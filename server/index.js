import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  openDb,
  seedContent,
  getContent,
  saveContent,
  getSetting,
  setSetting,
} from "./db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  getOrCreateSecret,
} from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const PORT = Number(process.env.PORT) || 3001;
const ADMIN_USER = process.env.ADMIN_USER || "LeonB";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "standaard_wachtwoord";
const SESSION_MAX_AGE = 7 * 24 * 3600;

const db = openDb();
seedContent(db);

// Migratie: voeg nieuwe velden toe aan bestaande content (zonder data te verliezen).
{
  const existing = getContent(db);
  if (existing && existing.hero) {
    let changed = false;
    if (typeof existing.hero.intervalMs !== "number") {
      existing.hero.intervalMs = 3800;
      changed = true;
    }
    if (typeof existing.hero.transitionMs !== "number") {
      existing.hero.transitionMs = 500;
      changed = true;
    }
    if (changed) saveContent(db, existing);
  }
}

const secret = getOrCreateSecret(db, getSetting, setSetting);

// Bron van waarheid voor inloggen: omgevingsvariabelen (ADMIN_USER / ADMIN_PASSWORD).
const ADMIN_HASH = hashPassword(ADMIN_PASSWORD);
if (ADMIN_PASSWORD === "standaard_wachtwoord") {
  console.warn(
    "[waarschuwing] je gebruikt het standaard admin-wachtwoord. Zet ADMIN_PASSWORD in je omgeving om dit te wijzigen."
  );
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1) {
      try {
        out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
      }
    }
  }
  return out;
}

function requireAuth(req, res, next) {
  const payload = verifyToken(secret, parseCookies(req).ss_token);
  if (!payload) return res.status(401).json({ error: "Niet ingelogd" });
  req.auth = payload;
  next();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BOOKING_STATUSES = new Set(["nieuw", "gelezen", "afgehandeld"]);

/* ------------------------------ Public API ------------------------------ */

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/content", (_req, res) => {
  res.json(getContent(db));
});

app.post("/api/bookings", (req, res) => {
  const b = req.body || {};
  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  if (!name) return res.status(400).json({ error: "Naam is verplicht" });
  if (!email) return res.status(400).json({ error: "E-mailadres is verplicht" });
  if (!EMAIL_RE.test(email))
    return res.status(400).json({ error: "Ongeldig e-mailadres" });

  const info = db
    .prepare(
      `INSERT INTO bookings
        (name, email, phone, company, service, message, preferred_date, preferred_time, contact_method, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'nieuw', ?)`
    )
    .run(
      name,
      email,
      String(b.phone || "").trim(),
      String(b.company || "").trim(),
      String(b.service || "").trim(),
      String(b.message || "").trim(),
      String(b.preferred_date || "").trim(),
      String(b.preferred_time || "").trim(),
      String(b.contact_method || "").trim(),
      new Date().toISOString()
    );

  const ref = `SS-${new Date().getFullYear()}-${String(
    info.lastInsertRowid
  ).padStart(4, "0")}`;
  res.status(201).json({ ok: true, ref });
});

/* --------------------------------- Auth --------------------------------- */

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (
    String(username || "") !== ADMIN_USER ||
    !verifyPassword(String(password || ""), ADMIN_HASH)
  ) {
    return res.status(401).json({ error: "Ongeldige inloggegevens" });
  }
  const token = signToken(secret, { user: ADMIN_USER });
  res.setHeader(
    "Set-Cookie",
    `ss_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`
  );
  res.json({ ok: true });
});

app.post("/api/auth/logout", (_req, res) => {
  res.setHeader(
    "Set-Cookie",
    "ss_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
  );
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  res.json({ authenticated: !!verifyToken(secret, parseCookies(req).ss_token) });
});

/* ------------------------------ Admin API ------------------------------- */

app.get("/api/admin/bookings", requireAuth, (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM bookings ORDER BY created_at DESC")
    .all();
  res.json(rows);
});

app.patch("/api/admin/bookings/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const status = String((req.body || {}).status || "");
  if (!BOOKING_STATUSES.has(status))
    return res.status(400).json({ error: "Ongeldige status" });
  const info = db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
  if (info.changes === 0) return res.status(404).json({ error: "Niet gevonden" });
  res.json({ ok: true });
});

app.delete("/api/admin/bookings/:id", requireAuth, (req, res) => {
  db.prepare("DELETE FROM bookings WHERE id = ?").run(Number(req.params.id));
  res.json({ ok: true });
});

app.put("/api/admin/content", requireAuth, (req, res) => {
  const data = req.body;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return res.status(400).json({ error: "Ongeldige content" });
  }
  saveContent(db, data);
  res.json({ ok: true });
});

/* --------------------------- Static & SPA fallback ---------------------- */

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  app.get("/", (_req, res) =>
    res
      .type("text")
      .send(
        "SoftSite API draait. Bouw de frontend met `npm run build` of start Vite met `npm run dev`."
      )
  );
}

app.use((err, _req, res, _next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Ongeldige JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "Serverfout" });
});

app.listen(PORT, () => {
  console.log(`SoftSite server draait op http://localhost:${PORT}`);
});

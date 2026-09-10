import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

export const DB_PATH =
  process.env.DB_PATH || path.join(__dirname, "data.sqlite");

export function openDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      service TEXT,
      message TEXT,
      preferred_date TEXT,
      preferred_time TEXT,
      contact_method TEXT,
      status TEXT NOT NULL DEFAULT 'nieuw',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return db;
}

export function getContent(db) {
  const row = db.prepare("SELECT data FROM content WHERE id = 1").get();
  return row ? JSON.parse(row.data) : null;
}

export function seedContent(db) {
  if (getContent(db)) return;
  const file = path.join(rootDir, "shared", "content.default.json");
  const raw = fs.readFileSync(file, "utf8");
  db.prepare("INSERT INTO content (id, data) VALUES (1, ?)").run(raw);
}

export function saveContent(db, data) {
  db.prepare("UPDATE content SET data = ? WHERE id = 1").run(JSON.stringify(data));
}

export function getSetting(db, key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : undefined;
}

export function setSetting(db, key, value) {
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

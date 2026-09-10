# Backend

De backend is een Node.js/Express-app in gewoon JavaScript (ESM). Hij verzorgt de
API, authenticatie en — in productie — het serveren van de gebouwde frontend.

## 1. Structuur

```text
server/
├── index.js    # Express-app: config, middleware, routes, static/SPA
├── auth.js     # wachtwoord-hashing + sessie-tokens (node:crypto)
├── db.js       # database openen, schema, seed, queries
└── data.sqlite # de database (git-ignored, runtime)
```

Er is bewust geen aparte `routes/`-map: de app is klein genoeg dat alle routes
overzichtelijk in `server/index.js` staan, gegroepeerd met commentaar-banners
(`Public API`, `Auth`, `Admin API`, `Static & SPA fallback`).

## 2. Opstartvolgorde (`server/index.js`)

1. Bepaalt `PORT`, `ADMIN_USER`, `ADMIN_PASSWORD` (env of defaults).
2. Opent de database (`openDb()`) en seedt content (`seedContent()`).
3. Voert een **defensieve content-migratie** uit (vult ontbrekende hero-velden aan).
4. Haalt/maakt het sessie-**secret** (`getOrCreateSecret`).
5. Berekent de `ADMIN_HASH` en waarschuwt als het standaardwachtwoord actief is.
6. Registreert middleware en routes, en start met `app.listen(PORT)`.

Belangrijke middleware:

- `app.disable("x-powered-by")` — verbergt de Express-header.
- `express.json({ limit: "1mb" })` — JSON-body's, gelimiteerd.
- `requireAuth` — beschermt de admin-routes.
- Een fout-handler helemaal onderaan die `entity.parse.failed` (ongeldige JSON)
  netjes afvangt en overige fouten als `500` teruggeeft.

## 3. Authenticatie (`server/auth.js`)

### 3.1 Wachtwoorden

Wachtwoorden worden gehasht met **scrypt** (via `node:crypto`):

```js
hashPassword(password, salt = crypto.randomBytes(16).toString("hex"))
// → "salt:hash" (hex), bijv. "a1b2…:9c8d…"
```

- `verifyPassword` splitst op `:`, herberekent de hash met dezelfde salt en
  vergelijkt met `crypto.timingSafeEqual` (timing-attack-veilig).
- Het **admin-wachtwoord** wordt **niet** in de database bewaard: het komt uit de
  omgevingsvariabele `ADMIN_PASSWORD` en wordt bij elke start gehasht.

### 3.2 Sessie-tokens

Geen JWT-library, maar een eigen, minimaal formaat:

```
<base64url(JSON payload incl. exp)>.<base64url(HMAC-SHA256(secret, body))>
```

- `signToken(secret, payload, maxAgeSeconds)` maakt de token; default 7 dagen.
- `verifyToken(secret, token)` controleert de handtekening (weer
  `timingSafeEqual`) én de `exp`-tijd.
- De token wordt gezet als cookie `ss_token` met `HttpOnly; Path=/; SameSite=Lax`
  en `Max-Age` van 7 dagen.

### 3.3 Secret

`getOrCreateSecret` bewaart een willekeurig 32-byte secret in de `settings`-tabel
(key `secret`) en hergebruikt dat. Zo blijven sessies geldig na een herstart.
**Let op:** als de database wordt verwijderd, worden alle bestaande sessies
ongeldig.

### 3.4 Cookie-parsing

`parseCookies(req)` parst de `Cookie`-header handmatig (URL-decoding met
fallback). `requireAuth` leest `ss_token` hieruit en verifieert hem.

## 4. Database-laag (`server/db.js`)

Zie [Database](database.md) voor schema en conventies. Kort:

- `openDb()` opent de DB, zet WAL en legt het schema aan.
- `getContent(db)` / `saveContent(db, data)` lezen/schrijven de content-JSON.
- `seedContent(db)` vult content als de rij ontbreekt.
- `getSetting` / `setSetting` zijn de key/value-helpers (voor het secret).

Alle queries gebruiken prepared statements.

## 5. Validatie

- **Bookings:** `name`/`email` verplicht; e-mail via regex
  `EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Overige velden worden getrimd naar
  strings (lege input → lege string).
- **Status-wijzigingen:** alleen toegestane waarden via de set
  `BOOKING_STATUSES` (`nieuw`, `gelezen`, `afgehandeld`).
- **Content:** `PUT /api/admin/content` controleert alleen dat de body een
  (niet-array) object is.

## 6. Beveiliging (huidige maatregelen)

- `x-powered-by` uit.
- `HttpOnly` + `SameSite=Lax` sessie-cookie.
- scrypt + timing-safe vergelijking voor wachtwoorden; HMAC + timing-safe
  vergelijking voor tokens.
- Prepared statements overal (geen SQL-injectie).
- Body-limiet van 1 MB.
- Admin-routes achter `requireAuth`.

### Aandachtspunten voor productie

- Zet een sterk `ADMIN_PASSWORD` (de server waarschuwt zolang de default actief is).
- Er is **geen rate-limiting** op `/api/auth/login` — overweeg dit bij publieke
  blootstelling.
- Er is **geen CSRF-token**; `SameSite=Lax` mitigeert veel CSRF, maar bij een
  wijziging naar state-changing requests vanaf externe origins is een CSRF-token
  aan te raden.
- Serveer de site in productie achter **HTTPS** (bijv. een reverse proxy met TLS).
  Zie [Deployment](deployment.md).

## 7. Conventies (backend)

- **ESM** (`import`/`export`), met `"type": "module"` in `package.json`.
- **Async is minimaal:** routes zijn overwegend synchroon (better-sqlite3 is
  synchroon). Alleen waar nodig gebruik je `async` (bijv. de frontend `fetch`).
- **Foutresponsen** zijn uniform `{ error: string }` met een passende statuscode.
- **Validatie aan de rand:** route-handlers valideren en normaliseren input
  (trim, String()-casts) vóór ze de DB in gaan.
- **Groepeer routes** met de bestaande commentaar-banners; houd publieke en
  admin-routes gescheiden.
- **Nederlandstalige** foutmeldingen en comments (consistent met de rest).

---

Volgende: [Code-conventies](code-conventions.md) · [Deployment](deployment.md).

# Architectuur

Dit document beschrijft hoe SoftSite in elkaar zit: de lagen, de datastromen en
de belangrijkste ontwerpkeuzes. Lees dit eerst als je wilt begrijpen hoe de
verschillende onderdelen samenwerken.

## 1. Overzicht

SoftSite is een **monorepo-achtige single-app** met twee losse runtime-onderdelen
die samen één website vormen:

1. **Frontend** (`src/`) — een React SPA met twee routes:
   - `/` — de publieke one-pager (hero, diensten, werkwijze, over, contact).
   - `/admin` — de beheerdersportal (inloggen, aanvragen beheren, content bewerken).
2. **Backend** (`server/`) — een Express-API die content en afspraakverzoeken
   beheert, authenticatie verzorgt en (in productie) de gebouwde frontend serveert.

Beide draaien in **JavaScript/TypeScript op Node.js**. De database is een
**SQLite-bestand** (`server/data.sqlite`).

```
┌───────────────────────────── Browser ─────────────────────────────┐
│                                                                    │
│   React SPA (Vite/TypeScript)                                      │
│   ├── Home  (one-pager)   ── leest content via ContentContext      │
│   └── Admin (portal)      ── leest/schrijft content & bookings      │
│                                                                    │
└───────────────┬────────────────────────────────────────────────────┘
                │  HTTP  (fetch → /api/*)
                ▼
┌───────────────────────────── Server (Node) ────────────────────────┐
│                                                                    │
│   Express 5  (server/index.js)                                     │
│   ├── publieke API  (/api/content, /api/bookings, /api/auth/*)     │
│   ├── admin API     (/api/admin/*, achter requireAuth)             │
│   └── static/SPA    (serveert dist/, fallback naar index.html)     │
│                                                                    │
│   auth.js  → scrypt-hashing, HMAC-sessie-tokens                    │
│   db.js    → better-sqlite3, schema, seed, queries                 │
│                                                                    │
└───────────────┬────────────────────────────────────────────────────┘
                │  better-sqlite3 (synchronous, WAL)
                ▼
        ┌──────────────────────┐
        │  SQLite               │
        │  server/data.sqlite   │
        │  ┌──────────────┐     │
        │  │ content      │     │   één JSON-blob met alle site-teksten
        │  │ bookings     │     │   afspraakverzoeken
        │  │ settings     │     │   key/value (o.a. sessie-secret)
        │  └──────────────┘     │
        └──────────────────────┘
```

## 2. Tech-stack

| Laag      | Technologie | Waarom |
| --------- | ----------- | ------ |
| Frontend  | React 19 + TypeScript | Componenten en typeveiligheid |
| Bouwer    | Vite 8 | Snel dev-server + productie-build |
| Styling   | Tailwind CSS v4 | Utility-first, kleinere CSS-output |
| Router    | react-router-dom 7 | Client-side routing (`/` en `/admin`) |
| Backend   | Express 5 | Lichtgewicht HTTP-framework |
| Database  | better-sqlite3 | Synchrone SQLite-driver, geen aparte DB-server |
| Auth      | `node:crypto` (scrypt + HMAC) | Geen externe auth-afhankelijkheden |
| Tooling   | oxlint, concurrently | Linting en het parallel starten van dev-servers |

## 3. Datastromen

### 3.1 Content (site-teksten)

```
shared/content.default.json
        │  (1) seed bij eerste start als DB leeg is
        ▼
SQLite: content (id = 1, data = JSON)
        │  (2) GET /api/content
        ▼
src/lib/api.ts → ContentContext (React context)
        │  (3) useContent() in componenten
        ▼
Home / Footer renderen de teksten
```

1. Bij het opstarten controleert de server of er content in de database staat.
   Zo niet, dan wordt `shared/content.default.json` als seed ingeladen
   (`seedContent` in `server/db.js`).
2. De frontend haalt de content op via `GET /api/content`.
3. `ContentContext` stelt de content beschikbaar aan alle componenten via
   `useContent()`. Totdat de API antwoordt (of als er geen backend is), wordt de
   fallback uit `shared/content.default.json` gebruikt.

De admin-portal slaat wijzigingen terug via `PUT /api/admin/content`, waarna de
hele `SiteContent`-JSON als één blob wordt weggeschreven.

### 3.2 Afspraakverzoeken (bookings)

```
Bezoeker vult contactformulier in (Home)
        │  POST /api/bookings
        ▼
Server valideert → INSERT INTO bookings
        │  retourneert referentie "SS-2026-0001"
        ▼
Admin-portal leest via GET /api/admin/bookings
en wijzigt status via PATCH /api/admin/bookings/:id
```

### 3.3 Authenticatie

```
Admin logt in → POST /api/auth/login (username + password)
        │  server controleert tegen ADMIN_USER / ADMIN_PASSWORD (env)
        ▼
Server zet HttpOnly-cookie "ss_token" (HMAC-gesigneerd, 7 dagen)
        │  daaropvolgende requests sturen de cookie automatisch mee
        ▼
requireAuth leest/verifieert de cookie → toegang tot /api/admin/*
```

Zie [Backend](backend.md) voor details over hashing en token-formaat.

## 4. Ontwerpkeuzes

- **Eén SQLite-bestand, geen aparte databaseserver.** Simpel te deployen en te
  back-uppen. Geschikt voor het lage verkeersvolume van een klein bureau.
- **Content als één JSON-blob.** Alle teksten van de site leven als één object in
  de `content`-tabel. Dat maakt het admin-portal eenvoudig (één formulier,
  één `PUT`), ten koste van relationele flexibiliteit — voor deze use-case een
  bewuste afweging. Zie [Contentmodel](content-model.md).
- **Geen ORM.** Queries zijn raw SQL via prepared statements (`db.prepare(...)`),
  wat transparant en controleerbaar blijft.
- **Eigen auth in plaats van een library.** Wachtwoorden via `scrypt`, sessies via
  een HMAC-gesigneerd token (geen JWT-dependency). Bewust minimaal gehouden.
- **Bron van waarheid voor inloggen = omgevingsvariabelen.** De admin-credentials
  staan niet in de database, maar in `ADMIN_USER` / `ADMIN_PASSWORD`.
- **Één codebase voor site + portal.** De portal is geen aparte app, maar de
  `/admin`-route in dezelfde SPA. Dezelfde styling, types en api-client worden
  hergebruikt.

## 5. Belangrijke bestanden

| Bestand | Rol |
| ------- | --- |
| `src/main.tsx` | React-entrypoint en router-definitie |
| `src/context/ContentContext.tsx` | Haalt content op en deelt het via context |
| `src/lib/types.ts` | Gedeelde TypeScript-typen (`SiteContent`, `Booking`, …) |
| `src/lib/api.ts` | Alle API-calls op één plek (fetch-wrapper) |
| `src/lib/content.ts` | Fallback-content uit `shared/content.default.json` |
| `server/index.js` | Express-app: routes, middleware, static/SPA |
| `server/db.js` | Database openen, schema, seed, queries |
| `server/auth.js` | Wachtwoord-hashing en sessie-tokens |
| `shared/content.default.json` | Standaardcontent (seed + fallback) |
| `vite.config.ts` | Vite-config en de `/api`-proxy naar `:3001` |

## 6. Hoe de dev-omgeving aan elkaar hangt

- `npm run dev` start Vite op **:5173**.
- `npm run dev:server` start Express op **:3001** met `node --watch`.
- Vite proxyt alle requests naar `/api` door naar `http://localhost:3001`
  (zie `vite.config.ts`), zodat de frontend in dev gewoon `/api/...` kan fetchen.
- `npm run dev:all` start beide tegelijk via `concurrently`.

In productie is er geen Vite meer: `npm run build` maakt `dist/`, en `npm start`
laat Express de statische bestanden én de API op dezelfde poort (`:3001`) serveren.

## 7. Productie-topologie

De app wordt gehost op een **VPS**, met **Cloudflare** ervoor als
**DDoS-bescherming** (en optioneel WAF/CDN). De domeinregistrar wijst de
nameservers naar **Cloudflare DNS**, en Cloudflare routeert het verkeer door naar
de VPS:

```
Bezoeker → Cloudflare (DDoS · DNS · TLS-edge) → VPS (Node.js-app) → SQLite
```

Zie [Deployment → Hosting & netwerk](deployment.md) voor de inrichting.

---

Volgende: [Aan de slag](getting-started.md) of [Database](database.md).

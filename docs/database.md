# Database

SoftSite gebruikt **SQLite** via de synchrone driver [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3).
Er is dus geen aparte databaseserver; de data leeft in één bestand:
`server/data.sqlite` (aanpasbaar via `DB_PATH`).

## 1. Locatie & aanmaken

- Het pad wordt bepaald in `server/db.js`:

  ```js
  export const DB_PATH =
    process.env.DB_PATH || path.join(__dirname, "data.sqlite");
  ```

- `openDb()` opent (en maakt indien nodig) het bestand, zet de journal-modus op
  **WAL** en legt het schema aan met `CREATE TABLE IF NOT EXISTS`.
- `seedContent()` vult de `content`-tabel met `shared/content.default.json` als
  die nog leeg is.
- Het bestand (inclusief `-wal` en `-shm` bestanden) staat in `.gitignore` en
  hoort **niet** in versiebeheer.

## 2. Journal-modus

```js
db.pragma("journal_mode = WAL");
```

WAL (Write-Ahead Logging) zorgt dat lezen en schrijven elkaar minder blokkeren.
Naast `data.sqlite` kunnen daarom tijdelijk `data.sqlite-wal` en
`data.sqlite-shm` verschijnen — die zijn normaal en verdwijnen/klein bij een
nette afsluiting.

## 3. Schema

Het volledige schema (uit `server/db.js`):

```sql
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
```

### 3.1 `content`

| Kolom | Type    | Beschrijving |
| ----- | ------- | ------------ |
| `id`  | INTEGER | Altijd `1` (enforced met `CHECK`). Er is bewust maar één rij. |
| `data`| TEXT    | De volledige `SiteContent`-structuur als JSON-string. |

> De hele site-content (hero, diensten, werkwijze, over, contact, bedrijfsgegevens)
> wordt als **één JSON-blob** bewaard. Zie [Contentmodel](content-model.md).

### 3.2 `bookings`

| Kolom            | Type    | Null? | Beschrijving |
| ---------------- | ------- | ----- | ------------ |
| `id`             | INTEGER | nee   | Auto-increment primaire sleutel |
| `name`           | TEXT    | nee   | Naam van de aanvrager |
| `email`          | TEXT    | nee   | E-mailadres (server-valideert formaat) |
| `phone`          | TEXT    | ja    | Telefoonnummer |
| `company`        | TEXT    | ja    | Bedrijfsnaam |
| `service`        | TEXT    | ja    | Gekozen dienst (titel van een service) |
| `message`        | TEXT    | ja    | Vrij tekstveld |
| `preferred_date` | TEXT    | ja    | Gewenst moment (vrije tekst, bijv. "volgende week dinsdagmiddag") |
| `preferred_time` | TEXT    | ja    | (gereserveerd; momenteel niet gebruikt door het formulier) |
| `contact_method` | TEXT    | ja    | `phone` / `video` / `email` |
| `status`         | TEXT    | nee   | `nieuw` (default), `gelezen` of `afgehandeld` |
| `created_at`     | TEXT    | nee   | ISO 8601-timestamp (`new Date().toISOString()`) |

**Status-waarden** (gedefinieerd als `BOOKING_STATUSES` in `server/index.js` en
als `BookingStatus` in `src/lib/types.ts`):

| Waarde       | Betekenis |
| ------------ | --------- |
| `nieuw`      | Nog niet bekeken |
| `gelezen`    | Bekeken, nog niet afgehandeld |
| `afgehandeld`| Afgerond |

### 3.3 `settings`

| Kolom   | Type | Beschrijving |
| ------- | ---- | ------------ |
| `key`   | TEXT | Primaire sleutel |
| `value` | TEXT | Waarde als string |

Wordt nu gebruikt voor één item: `secret` (het sessie-ondertekeningsgeheim, zie
[Backend](backend.md)). Het is een generieke key/value-tabel voor toekomstige
instellingen.

## 4. Database-conventies

Volg deze regels bij het toevoegen of wijzigen van tabellen/kolommen:

- **Snake_case-kolomnamen** in de database (`preferred_date`, `created_at`, …).
  In TypeScript worden deze 1-op-1 overgenomen (`Booking.preferred_date`), zodat
  er geen mapping-laag nodig is.
- **Prepared statements, altijd.** Gebruik `db.prepare(...)` met placeholders
  (`?`) en geef waarden mee aan `.run(...)` / `.get(...)` / `.all(...)`. Nooit
  string-interpolatie van gebruikersinvoer in SQL.
- **`TEXT` voor timestamps** in ISO 8601-formaat. Er wordt geen SQLite
  datetime-functie gebruikt; formattering gebeurt aan de frontend (`fmtDate`).
- **Nullable kolommen expliciet.** Optionele formuliervelden krijgen `NULL` als
  ze leeg zijn (de API trimt en zet lege strings om naar lege string — zie de
  `String(b.x || "").trim()`-patroon; voor optionele velden blijft een lege
  string `""` worden opgeslagen).
- **Default-waarden op kolom-niveau** waar zinvol (bijv. `status DEFAULT 'nieuw'`).
- **`IF NOT EXISTS` in `openDb()`.** Het schema wordt idempotent aangelegd bij
  elke start.

## 5. Seeden

`seedContent(db)` draait bij elke serverstart, maar doet alleen iets als de
`content`-rij nog niet bestaat:

```js
export function seedContent(db) {
  if (getContent(db)) return;
  const file = path.join(rootDir, "shared", "content.default.json");
  const raw = fs.readFileSync(file, "utf8");
  db.prepare("INSERT INTO content (id, data) VALUES (1, ?)").run(raw);
}
```

## 6. Migraties

Er is geen migratie-framework. Het patroon is **additief en defensief**, te zien
in `server/index.js` (direct na `seedContent`):

```js
{
  const existing = getContent(db);
  if (existing && existing.hero) {
    let changed = false;
    if (typeof existing.hero.intervalMs !== "number") {
      existing.hero.intervalMs = 3800;
      changed = true;
    }
    // ... eventueel meer velden
    if (changed) saveContent(db, existing);
  }
}
```

**Conventie voor nieuwe velden in de content-JSON:**

1. Voeg het veld toe aan `shared/content.default.json` (met een zinvolle default).
2. Voeg het toe aan het type in `src/lib/types.ts`.
3. Voeg een defensieve migratie toe in `server/index.js`: controleer of het veld
   ontbreekt/ongeldig is op bestaande content en vul de default in, zodat
   bestaande databases geen data verliezen.
4. Optioneel: een invoerveld in de admin-portal (`src/pages/Admin.tsx`).

Voor échte tabelwijzigingen aan `bookings` of `settings` is hetzelfde idee van
toepassing: voeg `ALTER TABLE`-stappen toe die idempotent zijn, of controleer met
`PRAGMA table_info(...)` of een kolom al bestaat.

## 7. Back-up & herstel

- De database is één bestand: een back-up is simpelweg een kopie van
  `server/data.sqlite`.
- Voor een consistente kopie terwijl de server draait, gebruik SQLite's online
  backup (of stop de server kort). Met WAL is een simpele `cp` meestal prima,
  maar het veiligst is:

  ```bash
  sqlite3 server/data.sqlite ".backup 'backup.sqlite'"
  ```

- Herstel: stop de server, vervang `server/data.sqlite` door de back-up en start
  opnieuw.

---

Volgende: [API-referentie](api-reference.md) · [Contentmodel](content-model.md).

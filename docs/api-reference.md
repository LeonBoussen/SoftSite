# API-referentie

De API is een Express-server. Alle routes leven in `server/index.js`. De
frontend praat ermee via de helperfuncties in `src/lib/api.ts`.

## 1. Basis

- **Base URL (productie):** zelfde origin als de site (bijv. `http://localhost:3001`)
- **Base URL (dev):** `http://localhost:3001` (Vite proxyt `/api` hiernaartoe)
- **Content-Type:** requests met een body zijn `application/json`; responses zijn
  `application/json` (behalve de SPA/static-bestanden).
- **Body-limiet:** `express.json({ limit: "1mb" })`.

### Foutrespons

Fouten hebben doorgaans de vorm:

```json
{ "error": "Beschrijving van de fout" }
```

Met bijbehorende HTTP-statuscode (400, 401, 404, 500). Bij ongeldige JSON wordt
specifiek `400 { "error": "Ongeldige JSON" }` geretourneerd.

### Authenticatie

Admin-routes vereisen een geldige sessie-cookie `ss_token` (HttpOnly). Die wordt
gezet door `POST /api/auth/login`. De frontend stuurt cookies automatisch mee
(`fetch` met `credentials` is hier niet expliciet nodig omdat de requests
same-origin zijn).

## 2. Publieke endpoints

### `GET /api/health`

Health-check.

**Response 200:**

```json
{ "ok": true }
```

### `GET /api/content`

Haalt de volledige site-content op (het `SiteContent`-object). Zie
[Contentmodel](content-model.md) voor de structuur.

**Response 200:** het `SiteContent`-object, of `null` als er nog geen content is.

### `POST /api/bookings`

Maakt een afspraakverzoek aan.

**Request body** (alle velden optioneel behalve `name` en `email`):

```json
{
  "name": "Jan Jansen",
  "email": "jan@bedrijf.nl",
  "phone": "+31 6 1234 5678",
  "company": "Bedrijf BV",
  "service": "Websites",
  "message": "Ik wil graag een nieuwe site.",
  "preferred_date": "volgende week dinsdagmiddag",
  "contact_method": "phone"
}
```

**Validatie:**

- `name` is verplicht (na trim) → anders `400 { "error": "Naam is verplicht" }`
- `email` is verplicht → anders `400 { "error": "E-mailadres is verplicht" }`
- `email` moet aan het formaat voldoen → anders `400 { "error": "Ongeldig e-mailadres" }`

**Response 201:**

```json
{ "ok": true, "ref": "SS-2026-0001" }
```

`ref` is de referentie die de bezoeker te zien krijgt:
`SS-<jaar>-<id gepadded naar 4 cijfers>`.

## 3. Auth-endpoints

### `POST /api/auth/login`

Logt in en zet de sessie-cookie.

**Request body:**

```json
{ "username": "LeonB", "password": "standaard_wachtwoord" }
```

**Response 200:**

```json
{ "ok": true }
```

**Response 401** bij ongeldige credentials:

```json
{ "error": "Ongeldige inloggegevens" }
```

> De cookie `ss_token` wordt gezet met `HttpOnly; Path=/; SameSite=Lax` en
> `Max-Age` van 7 dagen.

### `POST /api/auth/logout`

Verwijdert de sessie-cookie (zet `Max-Age=0`).

**Response 200:**

```json
{ "ok": true }
```

### `GET /api/auth/me`

Geeft aan of de huidige request is ingelogd.

**Response 200:**

```json
{ "authenticated": true }
```

of

```json
{ "authenticated": false }
```

## 4. Admin-endpoints (vereisen auth)

Alle onderstaande routes gaan door `requireAuth` en retourneren `401
{ "error": "Niet ingelogd" }` zonder geldige sessie.

### `GET /api/admin/bookings`

Lijst alle afspraakverzoeken, nieuwste eerst (`ORDER BY created_at DESC`).

**Response 200:** array van `Booking`-objecten:

```json
[
  {
    "id": 1,
    "name": "Jan Jansen",
    "email": "jan@bedrijf.nl",
    "phone": "+31 6 1234 5678",
    "company": "Bedrijf BV",
    "service": "Websites",
    "message": "Ik wil graag een nieuwe site.",
    "preferred_date": "volgende week dinsdagmiddag",
    "preferred_time": null,
    "contact_method": "phone",
    "status": "nieuw",
    "created_at": "2026-09-01T10:00:00.000Z"
  }
]
```

### `PATCH /api/admin/bookings/:id`

Wijzigt de status van een aanvraag.

**Request body:**

```json
{ "status": "gelezen" }
```

**Toegestane waarden:** `nieuw`, `gelezen`, `afgehandeld`.

- **200:** `{ "ok": true }`
- **400:** `{ "error": "Ongeldige status" }` bij een onbekende status
- **404:** `{ "error": "Niet gevonden" }` als er geen rij met dit `id` is

### `DELETE /api/admin/bookings/:id`

Verwijdert een aanvraag permanent.

**Response 200:** `{ "ok": true }`

> Let op: dit retourneert ook `ok` als het `id` niet bestond (idempotent).

### `PUT /api/admin/content`

Vervangt de volledige site-content door de aangeleverde JSON.

**Request body:** een geldig `SiteContent`-object (zie
[Contentmodel](content-model.md)). De server controleert alleen dat het een
object is (geen array/primitief), niet elk afzonderlijk veld.

- **200:** `{ "ok": true }`
- **400:** `{ "error": "Ongeldige content" }` als de body geen object is

## 5. Static & SPA-fallback

Als `dist/` bestaat (na `npm run build`), serveert de server:

- statische bestanden uit `dist/` via `express.static`,
- een SPA-fallback: elke `GET` die niet met `/api/` begint, krijgt
  `dist/index.html`.

Zonder `dist/` geeft `GET /` een korte tekst-uitleg terug.

## 6. Samenvattingstabel

| Methode | Pad                        | Auth | Beschrijving |
| ------- | -------------------------- | ---- | ------------ |
| GET     | `/api/health`              | –    | Health-check |
| GET     | `/api/content`             | –    | Site-content ophalen |
| POST    | `/api/bookings`            | –    | Afspraakverzoek aanmaken |
| POST    | `/api/auth/login`          | –    | Inloggen (zet cookie) |
| POST    | `/api/auth/logout`         | –    | Uitloggen (verwijdert cookie) |
| GET     | `/api/auth/me`             | –    | Inlogstatus opvragen |
| GET     | `/api/admin/bookings`      | ✓    | Alle aanvragen |
| PATCH   | `/api/admin/bookings/:id`  | ✓    | Status wijzigen |
| DELETE  | `/api/admin/bookings/:id`  | ✓    | Aanvraag verwijderen |
| PUT     | `/api/admin/content`       | ✓    | Content vervangen |

---

Volgende: [Contentmodel](content-model.md) · [Backend](backend.md).

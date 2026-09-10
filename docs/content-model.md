# Contentmodel

Alle teksten en instellingen van de site leven in één structuur: `SiteContent`.
Dit document beschrijft die structuur, waar die vandaan komt en hoe je hem
aanpast.

## 1. Waar de content leeft

De content kent drie "plekken":

1. **`shared/content.default.json`** — de bron van waarheid voor **standaard**-
   content. Wordt gebruikt als (a) seed voor de database en (b) fallback aan de
   frontend wanneer de API nog niet heeft geantwoord (of er geen backend is).
2. **SQLite, tabel `content`** — de **live** content. Wordt bewerkt via de
   admin-portal en opgeslagen als één JSON-blob.
3. **`src/lib/content.ts`** — importeert de default-JSON en exporteert hem als
   `DEFAULT_CONTENT`, zodat de frontend altijd iets kan renderen.

> Regel: wijzig je een veld dat ook op de site moet verschijnen, pas dan het
> **type** in `src/lib/types.ts`, de **default** in `shared/content.default.json`
> en (indien nodig) de **admin-UI** in `src/pages/Admin.tsx` aan.

## 2. Het type `SiteContent`

Definitie uit `src/lib/types.ts`:

```ts
export type SiteContent = {
  site: SiteInfo;
  hero: {
    eyebrow: string;
    lines: string[];
    subtitle: string;
    intervalMs: number;
    transitionMs: number;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  services: Service[];
  process: { title: string; steps: ProcessStep[] };
  about: { title: string; paragraphs: string[]; points: AboutPoint[] };
  contact: { title: string; subtitle: string; hours: string };
};
```

Met de deelschakels:

```ts
export type SiteInfo = {
  name: string;       // bedrijfsnaam
  founderName: string;
  location: string;
  email: string;
  phone: string;
  kvk: string;        // KvK-nummer
  btw: string;        // BTW-nummer
};

export type Service = {
  id: string;         // uniek, bijv. "website"
  icon: string;       // naam van een Icon (zie frontend.md)
  title: string;
  description: string;
  points: string[];   // kenmerken/bullets
};

export type ProcessStep = { title: string; description: string };

export type AboutPoint = { title: string; description: string };
```

## 3. Veld-voor-veld

### `site` — bedrijfsgegevens

| Veld         | Type   | Waar zichtbaar |
| ------------ | ------ | -------------- |
| `name`       | string | Navbar/Footer-logo, footer, copyright |
| `founderName`| string | Over-sectie (avatar met initialen + naam) |
| `location`   | string | Over-sectie en footer |
| `email`      | string | Over-, contact- en footersectie (`mailto:`) |
| `phone`      | string | Contact- en footersectie (`tel:`) |
| `kvk`        | string | Footer (naast BTW) |
| `btw`        | string | Footer (naast KvK) |

> `phone` wordt voor `tel:`-links gefilterd met `replace(/[^+\d]/g, "")`.

### `hero` — de openingssectie

| Veld          | Type   | Beschrijving |
| ------------- | ------ | ------------ |
| `eyebrow`     | string | Klein uppercase-label boven de titel |
| `lines`       | string[] | Roterende kopregels (zie `HeroCycle`) |
| `subtitle`    | string | Ondertitel onder de titel |
| `intervalMs`  | number | Hoe lang elke regel blijft staan (ms) |
| `transitionMs`| number | Duur van de fade/slide-overgang (ms) |
| `primaryCta`  | {label, href} | Primaire knop (label + anchor-href) |
| `secondaryCta`| {label, href} | Secundaire knop |

> `intervalMs` en `transitionMs` worden in `HeroCycle` afgekapt op minimum
> `1000` resp. `150` ms. In de admin kun je ze aanpassen.

### `services` — diensten

Een array van `Service`. De volgorde in de array is de volgorde op de site.
`icon` verwijst naar een naam uit `src/components/Icon.tsx` (bijv. `"globe"`,
`"server"`, `"shield"`). `points` zijn de bullets met een vinkje.

### `process` — werkwijze

- `title`: kop van de sectie.
- `steps`: een array van `ProcessStep`, gerenderd als genummerde kaarten (`01`,
  `02`, …). De nummering is de index + 1.

### `about` — over

- `title`: het kleine eyebrow-label ("Over SoftSite").
- `paragraphs`: array van alinea's.
- `points`: array van `AboutPoint` (titel + beschrijving), gerenderd als drie
  kaarten.

> De vaste kop van de over-sectie ("Persoonlijk, duidelijk en gebouwd om te
> blijven.") staat **hardcoded** in `Home.tsx`, niet in content.

### `contact` — contact

- `title`: kop van de contact-sectie.
- `subtitle`: introductietekst.
- `hours`: bereikbaarheid (bijv. "Ma–vr, 09:00–17:30").

> Het contactformulier zelf is hardcoded in `Home.tsx` (het `BookingForm`);
> alleen de teksten eromheen komen uit content.

## 4. Hoe de content door de app stroomt

1. **Opstart server:** `openDb()` + `seedContent()`. Als de DB leeg is, wordt
   `shared/content.default.json` weggeschreven naar de `content`-tabel.
2. **Frontend mount:** `ContentProvider` zet de state op `DEFAULT_CONTENT` en
   roept daarna `fetchContent()` (`GET /api/content`). Bij succes wordt de live
   content gezet; bij een fout blijft de fallback staan.
3. **Componenten lezen** via `const { site, hero, services, ... } = useContent()`.
4. **Admin bewerkt:** `ContentTab` laadt de content in een `draft`-state, laat de
   gebruiker velden aanpassen en stuurt bij "Opslaan" de hele structuur via
   `PUT /api/admin/content` terug. De server `JSON.stringify`'t hem en schrijft
   hem weg.

## 5. Een nieuw veld toevoegen (stappenplan)

1. **Type:** voeg het veld toe in `src/lib/types.ts`.
2. **Default:** voeg het toe aan `shared/content.default.json` met een zinvolle
   waarde (zodat de site niet breekt op oude data).
3. **Migratie:** voeg in `server/index.js` een defensieve check toe die het veld
   aanvult op bestaande content (zie [Database → Migraties](database.md)).
4. **Renderen:** gebruik het veld in de juiste component (`Home.tsx`, `Footer.tsx`,
   etc.).
5. **Admin (optioneel):** voeg een invoerveld toe in `ContentTab` in
   `src/pages/Admin.tsx`.

## 6. Voorbeeld

Een verkort voorbeeld van de JSON (volledige versie: `shared/content.default.json`):

```json
{
  "site": {
    "name": "SoftSite",
    "founderName": "Leon Boussen",
    "location": "Nederland · volledig remote",
    "email": "hello@softsite.nl",
    "phone": "",
    "kvk": "",
    "btw": ""
  },
  "hero": {
    "eyebrow": "Websites · Hosting · Websecurity",
    "lines": ["We bouwen digitale producten exact naar jouw wens."],
    "subtitle": "SoftSite bouwt, host en beveiligt websites…",
    "intervalMs": 3800,
    "transitionMs": 500,
    "primaryCta": { "label": "Plan een gratis kennismaking", "href": "#contact" },
    "secondaryCta": { "label": "Bekijk onze diensten", "href": "#diensten" }
  },
  "services": [
    {
      "id": "website",
      "icon": "globe",
      "title": "Websites",
      "description": "Een website die er goed uitziet én gevonden wordt.",
      "points": ["Ontwerp en bouw op maat", "Snel, toegankelijk en mobielvriendelijk"]
    }
  ]
}
```

---

Volgende: [Frontend](frontend.md) · [Database](database.md).

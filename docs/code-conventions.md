# Code-conventies

Afspraken zodat de codebase consistent en voorspelbaar blijft. Houd je hieraan bij
nieuwe code of wijzigingen.

## 1. Taal

- **Code, comments, commit-messages en UI-teksten zijn Nederlands.**
- Foutmeldingen en log-regels ook (bijv. `"Naam is verplicht"`,
  `"[waarschuwing] je gebruikt het standaard admin-wachtwoord…"`).
- Alleen technische termen mogen Engels blijven (component, hook, router, etc.).

## 2. TypeScript

- **Strict via de compiler-opties** in `tsconfig.app.json` /
  `tsconfig.node.json`:
  - `noUnusedLocals` en `noUnusedParameters` staan aan — verwijder ongebruikte
    variabelen/params.
  - `noFallthroughCasesInSwitch` aan.
  - `verbatimModuleSyntax` aan → importeer types expliciet met `import type`.
- **Gedeelde typen** horen in `src/lib/types.ts` (bijv. `SiteContent`,
  `Booking`). Definieer ze op één plek en importeer ze elders.
- **Expliciete types** bij component-props en API-functies; `any` vermijden.

Voorbeeld van een type-only import (vanwege `verbatimModuleSyntax`):

```ts
import type { Booking, SiteContent } from "./types";
```

## 3. React

- **Function components** (geen classes). Gebruik hooks.
- **Naamgeving componenten:** `PascalCase` (`Navbar`, `HeroCycle`). Bestand
  dezelfde naam (`Navbar.tsx`).
- **Eén component per bestand** in principe; kleine privé-subcomponenten in
  hetzelfde bestand zijn prima (bijv. `Field`, `Section`, `StringListEditor` in
  `Admin.tsx`).
- **Props-types inline** als object-type, tenzij herbruikbaar (dan in
  `types.ts`):

  ```tsx
  function Field({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) { … }
  ```

- **Event-handlers** heten `handle*` of `on*`; submit-handlers vaak `submit`.
- **Custom hooks** (`useContent`) beginnen met `use`.
- Houd componenten gefocust; verplaats generieke UI naar `src/components/`.

## 4. Naamgeving

| Onderdeel      | Stijl        | Voorbeeld |
| -------------- | ------------ | --------- |
| Component      | PascalCase   | `HeroCycle`, `PageBackground` |
| Bestand (React)| PascalCase   | `Navbar.tsx` |
| Bestand (lib)  | kebab-case   | `api.ts`, `types.ts`, `content.ts` |
| Functie/variabele | camelCase  | `fetchContent`, `setForm` |
| Constante      | SCREAMING_SNAKE | `DEFAULT_CONTENT`, `EMAIL_RE`, `BOOKING_STATUSES` |
| Type/interface | PascalCase   | `SiteContent`, `BookingPayload` |
| CSS-variabele  | kebab-case   | `--orange-1`, `--bg-dark` |
| DB-kolom        | snake_case   | `created_at`, `preferred_date` |

## 5. API & backend

- **API-calls centraliseren** in `src/lib/api.ts`; niet ad hoc `fetch` in
  componenten. Elke functie retourneert een `Promise` met het juiste type.
- **Uniforme foutafhandeling:** de `readJson`-helper in `api.ts` leest `{ error }`
  uit niet-ok-responses en gooit een `Error` met die tekst.
- **Prepared statements** (nooit string-interpolatie) in `server/db.js` en
  route-handlers.
- **Valideer/normaliseer input** in de route-handler (trim, `String()`-casts)
  vóór de database.
- **Groepeer routes** in `server/index.js` met de bestaande commentaar-banners.

## 6. Styling (Tailwind)

- **Utility-first**, geen losse CSS-bestanden per component. Component-specifieke
  zaken mogen in `src/index.css` (keyframes, `hero-grid`, `noise`).
- **Brand-kleuren** via CSS-variabelen, niet hardcoded hex in de JSX:
  `bg-[var(--orange-1)]`, `text-[var(--orange-3)]`.
- **Dark mode** via de `dark:`-variant; test beide thema's.
- **Transparantie** met Tailwind alpha-notatie (`bg-white/70`) en lage waarden
  waar nodig (`border-black/8`).
- Gebruik `transition` op interactieve elementen; volg de bestaande visuele taal
  (afgeronde hoeken `rounded-2xl/3xl`, zachte schaduwen).

## 7. Toegankelijkheid

- Iconen decoratief: `aria-hidden="true"`.
- Interactieve elementen: gebruik echte `<button>`/`<a>`, geef labels aan
  icon-only knoppen (`aria-label`).
- Respecteer `prefers-reduced-motion` (zie `index.css` en `HeroCycle`).
- Focus-stijl is globaal geregeld; breek die niet af zonder alternatief.

## 8. Linting

`npm run lint` draait **oxlint**. Config: `.oxlintrc.json` (plugins `react`,
`typescript`, `oxc`) met o.a. `react/rules-of-hooks` als error. Laat lint slagen
vóór je iets afrondt.

## 9. Git & commits

- Er is (nog) geen git-repository/historie in deze map. Als je versiebeheer
  opzet, gebruik dan duidelijke commits, bij voorkeur in het Nederlands en in de
  tegenwoordige tijd ("voeg hero-migratie toe", "fix scroll op mobiel").
- `node_modules`, `dist` en `server/data.sqlite*` staan al in `.gitignore` en
  horen niet in de repo.

## 10. "Definition of done" voor een wijziging

- [ ] Types bijgewerkt (`src/lib/types.ts`) indien van toepassing.
- [ ] Default-content bijgewerkt (`shared/content.default.json`).
- [ ] Migratie toegevoegd als bestaande data het nodig heeft.
- [ ] Admin-UI bijgewerkt als het veld beheerd moet worden.
- [ ] `npm run lint` en `npm run build` slagen.
- [ ] Lokaal getest (licht én donker thema, desktop én mobiel).

---

Volgende: [Deployment](deployment.md) · terug naar [README](../README.md).

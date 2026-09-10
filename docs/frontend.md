# Frontend

De voorkant is een React 19 SPA in TypeScript, gebouwd met Vite en gestyled met
Tailwind CSS v4. Dit document beschrijft de structuur, de routing, het
state-beheer en de styling-conventies.

## 1. Structuur

```text
src/
├── main.tsx                  # entrypoint: root + router
├── index.css                 # design-tokens, Tailwind, keyframes
├── components/
│   ├── Navbar.tsx            # vaste navigatie + theme-toggle + mobiel menu
│   ├── Footer.tsx            # footer met nav, diensten, contact, copyright
│   ├── HeroCycle.tsx         # roterende hero-teksten (fade + slide)
│   ├── Icon.tsx              # inline SVG-icoonset + <Icon name=… />
│   └── PageBackground.tsx    # cursor-glow, grid, ruis en orbs
├── context/
│   └── ContentContext.tsx    # haalt content op en deelt het via context
├── lib/
│   ├── api.ts                # alle fetch-calls, op één plek
│   ├── content.ts            # DEFAULT_CONTENT (fallback uit JSON)
│   └── types.ts              # gedeelde TypeScript-typen
└── pages/
    ├── Home.tsx              # de publieke one-pager (incl. BookingForm)
    └── Admin.tsx             # de beheerdersportal
```

## 2. Entrypoint & routing

`src/main.tsx` definieert de router:

```tsx
const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/admin", element: <Admin /> },
  { path: "*", element: <Home /> },
]);
```

- **`/`** → de publieke one-pager.
- **`/admin`** → de portal.
- **`*`** (catch-all) → ook `Home` (onbekende routes vallen terug op de homepage).

De hele app is gewrapped in `<ContentProvider>`, zodat overal `useContent()`
beschikbaar is.

## 3. State-beheer

Er is **geen** Redux/Zustand. Er wordt gebruikgemaakt van:

1. **React Context** (`ContentContext`) voor de site-content. `ContentProvider`
   start met `DEFAULT_CONTENT` en vervangt die door de live content zodra
   `fetchContent()` klaar is. De provider is opzettelijk simpel (geen refetch);
   de admin herlaadt content zelf wanneer nodig.

   ```tsx
   const { site, hero, services, process, about, contact } = useContent();
   ```

2. **Lokale `useState`/`useEffect`** voor alles daarbinnen (thema, menu-open,
   formuliervelden, admin-tabs, etc.).

## 4. Componenten

### `Navbar`

- Vaste header, transparant bovenaan en voorzien van blur + border zodra er is
  gescrold (`scrolled = window.scrollY > 24`).
- `ThemeToggle` zet de class `dark` op `<html>` en bewaart de keuze in
  `localStorage.theme`. Standaard wordt `prefers-color-scheme` gevolgd.
- Mobiel menu togglet `document.body.style.overflow` om scrollen te blokkeren.

### `Footer`

- Toont logo, navigatie, diensten (`services`), contactgegevens en copyright.
- `site.kvk` / `site.btw` worden alleen getoond als ze niet leeg zijn.
- Bevat een subtiele "Beheer"-link naar `/admin`.

### `HeroCycle`

- Roteert `hero.lines` met een fade + verticale verschuiving.
- Meet de hoogte per regel en animeert de containerhoogte mee, zodat de
  ondertitel strak aansluit (ook bij 1↔2 regels).
- Rotatie pauzeert zodra de hero uit beeld is (via `IntersectionObserver`) en
  respecteert `prefers-reduced-motion`.
- `intervalMs`/`transitionMs` zijn configureerbaar (minimaal 1000/150 ms).

### `Icon`

- Een inline SVG-set (geen externe icon-library). Namen zijn getypeerd via
  `IconName`; onbekende namen vallen terug op het `spark`-icoon.

  ```tsx
  <Icon name="shield" size={20} />
  ```

- Alle iconen zijn `stroke="currentColor"`, dus ze kleuren mee via `text-*`
  classes of de brand-CSS-variabelen.

### `PageBackground`

- Cursor-volgende glow (alleen desktop met `pointer: fine` en breedte ≥ 1024 px),
  plus grid, ruis en twee langzaam bewegende orbs.
- De glow start onzichtbaar midden op het scherm en fadet zacht in, om een
  "flits" bij het laden te voorkomen. Animatie loopt via `requestAnimationFrame`
  en wordt netjes opgeruimd.

## 5. Pagina's

### `Home`

De one-pager met de secties **Hero → Diensten → Werkwijze → Over → Contact**.
Alle secties hebben een `id` (`#diensten`, `#werkwijze`, `#over`, `#contact`) voor
smooth-scroll via de `scrollTo()`-helper (met `scroll-mt-24` voor de vaste header).

Het `BookingForm` zit in `Home.tsx`:

- Lokale form-state (één object), met een `set(key)`-helper voor updates.
- Client-side check: naam + e-mail verplicht.
- Verstuurt via `submitBooking(...)`; bij succes toont het een bedank-scherm met
  de referentie, bij een fout een inline foutmelding.
- "Hoe wil je kennismaken?" is een `radiogroup` van drie knoppen
  (`phone` / `video` / `email`).

### `Admin`

De portal. Flow:

1. `Admin` checkt bij het mounten via `apiMe()` of er een sessie is.
2. Niet ingelogd → `LoginForm`.
3. Ingelogd → `Dashboard` met twee tabs: **Aanvragen** (`BookingsTab`) en
   **Content** (`ContentTab`).

- **`BookingsTab`**: haalt aanvragen op, filtert op status, biedt statusknoppen
  en een verwijderknop (met `window.confirm`).
- **`ContentTab`**: laadt content in een `draft`, biedt formuliervelden per
  sectie en stuurt bij "Opslaan" de hele structuur terug. Kleine herbruikbare
  bouwblokken: `Field`, `StringListEditor` (voor arrays van strings) en `Section`.

## 6. Styling

- **Tailwind CSS v4**, geïmporteerd via `@import "tailwindcss";` in `index.css`
  en als Vite-plugin (`@tailwindcss/vite`).
- **Design-tokens** staan als CSS-variabelen in `:root` (zie `src/index.css`):

  ```css
  --bg-light: #fff8f1;
  --bg-dark: #0b0b0d;
  --text-light: #151515;
  --text-dark: #f7f5f2;
  --orange-1: #ff8a1f;   /* primair oranje */
  --orange-2: #ffb14a;
  --orange-3: #ff6a00;   /* donkerder accent */
  ```

  In de JSX worden die als arbitraire Tailwind-values gebruikt, bijv.
  `bg-[var(--orange-1)]`, `text-[var(--orange-3)]`,
  `bg-[var(--bg-light)] dark:bg-[var(--bg-dark)]`.

- **Dark mode** is class-based:

  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```

  De `dark:`-variant is actief wanneer `<html>` de class `dark` heeft (gezet door
  `ThemeToggle`).

- **Opacity-styling** gebruikt Tailwind's alpha-notatie op kleuren
  (`bg-white/70`, `text-black/65`, `border-black/8`, `dark:bg-white/5`).
- **Focus-stijl** is globaal geregeld via `:focus-visible` (oranje outline).

## 7. Toegankelijkheid

- Iconen zijn `aria-hidden="true"` (decoratief); knoppen hebben waar nodig
  `aria-label`.
- Het contactvoorkeuren-blok gebruikt `role="radiogroup"`/`role="radio"` met
  `aria-checked`.
- `prefers-reduced-motion` wordt gerespecteerd in `index.css` (disabelt
  drift/ruis-animaties en smooth-scroll) en in `HeroCycle` (geen rotatie).
- Het mobiel menu heeft `aria-expanded`.

---

Volgende: [Backend](backend.md) · [Code-conventies](code-conventions.md).

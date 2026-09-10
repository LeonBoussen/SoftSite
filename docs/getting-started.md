# Aan de slag

Alles wat je nodig hebt om SoftSite lokaal te draaien en te ontwikkelen.

## 1. Vereisten

- **Node.js 22** of nieuwer. Controleer met:

  ```bash
  node --version   # moet ≥ v22 zijn
  npm --version
  ```

- Geen aparte database nodig: SQLite en `better-sqlite3` worden als npm-dependency
  geïnstalleerd.

## 2. Installeren

```bash
npm install
```

De eerste keer wordt er (onder water) ook een native module voor
`better-sqlite3` gebouwd. Bij een Node-versie die sterk afwijkt van de versie
waarmee `package-lock.json` is gegenereerd, kan het nodig zijn:

```bash
npm rebuild better-sqlite3
```

## 3. Scripts

Alle scripts staan in `package.json`:

| Script             | Doet                                                  |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Start alleen de Vite-devserver op `:5173`              |
| `npm run dev:server` | Start alleen de API op `:3001` (met `node --watch`)  |
| `npm run dev:all`  | Start frontend én API tegelijk (via `concurrently`)    |
| `npm run build`    | TypeScript controleren (`tsc -b`) + Vite-build naar `dist/` |
| `npm run preview`  | Preview van de Vite-productie-build                    |
| `npm start`        | Start de Express-server (serveert `dist/` + API)       |
| `npm run lint`     | oxlint over de codebase                                |

### Aanbevolen dagelijkse workflow

```bash
npm run dev:all
```

- Website: <http://localhost:5173>
- API: <http://localhost:3001/api/health>
- Admin-portal: <http://localhost:3001/admin>

> De admin-portal draait op de **API-poort** (`:3001`), niet op de Vite-poort.
> Vite proxyt `/api/*` naar `:3001`, maar de `/admin`-route is een frontend-route;
> je kunt hem ook op `:5173/admin` openen — de API-calls worden dan geproxied.

## 4. Eerste keer inloggen

1. Ga naar <http://localhost:3001/admin>.
2. Log in met de standaardcredentials:
   - Gebruikersnaam: `LeonB`
   - Wachtwoord: `standaard_wachtwoord`
3. Bij het opstarten logt de server een waarschuwing zolang het standaardwachtwoord
   actief is.

## 5. Database

Bij de eerste start wordt automatisch `server/data.sqlite` aangemaakt en geseed met
`shared/content.default.json`. Dit bestand staat in `.gitignore`; verwijder het om
opnieuw met de standaardcontent te beginnen (pas op: ook alle aanvragen zijn dan weg).

Meer over het schema: [Database](database.md).

## 6. Productie-achtig draaien

```bash
npm run build
npm start
```

Dit bouwt de frontend naar `dist/` en laat Express de site + API op
**<http://localhost:3001>** serveren. Zie [Deployment](deployment.md) voor details.

## 7. Problemen oplossen

| Symptoom | Oplossing |
| -------- | --------- |
| `better-sqlite3` faalt met een native/ABI-fout | `npm rebuild better-sqlite3` (of verwijder `node_modules` + `package-lock.json` en `npm install` opnieuw) |
| `/api/*` geeft 404/500 in dev | Controleer dat de API draait op `:3001`; de proxy staat in `vite.config.ts` |
| Admin-login weigert | Gebruik de juiste `ADMIN_USER` / `ADMIN_PASSWORD`; herstart de server na het wijzigen van env-variabelen |
| Content-wijzigingen niet zichtbaar | Herlaad de pagina; de site laadt content bij het mounten van de app |
| Porten al bezet | Wijzig `PORT` (API) of pas de Vite-poort aan (`npm run dev -- --port 5174`) |

---

Volgende: [Database](database.md) · [Architectuur](architecture.md).

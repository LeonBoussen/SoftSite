# Deployment

Hoe je SoftSite productieklaar maakt en draait. De app is een Node.js-proces dat
zowel de API als (na een build) de statische site serveert — er is dus maar één
service nodig.

## 1. Bouwen

```bash
npm run build
```

Dit doet twee dingen:

1. `tsc -b` — controleert de TypeScript-projecten (`tsconfig.app.json` en
   `tsconfig.node.json`).
2. `vite build` — bouwt de frontend naar `dist/`.

## 2. Draaien

```bash
npm start
```

`npm start` draait `node server/index.js`. Als `dist/` bestaat, serveert de server:

- de statische bestanden uit `dist/`,
- een SPA-fallback (elke `GET` die niet met `/api/` begint → `dist/index.html`),
- de API op `/api/*`.

Zonder `dist/` geeft `GET /` alleen een korte tekst-uitleg.

De server luistert standaard op **`http://localhost:3001`** (aanpasbaar via `PORT`).

## 3. Omgevingsvariabelen (productie)

Zet deze in je hosting-omgeving (bijv. een `.env`-file of de secrets-config van
je platform):

| Variabele        | Verplicht | Beschrijving |
| ---------------- | --------- | ------------ |
| `PORT`           | nee       | Poort (default `3001`) |
| `ADMIN_USER`     | ja*       | Admin-gebruikersnaam (default `LeonB`) |
| `ADMIN_PASSWORD` | ja*       | Admin-wachtwoord (default `standaard_wachtwoord`) |
| `DB_PATH`        | nee       | Pad naar de SQLite-database |

\* Niet technisch verplicht, maar **altijd** overschrijven in productie. De
server logt een waarschuwing zolang het standaardwachtwoord actief is.

Voorbeeld:

```bash
PORT=3001 \
ADMIN_USER=LeonB \
ADMIN_PASSWORD='een-sterk-wachtwoord' \
DB_PATH=/var/lib/softsite/data.sqlite \
node server/index.js
```

## 4. Hosting & netwerk (VPS + Cloudflare)

De beoogde productie-opstelling bestaat uit drie onderdelen:

- **VPS** — de applicatie draait op een virtuele privéserver. Daarop staat dit
  Node.js-proces (via een process-manager, zie §7) en eventueel een reverse proxy
  vóór de app.
- **Cloudflare** — staat vóór de server als **DDoS-bescherming** (en naar wens
  ook WAF/CDN). Al het verkeer naar de site loopt eerst door Cloudflare vóór het
  de VPS bereikt.
- **Domeinregistrar (domain provider)** — wijst de **nameservers naar
  Cloudflare DNS**. Cloudflare beheert daarmee de DNS; het A/AAAA-record voor het
  domein wijst naar het IP van de VPS.

### Verkeersstroom

```
Bezoeker
   │
   ▼
Cloudflare  (DDoS-bescherming · DNS · evt. WAF/CDN · TLS-edge)
   │
   ▼
VPS         (reverse proxy → Node.js-app op localhost:3001)
   │
   ▼
SQLite      (server/data.sqlite)
```

### Inrichten

1. **DNS:** stel bij de domeinregistrar de nameservers van Cloudflare in.
2. **Cloudflare DNS-records:** maak een A-record aan dat het domein naar het
   publieke IP van de VPS wijst, en zet de proxy (de oranje wolk) aan.
3. **VPS:** draai de app via een process-manager (§7). Optioneel een reverse
   proxy (Caddy/nginx) die `localhost:3001` ontsluit.

> **Tip (beveiliging):** zet de proxy aan zodat het oorspronkelijke IP van de VPS
> verborgen blijft. Beperk vervolgens directe toegang tot de VPS-poorten
> (bijv. alleen Cloudflare-IP-ranges toestaan op poort 80/443 in de firewall), of
> gebruik **Cloudflare Tunnel** zodat er helemaal geen poort open hoeft.

## 5. HTTPS

Cloudflare termineert TLS aan de edge (gratis via Cloudflare). Kies in Cloudflare
de TLS-modus **Full (strict)** zodat het verkeer ook tussen Cloudflare en de VPS
versleuteld blijft — daarvoor heeft de VPS een geldig certificaat nodig (bijv.
een Cloudflare Origin-certificaat, of Let's Encrypt via Caddy/nginx).

- De Express-server zelf doet geen TLS; die blijft op `localhost:3001` draaien.
- Zorg dat cookies over HTTPS gaan; de cookie heeft geen `Secure`-flag in de code
  — overweeg die toe te voegen nu de site achter HTTPS draait.
- De Vite-devserver staat `allowedHosts: ['.ngrok-free.app']` toe (voor testen via
  ngrok); dat is alleen relevant in dev.

## 6. Database & persistentie

- De database is `server/data.sqlite` (of `DB_PATH`). Zorg dat die locatie
  **persistent** is (niet in een efemere container-laag) en regelmatig wordt
  geback-upt. Zie [Database → Back-up](database.md).
- Het sessie-`secret` staat in de `settings`-tabel. Verlies je de database, dan
  verlies je ook actieve sessies (en content + aanvragen).

## 7. Process-manager

Gebruik een process-manager zodat de app herstart na een crash of reboot:

```bash
# met systemd, PM2, of het process-management van je hoster
pm2 start server/index.js --name softsite
```

Stel de env-variabelen in via de config van de manager.

## 8. Checklist voor livegang

- [ ] `ADMIN_USER` / `ADMIN_PASSWORD` ingesteld (geen defaults).
- [ ] `npm run build` en `npm start` geslaagd; site bereikbaar op de juiste URL.
- [ ] Domeinregistrar wijst naar de Cloudflare-nameservers; A-record naar de VPS.
- [ ] Cloudflare-proxy aan (DDoS-bescherming actief) en TLS-modus `Full (strict)`.
- [ ] VPS-firewall beperkt directe toegang (alleen Cloudflare of via Tunnel).
- [ ] `DB_PATH` wijst naar een persistente locatie; back-up geregeld.
- [ ] Echte contactgegevens ingevuld via `/admin` → Bedrijf (telefoon, e-mail,
      KvK, BTW).
- [ ] Server-log gecontroleerd op waarschuwingen.

## 9. Nog open (uit `TODO`)

- [ ] Echte contactgegevens invullen (telefoon, e-mail, KvK, BTW) via `/admin`.
- [ ] Eventueel e-mailnotificatie koppelen zodat aanvragen ook per mail binnenkomen.
- [ ] Echt domein registreren en de VPS + Cloudflare-configuratie daadwerkelijk
      koppelen (setup uit §4).

---

Terug naar [README](../README.md) · [Backend](backend.md).

import { Icon } from "./Icon";
import { useContent } from "../context/ContentContext";

const anchors = [
  { label: "Diensten", href: "#diensten" },
  { label: "Werkwijze", href: "#werkwijze" },
  { label: "Over", href: "#over" },
  { label: "Contact", href: "#contact" },
];

function scrollTo(href: string) {
  if (href === "#top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Footer() {
  const { site, services, contact } = useContent();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/8 bg-white/50 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          <div className="sm:col-span-2 md:col-span-1">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("#top");
              }}
              className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--orange-1)] text-sm font-bold text-white">
                S
              </span>
              {site.name}
            </a>
            <p className="mt-3 max-w-xs text-sm leading-6 text-neutral-500 dark:text-white/50">
              Websites, hosting en websecurity voor ondernemers. Eén vast
              aanspreekpunt, heldere prijzen en geen technisch gedoe.
            </p>
            {(site.kvk || site.btw) && (
              <p className="mt-4 text-xs text-neutral-400 dark:text-white/35">
                {[site.kvk, site.btw].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Navigatie
            </h4>
            <ul className="mt-4 space-y-2.5">
              {anchors.map((a) => (
                <li key={a.href}>
                  <a
                    href={a.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(a.href);
                    }}
                    className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-white/50 dark:hover:text-white"
                  >
                    {a.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Diensten
            </h4>
            <ul className="mt-4 space-y-2.5">
              {services.map((s) => (
                <li key={s.id} className="text-sm text-neutral-500 dark:text-white/50">
                  {s.title}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-neutral-500 dark:text-white/50">
              {site.email && (
                <li className="flex items-start gap-2">
                  <Icon name="mail" size={15} className="mt-0.5 shrink-0" />
                  <a
                    href={`mailto:${site.email}`}
                    className="hover:text-neutral-900 dark:hover:text-white"
                  >
                    {site.email}
                  </a>
                </li>
              )}
              {site.phone && (
                <li className="flex items-start gap-2">
                  <Icon name="phone" size={15} className="mt-0.5 shrink-0" />
                  <a
                    href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                    className="hover:text-neutral-900 dark:hover:text-white"
                  >
                    {site.phone}
                  </a>
                </li>
              )}
              {site.location && (
                <li className="flex items-start gap-2">
                  <Icon name="map-pin" size={15} className="mt-0.5 shrink-0" />
                  {site.location}
                </li>
              )}
              {contact.hours && (
                <li className="flex items-start gap-2">
                  <Icon name="clock" size={15} className="mt-0.5 shrink-0" />
                  {contact.hours}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/8 pt-6 dark:border-white/10 sm:flex-row">
          <p className="text-center text-xs text-neutral-500 dark:text-white/40 sm:text-left">
            © {year} {site.name}. Alle rechten voorbehouden.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="text-xs text-neutral-400 transition hover:text-neutral-600 dark:text-white/35 dark:hover:text-white/60"
            >
              Beheer
            </a>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Terug naar boven"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-xs font-medium text-neutral-600 transition hover:bg-black/5 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
            >
              Terug naar boven
              <Icon name="arrow-up" size={12} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

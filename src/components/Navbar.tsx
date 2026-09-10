import * as React from "react";
import { Icon } from "./Icon";

const navLinks = [
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

function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.theme;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.theme = next ? "dark" : "light";
    setIsDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Wissel thema"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-transparent text-neutral-700 transition hover:bg-black/5 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
    >
      {isDark ? <Icon name="sun" size={17} /> : <Icon name="moon" size={17} />}
    </button>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Opaque when the menu is open (no matter the scroll position) so the bar
  // never sits transparent on top of the page; glassy only while scrolling
  // with the menu closed. Plain `var()` backgrounds and a hand-written glass
  // class keep this working on older mobile browsers (no `color-mix` needed).
  const barStyle = open
    ? "border-b border-black/8 bg-[var(--bg-light)] dark:border-white/10 dark:bg-[var(--bg-dark)]"
    : scrolled
      ? "nav-glass border-b border-black/8 dark:border-white/10"
      : "border-b border-transparent bg-transparent";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${barStyle}`}
      >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollTo("#top");
          }}
          className="flex items-center gap-2 text-base font-semibold tracking-tight text-neutral-900 dark:text-white"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--orange-1)] text-sm font-bold text-white">
            S
          </span>
          SoftSite
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(link.href);
              }}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-white/60 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#contact");
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--orange-1)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(255,138,31,0.28)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--orange-3)]"
          >
            Plan een afspraak
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Sluit menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-neutral-700 dark:border-white/10 dark:text-white/70"
          >
            <Icon name={open ? "close" : "menu"} size={18} />
          </button>
        </div>
      </nav>
    </header>

    {/* Mobile menu — rendered OUTSIDE the header so `fixed` is always
        relative to the viewport (a backdrop-filter on the header would
        otherwise become the containing block on some mobile browsers). */}
    {open && (
      <div className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-[var(--bg-light)] pt-24 md:hidden dark:bg-[var(--bg-dark)]">
        <div className="flex flex-col gap-1 px-6 pb-10">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                scrollTo(link.href);
              }}
              className="flex items-center justify-between rounded-xl px-4 py-4 text-lg font-medium text-neutral-900 transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
            >
              {link.label}
              <Icon name="arrow-right" size={18} className="text-black/40 dark:text-white/40" />
            </a>
          ))}
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              scrollTo("#contact");
            }}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--orange-1)] px-4 py-3.5 text-base font-medium text-white"
          >
            Plan een afspraak
          </a>
        </div>
      </div>
    )}
    </>
  );
}

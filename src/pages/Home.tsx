import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PageBackground } from "../components/PageBackground";
import { HeroCycle } from "../components/HeroCycle";
import { Icon } from "../components/Icon";
import { useContent } from "../context/ContentContext";
import { submitBooking } from "../lib/api";
import type { Service } from "../lib/types";

function scrollTo(href: string) {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ? w[0].toUpperCase() : ""))
    .join("");
}

const CONTACT_METHODS = [
  { id: "phone", label: "Telefonisch" },
  { id: "video", label: "Videobellen" },
  { id: "email", label: "E-mail" },
];

function BookingForm({ services }: { services: Service[] }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
    moment: "",
    method: "phone",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [ref, setRef] = useState("");

  const set =
    (key: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Vul je naam en e-mailadres in.");
      return;
    }
    setError("");
    setStatus("sending");
    try {
      const res = await submitBooking({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company: form.company,
        service: form.service,
        message: form.message,
        preferred_date: form.moment,
        contact_method: form.method,
      });
      setRef(res.ref);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis.");
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-black/8 bg-white/70 p-8 text-center dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-[var(--orange-3)] dark:bg-orange-500/12 dark:text-orange-300">
          <Icon name="check-circle" size={28} />
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight">
          Bedankt, {form.name.split(" ")[0]}!
        </h3>
        <p className="mt-3 text-sm leading-6 text-black/65 dark:text-white/65">
          Je aanvraag is ontvangen onder referentie{" "}
          <span className="font-semibold">{ref}</span>. We nemen binnen één
          werkdag contact met je op.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-black/8 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Naam *</span>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="Je naam"
            className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--orange-1)] dark:border-white/10 dark:bg-white/5"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">E-mailadres *</span>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="naam@bedrijf.nl"
            className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--orange-1)] dark:border-white/10 dark:bg-white/5"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Telefoon (optioneel)</span>
          <input
            value={form.phone}
            onChange={set("phone")}
            placeholder="+31 6 1234 5678"
            className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--orange-1)] dark:border-white/10 dark:bg-white/5"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Bedrijf (optioneel)</span>
          <input
            value={form.company}
            onChange={set("company")}
            placeholder="Bedrijfsnaam"
            className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--orange-1)] dark:border-white/10 dark:bg-white/5"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium">Waar kunnen we mee helpen?</span>
        <select
          value={form.service}
          onChange={set("service")}
          className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--orange-1)] dark:border-white/10 dark:bg-white/5"
        >
          <option value="">Nog niet zeker / algemeen</option>
          {services.map((s) => (
            <option key={s.id} value={s.title}>
              {s.title}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium">Je verhaal (optioneel)</span>
        <textarea
          value={form.message}
          onChange={set("message")}
          rows={4}
          placeholder="Vertel kort waar je mee bezig bent of wat je nodig hebt."
          className="mt-1.5 w-full resize-none rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--orange-1)] dark:border-white/10 dark:bg-white/5"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium">Gewenst moment (optioneel)</span>
        <input
          value={form.moment}
          onChange={set("moment")}
          placeholder="bijv. volgende week dinsdagmiddag"
          className="mt-1.5 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-[var(--orange-1)] dark:border-white/10 dark:bg-white/5"
        />
      </label>

      <p className="mt-5 text-sm font-medium">Hoe wil je kennismaken?</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Voorkeur voor het gesprek">
        {CONTACT_METHODS.map((m) => {
          const selected = form.method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setForm((f) => ({ ...f, method: m.id }))}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                selected
                  ? "border-[var(--orange-1)] bg-orange-50 text-black dark:border-orange-400/50 dark:bg-orange-500/10 dark:text-white"
                  : "border-black/10 bg-white/60 text-black/70 hover:border-orange-300/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--orange-1)] px-6 py-3.5 text-sm font-medium text-white shadow-[0_14px_40px_rgba(255,138,31,0.28)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--orange-3)] disabled:opacity-60"
      >
        <Icon name="send" size={15} />
        {status === "sending" ? "Versturen…" : "Verstuur aanvraag"}
      </button>
      <p className="mt-3 text-center text-xs text-black/45 dark:text-white/45">
        Vrijblijvend · antwoord binnen één werkdag
      </p>
    </form>
  );
}

export default function Home() {
  const { site, hero, services, process, about, contact } = useContent();

  return (
    <main className="relative overflow-hidden bg-[var(--bg-light)] text-[var(--text-light)] transition-colors duration-300 dark:bg-[var(--bg-dark)] dark:text-[var(--text-dark)]">
      <PageBackground />
      <Navbar />

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-6 lg:pt-40">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--orange-1)]">
            {hero.eyebrow}
          </p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            <HeroCycle
              lines={hero.lines}
              intervalMs={hero.intervalMs}
              transitionMs={hero.transitionMs}
            />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-black/68 dark:text-white/68 sm:text-lg">
            {hero.subtitle}
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={hero.primaryCta.href}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(hero.primaryCta.href);
              }}
              className="inline-flex items-center justify-center rounded-full bg-[var(--orange-1)] px-6 py-3 text-sm font-medium text-white shadow-[0_16px_50px_rgba(255,138,31,0.28)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--orange-3)]"
            >
              {hero.primaryCta.label}
            </a>
            <a
              href={hero.secondaryCta.href}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(hero.secondaryCta.href);
              }}
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/60 px-6 py-3 text-sm font-medium text-black/75 transition duration-300 hover:border-orange-300 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/78 dark:hover:border-orange-400/40 dark:hover:text-white"
            >
              {hero.secondaryCta.label}
            </a>
          </div>
          <p className="mt-5 text-xs text-black/45 dark:text-white/45">
            Vrijblijvend · één vast aanspreekpunt · geen verborgen kosten
          </p>
        </div>
      </section>

      {/* Diensten */}
      <section
        id="diensten"
        className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-6 lg:py-24"
      >
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--orange-1)]">
            Diensten
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Alles wat je nodig hebt, onder één dak.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-3xl border border-black/8 bg-white/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-orange-300/60 dark:border-white/10 dark:bg-white/5 dark:hover:border-orange-400/30"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-[var(--orange-3)] dark:bg-orange-500/12 dark:text-orange-300">
                <Icon name={service.icon} size={20} />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-black/65 dark:text-white/65">
                {service.description}
              </p>
              <ul className="mt-5 space-y-2.5">
                {service.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm text-black/70 dark:text-white/70"
                  >
                    <Icon
                      name="check"
                      size={15}
                      className="mt-0.5 shrink-0 text-[var(--orange-3)] dark:text-orange-300"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Werkwijze */}
      <section
        id="werkwijze"
        className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-6 lg:py-24"
      >
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--orange-1)]">
            Werkwijze
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {process.title}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {process.steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-3xl border border-black/8 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5"
            >
              <div className="text-sm font-semibold text-[var(--orange-3)] dark:text-orange-300">
                0{i + 1}
              </div>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Over */}
      <section
        id="over"
        className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-6 lg:py-24"
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-black/8 bg-white/70 p-7 dark:border-white/10 dark:bg-white/5 sm:p-9">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--orange-1)]">
              {about.title}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Persoonlijk, duidelijk en gebouwd om te blijven.
            </h2>
            {about.paragraphs.map((p) => (
              <p
                key={p}
                className="mt-4 text-base leading-7 text-black/68 dark:text-white/68"
              >
                {p}
              </p>
            ))}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {about.points.map((point) => (
                <div
                  key={point.title}
                  className="rounded-2xl border border-black/8 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.03]"
                >
                  <h3 className="text-base font-semibold">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-black/65 dark:text-white/65">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-black/8 bg-white/70 p-7 dark:border-white/10 dark:bg-white/5 sm:p-9">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--orange-1)] text-xl font-bold text-white shadow-[0_10px_30px_rgba(255,138,31,0.3)]">
                {initials(site.founderName) || "S"}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{site.founderName}</h3>
                <p className="text-sm text-black/55 dark:text-white/55">
                  Oprichter van {site.name}
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm leading-7 text-black/68 dark:text-white/68">
              Je werkt rechtstreeks met de oprichter: geen accountmanagers,
              geen wisselende teams en geen callcenter. Van het eerste gesprek
              tot de oplevering en daarna blijf je met dezelfde persoon in
              contact.
            </p>
            <div className="mt-6 space-y-3 text-sm text-black/65 dark:text-white/65">
              {site.location && (
                <div className="flex items-center gap-2.5">
                  <Icon name="map-pin" size={16} className="text-[var(--orange-3)] dark:text-orange-300" />
                  {site.location}
                </div>
              )}
              {site.email && (
                <div className="flex items-center gap-2.5">
                  <Icon name="mail" size={16} className="text-[var(--orange-3)] dark:text-orange-300" />
                  <a href={`mailto:${site.email}`} className="hover:underline">
                    {site.email}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 pb-24 pt-16 sm:px-6 lg:pb-32"
      >
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--orange-1)]">
              Contact
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {contact.title}
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-black/68 dark:text-white/68">
              {contact.subtitle}
            </p>

            <ul className="mt-8 space-y-4 text-sm text-black/65 dark:text-white/65">
              {site.email && (
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[var(--orange-3)] dark:bg-orange-500/12 dark:text-orange-300">
                    <Icon name="mail" size={17} />
                  </span>
                  <a href={`mailto:${site.email}`} className="hover:underline">
                    {site.email}
                  </a>
                </li>
              )}
              {site.phone && (
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[var(--orange-3)] dark:bg-orange-500/12 dark:text-orange-300">
                    <Icon name="phone" size={17} />
                  </span>
                  <a
                    href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}
                    className="hover:underline"
                  >
                    {site.phone}
                  </a>
                </li>
              )}
              {contact.hours && (
                <li className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-[var(--orange-3)] dark:bg-orange-500/12 dark:text-orange-300">
                    <Icon name="clock" size={17} />
                  </span>
                  {contact.hours}
                </li>
              )}
            </ul>
          </div>

          <BookingForm services={services} />
        </div>
      </section>

      <Footer />
    </main>
  );
}

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Icon } from "../components/Icon";
import type {
  Booking,
  BookingStatus,
  Service,
  SiteContent,
  SiteInfo,
} from "../lib/types";
import {
  apiLogin,
  apiLogout,
  apiMe,
  deleteBooking,
  fetchContent,
  listBookings,
  saveContent,
  updateBookingStatus,
} from "../lib/api";

const inputCls =
  "mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--orange-1)] dark:border-white/10 dark:bg-white/5 dark:text-white";

const STATUSES: { id: BookingStatus; label: string }[] = [
  { id: "nieuw", label: "Nieuw" },
  { id: "gelezen", label: "Gelezen" },
  { id: "afgehandeld", label: "Afgehandeld" },
];

const STATUS_STYLE: Record<BookingStatus, string> = {
  nieuw: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200",
  gelezen: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
  afgehandeld: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-200",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </label>
  );
}

function StringListEditor({
  label,
  values,
  onChange,
  addLabel = "Toevoegen",
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  addLabel?: string;
}) {
  return (
    <div>
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <input
              value={v}
              onChange={(e) =>
                onChange(values.map((x, idx) => (idx === i ? e.target.value : x)))
              }
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              aria-label="Verwijder regel"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 text-black/50 transition hover:text-red-500 dark:border-white/10 dark:text-white/50"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--orange-3)] hover:underline dark:text-orange-300"
      >
        <Icon name="plus" size={14} /> {addLabel}
      </button>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white/70 p-6 dark:border-white/10 dark:bg-white/5">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

/* ------------------------------- Login ---------------------------------- */

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiLogin(username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen mislukt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-24 max-w-sm px-5">
      <form
        onSubmit={submit}
        className="rounded-3xl border border-black/8 bg-white/70 p-8 dark:border-white/10 dark:bg-white/5"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--orange-1)] text-white">
          <Icon name="lock" size={20} />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Beheer SoftSite
        </h1>
        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          Log in om content en aanvragen te beheren.
        </p>

        <div className="mt-6 space-y-4">
          <Field label="Gebruikersnaam" value={username} onChange={setUsername} />
          <Field
            label="Wachtwoord"
            value={password}
            onChange={setPassword}
            type="password"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--orange-1)] px-6 py-3 text-sm font-medium text-white transition duration-300 hover:bg-[var(--orange-3)] disabled:opacity-60"
        >
          {loading ? "Inloggen…" : "Inloggen"}
        </button>

        <a
          href="/"
          className="mt-4 block text-center text-xs text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
        >
          ← Terug naar de site
        </a>
      </form>
    </div>
  );
}

/* ----------------------------- Aanvragen tab ---------------------------- */

function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | "alle">("alle");
  const [loading, setLoading] = useState(true);

  const load = () => {
    listBookings()
      .then(setBookings)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setStatus = async (id: number, status: BookingStatus) => {
    await updateBookingStatus(id, status);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
  };

  const remove = async (id: number) => {
    if (!window.confirm("Deze aanvraag verwijderen?")) return;
    await deleteBooking(id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const visible =
    filter === "alle" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("alle")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === "alle"
              ? "bg-[var(--orange-1)] text-white"
              : "border border-black/10 text-black/65 hover:border-orange-300 dark:border-white/10 dark:text-white/65"
          }`}
        >
          Alle ({bookings.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilter(s.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === s.id
                ? "bg-[var(--orange-1)] text-white"
                : "border border-black/10 text-black/65 hover:border-orange-300 dark:border-white/10 dark:text-white/65"
            }`}
          >
            {s.label} ({bookings.filter((b) => b.status === s.id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-black/55 dark:text-white/55">Laden…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 text-sm text-black/55 dark:text-white/55">
          Geen aanvragen in deze weergave.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {visible.map((b) => (
            <li
              key={b.id}
              className="rounded-2xl border border-black/8 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {b.name}
                    {b.company && (
                      <span className="font-normal text-black/50 dark:text-white/50">
                        {" "}
                        · {b.company}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                    {fmtDate(b.created_at)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[b.status]}`}
                >
                  {STATUSES.find((s) => s.id === b.status)?.label}
                </span>
              </div>

              <div className="mt-3 grid gap-3 text-sm text-black/70 dark:text-white/70 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Icon name="mail" size={15} className="text-black/40 dark:text-white/40" />
                  <a href={`mailto:${b.email}`} className="hover:underline">
                    {b.email}
                  </a>
                </div>
                {b.phone && (
                  <div className="flex items-center gap-2">
                    <Icon name="phone" size={15} className="text-black/40 dark:text-white/40" />
                    <a href={`tel:${b.phone.replace(/[^+\d]/g, "")}`} className="hover:underline">
                      {b.phone}
                    </a>
                  </div>
                )}
                {b.service && (
                  <div className="flex items-center gap-2">
                    <Icon name="spark" size={15} className="text-black/40 dark:text-white/40" />
                    {b.service}
                  </div>
                )}
                {b.contact_method && (
                  <div className="flex items-center gap-2">
                    <Icon name="calendar" size={15} className="text-black/40 dark:text-white/40" />
                    {b.contact_method}
                    {b.preferred_date && ` · ${b.preferred_date}`}
                  </div>
                )}
              </div>

              {b.message && (
                <p className="mt-3 whitespace-pre-wrap rounded-xl border border-black/8 bg-black/[0.02] p-4 text-sm leading-6 text-black/70 dark:border-white/8 dark:bg-white/[0.03] dark:text-white/70">
                  {b.message}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/8 pt-4 dark:border-white/10">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatus(b.id, s.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      b.status === s.id
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "border border-black/10 text-black/60 hover:border-orange-300 dark:border-white/10 dark:text-white/60"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={() => remove(b.id)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/55 transition hover:border-red-300 hover:text-red-600 dark:border-white/10 dark:text-white/55 dark:hover:text-red-300"
                >
                  <Icon name="trash" size={13} />
                  Verwijderen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------ Content tab ----------------------------- */

function ContentTab() {
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchContent().then(setDraft).catch(() => setError("Content kon niet worden geladen."));
  }, []);

  if (!draft) {
    return (
      <p className="text-sm text-black/55 dark:text-white/55">
        {error || "Laden…"}
      </p>
    );
  }

  const update = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const updateSite = (key: keyof SiteInfo, value: string) =>
    setDraft((d) => (d ? { ...d, site: { ...d.site, [key]: value } } : d));

  const updateHero = (patch: Partial<SiteContent["hero"]>) =>
    setDraft((d) => (d ? { ...d, hero: { ...d.hero, ...patch } } : d));

  const updateService = (i: number, patch: Partial<Service>) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            services: d.services.map((s, idx) =>
              idx === i ? { ...s, ...patch } : s
            ),
          }
        : d
    );

  const save = async () => {
    setSaved(false);
    setError("");
    try {
      await saveContent(draft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt");
    }
  };

  return (
    <div className="space-y-5">
      <Section title="Bedrijf">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bedrijfsnaam" value={draft.site.name} onChange={(v) => updateSite("name", v)} />
          <Field label="Naam oprichter" value={draft.site.founderName} onChange={(v) => updateSite("founderName", v)} />
          <Field label="Locatie" value={draft.site.location} onChange={(v) => updateSite("location", v)} />
          <Field label="E-mailadres" value={draft.site.email} onChange={(v) => updateSite("email", v)} />
          <Field label="Telefoonnummer" value={draft.site.phone} onChange={(v) => updateSite("phone", v)} />
          <Field label="KvK-nummer" value={draft.site.kvk} onChange={(v) => updateSite("kvk", v)} />
          <Field label="BTW-nummer" value={draft.site.btw} onChange={(v) => updateSite("btw", v)} />
        </div>
      </Section>

      <Section title="Hero">
        <Field label="Eyebrow" value={draft.hero.eyebrow} onChange={(v) => updateHero({ eyebrow: v })} />
        <Field label="Ondertitel" value={draft.hero.subtitle} onChange={(v) => updateHero({ subtitle: v })} textarea />
        <StringListEditor
          label="Roterende teksten"
          values={draft.hero.lines}
          onChange={(lines) => updateHero({ lines })}
          addLabel="Regel toevoegen"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Wisseltijd per tekst (ms)</span>
            <input
              type="number"
              min={1000}
              step={100}
              value={draft.hero.intervalMs}
              onChange={(e) =>
                updateHero({ intervalMs: Number(e.target.value) || 3800 })
              }
              className={inputCls}
            />
            <span className="mt-1 block text-xs text-black/45 dark:text-white/45">
              Hoe lang elke tekst blijft staan voordat de volgende komt.
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Overgangstijd (ms)</span>
            <input
              type="number"
              min={150}
              step={50}
              value={draft.hero.transitionMs}
              onChange={(e) =>
                updateHero({ transitionMs: Number(e.target.value) || 500 })
              }
              className={inputCls}
            />
            <span className="mt-1 block text-xs text-black/45 dark:text-white/45">
              Hoe snel de fade van tekst A naar B verloopt.
            </span>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Knop 1 label"
            value={draft.hero.primaryCta.label}
            onChange={(v) => updateHero({ primaryCta: { ...draft.hero.primaryCta, label: v } })}
          />
          <Field
            label="Knop 2 label"
            value={draft.hero.secondaryCta.label}
            onChange={(v) => updateHero({ secondaryCta: { ...draft.hero.secondaryCta, label: v } })}
          />
        </div>
      </Section>

      <Section title="Diensten">
        {draft.services.map((service, i) => (
          <div
            key={service.id}
            className="rounded-2xl border border-black/8 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.03]"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Titel"
                value={service.title}
                onChange={(v) => updateService(i, { title: v })}
              />
              <Field
                label="Beschrijving"
                value={service.description}
                onChange={(v) => updateService(i, { description: v })}
              />
            </div>
            <div className="mt-4">
              <StringListEditor
                label="Kenmerken"
                values={service.points}
                onChange={(points) => updateService(i, { points })}
                addLabel="Kenmerk toevoegen"
              />
            </div>
          </div>
        ))}
      </Section>

      <Section title="Werkwijze">
        <Field
          label="Titel"
          value={draft.process.title}
          onChange={(v) => update("process", { ...draft.process, title: v })}
        />
        {draft.process.steps.map((step, i) => (
          <div
            key={i}
            className="grid gap-4 rounded-2xl border border-black/8 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.03] sm:grid-cols-2"
          >
            <Field
              label={`Stap ${i + 1} · titel`}
              value={step.title}
              onChange={(v) =>
                update("process", {
                  ...draft.process,
                  steps: draft.process.steps.map((s, idx) =>
                    idx === i ? { ...s, title: v } : s
                  ),
                })
              }
            />
            <Field
              label={`Stap ${i + 1} · beschrijving`}
              value={step.description}
              onChange={(v) =>
                update("process", {
                  ...draft.process,
                  steps: draft.process.steps.map((s, idx) =>
                    idx === i ? { ...s, description: v } : s
                  ),
                })
              }
            />
          </div>
        ))}
      </Section>

      <Section title="Over">
        <Field
          label="Titel"
          value={draft.about.title}
          onChange={(v) => update("about", { ...draft.about, title: v })}
        />
        <StringListEditor
          label="Alinea's"
          values={draft.about.paragraphs}
          onChange={(paragraphs) => update("about", { ...draft.about, paragraphs })}
          addLabel="Alinea toevoegen"
        />
        {draft.about.points.map((point, i) => (
          <div
            key={i}
            className="grid gap-4 rounded-2xl border border-black/8 bg-black/[0.02] p-5 dark:border-white/8 dark:bg-white/[0.03] sm:grid-cols-2"
          >
            <Field
              label={`Kenmerk ${i + 1} · titel`}
              value={point.title}
              onChange={(v) =>
                update("about", {
                  ...draft.about,
                  points: draft.about.points.map((p, idx) =>
                    idx === i ? { ...p, title: v } : p
                  ),
                })
              }
            />
            <Field
              label={`Kenmerk ${i + 1} · beschrijving`}
              value={point.description}
              onChange={(v) =>
                update("about", {
                  ...draft.about,
                  points: draft.about.points.map((p, idx) =>
                    idx === i ? { ...p, description: v } : p
                  ),
                })
              }
            />
          </div>
        ))}
      </Section>

      <Section title="Contact">
        <Field
          label="Titel"
          value={draft.contact.title}
          onChange={(v) => update("contact", { ...draft.contact, title: v })}
        />
        <Field
          label="Ondertitel"
          value={draft.contact.subtitle}
          onChange={(v) => update("contact", { ...draft.contact, subtitle: v })}
          textarea
        />
        <Field
          label="Bereikbaarheid"
          value={draft.contact.hours}
          onChange={(v) => update("contact", { ...draft.contact, hours: v })}
        />
      </Section>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--orange-1)] px-6 py-3 text-sm font-medium text-white transition duration-300 hover:bg-[var(--orange-3)]"
        >
          <Icon name="check" size={15} />
          Wijzigingen opslaan
        </button>
        {saved && (
          <span className="text-sm font-medium text-green-600 dark:text-green-300">
            Opgeslagen
          </span>
        )}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
  );
}

/* ------------------------------- Dashboard ------------------------------ */

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"aanvragen" | "content">("aanvragen");

  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--orange-1)] text-sm font-bold text-white">
            S
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">SoftSite beheer</h1>
            <p className="text-xs text-black/50 dark:text-white/50">
              Content en aanvragen beheren
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition hover:border-orange-300 dark:border-white/10 dark:text-white/70"
          >
            <Icon name="arrow-right" size={14} />
            Naar de site
          </a>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition hover:border-orange-300 dark:border-white/10 dark:text-white/70"
          >
            <Icon name="logout" size={14} />
            Uitloggen
          </button>
        </div>
      </div>

      <div className="mt-8 flex gap-2 border-b border-black/8 dark:border-white/10">
        <button
          onClick={() => setTab("aanvragen")}
          className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            tab === "aanvragen"
              ? "border-[var(--orange-1)] text-black dark:text-white"
              : "border-transparent text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white"
          }`}
        >
          <Icon name="inbox" size={16} />
          Aanvragen
        </button>
        <button
          onClick={() => setTab("content")}
          className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            tab === "content"
              ? "border-[var(--orange-1)] text-black dark:text-white"
              : "border-transparent text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white"
          }`}
        >
          <Icon name="edit" size={16} />
          Content
        </button>
      </div>

      <div className="mt-8">
        {tab === "aanvragen" ? <BookingsTab /> : <ContentTab />}
      </div>
    </div>
  );
}

/* -------------------------------- Root ---------------------------------- */

export default function Admin() {
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    apiMe()
      .then((res) => setAuthenticated(res.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setChecked(true));
  }, []);

  const logout = async () => {
    await apiLogout();
    setAuthenticated(false);
  };

  if (!checked) {
    return (
      <main className="min-h-screen bg-[var(--bg-light)] text-[var(--text-light)] transition-colors duration-300 dark:bg-[var(--bg-dark)] dark:text-[var(--text-dark)]">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-black/55 dark:text-white/55">Laden…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-light)] text-[var(--text-light)] transition-colors duration-300 dark:bg-[var(--bg-dark)] dark:text-[var(--text-dark)]">
      {authenticated ? (
        <Dashboard onLogout={logout} />
      ) : (
        <LoginForm onSuccess={() => setAuthenticated(true)} />
      )}
    </main>
  );
}

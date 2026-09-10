export type Service = {
  id: string;
  icon: string;
  title: string;
  description: string;
  points: string[];
};

export type ProcessStep = {
  title: string;
  description: string;
};

export type AboutPoint = {
  title: string;
  description: string;
};

export type SiteInfo = {
  name: string;
  founderName: string;
  location: string;
  email: string;
  phone: string;
  kvk: string;
  btw: string;
};

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

export type BookingStatus = "nieuw" | "gelezen" | "afgehandeld";

export type Booking = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  contact_method: string | null;
  status: BookingStatus;
  created_at: string;
};

export type BookingPayload = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  message?: string;
  preferred_date?: string;
  preferred_time?: string;
  contact_method?: string;
};

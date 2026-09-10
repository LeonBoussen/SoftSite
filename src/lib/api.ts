import type { Booking, BookingPayload, SiteContent } from "./types";

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Er ging iets mis. Probeer het opnieuw.";
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* body is geen JSON */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export function fetchContent(): Promise<SiteContent> {
  return fetch("/api/content").then((r) => readJson<SiteContent>(r));
}

export function submitBooking(
  payload: BookingPayload
): Promise<{ ok: boolean; ref: string }> {
  return fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => readJson<{ ok: boolean; ref: string }>(r));
}

export function apiLogin(
  username: string,
  password: string
): Promise<{ ok: boolean }> {
  return fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  }).then((r) => readJson<{ ok: boolean }>(r));
}

export function apiLogout(): Promise<{ ok: boolean }> {
  return fetch("/api/auth/logout", { method: "POST" }).then((r) =>
    readJson<{ ok: boolean }>(r)
  );
}

export function apiMe(): Promise<{ authenticated: boolean }> {
  return fetch("/api/auth/me").then((r) =>
    readJson<{ authenticated: boolean }>(r)
  );
}

export function listBookings(): Promise<Booking[]> {
  return fetch("/api/admin/bookings").then((r) => readJson<Booking[]>(r));
}

export function updateBookingStatus(
  id: number,
  status: string
): Promise<{ ok: boolean }> {
  return fetch(`/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then((r) => readJson<{ ok: boolean }>(r));
}

export function deleteBooking(id: number): Promise<{ ok: boolean }> {
  return fetch(`/api/admin/bookings/${id}`, { method: "DELETE" }).then((r) =>
    readJson<{ ok: boolean }>(r)
  );
}

export function saveContent(content: SiteContent): Promise<{ ok: boolean }> {
  return fetch("/api/admin/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  }).then((r) => readJson<{ ok: boolean }>(r));
}

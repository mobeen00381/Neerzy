// src/components/admin/api.ts
// Client-side fetch helpers for the private /admin dashboard.

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("admin_token") || "";
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("admin_auth");
  sessionStorage.removeItem("admin_token");
}

export function qs(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Authenticated JSON request to an /api/admin route. */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (init?.body) headers["Content-Type"] = "application/json";

  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    clearAdminSession();
    if (typeof window !== "undefined") window.location.href = "/admin";
    throw new ApiError("Session expired — please sign in again.", 401);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status);
  }
  return res.json() as Promise<T>;
}

/** Exports a CSV from /api/admin/export (downloads in the browser). */
export async function exportCsv(type: "users" | "transactions" | "leads"): Promise<void> {
  const token = getAdminToken();
  const res = await fetch(`/api/admin/export?type=${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body?.error || "Export failed", res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neerzy-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

"use server";

import { cookies } from "next/headers";
import type { Mention } from "@/lib/announcements";
import { getUserByUsername } from "./profile";

const API_BASE = process.env.BASE_URL;
const ENDPOINT = `${API_BASE}api/v1/announcements/`;

export type AnnouncementStatus = "draft" | "scheduled" | "pending" | "published" | "failed";

export interface Author {
  username: string;
  first_name: string;
  last_name: string;
}

// Editors only — the API strips `deliveries` from everyone else
export interface Delivery {
  id: number;
  channel: string;
  status: "pending" | "sent" | "failed";
  attempts: number;
  // Raw exception text: the API sends it to Admins only, so it is absent for other editors
  last_error?: string;
  delivered_at: string | null;
}

export interface Announcement {
  id: number;
  type: string;
  type_display: string;
  title: string;
  summary: string;
  content: string;
  publish_at: string | null;
  status: AnnouncementStatus;
  created_at: string;
  updated_at: string;
  created_by: Author | null;
  updated_by: Author | null;
  // Discord ID → member, for the <@id> pings in `content` (best effort: unknown IDs are absent)
  mentions: Record<string, Mention>;
  deliveries?: Delivery[];
}

// What a logged-out visitor may read: enough for a link card, never the body
export interface AnnouncementPreview {
  id: number;
  type: string;
  type_display: string;
  title: string;
  summary: string;
  publish_at: string;
}

export interface AnnouncementPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Announcement[];
}

export interface AnnouncementFilters {
  page?: number;
  type?: string;
  in_title?: string;
  status?: AnnouncementStatus;
  created_by?: string;
  // Published-only: what the home card and /news show, even to editors
  live?: boolean;
  ordering?: string;
}

export interface AnnouncementPayload {
  type: string;
  title: string;
  summary: string;
  content: string;
  publish_at: string | null;
}

export interface TypeOption {
  value: string;
  label: string;
}

type Result<T> = { success: true; data: T } | { success: false; error: string; notFound: boolean };

async function authHeaders() {
  const access = (await cookies()).get("access")?.value;
  if (!access) throw new Error("No access token found");
  return {
    Authorization: `Bearer ${access}`,
    "Accept-Language": "ar",
    "Content-Type": "application/json",
  };
}

// DRF keys field errors by field name and puts permission/object errors in `detail`
async function errorMessage(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null);
  const firstFieldError = Object.values(data ?? {}).find(
    (v): v is string[] => Array.isArray(v) && typeof v[0] === "string",
  )?.[0];
  return data?.detail || firstFieldError || `${fallback} (${res.status})`;
}

// The shared fetch → error-parse → try/catch shape for every call below
async function call<T>(
  url: string,
  init: RequestInit & { auth?: boolean },
  fallback: string,
): Promise<Result<T>> {
  try {
    const { auth = true, ...rest } = init;
    const headers = auth ? await authHeaders() : { "Accept-Language": "ar" };
    const res = await fetch(url, { ...rest, headers, cache: "no-store" });
    if (!res.ok) {
      return {
        success: false,
        error: await errorMessage(res, fallback),
        notFound: res.status === 404,
      };
    }
    return { success: true, data: (res.status === 204 ? undefined : await res.json()) as T };
  } catch (error) {
    console.error(`Error in ${init.method ?? "GET"} ${url}:`, error);
    return { success: false, error: fallback, notFound: false };
  }
}

export async function getAnnouncements(
  filters: AnnouncementFilters = {},
): Promise<Result<AnnouncementPage>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return call(`${ENDPOINT}?${params}`, {}, "تعذر تحميل الأخبار");
}

export async function getAnnouncement(id: number): Promise<Result<Announcement>> {
  return call(`${ENDPOINT}${id}/`, {}, "تعذر تحميل الخبر");
}

// No login needed — this is what a link card and the logged-out teaser are built from
export async function getAnnouncementPreview(id: number): Promise<Result<AnnouncementPreview>> {
  return call(`${ENDPOINT}${id}/preview/`, { auth: false }, "تعذر تحميل الخبر");
}

// Labels come from the API (DRF's OPTIONS metadata) instead of a hand-kept list. Only
// someone allowed to POST gets them, which is exactly who opens the editor.
export async function getTypeOptions(): Promise<Result<TypeOption[]>> {
  const res = await call<{
    actions?: { POST?: { type?: { choices?: { value: string; display_name: string }[] } } };
  }>(ENDPOINT, { method: "OPTIONS" }, "تعذر تحميل أنواع الأخبار");
  if (!res.success) return res;
  const choices = res.data.actions?.POST?.type?.choices ?? [];
  return {
    success: true,
    data: choices.map((c) => ({ value: c.value, label: c.display_name })),
  };
}

export async function createAnnouncement(
  payload: AnnouncementPayload,
): Promise<Result<Announcement>> {
  return call(ENDPOINT, { method: "POST", body: JSON.stringify(payload) }, "فشل إنشاء الخبر");
}

export async function updateAnnouncement(
  id: number,
  payload: Partial<AnnouncementPayload>,
): Promise<Result<Announcement>> {
  return call(
    `${ENDPOINT}${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    "فشل تحديث الخبر",
  );
}

export async function deleteAnnouncement(id: number): Promise<Result<undefined>> {
  return call(`${ENDPOINT}${id}/`, { method: "DELETE" }, "فشل حذف الخبر");
}

// For the editor's preview: the same `{name, username}` the API puts in `mentions`, for
// handles typed since the last save. `null` marks a handle no member owns, so the editor
// doesn't ask again. Same name rule as the API: full name, else the username.
// One request per handle, capped; a leaderboard post has a handful. Add a
// batch filter on the users endpoint if bodies ever mention dozens of people.
export async function resolveMentions(
  usernames: string[],
): Promise<Record<string, Mention | null>> {
  const found = await Promise.all(
    usernames.slice(0, 20).map(async (username) => {
      const res = await getUserByUsername(username);
      if (!res.success || !res.data) return [username, null] as const;
      const u = res.data;
      const name = `${u.first_name} ${u.last_name}`.trim() || u.username;
      return [username, { name, username: u.username }] as const;
    }),
  );
  return Object.fromEntries(found);
}

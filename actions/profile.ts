"use server";

import { cookies } from "next/headers";
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { getHijriMonthDays } from "@/lib/utils";
import { SUPERVISOR_MANAGED_CATEGORY_IDS } from "@/lib/profile-types";
import { getCachedPointsCategories } from "./categories";

const API_BASE = process.env.BASE_URL;

function toIsoDate(d: { year: number; month: number; day: number }): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

// The last seven days, ending today. The control board buckets by Hijri week for
// its own grid, but a follow-up signal must not reset the whole circle to
// "has not recited" on the first of each month.
function getLastSevenDays(): { start: string; end: string } {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 86_400_000);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: iso(weekAgo), end: iso(today) };
}

// Current Hijri month range (same as the home leaderboard)
function getCurrentHijriMonthRange(): { start: string; end: string } {
  const now = new Date();
  const hijri = gregorianToHijri({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
  const monthDays = getHijriMonthDays(hijri.year, hijri.month);
  const start = hijriToGregorian({ year: hijri.year, month: hijri.month, day: 1 });
  const end = hijriToGregorian({ year: hijri.year, month: hijri.month, day: monthDays });
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

// ===============================
// Types
// ===============================

interface ApiUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[];
  supervisor: string | null;
  referrer: string | null;
  date_joined: string;
}

interface ApiActivity {
  id: number;
  category: number;
  date: string;
  multiplier: number;
}

interface ApiPoints {
  user: number;
  points: number;
  activities: ApiActivity[];
}

interface ApiCategory {
  id: number;
  name: string;
  value: number;
}

export interface FetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===============================
// Token helper
// ===============================

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access")?.value ?? null;
}

async function fetchJson<T>(url: string, token: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": "ar",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

// ===============================
// Get User by Username (for supervisor/referrer links)
// ===============================

export async function getUserByUsername(username: string): Promise<FetchResult<ApiUser>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const data = await fetchJson<{ results: ApiUser[] }>(
      `${API_BASE}api/v1/users/?username=${encodeURIComponent(username)}`,
      token,
    );

    if (!data.results || data.results.length === 0) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: data.results[0] };
  } catch (error) {
    console.error("Error fetching user by username:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===============================
// Get User Profile by ID
// ===============================

export async function getUserProfile(
  userId: number,
): Promise<FetchResult<{ user: ApiUser; points: number; activities: ApiActivity[] }>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const [userRes, pointsRes] = await Promise.all([
      fetchJson<ApiUser>(`${API_BASE}api/v1/users/${userId}/`, token),
      fetchJson<ApiPoints | { results: ApiPoints[] }>(
        `${API_BASE}api/v1/users/${userId}/points/`,
        token,
      ),
    ]);

    // Points endpoint may return a single object or paginated results
    let pointsData: ApiPoints;
    if (Array.isArray(pointsRes)) {
      pointsData = pointsRes[0] ?? { user: userId, points: 0, activities: [] };
    } else if ("results" in pointsRes && Array.isArray(pointsRes.results)) {
      pointsData = pointsRes.results[0] ?? { user: userId, points: 0, activities: [] };
    } else {
      pointsData = pointsRes as ApiPoints;
    }

    return {
      success: true,
      data: {
        user: userRes,
        points: pointsData.points ?? 0,
        activities: pointsData.activities ?? [],
      },
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===============================
// Get One Hijri Month's Points
// ===============================
// `/users/{id}/points/` without a date range returns everything since the member
// joined. The profile talks about "this month", so it has to ask for the month.

export async function getUserPointsForMonth(
  userId: number,
  hijriYear: number,
  hijriMonth: number,
): Promise<FetchResult<{ points: number; activities: ApiActivity[] }>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const monthDays = getHijriMonthDays(hijriYear, hijriMonth);
    const start = toIsoDate(hijriToGregorian({ year: hijriYear, month: hijriMonth, day: 1 }));
    const end = toIsoDate(hijriToGregorian({ year: hijriYear, month: hijriMonth, day: monthDays }));

    const data = await fetchJson<ApiPoints>(
      `${API_BASE}api/v1/users/${userId}/points/?date_after=${start}&date_before=${end}`,
      token,
    );

    return {
      success: true,
      data: { points: data.points ?? 0, activities: data.activities ?? [] },
    };
  } catch (error) {
    console.error("Error fetching month points:", error);
    return { success: false, error: "تعذّر تحميل نقاط الشهر" };
  }
}

// ===============================
// Get Circle Peers (same recitation supervisor)
// ===============================

export interface CirclePeer {
  id: number;
  username: string;
  fullName: string;
}

export async function getCirclePeers(
  supervisorUsername: string,
  excludeUserId: number,
): Promise<FetchResult<CirclePeer[]>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const data = await fetchJson<{ results: ApiUser[] }>(
      `${API_BASE}api/v1/users/?supervisor=${encodeURIComponent(supervisorUsername)}&group=Student`,
      token,
    );

    // The API hands back each peer's email; it has no business reaching the browser
    const peers = (data.results || [])
      .filter((u) => u.id !== excludeUserId)
      .map((u) => ({
        id: u.id,
        username: u.username,
        fullName: `${u.first_name} ${u.last_name}`.trim() || u.username,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"));

    return { success: true, data: peers };
  } catch (error) {
    console.error("Error fetching circle peers:", error);
    return { success: false, error: "تعذّر تحميل زملاء الحلقة" };
  }
}

// ===============================
// Get Student Rank (monthly leaderboard position)
// ===============================

export async function getStudentRank(
  userId: number,
  hijriYear?: number,
  hijriMonth?: number,
): Promise<FetchResult<number | null>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const { start, end } =
      hijriYear && hijriMonth
        ? {
            start: toIsoDate(hijriToGregorian({ year: hijriYear, month: hijriMonth, day: 1 })),
            end: toIsoDate(
              hijriToGregorian({
                year: hijriYear,
                month: hijriMonth,
                day: getHijriMonthDays(hijriYear, hijriMonth),
              }),
            ),
          }
        : getCurrentHijriMonthRange();

    const data = await fetchJson<{ results: ApiPoints[] } | ApiPoints[]>(
      `${API_BASE}api/v1/users/points/?date_after=${start}&date_before=${end}&ordering=-points`,
      token,
    );

    const results = Array.isArray(data) ? data : (data.results ?? []);
    const me = results.find((p) => p.user === userId);
    if (!me) return { success: true, data: null };

    // A month with no points earns no standing — in a month where nobody scored,
    // the tie rule below would otherwise hand everyone first place
    if ((me.points ?? 0) <= 0) return { success: true, data: null };

    // Rank = 1 + number of students with strictly more points (ties share rank)
    const rank = 1 + results.filter((p) => (p.points ?? 0) > (me.points ?? 0)).length;
    return { success: true, data: rank };
  } catch (error) {
    console.error("Error fetching student rank:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// The most recent activity of any kind, used to spot a member who has stopped
function latestActivityDate(activities?: ApiActivity[]): string | null {
  if (!activities || activities.length === 0) return null;
  let latest = 0;
  for (const a of activities) {
    const t = new Date(a.date).getTime();
    if (!Number.isNaN(t) && t > latest) latest = t;
  }
  return latest > 0 ? new Date(latest).toISOString() : null;
}

// ===============================
// Quiet Members (Admin only)
// ===============================
// Every student, with how long they have been silent. An administrator is the one
// who can pick up a phone, so this is the list that lets them notice a member
// slipping away before the term ends.
//
// Note: /users/points/ is capped at one page of 50 by the API, so a community past
// that size will need the endpoint paginated before this list can be complete.

export interface QuietMember {
  id: number;
  username: string;
  fullName: string;
  supervisorName: string | null;
  dateJoined: string;
  lastActivityAt: string | null;
  weeksSilent: number | null;
}

export async function getQuietMembers(): Promise<FetchResult<QuietMember[]>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    // One pass over the whole roster: it yields the students and, from the same
    // rows, the names behind the supervisor usernames the API stores.
    const [usersRes, pointsRes] = await Promise.all([
      fetchJson<{ results: ApiUser[] }>(`${API_BASE}api/v1/users/`, token),
      fetchJson<{ results: ApiPoints[] } | ApiPoints[]>(`${API_BASE}api/v1/users/points/`, token),
    ]);

    const everyone = usersRes.results || [];
    const points = Array.isArray(pointsRes) ? pointsRes : (pointsRes.results ?? []);
    const nameOf = new Map(
      everyone.map((u) => [u.username, `${u.first_name} ${u.last_name}`.trim() || u.username]),
    );

    const members: QuietMember[] = everyone
      .filter((u) => (u.groups || []).includes("Student"))
      .map((u) => {
        const record = points.find((p) => p.user === u.id);
        const lastActivityAt = latestActivityDate(record?.activities);
        const since = lastActivityAt ?? u.date_joined;
        const last = new Date(since);
        const weeks = Number.isNaN(last.getTime())
          ? null
          : Math.floor((Date.now() - last.getTime()) / 86_400_000 / 7);

        return {
          id: u.id,
          username: u.username,
          fullName: `${u.first_name} ${u.last_name}`.trim() || u.username,
          supervisorName: u.supervisor ? (nameOf.get(u.supervisor) ?? u.supervisor) : null,
          dateJoined: u.date_joined,
          lastActivityAt,
          weeksSilent: weeks,
        };
      });

    // Longest silence first — the members furthest from the maqra'a lead the list
    members.sort((a, b) => (b.weeksSilent ?? 0) - (a.weeksSilent ?? 0));

    return { success: true, data: members };
  } catch (error) {
    console.error("Error fetching quiet members:", error);
    return { success: false, error: "تعذّر تحميل متابعة الأعضاء" };
  }
}

// ===============================
// Get Supervised Students (Moderator only)
// ===============================

export async function getSupervisedStudents(supervisorUsername: string): Promise<
  FetchResult<
    Array<{
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      groups: string[];
      points: number;
      activities_count: number;
      weekly_activities_count: number;
      date_joined: string;
      recited_this_week: boolean;
      last_activity_at: string | null;
    }>
  >
> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const { start, end } = getLastSevenDays();
    const { start: monthStart, end: monthEnd } = getCurrentHijriMonthRange();

    // Students supervised by this moderator; their points and activity count for
    // the current Hijri month (same period as the rest of the app); their
    // all-time activity, used only to tell whether they have gone quiet; and
    // this week's recitation on its own — the last one answers "who has not
    // recited yet", which is the supervisor's actual job.
    const [data, monthPointsData, allPointsData, weekPointsData, weekScopedData] =
      await Promise.all([
        fetchJson<{ results: ApiUser[] }>(
          `${API_BASE}api/v1/users/?supervisor=${encodeURIComponent(supervisorUsername)}&group=Student`,
          token,
        ),
        fetchJson<{ results: ApiPoints[] } | ApiPoints[]>(
          `${API_BASE}api/v1/users/points/?date_after=${monthStart}&date_before=${monthEnd}`,
          token,
        ),
        fetchJson<{ results: ApiPoints[] } | ApiPoints[]>(`${API_BASE}api/v1/users/points/`, token),
        fetchJson<{ results: ApiPoints[] } | ApiPoints[]>(
          `${API_BASE}api/v1/users/points/?date_after=${start}&date_before=${end}`,
          token,
        ),
        fetchJson<{ results: ApiPoints[] } | ApiPoints[]>(
          `${API_BASE}api/v1/users/points/?date_after=${start}&date_before=${end}`,
          token,
        ),
      ]);

    const normalize = (d: { results: ApiPoints[] } | ApiPoints[]): ApiPoints[] =>
      Array.isArray(d) ? d : (d.results ?? []);

    const monthPoints = normalize(monthPointsData);
    const allPoints = normalize(allPointsData);
    const weekPoints = normalize(weekPointsData);
    const weekScoped = normalize(weekScopedData);

    const students = data.results.map((student) => {
      const monthInfo = monthPoints.find((p) => p.user === student.id);
      const allInfo = allPoints.find((p) => p.user === student.id);
      const weekInfo = weekPoints.find((p) => p.user === student.id);
      const scopedInfo = weekScoped.find((p) => p.user === student.id);
      return {
        id: student.id,
        username: student.username,
        first_name: student.first_name,
        last_name: student.last_name,
        groups: student.groups,
        points: monthInfo?.points ?? 0,
        activities_count: monthInfo?.activities?.length ?? 0,
        weekly_activities_count: weekInfo?.activities?.length ?? 0,
        date_joined: student.date_joined,
        recited_this_week: (scopedInfo?.activities ?? []).some((a) =>
          SUPERVISOR_MANAGED_CATEGORY_IDS.includes(a.category),
        ),
        last_activity_at: latestActivityDate(allInfo?.activities),
      };
    });

    return {
      success: true,
      data: students,
    };
  } catch (error) {
    console.error("Error fetching supervised students:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===============================
// Update User (Admin only)
// ===============================

export async function updateUser(
  userId: number,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    supervisor?: string | null;
    referrer?: string | null;
    groups?: string[];
    password?: string;
  },
): Promise<FetchResult<null>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const res = await fetch(`${API_BASE}api/v1/users/${userId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `تعذّر تحديث البيانات (${res.status})`;
      try {
        const errData = JSON.parse(text);
        // DRF keys field errors by field name; permissions land in `detail`
        errorMsg =
          errData?.detail ||
          errData?.email?.[0] ||
          errData?.first_name?.[0] ||
          errData?.last_name?.[0] ||
          errData?.password?.[0] ||
          errData?.referrer?.[0] ||
          errData?.non_field_errors?.[0] ||
          errorMsg;
      } catch {
        // not JSON
      }
      return { success: false, error: errorMsg };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ===============================
// Get Student Activities (Moderator/Admin)
// ===============================

export async function getStudentActivities(studentId: number): Promise<FetchResult<ApiActivity[]>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    // The endpoint is paginated (PAGE_SIZE 50) — walk `next` so an older
    // activity never becomes invisible, and so undeletable, in the log
    const activities: ApiActivity[] = [];
    let url: string | null = `${API_BASE}api/v1/users/${studentId}/activities/`;
    let guard = 0;

    while (url && guard < 20) {
      const page: { results: ApiActivity[]; next: string | null } | ApiActivity[] = await fetchJson(
        url,
        token,
      );

      if (Array.isArray(page)) {
        activities.push(...page);
        url = null;
      } else {
        activities.push(...(page.results || []));
        url = page.next;
      }
      guard++;
    }

    return { success: true, data: activities };
  } catch (error) {
    console.error("Error fetching student activities:", error);
    return { success: false, error: "تعذّر تحميل الأنشطة" };
  }
}

// ===============================
// Change a Student Activity's Category (Moderator/Admin)
// ===============================
// A supervisor who recorded reading where they meant recitation should be able to
// correct it without deleting and re-recording. Both the old and the new category
// must be within a supervisor's scope, checked here and not only in the browser.

export async function updateStudentActivityCategory(
  studentId: number,
  activityId: number,
  categoryId: number,
): Promise<FetchResult<null>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    if (!SUPERVISOR_MANAGED_CATEGORY_IDS.includes(categoryId)) {
      return { success: false, error: "هذا النوع من الأنشطة يسجّله المدراء" };
    }

    const activity = await fetchJson<ApiActivity>(
      `${API_BASE}api/v1/users/${studentId}/activities/${activityId}/`,
      token,
    );
    if (!SUPERVISOR_MANAGED_CATEGORY_IDS.includes(activity.category)) {
      return { success: false, error: "هذا النوع من الأنشطة يسجّله المدراء" };
    }
    if (activity.category === categoryId) {
      return { success: true, data: null };
    }

    const res = await fetch(`${API_BASE}api/v1/users/${studentId}/activities/${activityId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: categoryId }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `تعذّر تعديل النشاط (${res.status})`;
      try {
        const data = JSON.parse(text);
        errorMsg = data?.detail || data?.error || errorMsg;
      } catch {
        // not JSON
      }
      return { success: false, error: errorMsg };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Error updating student activity category:", error);
    return { success: false, error: "تعذّر تعديل النشاط" };
  }
}

// ===============================
// Change a Student Activity's Multiplier (Moderator/Admin)
// ===============================
// Spectacular performance is recorded as a multiplier on the activity, and the
// API counts points as multiplier × category value. A performance recorded at
// ×1 that deserved more should be correctable without deleting and re-recording.
// Same supervisor scope as the category path, enforced here and not only in the
// browser.

export async function updateStudentActivityMultiplier(
  studentId: number,
  activityId: number,
  multiplier: number,
): Promise<FetchResult<null>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    // The API itself only demands an integer ≥ 1; nothing else is a rule
    if (!Number.isInteger(multiplier) || multiplier < 1) {
      return { success: false, error: "قيمة المضاعف غير صالحة" };
    }

    const activity = await fetchJson<ApiActivity>(
      `${API_BASE}api/v1/users/${studentId}/activities/${activityId}/`,
      token,
    );
    if (!SUPERVISOR_MANAGED_CATEGORY_IDS.includes(activity.category)) {
      return { success: false, error: "هذا النوع من الأنشطة يسجّله المدراء" };
    }
    if (activity.multiplier === multiplier) {
      return { success: true, data: null };
    }

    const res = await fetch(`${API_BASE}api/v1/users/${studentId}/activities/${activityId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ multiplier }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `تعذّر تعديل النشاط (${res.status})`;
      try {
        const data = JSON.parse(text);
        errorMsg = data?.detail || data?.multiplier?.[0] || data?.error || errorMsg;
      } catch {
        // not JSON
      }
      return { success: false, error: errorMsg };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Error updating student activity multiplier:", error);
    return { success: false, error: "تعذّر تعديل النشاط" };
  }
}

// ===============================
// Delete Student Activity (Moderator/Admin)
// ===============================

export async function deleteStudentActivity(
  studentId: number,
  activityId: number,
): Promise<FetchResult<null>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    // A supervisor manages recitation and reading only. The API itself lets them
    // touch any category of their own students, so the scope is enforced here —
    // the browser filter alone would not survive a hand-made call to this action.
    const activity = await fetchJson<ApiActivity>(
      `${API_BASE}api/v1/users/${studentId}/activities/${activityId}/`,
      token,
    );
    if (!SUPERVISOR_MANAGED_CATEGORY_IDS.includes(activity.category)) {
      return { success: false, error: "هذا النوع من الأنشطة يسجّله المدراء" };
    }

    const res = await fetch(`${API_BASE}api/v1/users/${studentId}/activities/${activityId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `تعذّر حذف النشاط (${res.status})`;
      try {
        const data = JSON.parse(text);
        errorMsg = data?.detail || data?.error || errorMsg;
      } catch {
        // not JSON
      }
      return { success: false, error: errorMsg };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Error deleting student activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===============================
// Add Student Activity (Moderator/Admin)
// ===============================

export async function addStudentActivity(
  studentId: number,
  categoryId: number,
  multiplier: number,
): Promise<FetchResult<{ id: number }>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    // Same scope as the delete path — recitation and reading only
    if (!SUPERVISOR_MANAGED_CATEGORY_IDS.includes(categoryId)) {
      return { success: false, error: "هذا النوع من الأنشطة يسجّله المدراء" };
    }

    const date = new Date().toISOString();

    const res = await fetch(`${API_BASE}api/v1/users/${studentId}/activities/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: categoryId, multiplier, date }),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `تعذّر تسجيل النشاط (${res.status})`;
      try {
        const data = JSON.parse(text);
        errorMsg = data?.detail || data?.error || errorMsg;
      } catch {
        // not JSON
      }
      return { success: false, error: errorMsg };
    }

    const data = await res.json();
    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error("Error adding student activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getProfileCategories(): Promise<FetchResult<ApiCategory[]>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");
    const categories = await getCachedPointsCategories(token);
    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

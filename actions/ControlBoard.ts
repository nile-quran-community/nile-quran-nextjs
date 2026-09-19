"use server";

import { revalidatePath } from "next/cache";
import { getHijriWeekRange } from "@/lib/utils";
import { cookies } from "next/headers";
import { getCachedPointsCategories } from "./categories";

const API_BASE = process.env.BASE_URL;

// ===============================
// ADD USER ACTIVITY
// ===============================
export async function addUserActivity(
  uid: number,
  category: number,
  date: string,
  multiplier: number | null,
) {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    await fetch(`${API_BASE}api/v1/users/${uid}/activities/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category, multiplier, date }),
    });

    revalidatePath("/control-panel");
    return { success: true };
  } catch (error) {
    console.error("Error adding activity:", error);
    return { success: false, error: "فشل إضافة النشاط" };
  }
}

// ===============================
// UPDATE USER ACTIVITY
// ===============================
export async function updateUserActivity(uid: number, activityId: number, multiplier: number) {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    if (!access) {
      return { success: false, error: "غير مصرح - الرجاء تسجيل الدخول" };
    }

    const response = await fetch(`${API_BASE}api/v1/users/${uid}/activities/${activityId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ multiplier }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData?.detail || `فشل تحديث النشاط (${response.status})`,
      };
    }

    revalidatePath("/control-panel");
    return { success: true };
  } catch (error) {
    console.error("Error updating activity:", error);
    return { success: false, error: "فشل تحديث النشاط" };
  }
}

// ===============================
// DELETE USER ACTIVITY
// ===============================
export async function deleteUserActivity(uid: number, activityId: number) {
  if (!activityId || typeof activityId !== "number" || isNaN(activityId)) {
    console.error("Invalid activity ID:", activityId);
    return { success: false, error: "معرف النشاط غير صالح" };
  }

  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    if (!access) {
      return { success: false, error: "غير مصرح - الرجاء تسجيل الدخول" };
    }

    const response = await fetch(`${API_BASE}api/v1/users/${uid}/activities/${activityId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch {
        errorData = {};
      }

      console.error("Delete failed:", response.status, errorData);
      return {
        success: false,
        error:
          errorData?.detail ||
          errorData?.message ||
          errorData?.error ||
          `فشل حذف النشاط (${response.status})`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting activity:", error);
    return { success: false, error: "فشل حذف النشاط - خطأ في الاتصال" };
  }
}

// ===============================
// UPDATE USER SUPERVISOR
// ===============================
export async function updateUserSupervisor(uid: number, supervisorUsername: string | null) {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    const response = await fetch(`${API_BASE}api/v1/users/${uid}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ supervisor: supervisorUsername }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData?.supervisor?.[0] || errorData?.detail };
    }

    revalidatePath("/control-board");
    return { success: true };
  } catch (error) {
    console.error("Error updating supervisor:", error);
    return { success: false };
  }
}

// ===============================
// UPDATE USER ACTIVE STATUS
// ===============================
export async function updateUserActiveStatus(uid: number, isActive: boolean) {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    const response = await fetch(`${API_BASE}api/v1/users/${uid}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_active: isActive }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData?.is_active?.[0] || errorData?.detail };
    }

    revalidatePath("/control-board");
    return { success: true };
  } catch (error) {
    console.error("Error updating active status:", error);
    return { success: false };
  }
}

// date_after/date_before are NOT supported on this endpoint (see /api/v1/schema/) — the
// backend silently ignores unknown query params, so don't pass them here (unlike
// getPoints/getUserActivities below, where the schema does support them).
export async function getUsers(group?: string) {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    if (!access) throw new Error("No access token found in cookies");

    // Sort by first name, then last name (Arabic names supported)
    const params = new URLSearchParams({ ordering: "first_name,last_name" });
    if (group) params.set("group", group);
    const query = `?${params.toString()}`;
    const fetchPage = async (url: string) => {
      const result = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access}`,
          "Accept-Language": "ar",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      // Without this a 401/403 returns {detail}, `results` is undefined, and the
      // caller renders an empty board — a failure dressed up as "no members".
      if (!result.ok) {
        throw new Error(`Failed to fetch users (${result.status})`);
      }
      return result.json();
    };

    // The endpoint pages at 50 (DRF PAGE_SIZE, with no page_size query param to
    // raise it), so walk `next` — otherwise member 51 is invisible to the board,
    // and to every other caller of this action.
    const firstPage = await fetchPage(`${API_BASE}api/v1/users/${query}`);
    const users = firstPage.results ?? [];
    let next: string | null = firstPage.next ?? null;
    let guard = 0;

    while (next && guard < 20) {
      const page = await fetchPage(next);
      users.push(...(page.results ?? []));
      next = page.next ?? null;
      guard++;
    }

    return {
      success: true,
      users,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return { success: false, error: error };
  }
}

// ===============================
// GET CATEGORIES — shared 1-hour cache with the profile page (see actions/categories.ts)
// ===============================
export async function getCategories() {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    if (!access) throw new Error("No access token found in cookies");

    const categories = await getCachedPointsCategories(access);

    return { success: true as const, categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false as const, error: error };
  }
}

export async function getUserActivities(
  Id: number,
  year: number,
  month: number,
  weekIndex: number,
) {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    if (!access) throw new Error("No access token found in cookies");
    const { start, end } = getHijriWeekRange(year, month, weekIndex);

    const query = `?date_after=${start}&date_before=${end}`;
    const response = await fetch(`${API_BASE}api/v1/users/${Id}/activities/${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch activities: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return { success: true, activities: data.results };
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return { success: false, error: error };
  }
}

export async function getPoints(year: number, month: number, weekIndex: number) {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    if (!access) throw new Error("No access token found in cookies");
    const { start, end } = getHijriWeekRange(year, month, weekIndex);

    const query = `?date_after=${start}&date_before=${end}`;
    const response = await fetch(`${API_BASE}api/v1/users/points/${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch points: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return { success: true, points: data.results };
  } catch (error) {
    console.error("Error fetching points:", error);
    return { success: false, error: error };
  }
}

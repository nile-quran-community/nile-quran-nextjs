"use server";

import { revalidatePath } from "next/cache";
import { getHijriMonthDays } from "@/lib/utils";
import { cookies } from "next/headers";
import { hijriToGregorian } from "@tabby_ai/hijri-converter";
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

    const query = group ? `?group=${group}` : "";
    const result = await fetch(`${API_BASE}api/v1/users/${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const resultData = await result.json();
    return {
      success: true,
      users: resultData.results,
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
    const monthDays = getHijriMonthDays(year, month);

    let startHijriDay: number;
    let endHijriDay: number;

    if (weekIndex >= 1 && weekIndex <= 3) {
      startHijriDay = (weekIndex - 1) * 7 + 1;
      endHijriDay = weekIndex * 7;
    } else if (weekIndex === 4) {
      startHijriDay = 22;
      endHijriDay = monthDays;
    } else {
      throw new Error("Invalid weekIndex");
    }

    const startDate = hijriToGregorian({ year, month, day: startHijriDay });
    const endDate = hijriToGregorian({ year, month, day: endHijriDay });

    const start = `${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`;
    const end = `${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`;

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
    const monthDays = getHijriMonthDays(year, month);

    let startHijriDay: number;
    let endHijriDay: number;

    if (weekIndex >= 1 && weekIndex <= 3) {
      startHijriDay = (weekIndex - 1) * 7 + 1;
      endHijriDay = weekIndex * 7;
    } else if (weekIndex === 4) {
      startHijriDay = 22;
      endHijriDay = monthDays;
    } else {
      throw new Error("Invalid weekIndex");
    }

    const startDate = hijriToGregorian({ year, month, day: startHijriDay });
    const endDate = hijriToGregorian({ year, month, day: endHijriDay });

    const start = `${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`;
    const end = `${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`;

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

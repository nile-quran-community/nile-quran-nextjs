"use server";

import { revalidatePath } from "next/cache";
import { unstable_cache } from "next/cache";
import { getHijriMonthDays } from "@/lib/utils";
import { cookies } from "next/headers";
import { hijriToGregorian } from "@tabby_ai/hijri-converter";

const API_BASE = process.env.BASE_URL;
type Activity = {
  id: number;
  category: number;
  date: string;
  points?: number;
};
type UserSummary = {
  user: number;
  points: number;
  activities: Activity[];
};

// ===============================
// ADD USER ACTIVITY
// ===============================
export async function addUserActivity(
  uid: number,
  category: number,
  date: string,
  count: number | null,
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
      body: JSON.stringify({ category, count, date }),
    });

    revalidatePath("/control-panel");
    return { success: true };
  } catch (error) {
    console.error("Error adding activity:", error);
    return { success: false, error: "فشل إضافة النشاط" };
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
// GET USERS WITH DETAILS (WITH DATES)
// ===============================
export async function getUsersWithDetails(start?: string, end?: string) {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    if (!access) throw new Error("No access token found in cookies");

    const query = start && end ? `?date_after=${start}&date_before=${end}` : "";

    const summaryRes = await fetch(`${API_BASE}api/v1/users/points/${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const summaryData = await summaryRes.json();

    if (!summaryRes.ok) {
      throw new Error("Failed to fetch user activities");
    }
    if (!summaryData.results) {
      throw new Error("No users found");
    }

    const users = await Promise.all(
      summaryData.results.map(async (item: UserSummary) => {
        try {
          const userRes = await fetch(`${API_BASE}api/v1/users/${item.user}`);
          const userData = await userRes.json();

          return {
            id: item.user,
            ...userData,
            points: item.points,
            activities: item.activities,
          };
        } catch (err) {
          console.error(`Error fetching user ${item.user}:`, err);
          return null;
        }
      }),
    );

    const validUsers = users.filter(Boolean);
    return { success: true, users: validUsers };
  } catch (error) {
    console.error("Error in getUsersWithDetails:", error);
    return { success: false, error: "فشل في جلب بيانات المستخدمين" };
  }
}

// ===============================
// GET WEEK DATA
// ===============================
export async function getWeekData(start: string, end: string) {
  try {
    const [users, categories] = await Promise.all([
      getUsersWithDetails(start, end),
      getCategories(),
    ]);

    const activitiesMap: Record<string, Activity[]> = {};

    return {
      success: true,
      users: users || [],
      activities: activitiesMap,
      categories: categories || [],
    };
  } catch (error) {
    console.error("Error fetching week data:", error);
    return {
      success: false,
      users: [],
      activities: {},
      categories: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUsers(year: number, month: number, weekIndex: number) {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    if (!access) throw new Error("No access token found in cookies");
    const monthDays = getHijriMonthDays(year, month);

    let startHijriDay: number;
    let endHijriDay: number;

    if (weekIndex >= 1 && weekIndex <= 4) {
      startHijriDay = (weekIndex - 1) * 7 + 1;
      endHijriDay = weekIndex * 7;
    } else if (weekIndex === 5) {
      startHijriDay = 29;
      endHijriDay = monthDays === 29 ? 29 : 30;
    } else {
      throw new Error("Invalid weekIndex");
    }

    const startDate = hijriToGregorian({ year, month, day: startHijriDay });
    const endDate = hijriToGregorian({ year, month, day: endHijriDay });

    const start = `${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`;
    const end = `${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`;

    const query = `?date_after=${start}&date_before=${end}`;
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
// GET CATEGORIES — cached per access token for 1 hour
// ===============================
// ✅ unstable_cache works even with Authorization headers
// because we pass the token as a cache key argument
const getCategoriesCached = unstable_cache(
  async (access: string) => {
    const response = await fetch(`${API_BASE}api/v1/users/points/categories/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch categories: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.results;
  },
  ["categories"], // cache key prefix
  { revalidate: 3600 }, // 1 hour
);

export async function getCategories() {
  try {
    const cookieStore = await cookies();
    const access = cookieStore.get("access")?.value;

    if (!access) throw new Error("No access token found in cookies");

    // ✅ Pass access token as argument so it's part of the cache key
    const categories = await getCategoriesCached(access);

    return { success: true, categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: error };
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

    if (weekIndex >= 1 && weekIndex <= 4) {
      startHijriDay = (weekIndex - 1) * 7 + 1;
      endHijriDay = weekIndex * 7;
    } else if (weekIndex === 5) {
      startHijriDay = 29;
      endHijriDay = monthDays === 29 ? 29 : 30;
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

    if (weekIndex >= 1 && weekIndex <= 4) {
      startHijriDay = (weekIndex - 1) * 7 + 1;
      endHijriDay = weekIndex * 7;
    } else if (weekIndex === 5) {
      startHijriDay = 29;
      endHijriDay = monthDays === 29 ? 29 : 30;
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

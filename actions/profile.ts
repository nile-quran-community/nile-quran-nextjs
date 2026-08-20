"use server";

import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";

const API_BASE = process.env.BASE_URL;

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

export async function getUserByUsername(
  username: string,
): Promise<FetchResult<ApiUser>> {
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
// Get All Users with Roles (Admin only)
// ===============================

export async function getAllUsersWithRoles(): Promise<
  FetchResult<
    Array<{
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
      groups: string[];
      supervisor: string | null;
      referrer: string | null;
      date_joined: string;
    }>
  >
> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const data = await fetchJson<{ results: ApiUser[] }>(
      `${API_BASE}api/v1/users/?ordering=date_joined`,
      token,
    );

    return {
      success: true,
      data: data.results,
    };
  } catch (error) {
    console.error("Error fetching all users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===============================
// Get Supervised Students (Moderator only)
// ===============================

export async function getSupervisedStudents(
  supervisorUsername: string,
): Promise<
  FetchResult<
    Array<{
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      groups: string[];
      points: number;
      activities_count: number;
    }>
  >
> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    // Fetch students supervised by this moderator
    const data = await fetchJson<{ results: ApiUser[] }>(
      `${API_BASE}api/v1/users/?supervisor=${supervisorUsername}&group=Student`,
      token,
    );

    // Fetch points for all students
    const pointsData = await fetchJson<{ results: ApiPoints[] } | ApiPoints[]>(
      `${API_BASE}api/v1/users/points/`,
      token,
    );

    let allPoints: ApiPoints[] = [];
    if (Array.isArray(pointsData)) {
      allPoints = pointsData;
    } else if ("results" in pointsData && Array.isArray(pointsData.results)) {
      allPoints = pointsData.results;
    }

    const students = data.results.map((student) => {
      const pointsInfo = allPoints.find((p) => p.user === student.id);
      return {
        id: student.id,
        username: student.username,
        first_name: student.first_name,
        last_name: student.last_name,
        groups: student.groups,
        points: pointsInfo?.points ?? 0,
        activities_count: pointsInfo?.activities?.length ?? 0,
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
// Get Categories (cached 1h)
// ===============================

const getCategoriesCached = unstable_cache(
  async (token: string) => {
    const res = await fetch(`${API_BASE}api/v1/users/points/categories/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
    const data = await res.json();
    return data.results as ApiCategory[];
  },
  ["profile-categories"],
  { revalidate: 3600 },
);

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
      let errorMsg = `فشل إضافة النشاط (${res.status})`;
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

// ===============================
// Update Student Activity (Moderator/Admin)
// ===============================

export async function updateStudentActivity(
  studentId: number,
  activityId: number,
  multiplier: number,
): Promise<FetchResult<null>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const res = await fetch(`${API_BASE}api/v1/users/${studentId}/activities/${activityId}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ multiplier }),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `فشل تحديث النشاط (${res.status})`;
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
    console.error("Error updating student activity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
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

    const res = await fetch(`${API_BASE}api/v1/users/${studentId}/activities/${activityId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `فشل حذف النشاط (${res.status})`;
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
// Get Student Activities (for edit/delete in moderator view)
// ===============================

export async function getStudentActivities(
  studentId: number,
): Promise<FetchResult<ApiActivity[]>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    const data = await fetchJson<{ results: ApiActivity[] } | ApiActivity[]>(
      `${API_BASE}api/v1/users/${studentId}/activities/`,
      token,
    );

    if (Array.isArray(data)) {
      return { success: true, data };
    }

    return { success: true, data: data.results || [] };
  } catch (error) {
    console.error("Error fetching student activities:", error);
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
    const categories = await getCategoriesCached(token);
    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

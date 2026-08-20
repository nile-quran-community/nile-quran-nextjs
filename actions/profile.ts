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
      `${API_BASE}api/v1/users/`,
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
// Get Global Stats (Admin only)
// ===============================

export async function getGlobalStats(): Promise<FetchResult<{
  totalUsers: number;
  totalStudents: number;
  totalSupervisors: number;
  totalAdmins: number;
  totalPoints: number;
  avgPoints: number;
  avgAttendance: number;
}>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    // Fetch all users
    const usersData = await fetchJson<{ results: ApiUser[] }>(
      `${API_BASE}api/v1/users/`,
      token,
    );
    const allUsers = usersData.results || [];

    // Fetch all points
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

    const totalUsers = allUsers.length;
    const totalStudents = allUsers.filter((u) => u.groups.includes("Student")).length;
    const totalSupervisors = allUsers.filter((u) => u.groups.includes("Supervisor")).length;
    const totalAdmins = allUsers.filter((u) => u.groups.includes("Admin")).length;
    const totalPoints = allPoints.reduce((sum, p) => sum + (p.points ?? 0), 0);
    const avgPoints = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;

    // Calculate avg attendance: activities with category 1 (حضور خاطرة) or 6 (اجتماع)
    let attendanceActivities = 0;
    for (const p of allPoints) {
      for (const a of p.activities) {
        if (a.category === 1 || a.category === 6) {
          attendanceActivities++;
        }
      }
    }
    const avgAttendance = totalStudents > 0
      ? Math.min(Math.round((attendanceActivities / (totalStudents * 4)) * 100), 100)
      : 0;

    return {
      success: true,
      data: { totalUsers, totalStudents, totalSupervisors, totalAdmins, totalPoints, avgPoints, avgAttendance },
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ===============================
// Get Top Supervisors (Admin only)
// ===============================

export async function getTopSupervisors(): Promise<FetchResult<Array<{
  id: number;
  username: string;
  fullName: string;
  studentCount: number;
  totalPoints: number;
  avgPoints: number;
}>>> {
  try {
    const token = await getToken();
    if (!token) throw new Error("No access token");

    // Fetch all users
    const usersData = await fetchJson<{ results: ApiUser[] }>(
      `${API_BASE}api/v1/users/`,
      token,
    );
    const allUsers = usersData.results || [];

    // Fetch all points
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

    // Group students by supervisor
    const supervisorMap: Record<string, { students: ApiUser[]; points: number }> = {};
    for (const u of allUsers) {
      if (u.groups.includes("Student") && u.supervisor) {
        if (!supervisorMap[u.supervisor]) {
          supervisorMap[u.supervisor] = { students: [], points: 0 };
        }
        supervisorMap[u.supervisor].students.push(u);
        const pts = allPoints.find((p) => p.user === u.id);
        if (pts) {
          supervisorMap[u.supervisor].points += pts.points ?? 0;
        }
      }
    }

    // Build result
    const result = Object.entries(supervisorMap).map(([username, data]) => {
      const supUser = allUsers.find((u) => u.username === username);
      const fullName = supUser ? `${supUser.first_name} ${supUser.last_name}`.trim() || username : username;
      const studentCount = data.students.length;
      const totalPoints = data.points;
      const avgPoints = studentCount > 0 ? Math.round(totalPoints / studentCount) : 0;
      return { id: supUser?.id ?? 0, username, fullName, studentCount, totalPoints, avgPoints };
    }).sort((a, b) => b.avgPoints - a.avgPoints);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching top supervisors:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ===============================
// Update User (Admin only)
// ===============================

export async function updateUser(
  userId: number,
 data: { first_name?: string; last_name?: string; email?: string; supervisor?: string | null; referrer?: string | null },
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
      let errorMsg = `فشل تحديث البيانات (${res.status})`;
      try {
        const errData = JSON.parse(text);
        errorMsg = errData?.detail || errData?.email?.[0] || errData?.first_name?.[0] || errorMsg;
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

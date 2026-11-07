"use server";

import { getHijriMonthDays } from "@/lib/utils";
import { cookies } from "next/headers";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { hijriToGregorian } from "@tabby_ai/hijri-converter";

const API_BASE = process.env.BASE_URL;

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  supervisor: string;
  phone_number: string;
  date_joined: string;
  groups: string[];
}

interface Activity {
  id?: number;
  type?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

interface LeaderboardItem {
  user: number;
  points: number;
  activities: Activity[];
}

interface MappedLeaderboardUser {
  id: number;
  name: string;
  username: string;
  points: number;
  groups: string[];
}

export async function getLeaderboardData(year: number, month: number) {
  try {
    const lastDay = getHijriMonthDays(year, month);
    const startDate = hijriToGregorian({
      year,
      month,
      day: 1,
    });

    const endDate = hijriToGregorian({
      year,
      month,
      day: lastDay,
    });
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access");

    if (!accessToken) {
      throw new Error("No access token found");
    }

    const start = `${startDate.year}-${String(startDate.month).padStart(
      2,
      "0",
    )}-${String(startDate.day).padStart(2, "0")}`;
    const end = `${endDate.year}-${String(endDate.month).padStart(
      2,
      "0",
    )}-${String(endDate.day).padStart(2, "0")}`;

    // Both lists page at 50 — read every page, or member 51+ drops off the board
    const [results, usersList] = await Promise.all([
      fetchAllPages<LeaderboardItem>(
        `${API_BASE}api/v1/users/points/?date_after=${start}&date_before=${end}&ordering=-points`,
        accessToken.value,
      ),
      fetchAllPages<User>(`${API_BASE}api/v1/users/`, accessToken.value),
    ]);

    if (results.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Results are already ordered by points descending (ordering=-points)

    // One bulk user list, not one round trip per leaderboard row
    const usersById = new Map(usersList.map((u) => [u.id, u]));

    const mappedData: MappedLeaderboardUser[] = results.map((item) => {
      const user = usersById.get(item.user);

      if (user) {
        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          username: user.username,
          points: item.points || 0,
          groups: user.groups || [],
        };
      }

      return {
        id: item.user,
        name: "مستخدم",
        username: "",
        points: item.points || 0,
        groups: [],
      };
    });

    return {
      success: true,
      data: mappedData,
    };
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserDetails(userId: number) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access");

    if (!accessToken) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE}api/v1/users/${userId}/`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user details");
    }

    const user: User = await response.json();

    return {
      success: true,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        username: user.username,
        email: user.email,
        groups: user.groups,
      },
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return {
      success: false,
      user: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

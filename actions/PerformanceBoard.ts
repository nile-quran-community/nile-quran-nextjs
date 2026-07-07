"use server";

import { getHijriMonthDays } from "@/lib/utils";
import { cookies } from "next/headers";
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

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LeaderboardItem[];
}

interface MappedLeaderboardUser {
  id: number;
  name: string;
  username: string;
  points: number;
  groups: string[];
}

type APIResponse = LeaderboardItem[] | PaginatedResponse | LeaderboardItem;

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

    const query = `?date_after=${start}&date_before=${end}`;
    const result = await fetch(`${API_BASE}api/v1/users/points/${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!result.ok) {
      const errorText = await result.text();
      throw new Error(
        `Failed to fetch leaderboard data: ${result.status} - ${errorText}`,
      );
    }

    const data: APIResponse = await result.json();

    // Handle different possible response structures
    let results: LeaderboardItem[] = [];

    if (Array.isArray(data)) {
      results = data;
    } else if ("results" in data && Array.isArray(data.results)) {
      results = data.results;
    } else if ("user" in data && "points" in data) {
      results = [data];
    }

    if (results.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Sort by points descending
    const sortedResults = results.sort((a, b) => {
      const aPoints = a.points || 0;
      const bPoints = b.points || 0;
      return bPoints - aPoints;
    });

    // Fetch user details for each user ID
    const mappedData: MappedLeaderboardUser[] = await Promise.all(
      sortedResults.map(async (item) => {
        const userId = item.user;

        const userDetailsResponse = await getUserDetails(userId);

        if (userDetailsResponse.success && userDetailsResponse.user) {
          return {
            id: userDetailsResponse.user.id,
            name: userDetailsResponse.user.name,
            username: userDetailsResponse.user.username,
            points: item.points || 0,
            groups: userDetailsResponse.user.groups || [],
          };
        }

        return {
          id: userId,
          name: "مستخدم",
          username: "",
          points: item.points || 0,
          groups: [],
        };
      }),
    );

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

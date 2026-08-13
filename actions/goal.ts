"use server";

import { cookies } from "next/headers";
import { hijriToGregorian } from "@tabby_ai/hijri-converter";
import { getHijriMonthDays } from "@/lib/utils";

const API_BASE = process.env.BASE_URL;

interface GoalData {
  id?: number;
  description?: string;
  target?: number;
  current?: number;
}

interface GoalResponse {
  success: boolean;
  data: GoalData | null;
  error?: string;
}

export async function getGoalOfTheMonth(year: number, month: number): Promise<GoalResponse> {
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
    const response = await fetch(`${API_BASE}api/v1/goals/${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch goal data: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.results[0],
    };
  } catch (error) {
    console.error("Error fetching goal:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

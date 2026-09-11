"use server";

import { cookies } from "next/headers";
import { getTodayDateString, getGoalStatus } from "@/lib/utils";

const API_BASE = process.env.BASE_URL;

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  current: number;
  target: number;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
}

export interface GoalPayload {
  title: string;
  description?: string | null;
  current: number;
  target: number;
  start_date?: string | null;
  end_date?: string | null;
}

interface GoalListResponse {
  success: boolean;
  data: Goal[];
  error?: string;
}

interface GoalMutationResponse {
  success: boolean;
  data?: Goal;
  error?: string;
}

async function getAccessToken() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;
  if (!access) throw new Error("No access token found");
  return access;
}

// -start_date (latest started first) is the default everywhere goals are listed — the API
// supports server-side ordering via ?ordering=, so there's no need to re-sort client-side.
const DEFAULT_ORDERING = "-start_date";

async function fetchGoalsList(ordering: string = DEFAULT_ORDERING): Promise<Goal[]> {
  const access = await getAccessToken();
  const headers = {
    Authorization: `Bearer ${access}`,
    "Accept-Language": "ar",
    "Content-Type": "application/json",
  };

  // DRF paginates — a single page silently drops every goal past the default page size, so
  // follow `next` until the list is exhausted.
  let url: string | null = `${API_BASE}api/v1/goals/?ordering=${encodeURIComponent(ordering)}`;
  const goals: Goal[] = [];

  while (url) {
    const response: Response = await fetch(url, { headers, cache: "no-store" });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch goals: ${response.status} - ${errorText}`);
    }

    const data: { results: Goal[]; next: string | null } = await response.json();
    goals.push(...data.results);
    url = data.next;
  }

  return goals;
}

export async function getCurrentGoals(): Promise<GoalListResponse> {
  try {
    const goals = await fetchGoalsList();
    const today = getTodayDateString();
    const currentGoals = goals.filter((g) => getGoalStatus(g, today) === "current");
    return { success: true, data: currentGoals };
  } catch (error) {
    console.error("Error fetching current goals:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Every goal, regardless of date range — for the goals page. `ordering` accepts any value the
// API supports (current/target/start_date/end_date, each with a "-" prefix for descending).
export async function getAllGoals(ordering?: string): Promise<GoalListResponse> {
  try {
    const data = await fetchGoalsList(ordering);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching goals:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Shared by createGoal/updateGoal/deleteGoal — same fetch → error-parse → try/catch shape for all three.
async function submitGoal(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body: unknown,
  fallbackMsg: string,
): Promise<GoalMutationResponse> {
  try {
    const access = await getAccessToken();

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${access}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData?.detail || errorData?.title?.[0] || `${fallbackMsg} (${response.status})`,
      };
    }

    return { success: true, data: response.status === 204 ? undefined : await response.json() };
  } catch (error) {
    console.error(`Error in ${method} ${url}:`, error);
    return { success: false, error: fallbackMsg };
  }
}

export async function createGoal(payload: GoalPayload): Promise<GoalMutationResponse> {
  return submitGoal(`${API_BASE}api/v1/goals/`, "POST", payload, "فشل إنشاء الهدف");
}

export async function updateGoal(
  id: number,
  payload: Partial<GoalPayload>,
): Promise<GoalMutationResponse> {
  return submitGoal(`${API_BASE}api/v1/goals/${id}/`, "PATCH", payload, "فشل تحديث الهدف");
}

export async function deleteGoal(id: number): Promise<{ success: boolean; error?: string }> {
  return submitGoal(`${API_BASE}api/v1/goals/${id}/`, "DELETE", undefined, "فشل حذف الهدف");
}

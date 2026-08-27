"use server";

import { unstable_cache } from "next/cache";

const API_BASE = process.env.BASE_URL;

export interface PointsCategory {
  id: number;
  name: string;
  value: number;
}

// The point categories (§ CLAUDE.md's points table) rarely change and are the
// same list for every caller — the control board and every profile page used
// to each keep their own hour-long cache of this identical endpoint, doubling
// the cache misses for no reason. One cached fetch, shared by both.
const getCachedPointsCategoriesInternal = unstable_cache(
  async (token: string): Promise<PointsCategory[]> => {
    const res = await fetch(`${API_BASE}api/v1/users/points/categories/`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ar",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch categories: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    return data.results as PointsCategory[];
  },
  ["points-categories"],
  { revalidate: 3600 },
);

export async function getCachedPointsCategories(token: string): Promise<PointsCategory[]> {
  return getCachedPointsCategoriesInternal(token);
}

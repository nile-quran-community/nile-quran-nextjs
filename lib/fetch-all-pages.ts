// Every DRF list endpoint pages at 50 (PAGE_SIZE). Reading only `.results` of the first
// page silently drops member 51+ — walk `next` instead. Server-side only (needs the token).
export async function fetchAllPages<T>(url: string, token: string): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = url;
  let guard = 0;

  while (next && guard < 50) {
    const res: Response = await fetch(next, {
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
    const page: { results?: T[]; next?: string | null } | T[] = await res.json();
    if (Array.isArray(page)) return [...items, ...page];
    items.push(...(page.results ?? []));
    next = page.next ?? null;
    guard++;
  }
  return items;
}

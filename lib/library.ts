import { LIBRARY_CATEGORIES, LIBRARY_ITEMS } from "./library-data";

export { LIBRARY_CATEGORIES, LIBRARY_ITEMS };

export type LibraryType = "playlist" | "book" | "site" | "program";
export type LibraryCategoryId = (typeof LIBRARY_CATEGORIES)[number]["id"];

export interface LibraryLink {
  label: string;
  url: string;
}

export interface LibraryPurchase {
  store: string;
  url: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  type: LibraryType;
  url: string | null;
  categories: readonly LibraryCategoryId[];
  description: string;
  author?: string;
  cover?: string;
  download?: readonly LibraryLink[];
  purchase?: readonly LibraryPurchase[];
}

export const libraryItems: readonly LibraryItem[] = LIBRARY_ITEMS;

export const LIBRARY_TAGS: { id: LibraryType; label: string }[] = [
  { id: "playlist", label: "سلاسل" },
  { id: "book", label: "كتب" },
  { id: "site", label: "مواقع" },
  { id: "program", label: "برامج" },
];

const TYPE_LABEL: Record<LibraryType, string> = {
  playlist: "سلسلة",
  book: "كتاب",
  site: "موقع",
  program: "برنامج",
};

export function libraryTypeLabel(type: LibraryType): string {
  return TYPE_LABEL[type];
}

export function linkActionLabel(url: string): string {
  if (/youtu\.?be|youtube\.com/i.test(url)) return "شاهد";
  if (/goodreads\.com/i.test(url)) return "صفحة الكتاب على Goodreads";
  return "انتقل للموقع";
}

export function libraryCategoryLabel(id: LibraryCategoryId): string {
  return LIBRARY_CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

export function youtubePlaylistId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/[?&]list=([^&]+)/);
  return match?.[1] ?? null;
}

// Search matches the title and section labels only — not the description.
// Alef variants, ta marbuta, and alef maqsura fold together, and tashkeel is stripped.
export function normalizeLibraryQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export function filterLibraryItems(
  items: readonly LibraryItem[],
  category: LibraryCategoryId | null,
  tag: LibraryType | null,
  query: string,
): LibraryItem[] {
  const needle = normalizeLibraryQuery(query);

  return items.filter((item) => {
    if (category && !item.categories.includes(category)) return false;
    if (tag && item.type !== tag) return false;
    if (!needle) return true;

    const threadLabels = item.categories.map((id) => libraryCategoryLabel(id)).join(" ");
    const haystack = normalizeLibraryQuery(`${item.title} ${threadLabels}`);
    return haystack.includes(needle);
  });
}

export function getLibraryItem(id: string): LibraryItem | undefined {
  return libraryItems.find((item) => item.id === id);
}

export function relatedLibraryItems(item: LibraryItem, limit = 2): LibraryItem[] {
  const sameSection = libraryItems.filter(
    (other) =>
      other.id !== item.id && other.categories.some((category) => item.categories.includes(category)),
  );
  const pool =
    sameSection.length > 0
      ? sameSection
      : libraryItems.filter((other) => other.id !== item.id && other.type === item.type);
  return pool.slice(0, limit);
}

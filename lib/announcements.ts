// Pure helpers for announcements, kept free of "use server" and React so the check file can
// run them under plain Node (lib/announcements.check.mts).

const MENTION = /<@(\d+)>/g;

export interface Mention {
  name: string;
  username: string;
}

// A markdown link's text ends at the first unescaped `]`, so a name containing brackets (or
// a backslash) must not be able to end it early.
const escapeLinkText = (text: string) => text.replace(/[\\[\]]/g, "\\$&");

// The API maps the Discord IDs pinged in a body to the member (`mentions`, best effort: only
// people whose Discord ID we hold). A known ping becomes a link to their profile; anyone else
// reads as "عضو" rather than leaking a raw <@id>.
export function replaceMentions(content: string, mentions: Record<string, Mention>): string {
  return content.replace(MENTION, (_, id: string) => {
    const member = mentions[id];
    if (!member) return "عضو";
    return `[${escapeLinkText(member.name)}](/profile/${encodeURIComponent(member.username)})`;
  });
}

// ~200 words a minute, and never "0 minutes".
export function readingMinutes(content: string): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Login sends the visitor wherever `next` says, so only same-site paths may pass: no
// scheme, no `//host`, and no backslash (browsers read `/\host` as `//host`).
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  // a backslash, or any control character (below U+0020): both are what an open redirect hides in
  if (next.includes("\\") || [...next].some((c) => c.charCodeAt(0) < 0x20)) return "/";
  return next;
}

export type PublishMode = "draft" | "now" | "schedule";

// The editor offers three ways to publish; the API only knows `publish_at` (null = draft, a
// past time = due now, a future one = scheduled). The form already refuses an empty schedule
// time; if one got through anyway it becomes a draft rather than a silent "now", so a bad
// value can never post something to Discord.
// ponytail: `datetime-local` is read in the browser's zone; convert via Africa/Cairo
// explicitly if editors ever work outside Egypt.
export function toPublishAt(
  mode: PublishMode,
  local: string,
  now: Date = new Date(),
): string | null {
  if (mode === "draft") return null;
  if (mode === "now") return now.toISOString();
  const date = new Date(local);
  return local && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

// Back the other way, for prefilling a `datetime-local` input ("2026-10-25T18:30").
export function toDatetimeLocal(iso: string | null): string {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface Person {
  username: string;
  first_name: string;
  last_name: string;
}

// Generated announcements (the monthly leaderboard) have no author
export function authorName(author: Person | null): string {
  if (!author) return "مقرأة النيل";
  return `${author.first_name} ${author.last_name}`.trim() || author.username;
}

// Shown as "آخر تعديل بواسطة …", only when someone other than the author made the last edit
export function lastEditorName(author: Person | null, editor: Person | null): string | null {
  if (!editor || editor.username === author?.username) return null;
  return authorName(editor);
}

export const STATUS_LABELS = {
  draft: "مسودة",
  scheduled: "مجدول",
  pending: "بانتظار النشر على ديسكورد",
  published: "منشور",
  failed: "فشل النشر على ديسكورد",
} as const;

// What the editor tells the author after a save. The Discord post is made by a cron job that
// runs every 5 minutes, so nothing appears there instantly and the author shouldn't expect it.
export function savedMessage(status: keyof typeof STATUS_LABELS): string {
  switch (status) {
    case "draft":
      return "تم حفظ المسودة، ولن يراها غيرك حتى تنشرها.";
    case "scheduled":
      return "تم الحفظ، وسيُنشر الخبر في موعده ثم على ديسكورد خلال ٥ دقائق.";
    case "published":
      return "تم الحفظ، وسيتم تحديث رسالة ديسكورد خلال ٥ دقائق.";
    default:
      // pending or failed: due, but Discord doesn't have it yet (a failed post is retried)
      return "تم الحفظ، وسيُنشر على ديسكورد خلال ٥ دقائق.";
  }
}

// "after N attempts", with Arabic number agreement: واحدة / محاولتين / ٣–١٠ محاولات / ١١+ محاولة
export function attemptsLabel(count: number): string {
  if (count === 1) return "محاولة واحدة";
  if (count === 2) return "محاولتين";
  const digits = count.toLocaleString("ar-EG", { useGrouping: false });
  return `${digits} ${count >= 3 && count <= 10 ? "محاولات" : "محاولة"}`;
}

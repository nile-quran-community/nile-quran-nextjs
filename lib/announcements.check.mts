// Announcement helpers, run by hand like week-helpers.check.mts:
// `node --experimental-strip-types lib/announcements.check.mts`.
// safeNextPath guards an open redirect (login sends the visitor wherever `next` says),
// so its edge cases are the ones worth pinning down.
import assert from "node:assert/strict";
import {
  STATUS_LABELS,
  attemptsLabel,
  authorName,
  lastEditorName,
  readingMinutes,
  replaceMentions,
  mentionHandles,
  savedMessage,
  safeNextPath,
  toDatetimeLocal,
  toPublishAt,
} from "./announcements.ts";

// --- replaceMentions: @username handles become links to the member's profile ---
const aliMention = { name: "علي أحمد", username: "ali" };
const monaMention = { name: "منى", username: "mona" };
assert.equal(
  replaceMentions("مبروك @ali", { ali: aliMention }),
  "مبروك [علي أحمد](/profile/ali)",
  "a known handle becomes a profile link",
);
assert.equal(
  replaceMentions("@ali و @mona", { ali: aliMention, mona: monaMention }),
  "[علي أحمد](/profile/ali) و [منى](/profile/mona)",
  "every handle is replaced, not just the first",
);
assert.equal(
  replaceMentions("@ali @ali", { ali: aliMention }),
  "[علي أحمد](/profile/ali) [علي أحمد](/profile/ali)",
);
assert.equal(replaceMentions("@ghost و @everyone", {}), "@ghost و @everyone", "unknown handles stay");
assert.equal(replaceMentions("نص بلا إشارات", {}), "نص بلا إشارات");
assert.equal(replaceMentions("بريد a@b.com", {}), "بريد a@b.com", "an email address is not a mention");
assert.equal(
  replaceMentions("(@ali)، @ali.", { ali: aliMention }),
  "([علي أحمد](/profile/ali))، [علي أحمد](/profile/ali).",
  "punctuation around a handle is kept",
);
assert.equal(
  replaceMentions("@x7", { x7: { name: "x", username: "a.b+c@x" } }),
  "[x](/profile/a.b%2Bc%40x)",
  "the username is URL-encoded in the path",
);
assert.equal(
  replaceMentions("@x", { x: { name: "a]b [c]", username: "x" } }),
  "[a\\]b \\[c\\]](/profile/x)",
  "brackets in a name can't break out of the link text",
);

// --- mentionHandles: the distinct usernames a body mentions ---
assert.deepEqual(mentionHandles("@ali و @mona و @ali، بريد a@b.com"), ["ali", "mona"]);
assert.deepEqual(mentionHandles("بلا إشارات"), []);

// --- readingMinutes: never zero, grows with length ---
assert.equal(readingMinutes(""), 1);
assert.equal(readingMinutes("كلمة"), 1);
assert.equal(readingMinutes("كلمة ".repeat(200)), 1);
assert.equal(readingMinutes("كلمة ".repeat(201)), 2);
assert.equal(readingMinutes("كلمة\n\nأخرى   ".repeat(500)), 5, "any whitespace splits words");

// --- safeNextPath: same-site paths only ---
assert.equal(safeNextPath("/news/5"), "/news/5");
assert.equal(safeNextPath("/news?x=1#a"), "/news?x=1#a");
assert.equal(safeNextPath(undefined), "/");
assert.equal(safeNextPath(""), "/");
assert.equal(safeNextPath("news/5"), "/", "relative paths are refused");
assert.equal(safeNextPath("//evil.com"), "/", "protocol-relative URL");
assert.equal(safeNextPath("/\\evil.com"), "/", "browsers read /\\ as //");
assert.equal(safeNextPath("https://evil.com"), "/");
assert.equal(safeNextPath("javascript:alert(1)"), "/");
assert.equal(safeNextPath("/\nhttps://evil.com"), "/", "control characters are refused");

// --- toPublishAt: the editor's publish mode becomes the API's `publish_at` ---
const clock = new Date("2026-10-20T10:00:00.000Z");
assert.equal(toPublishAt("draft", "2026-10-25T18:00", clock), null, "a draft has no publish time");
assert.equal(toPublishAt("now", "", clock), "2026-10-20T10:00:00.000Z");
assert.equal(
  toPublishAt("schedule", "2026-10-25T18:00", clock),
  new Date("2026-10-25T18:00").toISOString(),
  "scheduled times are read in the editor's own zone",
);
assert.equal(toPublishAt("schedule", "", clock), null, "no time chosen is not a silent 'now'");
assert.equal(toPublishAt("schedule", "garbage", clock), null);

// --- toDatetimeLocal: prefill the edit form with what was saved ---
assert.equal(toDatetimeLocal(null), "");
assert.equal(toDatetimeLocal("not a date"), "");
assert.equal(
  toDatetimeLocal(toPublishAt("schedule", "2026-10-25T18:30", clock)),
  "2026-10-25T18:30",
  "saving then reopening shows the same wall-clock time",
);

// --- bylines ---
const ali = { username: "ali", first_name: "علي", last_name: "أحمد" };
const mona = { username: "mona", first_name: "منى", last_name: "" };
assert.equal(authorName(ali), "علي أحمد");
assert.equal(authorName(mona), "منى", "no trailing space when there is no last name");
assert.equal(
  authorName({ username: "x", first_name: "", last_name: "" }),
  "x",
  "falls back to the username",
);
assert.equal(authorName(null), "مقرأة النيل", "generated announcements have no author");

assert.equal(lastEditorName(ali, ali), null, "the author editing their own post is not news");
assert.equal(lastEditorName(ali, null), null, "never edited");
assert.equal(lastEditorName(null, mona), "منى", "a generated post edited by someone shows them");
assert.equal(lastEditorName(ali, mona), "منى");

// --- savedMessage: what the editor promises after a save, by where the announcement stands ---
assert.match(
  savedMessage("draft"),
  /مسودة/,
  "a draft says it is private, and promises no Discord post",
);
assert.doesNotMatch(savedMessage("draft"), /ديسكورد/);
assert.match(savedMessage("scheduled"), /ديسكورد/);
assert.match(savedMessage("pending"), /٥ دقائق/, "due but unsent: posts within a cron interval");
assert.match(savedMessage("failed"), /٥ دقائق/, "a failed post is retried on the next run");
assert.match(savedMessage("published"), /تحديث/, "editing a posted announcement updates Discord");

// --- attemptsLabel: Arabic number agreement for "after N attempts" ---
assert.equal(attemptsLabel(1), "محاولة واحدة");
assert.equal(attemptsLabel(2), "محاولتين");
assert.equal(attemptsLabel(3), "٣ محاولات");
assert.equal(attemptsLabel(10), "١٠ محاولات");
assert.equal(attemptsLabel(11), "١١ محاولة", "past ten the noun goes singular");
assert.equal(attemptsLabel(25), "٢٥ محاولة");

// --- STATUS_LABELS: the two states that depend on Discord must say so, since to an editor
// "pending" otherwise reads as "not live on the site yet" (it is: the Discord post is pending) ---
assert.match(STATUS_LABELS.pending, /ديسكورد/);
assert.match(STATUS_LABELS.failed, /ديسكورد/);
assert.doesNotMatch(
  STATUS_LABELS.draft,
  /ديسكورد/,
  "draft/scheduled are about the site, not Discord",
);
assert.doesNotMatch(STATUS_LABELS.scheduled, /ديسكورد/);

console.log("announcements checks passed");

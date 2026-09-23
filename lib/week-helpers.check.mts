// Hijri week bucketing, run by hand — the repo has no test runner and this does not
// need one: `node --experimental-strip-types lib/week-helpers.check.mts`.
// It is here because the buckets decide which week a recitation counts toward, and
// a boundary that lands a day out is invisible until a student is double-counted.
import assert from "node:assert/strict";
import { hijriToGregorian } from "@tabby_ai/hijri-converter";
import {
  getHijriWeekRange,
  getHijriWeekRangeForDate,
  getHijriWeekQueryRange,
  sameHijriWeek,
} from "./utils.ts";

const iso = (year: number, month: number, day: number) => {
  const g = hijriToGregorian({ year, month, day });
  return `${g.year}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}`;
};

// NaN no longer slips past the guard into a "NaN-NaN-NaN" API filter
assert.throws(() => getHijriWeekRange(1447, 3, NaN), /Invalid weekIndex/);
// an unparseable date is already stopped one level down, by the converter
assert.throws(() => getHijriWeekRangeForDate("not-a-date"), /date out of range/);
assert.throws(() => getHijriWeekRange(1447, 3, 0));
assert.throws(() => getHijriWeekRange(1447, 3, 5));

// Buckets: 1-7, 8-14, 15-21, 22-to-month-end. Day 29/30 is week 4, never a week 5.
for (let m = 1; m <= 12; m++) {
  for (const [d, wi] of [
    [1, 1],
    [7, 1],
    [8, 2],
    [14, 2],
    [15, 3],
    [21, 3],
    [22, 4],
    [29, 4],
  ] as const) {
    assert.equal(
      getHijriWeekRangeForDate(iso(1447, m, d)).start,
      getHijriWeekRange(1447, m, wi).start,
      `1447-${m}-${d} -> week ${wi}`,
    );
  }
}

// The query window strictly contains the week, padded 3 days each side
const w = getHijriWeekRangeForDate("2026-09-19");
const q = getHijriWeekQueryRange("2026-09-19");
assert.equal(new Date(w.start).getTime() - new Date(q.start).getTime(), 3 * 86400000);
assert.equal(new Date(q.end).getTime() - new Date(w.end).getTime(), 3 * 86400000);

// sameHijriWeek agrees with the range it came from, and the padding is outside it
assert.ok(sameHijriWeek(w.start, w.end));
assert.ok(!sameHijriWeek(w.start, q.start));
assert.ok(!sameHijriWeek(w.end, q.end));

console.log("week helpers ok");

"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { Lalezar, Tajawal } from "next/font/google";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Inbox,
  Check,
  UserCheck,
  RotateCcw,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PageHero, PageHeroHeading } from "@/components/ui/PageHero";
import {
  getUsers,
  getCategories,
  getPoints,
  addUserActivity,
  updateUserActivity,
  deleteUserActivity,
  updateUserSupervisor,
  updateUserActiveStatus,
  getAllMembers,
  type Member,
} from "@/actions/ControlBoard";
import { updateUser } from "@/actions/profile";
import { ALL_GROUPS, getGroupLabel } from "@/lib/profile-types";
import RoleBadge from "@/components/Profile/RoleBadge";
import UserRow, { UserAvatar, type DraftEntry } from "./userRow";
import MembersTable from "./MembersTable";
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { getHijriMonth, toArabicDigits } from "@/lib/utils";

// Fonts
const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

// Types
type Category = { id: number; name: string; value: number };
type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  groups: string[];
  points: number;
  supervisor: string | null;
  is_active: boolean;
};
type UserPoints = {
  user: number;
  points: number;
  activities: Activity[];
};
type PointsResponse = {
  points: UserPoints[];
};
type Activity = {
  id: number;
  category: number;
  date: string;
  multiplier: number;
};

export interface ControlPanelData {
  users: User[];
  categories: Category[];
  points: PointsResponse;
  error?: string | unknown;
}

// getCategories() is already cached server-side for an hour (shared with the
// profile page via getCachedPointsCategories in actions/categories.ts).
// categoriesRef below is the only client-side memoization — it avoids
// repeating even the (cheap, cached) round trip during this page's own
// lifetime.
async function fetchCategories(): Promise<Category[]> {
  const res = await getCategories();
  return res.success ? res.categories : [];
}

// Same date-for-a-new-activity rule the row used to compute itself — now computed once per
// save batch instead of once per row, since every pending edit in a batch targets the same
// currently-viewed week.
//
// "Is this really today" requires year + month to match too, not just the week number —
// week 1 of the viewed month otherwise looks identical to week 1 of the real current month
// whenever today happens to fall in week 1, silently stamping historical entries with
// today's real date instead of a date inside the month being edited.
function getActivityDateFor(
  weekIndex: number,
  currentWeek: number,
  year: number,
  month: number,
  todayHijriYear: number,
  todayHijriMonth: number,
) {
  if (weekIndex === currentWeek && year === todayHijriYear && month === todayHijriMonth) {
    return new Date().toISOString();
  }
  const day = weekIndex === 1 ? 1 : (weekIndex - 1) * 7 + 1;
  const currentDate = hijriToGregorian({ year, month, day });
  // Fixed midday time-of-day — only the date matters for a historical entry, and any
  // constant time keeps it safely inside that calendar day.
  return `${currentDate.year}-${currentDate.month}-${currentDate.day}T12:00:00.000Z`;
}

// Component
export default function ControlPanelClient({ currentUserId }: { currentUserId?: number }) {
  const date = new Date();
  const hijriDate = gregorianToHijri({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

  // Clamped, not a plain ceil: days 29/30 (the old trailing "week 5") now fold into week 4
  // instead of the month having a 5th, 1-2 day week.
  const getInitialWeekIndex = () => Math.min(Math.ceil(hijriDate.day / 7), 4);

  const currentWeek = getInitialWeekIndex();
  const weekArabicNames = ["الأول", "الثاني", "الثالث", "الرابع"];

  const [data, setData] = useState<ControlPanelData>({
    users: [],
    categories: [],
    points: { points: [] },
  });

  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(hijriDate.month);
  const [year, setYear] = useState(hijriDate.year);
  const [weekIndex, setWeekIndex] = useState<number>(getInitialWeekIndex);
  const [searchQuery, setSearchQuery] = useState("");
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [tab, setTab] = useState<"points" | "teams" | "pending" | "members">("points");
  // The whole community, not just students — an Admin or Supervisor serves on a
  // team too. Fetched the first time the teams tab is opened rather than on every
  // week change, since team membership has nothing to do with the week on screen.
  const [roster, setRoster] = useState<User[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState(false);
  // One attempt per page visit: keyed off a ref, not off `roster.length`, so a
  // failed fetch leaves an empty list rather than re-firing on every render.
  const rosterFetchedRef = useRef(false);
  const [confirmingActivateId, setConfirmingActivateId] = useState<number | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  // Which member's groups are open for editing. Group membership isn't weekly data,
  // so it's saved on its own the moment the modal is confirmed — it never joins the
  // week's draft batch, which is cleared on every week change.
  const [groupsEditId, setGroupsEditId] = useState<number | null>(null);
  const [savingGroups, setSavingGroups] = useState(false);

  // Every member across every group, fetched only once the tab is actually opened. It's a
  // heavier, separate query (getAllMembers walks the full paginated roster) than the Student/
  // Supervisor fetch the rest of this page already does.
  const [members, setMembers] = useState<Member[] | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Sparse per-user local edits, keyed by user id. A user only gets an entry once one of their
  // fields is touched; absent = "no local edit, use server truth." Cleared entirely on week
  // navigation (see the fetch effect below) since it belongs to whichever week is on screen.
  const [drafts, setDrafts] = useState<Record<number, DraftEntry>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  const categoriesRef = useRef<Category[]>([]);

  const fetchWeekData = useCallback(
    async (week: number) => {
      try {
        const [usersRes, categories, pointsRes, supervisorsRes] = await Promise.all([
          getUsers("Student"),
          categoriesRef.current.length > 0
            ? Promise.resolve(categoriesRef.current)
            : fetchCategories(),
          getPoints(year, month, week),
          getUsers("Supervisor"),
        ]);

        if (categories.length > 0) {
          categoriesRef.current = categories;
        }

        setData((prev) => {
          const newData = { ...prev };

          if (usersRes && usersRes.success) {
            const rawUsers = usersRes.users;
            newData.users = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
          } else {
            newData.error = usersRes?.error || "Error loading users";
          }

          if (pointsRes && pointsRes.success) {
            const raw = pointsRes.points;
            newData.points = {
              points: Array.isArray(raw) ? raw : (raw as { results?: UserPoints[] })?.results || [],
            };
          }

          newData.categories = categories;

          return newData;
        });

        if (supervisorsRes && supervisorsRes.success) {
          const rawSupervisors = supervisorsRes.users;
          setSupervisors(
            Array.isArray(rawSupervisors) ? rawSupervisors : rawSupervisors?.results || [],
          );
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setData((prev) => ({ ...prev, error: "System error loading data" }));
      }
    },
    [year, month],
  );

  useEffect(() => {
    setDrafts({}); // switching weeks discards any unsaved local edits — they belong to the old week
    setLoading(true);
    fetchWeekData(weekIndex).finally(() => setLoading(false));
  }, [weekIndex, fetchWeekData]);

  // Fetched once, the first time the tab is opened, not on mount, since most admin visits
  // never touch it, and not on every switch back to it, since the roster doesn't change that often.
  useEffect(() => {
    if (tab !== "members" || members !== null || membersLoading) return;
    setMembersLoading(true);
    setMembersError(null);
    getAllMembers()
      .then((res) => {
        if (res.success) setMembers(res.members);
        else setMembersError(res.error);
      })
      .finally(() => setMembersLoading(false));
  }, [tab, members, membersLoading]);

  useEffect(() => {
    if (tab !== "teams" || rosterFetchedRef.current) return;
    rosterFetchedRef.current = true;
    setRosterLoading(true);
    setRosterError(false);
    getUsers()
      .then((res) => {
        if (!res.success) throw new Error("roster fetch failed");
        const raw = res.users;
        setRoster(Array.isArray(raw) ? raw : raw?.results || []);
      })
      .catch((error) => {
        console.error("Error loading roster:", error);
        // Say so rather than drawing every group empty, and let the ref go back
        // so leaving the tab and returning is a retry.
        setRosterError(true);
        rosterFetchedRef.current = false;
      })
      .finally(() => setRosterLoading(false));
  }, [tab]);

  const isViewingCurrentWeek =
    weekIndex === currentWeek && month === hijriDate.month && year === hijriDate.year;

  const handleGoToCurrentWeek = () => {
    if (loading || isSavingAll || isViewingCurrentWeek) return;
    setYear(hijriDate.year);
    setMonth(hijriDate.month);
    setWeekIndex(currentWeek);
  };

  const handleWeekChange = (dir: "prev" | "next") => {
    if (loading || isSavingAll) return;

    if (dir === "next") {
      if (weekIndex < 4) {
        setWeekIndex((prev) => prev + 1);
      } else {
        setWeekIndex(1);
        if (month === 12) {
          setMonth(1);
          setYear((prev) => prev + 1);
        } else {
          setMonth((prev) => prev + 1);
        }
      }
    } else {
      if (weekIndex > 1) {
        setWeekIndex((prev) => prev - 1);
      } else {
        setWeekIndex(4);
        if (month === 1) {
          setMonth(12);
          setYear((prev) => prev - 1);
        } else {
          setMonth((prev) => prev - 1);
        }
      }
    }
  };

  // Active students — disabled accounts are surfaced only in the "قيد التفعيل" tab,
  // never in the points table or the top summary stats.
  const activeUsers = useMemo(() => (data?.users || []).filter((u) => u.is_active), [data?.users]);

  // Filtered & sorted users (by points desc)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return activeUsers;

    const q = searchQuery.trim().toLowerCase();
    return activeUsers.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      const supervisorUser = supervisors.find((s) => s.username === u.supervisor);
      const supervisorName = supervisorUser
        ? `${supervisorUser.first_name} ${supervisorUser.last_name}`.toLowerCase()
        : "";
      return fullName.includes(q) || supervisorName.includes(q);
    });
  }, [activeUsers, searchQuery, supervisors]);

  // Students awaiting admin activation
  const pendingUsers = useMemo(
    () => (data?.users || []).filter((u) => !u.is_active),
    [data?.users],
  );

  const handleActivateUser = async (userId: number) => {
    setActivatingId(userId);
    const res = await updateUserActiveStatus(userId, true);
    setActivatingId(null);
    setConfirmingActivateId(null);

    if (res.success) {
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === userId ? { ...u, is_active: true } : u)),
      }));
    } else {
      alert("حدث خطأ أثناء تفعيل الحساب");
    }
  };

  // Opened from the teams tab, which works off the roster — the points table has
  // nothing to do with group membership.
  const groupsEditUser = roster.find((u) => u.id === groupsEditId) ?? null;

  const handleSaveGroups = async (groups: string[]) => {
    if (groupsEditId === null) return;
    setSavingGroups(true);
    const res = await updateUser(groupsEditId, { groups });
    setSavingGroups(false);

    if (!res.success) {
      alert(res.error || "حدث خطأ أثناء تحديث المجموعات");
      return;
    }

    // data.users is the `?group=Student` list: a member who is no longer a student
    // leaves it now rather than lingering in the table until the next week change.
    setData((prev) => ({
      ...prev,
      users: groups.includes("Student")
        ? prev.users.map((u) => (u.id === groupsEditId ? { ...u, groups } : u))
        : prev.users.filter((u) => u.id !== groupsEditId),
    }));
    setRoster((prev) => prev.map((u) => (u.id === groupsEditId ? { ...u, groups } : u)));
    setGroupsEditId(null);
  };

  const handleEditGroups = useCallback((userId: number) => setGroupsEditId(userId), []);

  // Summary statistics — scoped to active accounts, so a disabled student's stale points
  // entries can't inflate totals or skew the completion rate.
  const summary = useMemo(() => {
    const totalStudents = activeUsers.length;
    const activeUserIds = new Set(activeUsers.map((u) => u.id));
    const activePoints = data.points?.points?.filter((p) => activeUserIds.has(p.user)) ?? [];

    const totalPoints = activePoints.reduce((sum, p) => sum + (p.points || 0), 0);
    const activeStudents = activePoints.filter((p) => (p.activities?.length || 0) > 0).length;
    const completionRate =
      totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

    return { totalStudents, totalPoints, activeStudents, completionRate };
  }, [activeUsers, data.points]);

  // Per-row slice of the points array — required for React.memo on UserRow to do anything at
  // all. Without this, data.points.points gets a new array reference on every save and would
  // be passed identically to every row, so memo's shallow comparison would never bail.
  const pointsByUser = useMemo(
    () => new Map(data.points.points.map((p) => [p.user, p])),
    [data.points.points],
  );

  // Invite (id 5) always renders last in the desktop table — sorted once here
  // instead of by the header and by every row on every render (categories
  // themselves change rarely; drafts and search change on every keystroke).
  const sortedCategories = useMemo(
    () => [...data.categories].sort((a, b) => (a.id === 5 ? 1 : b.id === 5 ? -1 : 0)),
    [data.categories],
  );

  // Which users currently have an unsaved edit (drives each row's own dirty prop), and how
  // many individual field-level edits are pending in total (drives the bottom bar's count —
  // one per checkbox/stepper/supervisor change, matching how many ops Save will actually send,
  // not how many rows they land on). A draft entry can exist for a user and still not be
  // "dirty" if every touched field was edited back to its original value.
  const { dirtyUserIds, pendingChangesCount } = useMemo(() => {
    const ids = new Set<number>();
    let changeCount = 0;

    for (const user of data.users) {
      const draft = drafts[user.id];
      if (!draft) continue;

      const originalActivities = pointsByUser.get(user.id)?.activities ?? [];
      let userDirty = false;

      for (const c of data.categories) {
        const draftValue = draft.activities?.[c.id];
        if (draftValue === undefined) continue;
        const originalValue = originalActivities.find((a) => a.category === c.id)?.multiplier ?? 0;
        if (draftValue !== originalValue) {
          userDirty = true;
          changeCount++;
        }
      }

      if (draft.supervisor !== undefined && draft.supervisor !== user.supervisor) {
        userDirty = true;
        changeCount++;
      }

      if (userDirty) ids.add(user.id);
    }

    return { dirtyUserIds: ids, pendingChangesCount: changeCount };
  }, [drafts, pointsByUser, data.users, data.categories]);

  // Stable (deps []) — only ever touches the one user's key via functional setState, so
  // editing one row never changes another row's draft prop reference.
  const handleCategoryDraftChange = useCallback(
    (userId: number, categoryId: number, multiplier: number) => {
      setDrafts((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          activities: { ...prev[userId]?.activities, [categoryId]: multiplier },
        },
      }));
    },
    [],
  );

  const handleSupervisorDraftChange = useCallback((userId: number, supervisor: string | null) => {
    setDrafts((prev) => ({ ...prev, [userId]: { ...prev[userId], supervisor } }));
  }, []);

  const handleDiscardAll = () => {
    if (isSavingAll) return;
    setDrafts({});
  };

  // Batches every dirty user's pending edits into the minimal set of add/update/delete calls
  // (diffed per category against server truth, exactly as a single row used to do — just fired
  // across every dirty user at once), then a single getPoints call reconciles totals for
  // everyone. A user whose write fails keeps their draft (and stays in dirtyUserIds, so they
  // reappear in the bar for a retry) because dirtiness is always recomputed live against
  // data.points/data.users — nothing here needs to explicitly "clear" a draft on success.
  const handleSaveAll = async () => {
    if (isSavingAll || dirtyUserIds.size === 0) return;
    setIsSavingAll(true);

    const activityDate = getActivityDateFor(
      weekIndex,
      currentWeek,
      year,
      month,
      hijriDate.year,
      hijriDate.month,
    );
    const categoryOps: Array<() => Promise<{ success: boolean; error?: string }>> = [];
    const supervisorOps: Array<{
      userId: number;
      supervisor: string | null;
      run: () => Promise<{ success: boolean; error?: string }>;
    }> = [];

    for (const userId of dirtyUserIds) {
      const user = data.users.find((u) => u.id === userId);
      if (!user) continue;
      const draft = drafts[userId];
      const originalActivities = pointsByUser.get(userId)?.activities ?? [];

      for (const category of data.categories) {
        const draftMultiplier = draft?.activities?.[category.id];
        if (draftMultiplier === undefined) continue;
        const original = originalActivities.find((a) => a.category === category.id);
        const originalMultiplier = original?.multiplier ?? 0;
        if (draftMultiplier === originalMultiplier) continue;
        if (draftMultiplier > 0 && originalMultiplier === 0) {
          categoryOps.push(() =>
            addUserActivity(userId, category.id, activityDate, draftMultiplier),
          );
        } else if (draftMultiplier > 0) {
          categoryOps.push(() => updateUserActivity(userId, original!.id, draftMultiplier));
        } else {
          categoryOps.push(() => deleteUserActivity(userId, original!.id));
        }
      }

      if (draft?.supervisor !== undefined && draft.supervisor !== user.supervisor) {
        supervisorOps.push({
          userId,
          supervisor: draft.supervisor,
          run: () => updateUserSupervisor(userId, draft.supervisor ?? null),
        });
      }
    }

    // allSettled (not all) — a rejection must not stop us from learning which of the other
    // users' ops landed, otherwise a retry would re-diff against stale data and double-submit
    // whatever already succeeded.
    const [categoryResults, supervisorResults] = await Promise.all([
      Promise.allSettled(categoryOps.map((op) => op())),
      Promise.allSettled(supervisorOps.map((s) => s.run())),
    ]);

    const succeededSupervisors = new Map<number, string | null>();
    supervisorResults.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value.success) {
        succeededSupervisors.set(supervisorOps[i].userId, supervisorOps[i].supervisor);
      }
    });

    const anyFailed =
      categoryResults.some((r) => r.status === "rejected" || !r.value.success) ||
      supervisorResults.some((r) => r.status === "rejected" || !r.value.success);

    try {
      // Single authoritative call for the whole batch — getPoints already returns a flat
      // UserPoints[] (unwrapped server-side) covering every user, so one call reconciles
      // totals for everyone who was just edited. Never recompute points client-side.
      const pointsRes = await getPoints(year, month, weekIndex);
      if (pointsRes.success) {
        setData((prev) => ({
          ...prev,
          points: { points: pointsRes.points },
          users: prev.users.map((u) =>
            succeededSupervisors.has(u.id)
              ? { ...u, supervisor: succeededSupervisors.get(u.id)! }
              : u,
          ),
        }));
      }
    } catch (error) {
      console.error("Error refreshing points after save:", error);
    }

    setIsSavingAll(false);
    if (anyFailed) alert("حدث خطأ أثناء حفظ بعض التغييرات");
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#EBF0EB]" dir="rtl">
      <PageHero>
        <PageHeroHeading
          icon={Sparkles}
          eyebrow="لوحة الإدارة"
          title="لوحة التحكم"
          subtitle="إدارة نقاط الطلاب، تفعيل الحسابات، ومتابعة بيانات الأعضاء"
        />
      </PageHero>

      {/* Main content */}
      <div className="container mx-auto px-4 lg:px-12 -mt-6 pb-12 relative z-10 flex flex-col gap-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <SummaryStat
            icon={<Users className="w-5 h-5" strokeWidth={2.2} />}
            label="إجمالي الطلاب"
            value={toArabicDigits(summary.totalStudents)}
            tone="primary"
            loading={loading}
          />
          <SummaryStat
            icon={<TrendingUp className="w-5 h-5" strokeWidth={2.2} />}
            label="إجمالي النقاط"
            value={toArabicDigits(summary.totalPoints)}
            tone="accent"
            loading={loading}
          />
          <SummaryStat
            icon={<CheckCircle2 className="w-5 h-5" strokeWidth={2.2} />}
            label="الطلاب النشطون"
            value={toArabicDigits(summary.activeStudents)}
            tone="muted"
            loading={loading}
          />
          <SummaryStat
            icon={<Sparkles className="w-5 h-5" strokeWidth={2.2} />}
            label="نسبة الإنجاز"
            value={`${toArabicDigits(summary.completionRate)}٪`}
            tone="primary"
            loading={loading}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl p-1.5 w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setTab("points")}
            className={`${tajawal.className} px-4 h-10 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              tab === "points"
                ? "bg-[#043F2E] text-white shadow-sm"
                : "text-[#043F2E] hover:bg-white/50"
            }`}
          >
            جدول النقاط
          </button>
          <button
            type="button"
            onClick={() => setTab("teams")}
            className={`${tajawal.className} px-4 h-10 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              tab === "teams"
                ? "bg-[#043F2E] text-white shadow-sm"
                : "text-[#043F2E] hover:bg-white/50"
            }`}
          >
            المجموعات
          </button>
          <button
            type="button"
            onClick={() => setTab("members")}
            className={`${tajawal.className} px-4 h-10 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              tab === "members"
                ? "bg-[#043F2E] text-white shadow-sm"
                : "text-[#043F2E] hover:bg-white/50"
            }`}
          >
            الأعضاء
          </button>
          {/* Always keep this tab last */}
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={`${tajawal.className} flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              tab === "pending"
                ? "bg-[#043F2E] text-white shadow-sm"
                : "text-[#043F2E] hover:bg-white/50"
            }`}
          >
            قيد التفعيل
            {pendingUsers.length > 0 && (
              <span
                aria-label={`${pendingUsers.length} حساب بانتظار التفعيل`}
                className="w-2 h-2 rounded-full bg-[#9B3D2E]"
              />
            )}
          </button>
        </div>

        {tab === "teams" && (
          <GroupsSection
            users={roster}
            loading={rosterLoading}
            error={rosterError}
            onEditMember={handleEditGroups}
          />
        )}

        {tab === "pending" && (
          <PendingActivationSection
            users={pendingUsers}
            confirmingId={confirmingActivateId}
            activatingId={activatingId}
            onRequestActivate={setConfirmingActivateId}
            onCancelActivate={() => setConfirmingActivateId(null)}
            onConfirmActivate={handleActivateUser}
          />
        )}

        {tab === "members" &&
          (membersLoading ? (
            <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-8 text-center text-[#043F2E]/50">
              <span className={tajawal.className}>جارٍ تحميل بيانات الأعضاء...</span>
            </div>
          ) : membersError ? (
            <div className="bg-white rounded-3xl border border-[#9B3D2E]/20 shadow-sm p-6 text-center text-[#9B3D2E]">
              <span className={tajawal.className}>تعذّر تحميل قائمة الأعضاء: {membersError}</span>
            </div>
          ) : (
            <MembersTable members={members ?? []} />
          ))}

        {tab === "points" && (
          <>
            {/* Filter + Progress card */}
            <div className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm p-5 md:p-6 flex flex-col gap-5">
              {/* Month progress */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`${lalezar.className} text-2xl md:text-[28px] text-[#043F2E] leading-none`}
                    >
                      {getHijriMonth(month - 1)} <span className="text-[#043F2E]/40">—</span>{" "}
                      {toArabicDigits(year)}
                    </div>
                    <span className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium`}>
                      الأسبوع {weekArabicNames[weekIndex - 1]}
                    </span>
                  </div>

                  {!isViewingCurrentWeek && (
                    <button
                      onClick={handleGoToCurrentWeek}
                      disabled={loading || isSavingAll}
                      className={`${tajawal.className} flex items-center gap-1.5 px-3 h-9 rounded-xl bg-[#043F2E] hover:bg-[#065f46] text-white text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.4} />
                      العودة للأسبوع الحالي
                    </button>
                  )}
                </div>

                <Progress
                  value={(weekIndex / 4) * 100}
                  className="h-3 bg-[#DEFF90]"
                  className2="bg-[#9ADD00]"
                />

                {/* Week dots */}
                <div className="flex items-center justify-between px-1">
                  {weekArabicNames.map((name, idx) => {
                    const isActive = idx + 1 === weekIndex;
                    const isPast = idx + 1 < weekIndex;
                    return (
                      <div key={name} className="flex flex-col items-center gap-1.5 flex-1">
                        <div
                          className={`w-3 h-3 rounded-full transition-all ${
                            isActive
                              ? "bg-[#9ADD00] ring-4 ring-[#BEE663]/40 scale-110"
                              : isPast
                                ? "bg-[#9ADD00]"
                                : "bg-[#DEFF90]"
                          }`}
                        />
                        <span
                          className={`${tajawal.className} text-[11px] md:text-xs font-medium ${
                            isActive ? "text-[#043F2E]" : "text-[#043F2E]/40"
                          }`}
                        >
                          {name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#043F2E]/10" />

              {/* Search + Navigation */}
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50"
                    strokeWidth={2.2}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن طالب أو مشرف..."
                    className={`${tajawal.className} w-full h-12 pr-11 pl-4 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors text-sm font-medium`}
                  />
                </div>

                {/* Week navigation */}
                <div className="flex justify-between items-center gap-2 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl p-1.5">
                  <button
                    onClick={() => handleWeekChange("prev")}
                    disabled={loading || isSavingAll}
                    aria-label="الأسبوع السابق"
                    className="w-10 h-10 rounded-xl bg-white hover:bg-[#BEE663] text-[#043F2E] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" strokeWidth={2.4} />
                  </button>

                  <div
                    className={`${tajawal.className} px-4 min-w-[120px] text-center text-sm font-bold text-[#043F2E]`}
                  >
                    الأسبوع {weekArabicNames[weekIndex - 1]}
                  </div>

                  <button
                    onClick={() => handleWeekChange("next")}
                    disabled={loading || isSavingAll}
                    aria-label="الأسبوع التالي"
                    className="w-10 h-10 rounded-xl bg-white hover:bg-[#BEE663] text-[#043F2E] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm overflow-hidden">
              {/* Table Header (sticky) */}
              <div className="hidden lg:block">
                {sortedCategories.length > 0 && <TableHeader categories={sortedCategories} />}
              </div>

              {/* Loading skeleton */}
              {loading && (
                <div className="p-4 md:p-6 flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 md:h-14 rounded-2xl bg-[#F7FBEA] animate-pulse" />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-4">
                    <Inbox className="w-7 h-7 text-[#043F2E]/40" strokeWidth={1.8} />
                  </div>
                  <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>
                    {searchQuery ? "لا توجد نتائج" : "لا يوجد طلاب"}
                  </h3>
                  <p className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium`}>
                    {searchQuery ? "جرب البحث بكلمة مختلفة" : "لم يتم العثور على طلاب لهذا الأسبوع"}
                  </p>
                </div>
              )}

              {/* Desktop table rows */}
              {!loading && filteredUsers.length > 0 && (
                <div className="hidden lg:flex flex-col">
                  {filteredUsers.map((user, index) => (
                    <UserRow
                      key={user.id}
                      variant="desktop"
                      isLast={index === filteredUsers.length - 1}
                      userId={user.id}
                      points={pointsByUser.get(user.id)}
                      firstname={user.first_name}
                      lastname={user.last_name}
                      username={user.username}
                      supervisor={user.supervisor}
                      supervisors={supervisors}
                      categories={sortedCategories}
                      draft={drafts[user.id]}
                      isDirty={dirtyUserIds.has(user.id)}
                      disabled={isSavingAll}
                      isActive={user.is_active}
                      onCategoryDraftChange={handleCategoryDraftChange}
                      onSupervisorDraftChange={handleSupervisorDraftChange}
                    />
                  ))}
                </div>
              )}

              {/* Mobile cards */}
              {!loading && filteredUsers.length > 0 && (
                <div className="lg:hidden flex flex-col gap-3 p-4">
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      variant="mobile"
                      userId={user.id}
                      points={pointsByUser.get(user.id)}
                      firstname={user.first_name}
                      lastname={user.last_name}
                      username={user.username}
                      supervisor={user.supervisor}
                      supervisors={supervisors}
                      categories={data.categories}
                      draft={drafts[user.id]}
                      isDirty={dirtyUserIds.has(user.id)}
                      disabled={isSavingAll}
                      isActive={user.is_active}
                      onCategoryDraftChange={handleCategoryDraftChange}
                      onSupervisorDraftChange={handleSupervisorDraftChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {groupsEditUser && (
        <GroupsModal
          fullName={`${groupsEditUser.first_name} ${groupsEditUser.last_name}`.trim()}
          groups={groupsEditUser.groups || []}
          saving={savingGroups}
          isSelf={groupsEditUser.id === currentUserId}
          onClose={() => !savingGroups && setGroupsEditId(null)}
          onSave={handleSaveGroups}
        />
      )}

      <UnsavedChangesBar
        count={pendingChangesCount}
        isSaving={isSavingAll}
        onSaveAll={handleSaveAll}
        onDiscardAll={handleDiscardAll}
      />
    </div>
  );
}

// ============================
// Groups — who belongs where. One card per group the API defines, roles included,
// so the page states the membership as it really is rather than the teams half of
// it; the last card catches anyone in no group at all. Tapping a member opens the
// same groups modal the points table uses.
// ============================
function GroupsSection({
  users,
  loading,
  error,
  onEditMember,
}: {
  users: User[];
  loading: boolean;
  error: boolean;
  onEditMember: (userId: number) => void;
}) {
  const active = users
    .filter((u) => u.is_active)
    .sort((a, b) =>
      `${a.first_name} ${a.last_name}`
        .trim()
        .localeCompare(`${b.first_name} ${b.last_name}`.trim(), "ar"),
    );
  // "No group this build knows", not "no group" — a member whose only group is one
  // the API added since would otherwise appear on no card at all.
  const unassigned = active.filter((u) => !ALL_GROUPS.some((g) => (u.groups || []).includes(g)));

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-3xl bg-white/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#F4E0D6] flex items-center justify-center mb-4">
          <Users className="w-7 h-7 text-[#9B3D2E]" strokeWidth={1.8} />
        </div>
        <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>تعذّر تحميل الأعضاء</h3>
        <p className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium`}>
          انتقل إلى تبويب آخر ثم عد إلى المجموعات للمحاولة مرة أخرى
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ALL_GROUPS.map((group) => (
        <GroupCard
          key={group}
          title={<RoleBadge group={group} size="lg" />}
          members={active.filter((u) => (u.groups || []).includes(group))}
          emptyText="لا أحد في هذه المجموعة بعد"
          onEditMember={onEditMember}
        />
      ))}

      <GroupCard
        title={
          <span className={`${tajawal.className} text-sm font-medium text-[#043F2E]/70`}>
            بدون مجموعة
          </span>
        }
        members={unassigned}
        emptyText="كل الأعضاء ضمن مجموعة"
        onEditMember={onEditMember}
      />
    </div>
  );
}

function GroupCard({
  title,
  members,
  emptyText,
  onEditMember,
}: {
  title: React.ReactNode;
  members: User[];
  emptyText: string;
  onEditMember: (userId: number) => void;
}) {
  return (
    <section className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        {title}
        <span
          className={`${tajawal.className} shrink-0 min-w-[28px] h-7 px-2 flex items-center justify-center rounded-lg text-xs font-bold ${
            members.length > 0 ? "bg-[#BEE663] text-[#043F2E]" : "bg-[#F7FBEA] text-[#043F2E]/40"
          }`}
        >
          {toArabicDigits(members.length)}
        </span>
      </div>

      <div className="h-px bg-[#043F2E]/10" />

      {members.length === 0 ? (
        <p className={`${tajawal.className} text-sm font-medium text-[#043F2E]/50 py-2`}>
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto">
          {members.map((m) => {
            const fullName = `${m.first_name} ${m.last_name}`.trim() || m.username;
            const initials =
              `${m.first_name?.charAt(0) || ""}${m.last_name?.charAt(0) || ""}`.trim();
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onEditMember(m.id)}
                  aria-label={`مجموعات ${fullName}`}
                  className="w-full flex items-center gap-2.5 p-1.5 rounded-xl text-start hover:bg-[#F7FBEA] transition-colors cursor-pointer"
                >
                  <UserAvatar initials={initials} size="sm" />
                  <span
                    className={`${tajawal.className} min-w-0 flex-1 text-sm font-medium text-[#043F2E] truncate`}
                  >
                    {fullName}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ============================
// Groups modal — the member's place in the community (role + NQC teams).
// Saved on its own, outside the week's draft batch.
// ============================
function GroupsModal({
  fullName,
  groups,
  saving,
  isSelf,
  onClose,
  onSave,
}: {
  fullName: string;
  groups: string[];
  saving: boolean;
  /** The admin editing their own membership — see the locked Admin checkbox below */
  isSelf: boolean;
  onClose: () => void;
  onSave: (groups: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(groups);

  const toggle = (group: string) =>
    setSelected((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );

  // A group the API added that this build doesn't list yet must survive a save
  // here rather than being silently stripped off the member.
  const unknown = groups.filter((g) => !ALL_GROUPS.includes(g as (typeof ALL_GROUPS)[number]));
  const changed = selected.length !== groups.length || selected.some((g) => !groups.includes(g));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#043F2E]/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`مجموعات ${fullName}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] max-h-[85vh] overflow-y-auto bg-white rounded-3xl border border-[#043F2E]/10 shadow-lg p-5 flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={`${lalezar.className} text-xl text-[#043F2E] leading-tight truncate`}>
              المجموعات
            </h3>
            <p className={`${tajawal.className} text-xs font-medium text-[#043F2E]/60 truncate`}>
              {fullName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[#043F2E]/60 hover:bg-[#F7FBEA] hover:text-[#043F2E] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {ALL_GROUPS.map((group) => {
            const checked = selected.includes(group);
            // Dropping your own admin group locks you out of this page, and with a
            // single admin account nothing in the UI can undo it.
            const locked = isSelf && group === "Admin" && checked;
            return (
              <button
                key={group}
                type="button"
                disabled={saving || locked}
                title={locked ? "لا يمكنك إزالة صلاحية الإدارة عن نفسك" : undefined}
                onClick={() => toggle(group)}
                className={`flex items-center gap-3 rounded-xl border p-2.5 text-start transition-colors disabled:opacity-50 cursor-pointer ${
                  checked
                    ? "bg-[#BEE663]/15 border-[#043F2E]/30"
                    : "bg-[#F7FBEA] border-[#043F2E]/8 hover:border-[#043F2E]/25"
                }`}
              >
                <span
                  className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${
                    checked
                      ? "bg-[#BEE663] border border-[#043F2E]"
                      : "bg-white border border-[#043F2E]/15"
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5 text-[#043F2E]" strokeWidth={3} />}
                </span>
                <RoleBadge group={group} size="md" />
              </button>
            );
          })}
        </div>

        {unknown.length > 0 && (
          <p className={`${tajawal.className} text-[11px] text-[#043F2E]/60`}>
            مجموعات أخرى محفوظة كما هي: {unknown.map(getGroupLabel).join(" · ")}
          </p>
        )}

        {!selected.includes("Student") && (
          <p
            dir="rtl"
            role="status"
            className={`${tajawal.className} flex items-start gap-2 rounded-xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-3 text-xs text-[#9B3D2E]`}
          >
            بدون مجموعة «طالب» لن يظهر العضو في جدول النقاط ولا في ترتيب الشهر.
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving || !changed}
            onClick={() => onSave(selected)}
            className={`${tajawal.className} flex-1 h-11 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className={`${tajawal.className} h-11 px-4 rounded-xl bg-[#F7FBEA] border border-[#043F2E]/15 text-[#043F2E] text-sm font-bold hover:bg-white transition-colors disabled:opacity-50 cursor-pointer`}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================
// Summary Stat Card
// ============================
function SummaryStat({
  icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "primary" | "accent" | "muted";
  loading: boolean;
}) {
  const toneClasses = {
    primary: "bg-[#043F2E] text-white",
    accent: "bg-[#BEE663] text-[#043F2E]",
    muted: "bg-[#F7FBEA] text-[#043F2E]",
  };

  return (
    <div
      className={`${toneClasses[tone]} rounded-2xl px-4 py-4 md:px-5 md:py-5 shadow-sm border border-[#043F2E]/10 flex items-center gap-3 md:gap-4 transition-transform hover:scale-[1.01]`}
    >
      <div
        className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${
          tone === "primary"
            ? "bg-white/10"
            : tone === "accent"
              ? "bg-[#043F2E]/10"
              : "bg-[#043F2E]/5"
        }`}
      >
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className={`${tajawal.className} text-[11px] md:text-xs font-medium opacity-80 truncate`}
        >
          {label}
        </span>
        {loading ? (
          <div className="h-6 md:h-7 w-12 mt-1 rounded-md bg-current/20 animate-pulse" />
        ) : (
          <span className={`${lalezar.className} text-2xl md:text-[28px] leading-tight`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================
// Pending Activation list
// ============================
function PendingActivationSection({
  users,
  confirmingId,
  activatingId,
  onRequestActivate,
  onCancelActivate,
  onConfirmActivate,
}: {
  users: User[];
  confirmingId: number | null;
  activatingId: number | null;
  onRequestActivate: (userId: number) => void;
  onCancelActivate: () => void;
  onConfirmActivate: (userId: number) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-4">
          <UserCheck className="w-7 h-7 text-[#043F2E]/40" strokeWidth={1.8} />
        </div>
        <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>
          لا توجد حسابات قيد التفعيل
        </h3>
        <p className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium`}>
          كل الحسابات الجديدة تم تفعيلها
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm overflow-hidden flex flex-col">
      {users.map((user, index) => {
        const fullName = `${user.first_name} ${user.last_name}`.trim();
        const initials =
          `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.trim();
        const isConfirming = confirmingId === user.id;
        const isBusy = activatingId === user.id;

        return (
          <div
            key={user.id}
            className={`flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-[#F7FBEA]/60 transition-colors ${
              index !== users.length - 1 ? "border-b border-[#043F2E]/8" : ""
            }`}
          >
            <UserAvatar initials={initials} size="sm" />
            <Link
              href={`/profile/${encodeURIComponent(user.username)}`}
              className="flex-1 min-w-0 hover:underline"
            >
              <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>
                {fullName}
              </p>
              <p className={`${tajawal.className} text-xs text-[#043F2E]/50 truncate`}>
                @{user.username}
              </p>
            </Link>

            {isConfirming ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={onCancelActivate}
                  className={`${tajawal.className} px-3 h-9 rounded-xl bg-[#F7FBEA] hover:bg-[#EBF0EB] text-[#043F2E] text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer`}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onConfirmActivate(user.id)}
                  className={`${tajawal.className} px-3 h-9 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer`}
                >
                  {isBusy ? "جارٍ التفعيل..." : "تأكيد التفعيل"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onRequestActivate(user.id)}
                className={`${tajawal.className} shrink-0 px-3.5 h-9 rounded-xl bg-[#043F2E] hover:bg-[#065f46] text-white text-xs font-bold transition-colors cursor-pointer`}
              >
                تفعيل الحساب
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================
// Table Header (desktop)
// ============================
function TableHeader({ categories }: { categories: Category[] }) {
  return (
    <div className="bg-[#F7FBEA] border-b border-[#043F2E]/10 px-4 py-3 flex items-center gap-3">
      {/* Student avatar column header */}
      <div className="w-[44px] shrink-0" />

      {/* Name */}
      <div className="w-[150px] shrink-0">
        <HeaderLabel>الاسم</HeaderLabel>
      </div>

      {/* Supervisor */}
      <div className="w-[120px] shrink-0">
        <HeaderLabel>المشرف</HeaderLabel>
      </div>

      {/* Categories — the caller already sorts these (invite last) */}
      <div className="flex-1 flex items-start gap-1 min-w-0">
        {categories.map((cat) => (
          <div key={cat.id} className="flex-1 min-w-0 flex flex-col items-center gap-1 px-1">
            <span
              className={`${tajawal.className} text-center text-[11px] font-bold text-[#043F2E] leading-tight break-words`}
            >
              {cat.name}
            </span>
            <span
              className={`${tajawal.className} text-[10px] font-bold text-[#043F2E] bg-[#BEE663] rounded-full px-1.5 py-0.5 leading-none`}
            >
              +{toArabicDigits(cat.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="w-[90px] shrink-0">
        <HeaderLabel>مجموع الأسبوع</HeaderLabel>
      </div>
    </div>
  );
}

function HeaderLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E] block truncate`}>
      {children}
    </span>
  );
}

// ============================
// Unsaved changes bar (bottom-floating global save)
// ============================
function UnsavedChangesBar({
  count,
  isSaving,
  onSaveAll,
  onDiscardAll,
}: {
  count: number;
  isSaving: boolean;
  onSaveAll: () => void;
  onDiscardAll: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4" dir="rtl">
      <div className="flex items-center gap-4 bg-[#043F2E] text-white rounded-2xl shadow-lg px-5 py-3.5">
        <span className={`${tajawal.className} text-sm font-bold`}>
          لديك {toArabicDigits(count)} {count === 1 ? "تغيير غير محفوظ" : "تغييرات غير محفوظة"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onDiscardAll}
            className={`${tajawal.className} px-4 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveAll}
            className={`${tajawal.className} flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            <Check className="w-4 h-4" strokeWidth={2.5} />
            {isSaving ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

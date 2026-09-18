"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Lalezar, Tajawal } from "next/font/google";
import { Plus, Pencil, Trash2, Target, AlertCircle, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PageHero, PageHeroHeading } from "@/components/ui/PageHero";
import {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  type Goal,
  type GoalPayload,
} from "@/actions/goal";
import {
  formatArabicNumber,
  formatArabicDate,
  getTodayDateString,
  getGoalStatus,
  getGoalProgress,
} from "@/lib/utils";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

type StatusFilter = "all" | "current" | "upcoming" | "ended";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "current", label: "جارية" },
  { value: "upcoming", label: "قادمة" },
  { value: "ended", label: "منتهية" },
];

interface Props {
  isAdmin: boolean;
}

export default function GoalsPageClient({ isAdmin }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    // ordering defaults to -start_date (latest started first) inside the action.
    const res = await getAllGoals();
    if (res.success) {
      setGoals(res.data);
      setError(null);
    } else {
      setError(res.error || "حدث خطأ أثناء تحميل الأهداف");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const filteredGoals = useMemo(() => {
    const today = getTodayDateString();
    const query = search.trim().toLowerCase();

    return goals.filter((goal) => {
      if (statusFilter !== "all" && getGoalStatus(goal, today) !== statusFilter) return false;
      if (!query) return true;
      return (
        goal.title.toLowerCase().includes(query) ||
        (goal.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [goals, search, statusFilter]);

  const handleSaved = (savedGoal: Goal, isNew: boolean) => {
    setEditing(null);
    setGoals((prev) =>
      isNew ? [savedGoal, ...prev] : prev.map((g) => (g.id === savedGoal.id ? savedGoal : g)),
    );
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    const res = await deleteGoal(id);
    setDeletingId(null);
    setConfirmingDeleteId(null);
    if (res.success) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } else {
      alert(res.error || "حدث خطأ أثناء حذف الهدف");
    }
  };

  return (
    <div className="w-full bg-[#EBF0EB] min-h-screen">
      <PageHero>
        <PageHeroHeading
          icon={Target}
          eyebrow="هدف المجتمع"
          title="الأهداف"
          subtitle="تابعوا أهداف المجتمع الحالية والقادمة، ومدى تقدم الجميع نحو تحقيقها."
        />
      </PageHero>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col gap-4" dir="rtl">
        {isAdmin && editing === null && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditing("new")}
              className={`${tajawal.className} shrink-0 flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] text-sm font-bold transition-colors cursor-pointer`}
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />
              هدف جديد
            </button>
          </div>
        )}

        {isAdmin && editing === "new" && (
          <GoalForm onCancel={() => setEditing(null)} onSaved={handleSaved} />
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50"
              strokeWidth={2.2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن هدف..."
              className={`${tajawal.className} w-full h-11 pr-10 pl-3.5 bg-white border border-[#043F2E]/15 rounded-xl text-sm text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 transition-colors`}
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#043F2E]/15 rounded-xl p-1 w-fit">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`${tajawal.className} px-3 h-9 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === value
                    ? "bg-[#043F2E] text-white"
                    : "text-[#043F2E]/60 hover:bg-[#F7FBEA]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-3 text-sm text-[#9B3D2E]"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
            <span>{error}</span>
          </div>
        ) : filteredGoals.length === 0 && editing === null ? (
          <div className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-[#043F2E]/40" strokeWidth={1.8} />
            </div>
            <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>لا توجد أهداف</h3>
            <p className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium`}>
              {goals.length > 0
                ? "لا توجد أهداف مطابقة لبحثك أو الفلتر المحدد"
                : isAdmin
                  ? "أضف هدفاً جديداً ليظهر للطلاب في الصفحة الرئيسية"
                  : "لم تتم إضافة أي أهداف بعد"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredGoals.map((goal) =>
              isAdmin && editing === goal.id ? (
                <GoalForm
                  key={goal.id}
                  goal={goal}
                  onCancel={() => setEditing(null)}
                  onSaved={handleSaved}
                />
              ) : (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  isAdmin={isAdmin}
                  isConfirmingDelete={confirmingDeleteId === goal.id}
                  isDeleting={deletingId === goal.id}
                  onEdit={() => setEditing(goal.id)}
                  onRequestDelete={() => setConfirmingDeleteId(goal.id)}
                  onCancelDelete={() => setConfirmingDeleteId(null)}
                  onConfirmDelete={() => handleDelete(goal.id)}
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================
// Goal Row (display)
// ============================
function GoalRow({
  goal,
  isAdmin,
  isConfirmingDelete,
  isDeleting,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  goal: Goal;
  isAdmin: boolean;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const hasData = goal.target > 0;
  const progressValue = getGoalProgress(goal.current, goal.target);

  return (
    <div className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className={`${lalezar.className} text-xl text-[#043F2E] truncate`}>{goal.title}</h3>
          {goal.description && (
            <p className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium`}>
              {goal.description}
            </p>
          )}
        </div>

        {isAdmin &&
          (isConfirmingDelete ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isDeleting}
                onClick={onCancelDelete}
                className={`${tajawal.className} px-3 h-9 rounded-xl bg-[#F7FBEA] hover:bg-[#EBF0EB] text-[#043F2E] text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer`}
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirmDelete}
                className={`${tajawal.className} px-3 h-9 rounded-xl bg-[#9B3D2E] hover:bg-[#9B3D2E]/90 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer`}
              >
                {isDeleting ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onEdit}
                aria-label="تعديل الهدف"
                className="w-9 h-9 rounded-xl bg-[#F7FBEA] hover:bg-[#BEE663] text-[#043F2E] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={onRequestDelete}
                aria-label="حذف الهدف"
                className="w-9 h-9 rounded-xl bg-[#F7FBEA] hover:bg-[#F4E0D6] text-[#9B3D2E] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2.2} />
              </button>
            </div>
          ))}
      </div>

      {hasData && (
        <Progress value={progressValue} className="h-2.5 bg-[#DEFF90]" className2="bg-[#9ADD00]" />
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className={`${tajawal.className} text-xs font-bold text-[#043F2E]`}>
          {formatArabicNumber(goal.current)} / {formatArabicNumber(goal.target)}
        </span>
        <span className={`${tajawal.className} text-xs text-[#043F2E]/50 font-medium`}>
          البداية: {goal.start_date ? formatArabicDate(goal.start_date) : "غير محددة"}
        </span>
        <span className={`${tajawal.className} text-xs text-[#043F2E]/50 font-medium`}>
          النهاية: {goal.end_date ? formatArabicDate(goal.end_date) : "غير محددة"}
        </span>
      </div>
    </div>
  );
}

// ============================
// Goal Form (create / edit) — admin only
// ============================
const inputClass = `${tajawal.className} bg-white w-full h-11 rounded-xl border border-[#043F2E]/30 focus:border-[#043F2E] focus:outline-none px-3.5 text-sm text-[#043F2E]`;

// Only the fields the admin actually changed — a full-payload PATCH would clobber concurrent
// edits to fields this form didn't touch.
function diffPayload(goal: Goal, payload: GoalPayload): Partial<GoalPayload> {
  const diff: Partial<GoalPayload> = {};
  (Object.keys(payload) as (keyof GoalPayload)[]).forEach((key) => {
    if (payload[key] !== goal[key]) diff[key] = payload[key] as never;
  });
  return diff;
}

function GoalForm({
  goal,
  onCancel,
  onSaved,
}: {
  goal?: Goal;
  onCancel: () => void;
  onSaved: (savedGoal: Goal, isNew: boolean) => void;
}) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [target, setTarget] = useState(goal?.target ?? 0);
  const [current, setCurrent] = useState(goal?.current ?? 0);
  const [startDate, setStartDate] = useState(goal?.start_date ?? "");
  const [endDate, setEndDate] = useState(goal?.end_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Once an existing end date was already set, treat it as deliberate and never overwrite it.
  // Otherwise, the first time this edit makes current reach the target, default the end date to
  // today — the admin can still change it afterward, which stops any further auto-updates.
  const [endDateTouched, setEndDateTouched] = useState(
    !!goal?.end_date || (goal ? goal.target > 0 && goal.current >= goal.target : false),
  );

  const maybeAutoFillEndDate = (nextCurrent: number, nextTarget: number) => {
    if (!endDateTouched && nextTarget > 0 && nextCurrent >= nextTarget) {
      setEndDate(getTodayDateString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("العنوان مطلوب");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: GoalPayload = {
      title: title.trim(),
      description: description.trim() || null,
      target,
      current,
      start_date: startDate || null,
      end_date: endDate || null,
    };

    const res = goal
      ? await updateGoal(goal.id, diffPayload(goal, payload))
      : await createGoal(payload);

    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.error || "حدث خطأ أثناء الحفظ");
      return;
    }
    onSaved(res.data, !goal);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm p-5 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <label className={`${tajawal.className} text-sm font-bold text-[#043F2E]`}>العنوان</label>
        <input
          dir="auto"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={`${tajawal.className} text-sm font-bold text-[#043F2E]`}>الوصف</label>
        <textarea
          dir="auto"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={`${tajawal.className} bg-white w-full rounded-xl border border-[#043F2E]/30 focus:border-[#043F2E] focus:outline-none px-3.5 py-2.5 text-sm text-[#043F2E] resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={`${tajawal.className} text-sm font-bold text-[#043F2E]`}>الهدف</label>
          <input
            type="number"
            min={0}
            value={target}
            onChange={(e) => {
              const value = Number(e.target.value);
              setTarget(value);
              maybeAutoFillEndDate(current, value);
            }}
            className={inputClass}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={`${tajawal.className} text-sm font-bold text-[#043F2E]`}>
            المُنجَز حالياً
          </label>
          <input
            type="number"
            min={0}
            value={current}
            onChange={(e) => {
              const value = Number(e.target.value);
              setCurrent(value);
              maybeAutoFillEndDate(value, target);
            }}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={`${tajawal.className} text-sm font-bold text-[#043F2E]`}>
            تاريخ البداية
          </label>
          <input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={`${tajawal.className} text-sm font-bold text-[#043F2E]`}>
            تاريخ النهاية
          </label>
          <input
            type="date"
            value={endDate ?? ""}
            onChange={(e) => {
              setEndDateTouched(true);
              setEndDate(e.target.value);
            }}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-3 text-sm text-[#9B3D2E]"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className={`${tajawal.className} px-4 h-10 rounded-xl bg-[#F7FBEA] hover:bg-[#EBF0EB] text-[#043F2E] text-sm font-bold disabled:opacity-50 transition-colors cursor-pointer`}
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`${tajawal.className} px-4 h-10 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] text-sm font-bold disabled:opacity-50 transition-colors cursor-pointer`}
        >
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
      </div>
    </form>
  );
}

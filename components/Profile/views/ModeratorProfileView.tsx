"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { Lalezar, Tajawal } from "next/font/google";
import {
  Search,
  Users,
  TrendingUp,
  Award,
  User,
  BookOpen,
  Inbox,
  ExternalLink,
  BookMarked,
  X,
  Plus,
  Minus,
  Loader2,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { toArabicDigits } from "@/lib/utils";
import {
  addStudentActivity,
  updateStudentActivity,
  deleteStudentActivity,
  getStudentActivities,
} from "@/actions/profile";
import type { SupervisedStudent } from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  students: SupervisedStudent[];
  moderatorName: string;
}

// Category IDs
const CAT_TASMEE = 4;
const CAT_QURAN_READING = 3;

// Category labels
const CATEGORY_LABELS: Record<number, string> = {
  1: "حضور جلسة خاطرة",
  2: "تحضير خاطرة",
  3: "قراءة القرآن",
  4: "تسميع القرآن",
  5: "دعوة عضو جديد",
  6: "حضور اجتماع الفريق",
};

// Category values (points per unit)
const CATEGORY_VALUES: Record<number, number> = {
  1: 1,
  2: 2,
  3: 1,
  4: 2,
  5: 1,
  6: 1,
};

type ActivityItem = {
  id: number;
  category: number;
  date: string;
  multiplier: number;
};

export default function ModeratorProfileView({ students, moderatorName }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "name">("points");
  const [addActivityStudent, setAddActivityStudent] = useState<SupervisedStudent | null>(null);
  const [manageStudent, setManageStudent] = useState<SupervisedStudent | null>(null);

  const filtered = useMemo(() => {
    let result = [...students];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) => {
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
        return fullName.includes(q) || s.username.toLowerCase().includes(q);
      });
    }

    if (sortBy === "points") {
      result.sort((a, b) => b.points - a.points);
    } else {
      result.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.trim();
        const nameB = `${b.first_name} ${b.last_name}`.trim();
        return nameA.localeCompare(nameB, "ar");
      });
    }

    return result;
  }, [students, search, sortBy]);

  const stats = useMemo(() => {
    const total = students.length;
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
    const avg = total > 0 ? Math.round(totalPoints / total) : 0;
    const activeStudents = students.filter((s) => s.activities_count > 0).length;
    return { total, totalPoints, avg, activeStudents };
  }, [students]);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="الطلاب المشرف عليهم" value={toArabicDigits(stats.total)} icon={<Users className="w-5 h-5" strokeWidth={2.2} />} accent />
        <StatCard label="إجمالي نقاط الفريق" value={toArabicDigits(stats.totalPoints)} icon={<TrendingUp className="w-5 h-5" strokeWidth={2.2} />} />
        <StatCard label="متوسط النقاط" value={toArabicDigits(stats.avg)} icon={<Award className="w-5 h-5" strokeWidth={2.2} />} />
        <StatCard label="الطلاب النشطون" value={toArabicDigits(stats.activeStudents)} icon={<BookOpen className="w-5 h-5" strokeWidth={2.2} />} />
      </div>

      {/* Students list */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#043F2E]/8 flex items-center gap-2 flex-wrap">
          <Users className="w-4 h-4 text-[#043F2E]" strokeWidth={2.2} />
          <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>طلابي</h3>
          <span className={`${tajawal.className} text-xs text-[#043F2E]/50 mr-auto`}>
            تحت إشراف {moderatorName}
          </span>
        </div>

        {/* Search + Sort */}
        <div className="px-5 py-4 border-b border-[#043F2E]/8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50" strokeWidth={2.2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن طالب بالاسم..."
              className={`${tajawal.className} w-full h-11 pr-11 pl-4 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors text-sm font-medium`}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl p-1.5">
            <button
              onClick={() => setSortBy("points")}
              className={`${tajawal.className} h-8 px-3 rounded-xl text-xs font-bold transition-colors ${
                sortBy === "points" ? "bg-[#043F2E] text-white" : "text-[#043F2E]/60 hover:bg-[#BEE663]/30"
              }`}
            >
              الأعلى نقاطاً
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`${tajawal.className} h-8 px-3 rounded-xl text-xs font-bold transition-colors ${
                sortBy === "name" ? "bg-[#043F2E] text-white" : "text-[#043F2E]/60 hover:bg-[#BEE663]/30"
              }`}
            >
              الاسم
            </button>
          </div>
        </div>

        {/* Students */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-[#043F2E]/40" strokeWidth={1.8} />
            </div>
            <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>
              {search ? "لا توجد نتائج" : "لا يوجد طلاب"}
            </h3>
            <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>
              {search ? "جرب البحث بكلمة مختلفة" : "لم يتم إسناد أي طلاب لإشرافك بعد"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Desktop header */}
            <div className="hidden md:flex bg-[#F7FBEA] border-b border-[#043F2E]/10 px-5 py-3 gap-3">
              <div className="w-[44px] shrink-0" />
              <div className="w-[180px] shrink-0"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الطالب</span></div>
              <div className="w-[100px] shrink-0 text-center"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الأنشطة</span></div>
              <div className="w-[140px] shrink-0 text-center"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الحضور</span></div>
              <div className="flex-1 text-center"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>النقاط</span></div>
              <div className="w-[220px] shrink-0 text-center"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>إجراءات</span></div>
            </div>

            {filtered.map((student, idx) => {
              const fullName = `${student.first_name} ${student.last_name}`.trim();
              const initials = `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();
              const attendance = Math.min(Math.round((student.activities_count / 8) * 100), 100);
              const isLast = idx === filtered.length - 1;

              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-[#F7FBEA]/60 transition-colors ${!isLast ? "border-b border-[#043F2E]/8" : ""}`}
                >
                  {/* Avatar */}
                  <div className="w-[44px] h-[44px] shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
                    <span className={`${tajawal.className} text-sm font-bold`}>
                      {initials || <User className="w-4 h-4" strokeWidth={2.2} />}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="w-[180px] shrink-0 min-w-0">
                    <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>{fullName || student.username}</p>
                    <p className={`${tajawal.className} text-[10px] text-[#043F2E]/40`}>@{student.username}</p>
                  </div>

                  {/* Activities count */}
                  <div className="w-[100px] shrink-0 text-center">
                    <span className={`${tajawal.className} text-xs font-medium text-[#043F2E]/60`}>
                      {toArabicDigits(student.activities_count)} نشاط
                    </span>
                  </div>

                  {/* Attendance bar */}
                  <div className="w-[140px] shrink-0 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[#F7FBEA] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-l from-[#9ADD00] to-[#BEE663] rounded-full transition-all" style={{ width: `${attendance}%` }} />
                    </div>
                    <span className={`${tajawal.className} text-[10px] font-bold text-[#043F2E]/60 shrink-0`}>
                      {toArabicDigits(attendance)}٪
                    </span>
                  </div>

                  {/* Points */}
                  <div className="flex-1 flex justify-center">
                    <span className={`${tajawal.className} min-w-[48px] h-9 px-3 flex items-center justify-center rounded-xl font-bold text-sm ${student.points > 0 ? "bg-[#BEE663] text-[#043F2E]" : "bg-[#F7FBEA] text-[#043F2E]/40"}`}>
                      {toArabicDigits(student.points)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="w-[220px] shrink-0 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setAddActivityStudent(student)}
                      className={`${tajawal.className} inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#065f46] text-[#BEE663] text-xs font-bold hover:bg-[#043F2E] transition-colors`}
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
                      نشاط
                    </button>
                    <button
                      onClick={() => setManageStudent(student)}
                      className={`${tajawal.className} inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#F7FBEA] border border-[#043F2E]/15 text-[#043F2E] text-xs font-bold hover:bg-[#BEE663]/30 transition-colors`}
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.4} />
                      تعديل
                    </button>
                    <Link
                      href={`/profile/${student.id}`}
                      className={`${tajawal.className} inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#043F2E] text-white text-xs font-bold hover:bg-[#065f46] transition-colors`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.4} />
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3 p-4">
              {filtered.map((student) => {
                const fullName = `${student.first_name} ${student.last_name}`.trim();
                const initials = `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();
                const attendance = Math.min(Math.round((student.activities_count / 8) * 100), 100);

                return (
                  <div key={student.id} className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/10 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
                        <span className={`${tajawal.className} text-base font-bold`}>{initials || <User className="w-5 h-5" strokeWidth={2.2} />}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`${tajawal.className} text-base font-bold text-[#043F2E] truncate`}>{fullName || student.username}</p>
                        <p className={`${tajawal.className} text-[10px] text-[#043F2E]/40`}>@{student.username}</p>
                      </div>
                      <span className={`${tajawal.className} shrink-0 min-w-[48px] h-9 px-3 flex items-center justify-center rounded-xl font-bold text-sm ${student.points > 0 ? "bg-[#BEE663] text-[#043F2E]" : "bg-white text-[#043F2E]/40 border border-[#043F2E]/10"}`}>
                        {toArabicDigits(student.points)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`${tajawal.className} text-[11px] text-[#043F2E]/50 shrink-0`}>الحضور</span>
                      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-l from-[#9ADD00] to-[#BEE663] rounded-full" style={{ width: `${attendance}%` }} />
                      </div>
                      <span className={`${tajawal.className} text-[10px] font-bold text-[#043F2E]/60`}>{toArabicDigits(attendance)}٪</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAddActivityStudent(student)}
                        className={`${tajawal.className} flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#065f46] text-[#BEE663] text-xs font-bold hover:bg-[#043F2E] transition-colors`}
                      >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.4} />
                        نشاط
                      </button>
                      <button
                        onClick={() => setManageStudent(student)}
                        className={`${tajawal.className} flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-white border border-[#043F2E]/15 text-[#043F2E] text-xs font-bold hover:bg-[#BEE663]/30 transition-colors`}
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={2.4} />
                        تعديل
                      </button>
                      <Link
                        href={`/profile/${student.id}`}
                        className={`${tajawal.className} flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#043F2E] text-white text-xs font-bold hover:bg-[#065f46] transition-colors`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.4} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      {addActivityStudent && (
        <AddActivityModal student={addActivityStudent} onClose={() => setAddActivityStudent(null)} />
      )}

      {/* Manage Activities Modal */}
      {manageStudent && (
        <ManageActivitiesModal student={manageStudent} onClose={() => setManageStudent(null)} />
      )}
    </div>
  );
}

// ============================
// Add Activity Modal
// ============================
function AddActivityModal({ student, onClose }: { student: SupervisedStudent; onClose: () => void }) {
  const [categoryId, setCategoryId] = useState<number>(CAT_TASMEE);
  const [amount, setAmount] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const fullName = `${student.first_name} ${student.last_name}`.trim() || student.username;
  const initials = `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();
  const points = amount * (CATEGORY_VALUES[categoryId] ?? 1);

  const handleSubmit = () => {
    setResult(null);
    startTransition(async () => {
      const res = await addStudentActivity(student.id, categoryId, amount);
      if (res.success) {
        setResult({ success: true, message: `تم تسجيل ${CATEGORY_LABELS[categoryId]} (${toArabicDigits(amount)}×) لـ ${fullName}` });
        setTimeout(onClose, 1500);
      } else {
        setResult({ success: false, message: res.error || "فشل تسجيل النشاط" });
      }
    });
  };

  // Available categories for moderator
  const availableCategories = [
    { id: CAT_TASMEE, label: "تسميع القرآن", unitLabel: "صفحة", value: 2, icon: <BookMarked className="w-4 h-4" strokeWidth={2.2} /> },
    { id: CAT_QURAN_READING, label: "قراءة القرآن", unitLabel: "صفحة", value: 1, icon: <BookOpen className="w-4 h-4" strokeWidth={2.2} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#043F2E]/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="إضافة نشاط"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[380px] bg-white rounded-3xl border border-[#043F2E]/10 shadow-lg p-5 flex flex-col gap-5"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#065f46] flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#BEE663]" strokeWidth={2.4} />
            </div>
            <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>إضافة نشاط</h3>
          </div>
          <button onClick={onClose} disabled={isPending} className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[#043F2E]/60 hover:bg-[#F7FBEA] hover:text-[#043F2E] transition-colors disabled:opacity-50">
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Student info */}
        <div className="flex items-center gap-3 bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
            <span className={`${tajawal.className} text-xs font-bold`}>{initials || <User className="w-4 h-4" strokeWidth={2.2} />}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>{fullName}</span>
            <span className={`${tajawal.className} text-[10px] text-[#043F2E]/50`}>@{student.username}</span>
          </div>
        </div>

        {/* Category selector */}
        <div className="flex flex-col gap-2">
          <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>نوع النشاط</label>
          <div className="grid grid-cols-2 gap-2">
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategoryId(cat.id); setAmount(1); }}
                disabled={isPending}
                className={`${tajawal.className} flex flex-col items-center gap-1.5 h-auto py-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                  categoryId === cat.id
                    ? "border-[#043F2E] bg-[#043F2E] text-white"
                    : "border-[#043F2E]/15 bg-[#F7FBEA] text-[#043F2E]/70 hover:border-[#043F2E]/40"
                } disabled:opacity-50`}
              >
                {cat.icon}
                {cat.label}
                <span className={`text-[10px] font-medium ${categoryId === cat.id ? "text-[#BEE663]" : "text-[#043F2E]/40"}`}>
                  {toArabicDigits(cat.value)} نقطة/صفحة
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount counter */}
        <div className="flex flex-col gap-2">
          <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>
            عدد الصفحات
          </label>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setAmount((p) => Math.max(1, p - 1))} disabled={isPending || amount <= 1} className="w-11 h-11 rounded-xl bg-[#F7FBEA] border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E] hover:bg-[#BEE663] transition-colors disabled:opacity-30">
              <Minus className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <div className="w-20 h-11 rounded-xl bg-[#043F2E] flex items-center justify-center">
              <span className={`${lalezar.className} text-2xl text-[#BEE663]}`}>{toArabicDigits(amount)}</span>
            </div>
            <button onClick={() => setAmount((p) => Math.min(60, p + 1))} disabled={isPending || amount >= 60} className="w-11 h-11 rounded-xl bg-[#F7FBEA] border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E] hover:bg-[#BEE663] transition-colors disabled:opacity-30">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 justify-center mt-1">
            {[1, 2, 3, 5, 10].map((n) => (
              <button key={n} onClick={() => setAmount(n)} disabled={isPending} className={`${tajawal.className} h-7 px-2.5 rounded-lg text-[11px] font-bold transition-colors ${amount === n ? "bg-[#043F2E] text-white" : "bg-[#F7FBEA] text-[#043F2E]/60 hover:bg-[#BEE663]/40"} disabled:opacity-50`}>
                {toArabicDigits(n)}
              </button>
            ))}
          </div>
          {/* Points preview */}
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className={`${tajawal.className} text-[11px] text-[#043F2E]/50`}>إجمالي النقاط:</span>
            <span className={`${tajawal.className} text-sm font-bold text-[#043F2E] bg-[#BEE663] rounded-full px-2 py-0.5`}>
              +{toArabicDigits(points)}
            </span>
          </div>
        </div>

        {/* Result message */}
        {result && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${result.success ? "bg-[#BEE663]/30 text-[#043F2E]" : "bg-red-50 text-red-600"}`}>
            {result.success ? <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} /> : <X className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
            <span className={`${tajawal.className} text-xs`}>{result.message}</span>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={isPending} className={`${tajawal.className} h-12 rounded-xl bg-[#043F2E] text-white text-sm font-bold hover:bg-[#065f46] transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}>
          {isPending ? (<><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />جارٍ التسجيل...</>) : (<><Plus className="w-4 h-4" strokeWidth={2.4} />تسجيل النشاط</>)}
        </button>
      </div>
    </div>
  );
}

// ============================
// Manage Activities Modal (edit/delete)
// ============================
function ManageActivitiesModal({ student, onClose }: { student: SupervisedStudent; onClose: () => void }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fullName = `${student.first_name} ${student.last_name}`.trim() || student.username;
  const initials = `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();

  // Load activities on mount
  useEffect(() => {
    getStudentActivities(student.id).then((res) => {
      setLoading(false);
      if (res.success && res.data) {
        setActivities(res.data);
      } else {
        setError(res.error || "فشل تحميل الأنشطة");
      }
    });
  }, [student.id]);

  const handleUpdate = (activityId: number) => {
    startTransition(async () => {
      const res = await updateStudentActivity(student.id, activityId, editValue);
      if (res.success) {
        setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, multiplier: editValue } : a)));
        setEditId(null);
      } else {
        setError(res.error || "فشل تحديث النشاط");
      }
    });
  };

  const handleDelete = (activityId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا النشاط؟")) return;
    startTransition(async () => {
      const res = await deleteStudentActivity(student.id, activityId);
      if (res.success) {
        setActivities((prev) => prev.filter((a) => a.id !== activityId));
      } else {
        setError(res.error || "فشل حذف النشاط");
      }
    });
  };

  function formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      return `${toArabicDigits(d.getDate())} ${months[d.getMonth()]}`;
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#043F2E]/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="إدارة الأنشطة"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] max-h-[85vh] overflow-y-auto bg-white rounded-3xl border border-[#043F2E]/10 shadow-lg p-5 flex flex-col gap-4"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#043F2E] flex items-center justify-center">
              <Pencil className="w-4 h-4 text-[#BEE663]" strokeWidth={2.4} />
            </div>
            <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>إدارة الأنشطة</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[#043F2E]/60 hover:bg-[#F7FBEA] hover:text-[#043F2E] transition-colors">
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* Student info */}
        <div className="flex items-center gap-3 bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
            <span className={`${tajawal.className} text-xs font-bold`}>{initials || <User className="w-4 h-4" strokeWidth={2.2} />}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>{fullName}</span>
            <span className={`${tajawal.className} text-[10px] text-[#043F2E]/50`}>@{student.username}</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5">
            <X className="w-4 h-4 text-red-600 shrink-0" strokeWidth={2.5} />
            <span className={`${tajawal.className} text-xs text-red-600`}>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#043F2E]/40 animate-spin" strokeWidth={2.5} />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-[#043F2E]/40" strokeWidth={1.8} />
            </div>
            <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>لا توجد أنشطة مسجلة</p>
          </div>
        ) : (
          /* Activities list */
          <div className="flex flex-col gap-2">
            {activities.map((act) => {
              const catName = CATEGORY_LABELS[act.category] || `تصنيف ${toArabicDigits(act.category)}`;
              const catValue = CATEGORY_VALUES[act.category] ?? 1;
              const totalPoints = act.multiplier * catValue;
              const isEditing = editId === act.id;

              return (
                <div
                  key={act.id}
                  className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3 flex items-center gap-3"
                >
                  {/* Category info */}
                  <div className="flex-1 min-w-0">
                    <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>{catName}</p>
                    <p className={`${tajawal.className} text-[10px] text-[#043F2E]/50`}>
                      {formatDate(act.date)} • {toArabicDigits(act.multiplier)}× • +{toArabicDigits(totalPoints)} نقطة
                    </p>
                  </div>

                  {/* Edit mode */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setEditValue((v) => Math.max(1, v - 1))} disabled={isPending} className="w-8 h-8 rounded-lg bg-white border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E] hover:bg-[#BEE663] transition-colors disabled:opacity-30">
                        <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                      <span className={`${lalezar.className} text-lg text-[#043F2E] w-8 text-center`}>{toArabicDigits(editValue)}</span>
                      <button onClick={() => setEditValue((v) => Math.min(60, v + 1))} disabled={isPending} className="w-8 h-8 rounded-lg bg-white border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E] hover:bg-[#BEE663] transition-colors disabled:opacity-30">
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                      <button onClick={() => handleUpdate(act.id)} disabled={isPending} className="w-8 h-8 rounded-lg bg-[#043F2E] flex items-center justify-center text-white hover:bg-[#065f46] transition-colors disabled:opacity-50">
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} /> : <Check className="w-3.5 h-3.5" strokeWidth={2.5} />}
                      </button>
                      <button onClick={() => setEditId(null)} disabled={isPending} className="w-8 h-8 rounded-lg bg-white border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E]/60 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {/* Points badge */}
                      <span className={`${tajawal.className} text-xs font-bold text-[#043F2E] bg-[#BEE663] rounded-full px-2 py-0.5 shrink-0`}>
                        +{toArabicDigits(totalPoints)}
                      </span>
                      {/* Edit button */}
                      <button
                        onClick={() => { setEditId(act.id); setEditValue(act.multiplier); }}
                        disabled={isPending}
                        className="w-8 h-8 rounded-lg bg-white border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E]/60 hover:bg-[#BEE663]/30 hover:text-[#043F2E] transition-colors disabled:opacity-50"
                        title="تعديل"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={2.2} />
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(act.id)}
                        disabled={isPending}
                        className="w-8 h-8 rounded-lg bg-white border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E]/60 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================
// Stat Card
// ============================
function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-4 border flex items-center gap-3 ${accent ? "bg-[#043F2E] text-[#BEE663] border-[#043F2E]/15" : "bg-white text-[#043F2E] border-[#043F2E]/10 shadow-sm"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-white/10" : "bg-[#F7FBEA]"}`}>{icon}</div>
      <div className="flex flex-col min-w-0">
        <span className={`${tajawal.className} text-[11px] font-medium opacity-70`}>{label}</span>
        <span className={`${lalezar.className} text-2xl leading-tight`}>{value}</span>
      </div>
    </div>
  );
}

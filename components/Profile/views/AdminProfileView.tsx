"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lalezar, Tajawal } from "next/font/google";
import {
  Search,
  Users,
  Crown,
  Shield,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Award,
  Pencil,
  X,
  Mail,
  User as UserIcon,
  Loader2,
  Check,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { toArabicDigits } from "@/lib/utils";
import { updateUser } from "@/actions/profile";
import type { AdminUserSummary } from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface GlobalStats {
  totalUsers: number;
  totalStudents: number;
  totalSupervisors: number;
  totalAdmins: number;
  totalPoints: number;
  avgPoints: number;
  avgAttendance: number;
}

interface TopSupervisor {
  id: number;
  username: string;
  fullName: string;
  studentCount: number;
  totalPoints: number;
  avgPoints: number;
}

interface Props {
  users: AdminUserSummary[];
  supervisorMap: Record<string, { id: number; fullName: string }>;
  globalStats: GlobalStats | null;
  topSupervisors: TopSupervisor[];
}

const roleIcon: Record<string, React.ReactNode> = {
  Admin: <Crown className="w-3.5 h-3.5" strokeWidth={2.4} />,
  Supervisor: <Shield className="w-3.5 h-3.5" strokeWidth={2.4} />,
  Student: <BookOpen className="w-3.5 h-3.5" strokeWidth={2.4} />,
};

const roleBadgeClass: Record<string, string> = {
  Admin: "bg-[#043F2E] text-[#BEE663]",
  Supervisor: "bg-[#065f46] text-[#DEFF90]",
  Student: "bg-[#F7FBEA] text-[#043F2E]",
};

const PAGE_SIZE = 10;

export default function AdminProfileView({
  users,
  supervisorMap,
  globalStats,
  topSupervisors,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [editUser, setEditUser] = useState<AdminUserSummary | null>(null);

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== "all") {
      result = result.filter((u) => u.groups.includes(roleFilter));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((u) => {
        const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
        return fullName.includes(q) || u.username.toLowerCase().includes(q);
      });
    }
    return result;
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* ============================ */}
      {/* Global Stats */}
      {/* ============================ */}
      {globalStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="إجمالي المستخدمين"
            value={toArabicDigits(globalStats.totalUsers)}
            subtext={`${toArabicDigits(globalStats.totalStudents)} طالب · ${toArabicDigits(globalStats.totalSupervisors)} مشرف`}
            icon={<Users className="w-5 h-5" strokeWidth={2.2} />}
            accent
          />
          <StatCard
            label="إجمالي النقاط"
            value={toArabicDigits(globalStats.totalPoints)}
            subtext="نقطة في المنصة"
            icon={<TrendingUp className="w-5 h-5" strokeWidth={2.2} />}
          />
          <StatCard
            label="متوسط النقاط"
            value={toArabicDigits(globalStats.avgPoints)}
            subtext="لكل طالب"
            icon={<Award className="w-5 h-5" strokeWidth={2.2} />}
          />
          <StatCard
            label="متوسط الحضور"
            value={`${toArabicDigits(globalStats.avgAttendance)}٪`}
            subtext="نسبة عامة"
            icon={<BookOpen className="w-5 h-5" strokeWidth={2.2} />}
          />
        </div>
      )}

      {/* ============================ */}
      {/* Top Supervisors */}
      {/* ============================ */}
      {topSupervisors.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#043F2E]/8 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#043F2E]" strokeWidth={2.2} />
            <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>أفضل المشرفين</h3>
            <span className={`${tajawal.className} text-xs text-[#043F2E]/50 mr-auto`}>
              ترتيب بمتوسط نقاط الطلاب
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {topSupervisors.map((sup, idx) => {
              const initials = sup.fullName.charAt(0) || sup.username.charAt(0);
              return (
                <Link
                  key={sup.id}
                  href={`/profile/${sup.id}`}
                  className="flex items-center gap-3 bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3 hover:border-[#043F2E]/30 hover:bg-white transition-colors group"
                >
                  {/* Rank badge */}
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? "bg-[#BEE663] text-[#043F2E]" : "bg-[#043F2E]/10 text-[#043F2E]/60"
                  }`}>
                    {toArabicDigits(idx + 1)}
                  </div>
                  {/* Avatar */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
                    <span className={`${tajawal.className} text-sm font-bold`}>{initials}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate group-hover:underline`}>
                      {sup.fullName}
                    </p>
                    <p className={`${tajawal.className} text-[10px] text-[#043F2E]/50`}>
                      {toArabicDigits(sup.studentCount)} طلاب · {toArabicDigits(sup.totalPoints)} نقطة
                    </p>
                  </div>
                  {/* Avg points badge */}
                  <span className={`${tajawal.className} shrink-0 h-9 px-3 flex items-center justify-center rounded-xl font-bold text-sm bg-[#BEE663] text-[#043F2E]`}>
                    {toArabicDigits(sup.avgPoints)}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#043F2E]/40 shrink-0" strokeWidth={2.2} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================ */}
      {/* Users Table */}
      {/* ============================ */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 flex flex-col gap-4">
        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50" strokeWidth={2.2} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="ابحث بالاسم أو اسم المستخدم..."
              className={`${tajawal.className} w-full h-12 pr-11 pl-4 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors text-sm font-medium`}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl p-1.5">
            {["all", "Admin", "Supervisor", "Student"].map((role) => (
              <button
                key={role}
                onClick={() => { setRoleFilter(role); setPage(0); }}
                className={`${tajawal.className} h-9 px-3 rounded-xl text-xs font-bold transition-colors ${
                  roleFilter === role ? "bg-[#043F2E] text-white" : "text-[#043F2E]/60 hover:bg-[#BEE663]/30"
                }`}
              >
                {role === "all" ? "الكل" : role === "Admin" ? "مدير" : role === "Supervisor" ? "مشرف" : "طالب"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[#043F2E]/8">
          {/* Header */}
          <div className="hidden md:flex bg-[#F7FBEA] border-b border-[#043F2E]/10 px-4 py-3 gap-3">
            <div className="w-[44px] shrink-0" />
            <div className="w-[140px] shrink-0"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الاسم</span></div>
            <div className="w-[100px] shrink-0"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الدور</span></div>
            <div className="w-[120px] shrink-0"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>المشرف</span></div>
            <div className="flex-1"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الإيميل</span></div>
            <div className="w-[80px] shrink-0 text-center"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>النقاط</span></div>
            <div className="w-[60px] shrink-0 text-center"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>تعديل</span></div>
          </div>

          {/* Rows */}
          {pageData.length === 0 ? (
            <div className="py-12 text-center">
              <p className={`${tajawal.className} text-sm text-[#043F2E]/50`}>لا توجد نتائج</p>
            </div>
          ) : (
            pageData.map((user, idx) => {
              const primaryRole = user.groups.includes("Admin") ? "Admin" : user.groups.includes("Supervisor") ? "Supervisor" : "Student";
              const fullName = `${user.first_name} ${user.last_name}`.trim();
              const initials = `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.trim();
              const isLast = idx === pageData.length - 1;
              const supInfo = user.supervisor ? supervisorMap[user.supervisor] : null;

              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F7FBEA]/60 transition-colors ${!isLast ? "border-b border-[#043F2E]/8" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    onClick={() => router.push(`/profile/${user.id}`)}
                    className="w-[44px] h-[44px] shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm cursor-pointer"
                  >
                    <span className={`${tajawal.className} text-sm font-bold`}>{initials || "؟"}</span>
                  </div>

                  {/* Name */}
                  <div className="w-[140px] shrink-0 min-w-0 cursor-pointer" onClick={() => router.push(`/profile/${user.id}`)}>
                    <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>{fullName || user.username}</p>
                    <p className={`${tajawal.className} text-[10px] text-[#043F2E]/40`}>@{user.username}</p>
                  </div>

                  {/* Role badge */}
                  <div className="w-[100px] shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${roleBadgeClass[primaryRole]}`}>
                      {roleIcon[primaryRole]}
                      {primaryRole === "Admin" ? "مدير" : primaryRole === "Supervisor" ? "مشرف" : "طالب"}
                    </span>
                  </div>

                  {/* Supervisor */}
                  <div className="w-[120px] shrink-0 min-w-0">
                    {supInfo ? (
                      <Link
                        href={`/profile/${supInfo.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`${tajawal.className} text-xs font-bold text-[#043F2E] hover:underline truncate inline-flex items-center gap-1`}
                      >
                        {supInfo.fullName}
                        <ExternalLink className="w-3 h-3 opacity-50" strokeWidth={2.2} />
                      </Link>
                    ) : (
                      <span className={`${tajawal.className} text-xs text-[#043F2E]/40 truncate`}>—</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex-1 min-w-0 hidden md:block">
                    <p className={`${tajawal.className} text-xs text-[#043F2E]/60 truncate`}>{user.email}</p>
                  </div>

                  {/* Points */}
                  <div className="w-[80px] shrink-0 flex justify-center">
                    <span className={`${tajawal.className} min-w-[40px] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-bold ${user.points > 0 ? "bg-[#BEE663] text-[#043F2E]" : "bg-[#F7FBEA] text-[#043F2E]/40"}`}>
                      {toArabicDigits(user.points)}
                    </span>
                  </div>

                  {/* Edit button */}
                  <div className="w-[60px] shrink-0 flex justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditUser(user); }}
                      className="w-8 h-8 rounded-lg bg-[#F7FBEA] border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E]/60 hover:bg-[#BEE663]/30 hover:text-[#043F2E] transition-colors"
                      title="تعديل البيانات"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className={`${tajawal.className} text-xs text-[#043F2E]/50`}>
              صفحة {toArabicDigits(page + 1)} من {toArabicDigits(totalPages)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-9 h-9 rounded-xl bg-white border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E] disabled:opacity-30 hover:bg-[#BEE663] transition-colors"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-9 h-9 rounded-xl bg-white border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E] disabled:opacity-30 hover:bg-[#BEE663] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.4} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          supervisorMap={supervisorMap}
          onClose={() => setEditUser(null)}
        />
      )}
    </div>
  );
}

// ============================
// Edit User Modal
// ============================
function EditUserModal({
  user,
  supervisorMap,
  onClose,
}: {
  user: AdminUserSummary;
  supervisorMap: Record<string, { id: number; fullName: string }>;
  onClose: () => void;
}) {
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [email, setEmail] = useState(user.email || "");
  const [supervisor, setSupervisor] = useState(user.supervisor || "");
  const [referrer, setReferrer] = useState(user.referrer || "");
  const [role, setRole] = useState(user.groups.includes("Admin") ? "Admin" : user.groups.includes("Supervisor") ? "Supervisor" : "Student");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.username;
  const initials = `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.trim();
  // Admin can edit referrer/supervisor per CanModifyUser permission
  const canEditRelations = true;

  const handleSubmit = () => {
    setResult(null);
    const data: Record<string, string | null> = {};
    if (firstName !== user.first_name) data.first_name = firstName;
    if (lastName !== user.last_name) data.last_name = lastName;
    if (email !== user.email) data.email = email;
    if (canEditRelations) {
      if (supervisor !== (user.supervisor || "")) data.supervisor = supervisor || null;
      if (referrer !== (user.referrer || "")) data.referrer = referrer || null;
      // Check if role changed
      const originalRole = user.groups.includes("Admin") ? "Admin" : user.groups.includes("Supervisor") ? "Supervisor" : "Student";
      if (role !== originalRole) {
        data.groups = [role];
      }
    }

    if (Object.keys(data).length === 0) {
      setResult({ success: false, message: "لم تقم بأي تغييرات" });
      return;
    }

    startTransition(async () => {
      const res = await updateUser(user.id, data);
      if (res.success) {
        setResult({ success: true, message: "تم تحديث البيانات بنجاح" });
        setTimeout(onClose, 1500);
      } else {
        setResult({ success: false, message: res.error || "فشل تحديث البيانات" });
      }
    });
  };

  const inputClass = `${tajawal.className} w-full h-11 px-4 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors text-sm font-medium`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#043F2E]/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="تعديل بيانات المستخدم"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] max-h-[85vh] overflow-y-auto bg-white rounded-3xl border border-[#043F2E]/10 shadow-lg p-5 flex flex-col gap-4"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#043F2E] flex items-center justify-center">
              <Pencil className="w-4 h-4 text-[#BEE663]" strokeWidth={2.4} />
            </div>
            <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>تعديل البيانات</h3>
          </div>
          <button onClick={onClose} disabled={isPending} className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[#043F2E]/60 hover:bg-[#F7FBEA] hover:text-[#043F2E] transition-colors disabled:opacity-50">
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
            <span className={`${tajawal.className} text-xs font-bold`}>{initials || <UserIcon className="w-4 h-4" strokeWidth={2.2} />}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>{fullName}</span>
            <span className={`${tajawal.className} text-[10px] text-[#043F2E]/50`}>@{user.username}</span>
          </div>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-3">
          {/* First name */}
          <div className="flex flex-col gap-1.5">
            <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>الاسم الأول</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isPending} className={inputClass} placeholder="الاسم الأول" />
          </div>

          {/* Last name */}
          <div className="flex flex-col gap-1.5">
            <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>الاسم الأخير</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isPending} className={inputClass} placeholder="الاسم الأخير" />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/40" strokeWidth={2.2} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending} type="email" className={`${inputClass} pr-11`} placeholder="email@example.com" />
            </div>
          </div>

          {/* Supervisor (Admin only) */}
          {canEditRelations && (
            <div className="flex flex-col gap-1.5">
              <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>المشرف</label>
              <select value={supervisor} onChange={(e) => setSupervisor(e.target.value)} disabled={isPending} className={`${inputClass} cursor-pointer`}>
                <option value="">— بدون مشرف —</option>
                {Object.entries(supervisorMap).map(([username, info]) => (
                  <option key={username} value={username}>{info.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Referrer (Admin only) */}
          {canEditRelations && (
            <div className="flex flex-col gap-1.5">
              <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>المُحيل</label>
              <select value={referrer} onChange={(e) => setReferrer(e.target.value)} disabled={isPending} className={`${inputClass} cursor-pointer`}>
                <option value="">— بدون —</option>
                {Object.entries(supervisorMap).map(([username, info]) => (
                  <option key={username} value={username}>{info.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Role (Admin only — promote/demote) */}
          {canEditRelations && (
            <div className="flex flex-col gap-1.5">
              <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>الدور</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} disabled={isPending} className={`${inputClass} cursor-pointer`}>
                <option value="Student">طالب</option>
                <option value="Supervisor">مشرف</option>
                <option value="Admin">مدير</option>
              </select>
              <span className={`${tajawal.className} text-[10px] text-[#043F2E]/40`}>⚠️ تغيير الدور بيأثر على الصلاحيات</span>
            </div>
          )}
        </div>

        {/* Result message */}
        {result && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${result.success ? "bg-[#BEE663]/30 text-[#043F2E]" : "bg-red-50 text-red-600"}`}>
            {result.success ? <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} /> : <X className="w-4 h-4 shrink-0" strokeWidth={2.5} />}
            <span className={`${tajawal.className} text-xs`}>{result.message}</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className={`${tajawal.className} h-12 rounded-xl bg-[#043F2E] text-white text-sm font-bold hover:bg-[#065f46] transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />جارٍ الحفظ...</>
          ) : (
            <><UserCheck className="w-4 h-4" strokeWidth={2.4} />حفظ التغييرات</>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================
// Stat Card
// ============================
function StatCard({
  label,
  value,
  subtext,
  icon,
  accent,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl px-4 py-4 border flex items-center gap-3 ${accent ? "bg-[#043F2E] text-[#BEE663] border-[#043F2E]/15" : "bg-white text-[#043F2E] border-[#043F2E]/10 shadow-sm"}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-white/10" : "bg-[#F7FBEA]"}`}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`${tajawal.className} text-[11px] font-medium opacity-70`}>{label}</span>
        <span className={`${lalezar.className} text-2xl leading-tight`}>{value}</span>
        {subtext && <span className={`${tajawal.className} text-[10px] opacity-60 mt-0.5`}>{subtext}</span>}
      </div>
    </div>
  );
}

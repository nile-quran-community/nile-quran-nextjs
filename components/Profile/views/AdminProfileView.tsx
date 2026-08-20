"use client";

import { useState, useMemo } from "react";
import { Lalezar, Tajawal } from "next/font/google";
import {
  Search,
  Users,
  Crown,
  Shield,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toArabicDigits } from "@/lib/utils";
import type { AdminUserSummary } from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  users: AdminUserSummary[];
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

export default function AdminProfileView({ users }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

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

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.groups.includes("Admin")).length;
    const moderators = users.filter((u) => u.groups.includes("Supervisor")).length;
    const students = users.filter((u) => u.groups.includes("Student")).length;
    return { total: users.length, admins, moderators, students };
  }, [users]);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="إجمالي المستخدمين" value={toArabicDigits(stats.total)} icon={<Users className="w-4 h-4" strokeWidth={2.2} />} />
        <StatCard label="الإدمن" value={toArabicDigits(stats.admins)} icon={<Crown className="w-4 h-4" strokeWidth={2.2} />} accent />
        <StatCard label="المشرفون" value={toArabicDigits(stats.moderators)} icon={<Shield className="w-4 h-4" strokeWidth={2.2} />} />
        <StatCard label="الطلاب" value={toArabicDigits(stats.students)} icon={<BookOpen className="w-4 h-4" strokeWidth={2.2} />} />
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 flex flex-col gap-4">
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
                  roleFilter === role
                    ? "bg-[#043F2E] text-white"
                    : "text-[#043F2E]/60 hover:bg-[#BEE663]/30"
                }`}
              >
                {role === "all" ? "الكل" : role === "Admin" ? "إدمن" : role === "Supervisor" ? "مشرف" : "طالب"}
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

              return (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className={`flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F7FBEA]/60 transition-colors ${!isLast ? "border-b border-[#043F2E]/8" : ""} cursor-pointer`}
                >
                  <div className="w-[44px] h-[44px] shrink-0 rounded-xl bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
                    <span className={`${tajawal.className} text-sm font-bold`}>{initials || "؟"}</span>
                  </div>
                  <div className="w-[140px] shrink-0 min-w-0">
                    <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>{fullName || user.username}</p>
                    <p className={`${tajawal.className} text-[10px] text-[#043F2E]/40`}>@{user.username}</p>
                  </div>
                  <div className="w-[100px] shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${roleBadgeClass[primaryRole]}`}>
                      {roleIcon[primaryRole]}
                      {primaryRole === "Admin" ? "إدمن" : primaryRole === "Supervisor" ? "مشرف" : "طالب"}
                    </span>
                  </div>
                  <div className="w-[120px] shrink-0 min-w-0">
                    <p className={`${tajawal.className} text-xs text-[#043F2E]/60 truncate`}>{user.supervisor || "—"}</p>
                  </div>
                  <div className="flex-1 min-w-0 hidden md:block">
                    <p className={`${tajawal.className} text-xs text-[#043F2E]/60 truncate`}>{user.email}</p>
                  </div>
                  <div className="w-[80px] shrink-0 flex justify-center">
                    <span className={`${tajawal.className} min-w-[40px] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-bold ${user.points > 0 ? "bg-[#BEE663] text-[#043F2E]" : "bg-[#F7FBEA] text-[#043F2E]/40"}`}>
                      {toArabicDigits(user.points)}
                    </span>
                  </div>
                </Link>
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
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-4 border flex items-center gap-3 ${accent ? "bg-[#BEE663] border-[#043F2E]/15 text-[#043F2E]" : "bg-[#F7FBEA] border-[#043F2E]/8 text-[#043F2E]"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-[#043F2E]/10" : "bg-[#043F2E]/5"}`}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`${tajawal.className} text-[11px] font-medium opacity-80`}>{label}</span>
        <span className={`${lalezar.className} text-xl leading-tight`}>{value}</span>
      </div>
    </div>
  );
}

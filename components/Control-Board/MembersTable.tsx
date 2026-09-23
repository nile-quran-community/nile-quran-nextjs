"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Tajawal } from "next/font/google";
import { Search, CheckCircle2, CircleDashed } from "lucide-react";
import { ACADEMIC_YEAR_OPTIONS, FACULTY_OPTIONS } from "@/lib/profile-fields";
import type { Member } from "@/actions/ControlBoard";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? "—";
}

// Age in full years as of today. Birthdays that haven't happened yet this year
// don't count, so a straight year subtraction alone would be off by one.
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthdayThisYear) age--;
  return age;
}

export default function MembersTable({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [incompleteOnly, setIncompleteOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (incompleteOnly && m.is_profile_complete) return false;
      if (!q) return true;
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
      return fullName.includes(q) || m.username.toLowerCase().includes(q);
    });
  }, [members, query, incompleteOnly]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-4 md:p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50"
            strokeWidth={2.2}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو اسم المستخدم"
            className={`${tajawal.className} w-full h-12 pr-11 pl-4 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors text-sm font-medium`}
          />
        </div>
        <label
          className={`${tajawal.className} flex items-center gap-2 text-sm font-medium text-[#043F2E]/80`}
        >
          <input
            type="checkbox"
            checked={incompleteOnly}
            onChange={(e) => setIncompleteOnly(e.target.checked)}
            className="accent-[#043F2E]"
          />
          الملفات غير المكتملة فقط
        </label>
      </div>

      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr className={`${tajawal.className} text-xs font-bold text-[#043F2E]/50 border-b border-[#043F2E]/8`}>
              <th className="text-start px-4 py-3">الاسم</th>
              <th className="text-start px-4 py-3">تاريخ الميلاد</th>
              <th className="text-start px-4 py-3">الكلية</th>
              <th className="text-start px-4 py-3">السنة الدراسية</th>
              <th className="text-start px-4 py-3">رقم الهاتف</th>
              <th className="text-start px-4 py-3">الملف الشخصي</th>
            </tr>
          </thead>
          <tbody className={tajawal.className}>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-[#043F2E]/6 last:border-0 hover:bg-[#F7FBEA]/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/profile/${encodeURIComponent(m.username)}#personal-info`}
                    className="font-bold text-[#043F2E] hover:underline"
                  >
                    {`${m.first_name} ${m.last_name}`.trim() || m.username}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#043F2E]/70">
                  {m.birth_date ? `${m.birth_date} (${calculateAge(m.birth_date)} سنة)` : "—"}
                </td>
                <td className="px-4 py-3 text-[#043F2E]/70">
                  {m.faculty === "other" ? m.faculty_other || "—" : labelFor(FACULTY_OPTIONS, m.faculty)}
                </td>
                <td className="px-4 py-3 text-[#043F2E]/70">
                  {labelFor(ACADEMIC_YEAR_OPTIONS, m.academic_year)}
                </td>
                <td dir="ltr" className="px-4 py-3 text-[#043F2E]/70 text-end">
                  {m.phone_number || "—"}
                </td>
                <td className="px-4 py-3">
                  {m.is_profile_complete ? (
                    <span className="inline-flex items-center gap-1.5 text-[#043F2E] font-bold">
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
                      مكتمل
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[#9B3D2E] font-bold">
                      <CircleDashed className="w-4 h-4" strokeWidth={2.2} />
                      غير مكتمل
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#043F2E]/50">
                  لا يوجد أعضاء مطابقون
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

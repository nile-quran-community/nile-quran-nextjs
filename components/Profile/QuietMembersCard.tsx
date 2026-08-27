import { Lalezar, Tajawal } from "next/font/google";
import { BellRing, Check, PhoneCall } from "lucide-react";
import Link from "next/link";
import SectionHeading from "./SectionHeading";
import { toArabicDigits } from "@/lib/utils";
import {
  INACTIVITY_ALERT_WEEKS,
  INACTIVITY_NOTICE_WEEKS,
} from "@/lib/profile-types";
import type { QuietMember } from "@/actions/profile";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

/**
 * Members who have gone quiet, for an administrator on their own page.
 *
 * Two thresholds, because they call for two different things. Eight weeks of
 * silence usually means someone has drifted out of the maqra'a, and the person
 * who can reach them is an administrator — so that group is named and asked for.
 * Four weeks is only a word in the ear: it is still an ordinary quiet spell, and
 * saying "act" about it would spend the alarm before it is needed.
 *
 * A supervisor is not shown this. Their part is recitation and reading, and it
 * already reaches them as a mark beside the student's name.
 */
export default function QuietMembersCard({ members }: { members: QuietMember[] }) {
  const lapsed = members.filter(
    (m) => m.weeksSilent !== null && m.weeksSilent >= INACTIVITY_ALERT_WEEKS,
  );
  const quiet = members.filter(
    (m) =>
      m.weeksSilent !== null &&
      m.weeksSilent >= INACTIVITY_NOTICE_WEEKS &&
      m.weeksSilent < INACTIVITY_ALERT_WEEKS,
  );

  const silence = (m: QuietMember) =>
    m.lastActivityAt === null
      ? "لم يسجّل أي نشاط منذ انضمامه"
      : `آخر نشاط قبل ${weeksInWords(m.weeksSilent)}`;

  return (
    <section
      aria-labelledby="quiet-members-heading"
      className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-4"
    >
      <SectionHeading
        id="quiet-members-heading"
        icon={<BellRing className="w-4 h-4" strokeWidth={2.2} />}
        title="متابعة الأعضاء"
        sub="من ابتعد عن المقرأة، ومن بدأ يهدأ"
      />

      {lapsed.length === 0 && quiet.length === 0 ? (
        <div className="flex items-center gap-2 bg-[#F7FBEA] border border-[#043F2E]/8 rounded-2xl px-4 py-3">
          <Check className="w-4 h-4 text-[#043F2E] shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <p className={`${tajawal.className} text-sm text-[#043F2E]`}>
            لا أحد بعيد عن المقرأة، بارك الله فيهم
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {lapsed.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#9B3D2E] shrink-0" strokeWidth={2.2} aria-hidden="true" />
                <h3 className={`${lalezar.className} text-base text-[#9B3D2E] leading-none`}>
                  يحتاجون تواصلًا
                </h3>
                <span className={`${tajawal.className} text-[11px] text-[#043F2E]/60`}>
                  {toArabicDigits(INACTIVITY_ALERT_WEEKS)} أسابيع فأكثر بلا نشاط
                </span>
              </div>

              {lapsed.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 bg-[#F4E0D6] border border-[#9B3D2E]/25 rounded-2xl px-4 py-3"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <Link
                      href={`/profile/${encodeURIComponent(m.username)}`}
                      className={`${tajawal.className} text-sm font-bold text-[#9B3D2E] truncate hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9B3D2E] focus-visible:ring-offset-2 rounded`}
                    >
                      {m.fullName}
                    </Link>
                    <p className={`${tajawal.className} text-[11px] text-[#9B3D2E]/80 truncate`}>
                      {silence(m)}
                      {m.supervisorName && ` · مشرفه ${m.supervisorName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {quiet.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-[#043F2E]/60 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                <h3 className={`${lalezar.className} text-base text-[#043F2E] leading-none`}>
                  للعلم فقط
                </h3>
                <span className={`${tajawal.className} text-[11px] text-[#043F2E]/60`}>
                  هدوء منذ {toArabicDigits(INACTIVITY_NOTICE_WEEKS)} أسابيع
                </span>
              </div>

              {quiet.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 bg-[#F7FBEA] border border-[#043F2E]/8 rounded-2xl px-4 py-3"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <Link
                      href={`/profile/${encodeURIComponent(m.username)}`}
                      className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 rounded`}
                    >
                      {m.fullName}
                    </Link>
                    <p className={`${tajawal.className} text-[11px] text-[#043F2E]/60 truncate`}>
                      {silence(m)}
                      {m.supervisorName && ` · مشرفه ${m.supervisorName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// أسبوع / أسبوعان / أسابيع — the count changes the noun
function weeksInWords(weeks: number | null): string {
  if (weeks === null) return "مدة غير معروفة";
  if (weeks <= 1) return "أسبوع";
  if (weeks === 2) return "أسبوعين";
  if (weeks <= 10) return `${toArabicDigits(weeks)} أسابيع`;
  return `${toArabicDigits(weeks)} أسبوعًا`;
}

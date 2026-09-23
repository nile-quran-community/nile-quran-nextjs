"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Tajawal, Lalezar } from "next/font/google";
import { IdCard, X } from "lucide-react";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

// sessionStorage means "once per login" is really "once per browser
// tab lifetime", logging out and back in in the same tab won't re-show it.
// Upgrade path if that ever matters: stamp the key with the session's
// last_login instead of a bare boolean, once the API exposes it.
function dismissalKey(userId: number): string {
  return `profile-nag-dismissed:${userId}`;
}

/**
 * A one-time nudge toward /profile#personal-info for a member with an
 * incomplete community profile. Native <dialog> gets focus trap + Escape +
 * top-layer for free, the one place in this app where that beats the usual
 * hand-rolled overlay, because a nag the user can casually miss defeats the
 * point.
 */
export default function ProfileCompletionNag({
  username,
  userId,
}: {
  username: string;
  userId: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem(dismissalKey(userId))) return;
    dialogRef.current?.showModal();
  }, [userId]);

  const dismiss = () => {
    sessionStorage.setItem(dismissalKey(userId), "1");
    dialogRef.current?.close();
  };

  const goToProfile = () => {
    dismiss();
    router.push(`/profile/${encodeURIComponent(username)}#personal-info`);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="profile-nag-heading"
      className="m-auto rounded-3xl border border-[#043F2E]/10 shadow-lg p-0 max-w-[380px] w-[calc(100%-2rem)] backdrop:bg-[#043F2E]/40"
      onCancel={dismiss}
    >
      <div dir="rtl" className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
              <IdCard className="w-4 h-4" strokeWidth={2.4} />
            </div>
            <h2 id="profile-nag-heading" className={`${lalezar.className} text-lg text-[#043F2E]`}>
              أكمل بياناتك
            </h2>
          </div>
          <button
            onClick={dismiss}
            aria-label="إغلاق"
            className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[#043F2E]/60 hover:bg-[#F7FBEA] hover:text-[#043F2E] transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
        <p className={`${tajawal.className} text-sm text-[#043F2E]/70 leading-relaxed`}>
          بياناتك الشخصية غير مكتملة. أكملها ليتعرف عليك مجتمعك. لن تستغرق أكثر من دقيقتين.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={goToProfile}
            className={`${tajawal.className} h-11 px-5 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] text-sm font-bold transition-colors`}
          >
            إكمال البيانات الآن
          </button>
          <button
            onClick={dismiss}
            className={`${tajawal.className} h-11 px-4 rounded-xl text-[#043F2E]/70 text-sm font-bold hover:bg-[#F7FBEA] transition-colors`}
          >
            لاحقًا
          </button>
        </div>
      </div>
    </dialog>
  );
}

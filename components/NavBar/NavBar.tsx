import { Lalezar, Tajawal } from "next/font/google";
import Link from "next/link";
import { IdCard } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { checkTokenValidity } from "@/actions/auth-actions";
import { getInitials } from "@/lib/utils";

import NavBarMobileMenu from "./NavBarMobileMenu";
import NavLinks from "./NavLinks";
import ProfileCompletionNag from "./ProfileCompletionNag";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: "700",
});

function Brand({ className = "" }: { className?: string }) {
  return (
    <Link href={"/"} className={`${lalezar.className} text-[#BEE663] text-2xl ${className}`}>
      مقرأة النيل
    </Link>
  );
}

export default async function NavBar() {
  const User = await checkTokenValidity();
  const initials = getInitials(User?.user?.first_name, User?.user?.last_name);
  const isAdmin = !!User?.user?.groups?.includes("Admin");
  // `is_profile_complete` is computed server-side (see users/models.py) — the
  // one source of truth, never recomputed from the individual fields here.
  const isProfileIncomplete = User?.isValid && User.user && User.user.is_profile_complete === false;

  return (
    <div className="bg-[#043F2E]">
      <div className="relative px-6 md:px-10 lg:px-16 h-[68px] flex justify-between items-center">
        {/* Profile + logout — desktop only, mobile drawer covers this */}
        <div className={`flex items-center gap-3 max-sm:hidden ${tajawal.className}`}>
          <LogoutButton variant="icon" />
          <Link
            href={"/profile"}
            aria-label="حسابي"
            title="حسابي"
            className="w-9 h-9 shrink-0 rounded-full bg-[#BEE663] text-[#043F2E] flex items-center justify-center font-bold text-sm"
          >
            {initials}
          </Link>
        </div>

        <NavBarMobileMenu User={User?.user} />

        {/* Sits next to the hamburger on mobile (justify-between); pushed to the end on desktop */}
        <Brand className="sm:order-last" />

        {/* Nav links — desktop only (NavLinks hides itself below sm), centered independent of side elements' widths */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <NavLinks isAdmin={isAdmin} />
        </div>
      </div>

      {isProfileIncomplete && (
        <>
          {/* Persistent for the rest of the authed session. No dismiss button. */}
          <Link
            href={`/profile/${encodeURIComponent(User.user.username)}#personal-info`}
            className={`${tajawal.className} flex items-center justify-center gap-2 h-9 px-4 bg-[#DEFF90] text-[#043F2E] text-xs font-bold hover:bg-[#9ADD00] transition-colors`}
          >
            <IdCard className="w-3.5 h-3.5" strokeWidth={2.4} />
            بياناتك في الملف الشخصي غير مكتملة، أكملها الآن
          </Link>
          <ProfileCompletionNag username={User.user.username} userId={User.user.id} />
        </>
      )}
    </div>
  );
}

import { Lalezar, Tajawal } from "next/font/google";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { checkTokenValidity } from "@/actions/auth-actions";
import { getInitials } from "@/lib/utils";

import NavBarMobileMenu from "./NavBarMobileMenu";
import NavLinks from "./NavLinks";

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
    </div>
  );
}

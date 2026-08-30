"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tajawal } from "next/font/google";
import { NAV_LINKS, isNavLinkActive } from "./navLinkItems";

const tajawal = Tajawal({ subsets: ["arabic"], weight: "700" });

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <div dir="rtl" className={`flex gap-2 max-sm:hidden ${tajawal.className}`}>
      {NAV_LINKS.filter((link) => !link.adminOnly || isAdmin).map(({ href, label, Icon }) => {
        const isActive = isNavLinkActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            dir="rtl"
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
              isActive
                ? "bg-[#065f46] text-[#BEE663] font-bold"
                : "text-[#BEE663]/70 hover:bg-[#065f46]/50 hover:text-[#BEE663]"
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={2.2} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

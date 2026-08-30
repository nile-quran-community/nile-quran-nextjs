"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LogoutButton from "./LogoutButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lalezar, Tajawal } from "next/font/google";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, isNavLinkActive } from "./navLinkItems";
import { getInitials } from "@/lib/utils";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: "700" });

interface User {
  first_name: string;
  last_name: string;
  groups?: string[];
}
interface Props {
  User: User;
}

export default function NavBarMobileMenu({ User }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();

  useEffect(() => {
    // close menu whenever the route changes
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    // the hamburger/drawer are sm:hidden — close the drawer if a resize crosses that breakpoint
    const mql = window.matchMedia("(min-width: 640px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsMobileMenuOpen(false);
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  if (!User) return null;

  const initials = getInitials(User.first_name, User.last_name);
  const isAdmin = !!User.groups?.includes("Admin");

  return (
    <div>
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="فتح القائمة"
        aria-expanded={isMobileMenuOpen}
        className="sm:hidden cursor-pointer text-[#BEE663] flex items-center justify-center"
      >
        <Menu className="w-6 h-6" strokeWidth={2.2} />
      </button>

      {/* Overlay — clicking it closes the menu */}
      <motion.div
        className={`sm:hidden fixed inset-0 top-[68px] bg-black/50 z-40 ${isMobileMenuOpen ? "" : "hidden"}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile menu panel */}
      <motion.div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        className={`sm:hidden flex flex-col fixed top-[68px] right-0 w-3/4 max-w-sm h-[calc(100vh-68px)] bg-[#043F2E] border-l border-[#BEE663]/10 box-border z-50 ${isMobileMenuOpen ? "" : "hidden"}`}
        initial={{ x: "100%" }}
        animate={{ x: isMobileMenuOpen ? 0 : "100%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full bg-[#2A5A45] p-5 flex items-center gap-3">
          <Link
            href={"/profile"}
            aria-label="حسابي"
            className="shrink-0 w-14 h-14 rounded-full bg-[#BEE663] text-[#043F2E] flex items-center justify-center"
          >
            <span className={`${tajawal.className} text-lg font-bold`}>{initials}</span>
          </Link>
          <div className="flex-1 min-w-0">
            <p className={`${tajawal.className} text-xs text-[#BEE663]/70`}>مرحباً بعودتك</p>
            <p className={`${lalezar.className} text-[#BEE663] text-xl leading-tight truncate`}>
              {User.first_name} {User.last_name}
            </p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="إغلاق القائمة"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[#BEE663] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2.2} />
          </button>
        </div>

        {/* Links */}
        <nav className={`flex flex-col px-4 py-4 gap-2 ${tajawal.className}`}>
          {NAV_LINKS.filter((link) => !link.adminOnly || isAdmin).map(({ href, label, Icon }) => {
            const isActive = isNavLinkActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 p-3 rounded-2xl text-base font-semibold transition-colors ${
                  isActive
                    ? "bg-[#BEE663] text-[#043F2E]"
                    : "bg-[#2A5A45]/60 text-[#BEE663] hover:bg-[#2A5A45]"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={2.2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className={`mt-auto px-4 py-4 border-t border-[#BEE663]/10 ${tajawal.className}`}>
          <LogoutButton
            variant="iconWithLabel"
            className="flex items-center gap-3 p-3 w-full rounded-2xl bg-[#2A5A45]/60 hover:bg-[#2A5A45] text-base font-semibold transition-colors"
          />
        </div>
      </motion.div>
    </div>
  );
}

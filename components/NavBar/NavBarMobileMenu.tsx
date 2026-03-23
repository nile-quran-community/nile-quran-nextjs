"use client";
import { useState, useEffect } from "react";
import Menu from "@/public/menu.png";
import { motion } from "framer-motion";
import Image from "next/image";
import LogoutButton from "./LogoutButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lalezar, Tajawal } from "next/font/google";

const lalezar = Lalezar({ subsets: ["latin"], weight: "400" });
const tajawal = Tajawal({ subsets: ["latin"], weight: "700" });
interface User {
  first_name: string;
  last_name: string;
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
  if (!User) return null;
  return (
    <div className="">
      <div
        onClick={() => setIsMobileMenuOpen(true)}
        className="sm:hidden cursor-pointer"
      >
        <Image src={Menu} alt="" />
      </div>
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
        className={`sm:hidden  flex flex-col gap-2 fixed top-[68px] right-0 w-3/4 h-[calc(100vh-68px)] bg-[#043F2E] backdrop-blur-xl border-l border-white/10 box-border z-50 ${isMobileMenuOpen ? "" : "hidden"}`}
        initial={{ x: "75%" }}
        animate={{ x: isMobileMenuOpen ? 0 : "75%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <div className="w-full bg-[#2A5A45] h-28 flex items-center justify-center ">
          <p
            className={`${lalezar.className}  text-[#E6F0E9] text-right font-bold text-2xl`}
          >
            {" "}
            مرحبا {User.first_name} {User.last_name}
          </p>
        </div>
        <div className="flex flex-col px-4 gap-2">
          <Link
            href={"/"}
            className={`${tajawal.className} p-3 flex rounded-2xl bg-[#2A5A45] text-[#E6F0E9] text-lg font-semibold justify-center`}
          >
            <p>الصفحة الرئيسية</p>
          </Link>
          <Link
            href={"/control-board"}
            className={`${tajawal.className} p-3 flex rounded-2xl bg-[#2A5A45] text-[#E6F0E9] text-lg font-semibold justify-center`}
          >
            <p>لوحه التحكم</p>
          </Link>
          <div
            className={`${tajawal.className} p-3 flex rounded-2xl bg-[#2A5A45]  text-lg font-semibold justify-center`}
          >
            <LogoutButton className="text-[#E6F0E9]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

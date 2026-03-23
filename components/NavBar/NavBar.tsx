import { Lalezar, Tajawal } from "next/font/google";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { checkTokenValidity } from "@/actions/auth-actions";

import NavBarMobileMenu from "./NavBarMobileMenu";
const lalezar = Lalezar({
  subsets: ["latin"],
  weight: "400",
});
const tajawal = Tajawal({
  subsets: ["latin"],
  weight: "700",
});

export default async function NavBar() {
  const User = await checkTokenValidity();
  return (
    <>
      <div className=" text-[#BEE663] h-[68px] bg-[#043F2E] flex justify-between  items-center px-28 max-sm:px-5">
        <div className={`flex gap-10 max-sm:hidden ${tajawal.className}`}>
          <LogoutButton />
          <Link href={"/"} className="">
            الصفحة الرئيسية
          </Link>
          {User?.user?.groups?.includes("Admin") ? (
            <Link href={"/control-board"} className="">
              لوحة التحكم
            </Link>
          ) : (
            ""
          )}
        </div>
        <NavBarMobileMenu User={User?.user} />
        <p className={`${lalezar.className} text-[30px]`}>مقرأة النيل</p>
      </div>
    </>
  );
}

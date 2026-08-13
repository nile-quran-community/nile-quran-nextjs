import { Lalezar } from "next/font/google";
import { Tajawal } from "next/font/google";
import Link from "next/link";
import SignUpForm from "./SignUpForm";
import LoginForm from "./LoginForm";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: "700" });

interface Props {
  mode: string;
}

export default function AuthForm({ mode }: Props) {
  return (
    <div className="w-[630px] flex z-30 flex-col items-center justify-center h-full max-sm:w-full">
      <p className={`text-[54px] text-[#043F2E] max-sm:text-[38px] ${lalezar.className}`}>
        مقرأة النيل
      </p>
      <div className="w-full rounded-2xl border border-[#043F2E] bg-[#F7FBEA] overflow-hidden">
        <div className={`w-full flex ${tajawal.className}`}>
          <Link
            href={"/auth/?mode=signup"}
            className={`w-1/2 h-[75px] max-sm:h-[60px] max-sm:font-extrabold ${
              mode === "signup" ? "bg-[#043F2E] text-[#EBFFBD]" : "bg-[#EBFFBD] text-[#043F2E]"
            } border-b border-[#043F2E] cursor-pointer flex justify-center items-center`}
          >
            إنشاء حساب
          </Link>
          <Link
            href={"/auth/?mode=login"}
            className={`w-1/2 ${
              mode === "login" ? "bg-[#043F2E] text-[#EBFFBD]" : "bg-[#EBFFBD] text-[#043F2E]"
            } h-[75px] max-sm:h-[60px] max-sm:font-extrabold border-b border-[#043F2E] cursor-pointer flex justify-center items-center`}
          >
            تسجيل الدخول
          </Link>
        </div>
        {mode === "login" ? <LoginForm /> : <SignUpForm />}
      </div>
    </div>
  );
}

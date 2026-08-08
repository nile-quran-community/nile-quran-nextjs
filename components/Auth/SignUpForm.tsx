"use client";
import { Tajawal } from "next/font/google";
import { useActionState } from "react";
import { Lock, Mail, AtSign, UserPlus } from "lucide-react";
import { signup } from "@/actions/auth-actions";
import { Spinner } from "../ui/spinner";
import type { SignupFormState } from "@/lib/types";
import InfoTooltip from "./InfoTooltip";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: "700",
});

export default function SignUpForm() {
  const initialState: SignupFormState = {
    errors: {},
    values: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      referrer: "",
    },
  };
  const [formState, formAction, isPending] = useActionState(signup, initialState);

  return (
    <form
      id="auth-form"
      action={formAction}
      className={`${tajawal.className} px-20 py-5 flex flex-col gap-5 max-sm:px-8`}
    >
      <div className="flex gap-3">
        <div className="w-1/2 flex flex-col gap-3 items-end">
          <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">الاسم الاخير</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            defaultValue={formState.values?.lastName ?? ""}
            placeholder="الاسم الاخير"
            dir="auto"
            className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end px-5 focus:placeholder:opacity-0"
          />
        </div>
        <div className="w-1/2 flex flex-col gap-3 items-end">
          <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">الاسم الاول</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            defaultValue={formState.values?.firstName ?? ""}
            placeholder="الاسم الاول"
            dir="auto"
            required
            className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end px-5 focus:placeholder:opacity-0"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">البريد الالكترونى</label>
        <div className="relative w-full">
          <Mail
            className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={formState.values?.email ?? ""}
            placeholder="البريد الالكترونى"
            dir="auto"
            required
            className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end pr-11 pl-5 focus:placeholder:opacity-0"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">اسم المستخدم</label>
        <div className="relative w-full">
          <AtSign
            className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="text"
            id="username"
            name="username"
            defaultValue={formState.values?.username ?? ""}
            placeholder="اسم المستخدم"
            dir="auto"
            required
            className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end pr-11 pl-5 focus:placeholder:opacity-0"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 items-end">
        <div className="flex items-center gap-2">
          <InfoTooltip text="اسم المستخدم الخاص بعضو المجتمع الذي دعاك للانضمام إلى المقرأة. إذا لم يكن لديك مُحيل، تواصل مع أحد أعضاء المجتمع." />
          <label htmlFor="referrer" className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
            من دعاك للانضمام
          </label>
        </div>
        <div className="relative w-full">
          <UserPlus
            className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="text"
            id="referrer"
            name="referrer"
            defaultValue={formState.values?.referrer ?? ""}
            placeholder="اسم المستخدم لمن دعاك"
            dir="auto"
            required
            className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end pr-11 pl-5 focus:placeholder:opacity-0"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">كلمة السر</label>
        <div className="relative w-full">
          <Lock
            className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="password"
            id="password"
            name="password"
            required
            placeholder="كلمة السر"
            dir="auto"
            className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end pr-11 pl-5 focus:placeholder:opacity-0"
          />
        </div>
      </div>
      {/* ERRORS */}
      {formState.errors && Object.keys(formState.errors).length > 0 && (
        <ul dir="rtl" className="list-none p-0 m-0 text-right w-full">
          {Object.entries(formState.errors).map(([key, value]) => (
            <li key={key} className="text-red-500 text-sm text-right">
              {String(value)}
            </li>
          ))}
        </ul>
      )}
      <button
        disabled={isPending}
        type="submit"
        className="rounded-[7px] flex justify-center items-center w-full bg-[#BEE663] h-14 max-sm:h-11 font-extrabold text-[20px] text-[#043F2E] cursor-pointer"
      >
        {isPending ? <Spinner /> : "إنشاء حساب"}
      </button>
    </form>
  );
}

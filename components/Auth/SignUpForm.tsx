"use client";
import { Tajawal } from "next/font/google";
import { useActionState } from "react";
import { AlertCircle, Lock, Mail, AtSign, UserPlus } from "lucide-react";
import { signup } from "@/actions/auth-actions";
import { Spinner } from "../ui/spinner";
import type { SignupFormState } from "@/lib/types";
import InfoTooltip from "./InfoTooltip";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: "700",
});

function inputClass(hasError: string | undefined, withIcon: boolean) {
  return [
    "bg-white w-full h-14 max-sm:h-11 rounded-[7px] border placeholder:text-end outline-none focus:placeholder:opacity-0 transition-colors",
    hasError
      ? "border-[#9B3D2E] focus:border-[#9B3D2E]"
      : "border-[#043F2E] focus:border-[#043F2E]",
    withIcon ? "pr-11 pl-5" : "px-5",
  ].join(" ");
}

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
            className={inputClass(formState.errors?.lastName, false)}
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
            className={inputClass(formState.errors?.firstName, false)}
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
            className={inputClass(formState.errors?.email, true)}
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
            className={inputClass(formState.errors?.username, true)}
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
            className={inputClass(formState.errors?.referrer, true)}
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
            className={inputClass(formState.errors?.password, true)}
          />
        </div>
      </div>
      {/* ERRORS */}
      {formState.errors && Object.keys(formState.errors).length > 0 && (
        <ul dir="rtl" className="list-none p-0 m-0 text-right w-full flex flex-col gap-2">
          {Object.entries(formState.errors).map(([key, value]) => {
            if (!value) return null;
            return (
              <li
                key={key}
                role="alert"
                className="flex items-center gap-1.5 text-sm text-[#9B3D2E] font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
                <span>{String(value)}</span>
              </li>
            );
          })}
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

"use client";
import { Tajawal } from "next/font/google";
import { useActionState } from "react";
import { AlertCircle, Lock, User as UserIcon } from "lucide-react";
import { login } from "@/actions/auth-actions";
import { Spinner } from "../ui/spinner";
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: "700",
});
interface FormState {
  errors: {
    email: string | undefined;
    [key: string]: string | undefined;
  };
}

function inputClass(hasError: boolean) {
  return [
    "bg-white w-full h-14 max-sm:h-11 rounded-[7px] border placeholder:text-end pr-11 pl-5 focus:placeholder:opacity-0 outline-none transition-colors",
    hasError
      ? "border-[#9B3D2E] focus:border-[#9B3D2E]"
      : "border-[#043F2E] focus:border-[#043F2E]",
  ].join(" ");
}

export default function LoginForm() {
  const initialState: FormState = { errors: { email: undefined } };
  const [formState, formAction, isPending] = useActionState(login, initialState);
  // Login errors are generic ("invalid credentials") — the backend doesn't
  // tell us which field is wrong, so highlight both together.
  const hasLoginError = Object.values(formState.errors).some(Boolean);
  return (
    <form
      id="auth-form"
      action={formAction}
      className={`${tajawal.className} px-20 py-5 flex flex-col gap-5 max-sm:px-8`}
    >
      <div className="flex flex-col gap-3 items-end">
        <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">اسم المستخدم</label>
        <div className="relative w-full">
          <UserIcon
            className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="text"
            id="username"
            name="username"
            placeholder="اسم المستخدم"
            dir="auto"
            required
            className={inputClass(hasLoginError)}
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
            className={inputClass(hasLoginError)}
          />
        </div>
      </div>
      {/* ERRORS */}
      <ul dir="rtl" className="list-none p-0 m-0 text-right w-full flex flex-col gap-2">
        {Object.entries(formState.errors).map(
          ([key, message]) =>
            message && (
              <li
                key={key}
                role="alert"
                className="flex items-center gap-1.5 text-sm text-[#9B3D2E] font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
                <span>{message}</span>
              </li>
            ),
        )}
      </ul>
      <button
        disabled={isPending}
        type="submit"
        className="rounded-[7px] flex justify-center items-center w-full bg-[#BEE663] h-14 max-sm:h-11 font-extrabold text-[20px] text-[#043F2E] cursor-pointer"
      >
        {isPending ? <Spinner /> : "تسجيل الدخول"}
      </button>
    </form>
  );
}

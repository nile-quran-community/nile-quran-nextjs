"use client";
import { Tajawal } from "next/font/google";
import { useActionState } from "react";
import { login } from "@/actions/auth-actions";
import { Spinner } from "../ui/spinner";
const tajawal = Tajawal({
  subsets: ["latin"],
  weight: "700",
});
interface FormState {
  errors: {
    email: string | undefined;
    [key: string]: string | undefined;
  };
}
export default function LoginForm() {
  const initialState: FormState = { errors: { email: undefined } };
  const [formState, formAction, isPending] = useActionState(
    login,
    initialState,
  );
  return (
    <form
      id="auth-form"
      action={formAction}
      className={`${tajawal.className} px-20 py-5 flex flex-col gap-5 max-sm:px-8`}
    >
      <div className="flex flex-col gap-3 items-end">
        <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
          اسم المستخدم
        </label>
        <input
          type="text"
          id="username"
          name="username"
          placeholder="اسم المستخدم"
          dir="auto"
          required
          className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end  px-5 focus:placeholder:opacity-0"
        />
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
          كلمة السر
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          placeholder="كلمة السر"
          dir="auto"
          className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end  px-5 focus:placeholder:opacity-0"
        />
      </div>
      {/* ERRORS */}
      {Object.entries(formState.errors).map(([key, message]) => (
        <li key={key} className="list-none text-right text-red-500 text-sm">
          {message}
        </li>
      ))}
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

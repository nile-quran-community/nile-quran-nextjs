"use client";
import { Tajawal } from "next/font/google";
import { useActionState } from "react";
import { signup } from "@/actions/auth-actions";
import { Spinner } from "../ui/spinner";
import type { SignupFormState } from "@/lib/types";

const tajawal = Tajawal({
  subsets: ["latin"],
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
  const [formState, formAction, isPending] = useActionState(
    signup,
    initialState,
  );

  return (
    <form
      id="auth-form"
      action={formAction}
      className={`${tajawal.className} px-20 py-5 flex flex-col gap-5 max-sm:px-8`}
    >
      <div className="flex gap-3">
        <div className="w-1/2 flex  flex-col gap-3 items-end">
          <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
            الاسم الاخير
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            defaultValue={formState.values?.lastName ?? ""}
            placeholder="الاسم الاخير"
            dir="auto"
            className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end  px-5 focus:placeholder:opacity-0"
          />
        </div>
        <div className="w-1/2 flex  flex-col gap-3 items-end">
          <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
            الاسم الاول
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            defaultValue={formState.values?.firstName ?? ""}
            placeholder="الاسم الاول"
            dir="auto"
            required
            className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end  px-5 focus:placeholder:opacity-0"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
          البريد الالكترونى
        </label>
        <input
          type="email"
          id="email"
          name="email"
          defaultValue={formState.values?.email ?? ""}
          placeholder="البريد الالكترونى"
          dir="auto"
          required
          className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end  px-5 focus:placeholder:opacity-0"
        />
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
          اسم المستخدم
        </label>
        <input
          type="text"
          id="username"
          name="username"
          defaultValue={formState.values?.username ?? ""}
          placeholder="اسم المستخدم"
          dir="auto"
          required
          className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end  px-5 focus:placeholder:opacity-0"
        />
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
          المرسل
        </label>
        <input
          type="referrer"
          id="referrer"
          name="referrer"
          defaultValue={formState.values?.referrer ?? ""}
          placeholder="المرسل"
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
      {formState.errors && Object.keys(formState.errors).length > 0 && (
        <ul className="list-none p-0 m-0 text-right">
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
        className="rounded-[7px] flex justify-center items-center w-full bg-[#BEE663] h-14 font-extrabold text-[20px] text-[#043F2E] cursor-pointer"
      >
        {isPending ? <Spinner /> : "تسجيل الدخول"}
      </button>
    </form>
  );
}

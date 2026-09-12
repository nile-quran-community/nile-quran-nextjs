"use client";
import { Tajawal } from "next/font/google";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, AtSign, UserPlus } from "lucide-react";
import { signup } from "@/actions/auth-actions";
import { signupSchema, type SignupValues } from "@/lib/schemas";
import { Spinner } from "../ui/spinner";
import InfoTooltip from "./InfoTooltip";
import FieldError from "../ui/field-error";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: "700",
});

function inputClass(hasError: boolean, withIcon: boolean) {
  return [
    "bg-white w-full h-14 max-sm:h-11 rounded-[7px] border placeholder:text-end outline-none focus:placeholder:opacity-0 transition-colors",
    hasError
      ? "border-[#9B3D2E] focus:border-[#9B3D2E]"
      : "border-[#043F2E] focus:border-[#043F2E]",
    withIcon ? "pr-11 pl-5" : "px-5",
  ].join(" ");
}

// Field names the API answers with, mapped onto the names this form uses
const API_FIELD_ALIASES: Record<string, keyof SignupValues> = {
  first_name: "firstName",
  last_name: "lastName",
};

export default function SignUpForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    // The form keeps whatever the member typed when a submit fails
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      referrer: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    // A successful signup redirects from the server action and never returns
    const result = await signup(values);
    for (const [field, message] of Object.entries(result?.errors ?? {})) {
      const target = API_FIELD_ALIASES[field] ?? field;
      const known = target in signupSchema.shape;
      setError(known ? (target as keyof SignupValues) : "root", { message });
    }
  });

  return (
    <form
      id="auth-form"
      onSubmit={onSubmit}
      noValidate
      className={`${tajawal.className} px-20 py-5 flex flex-col gap-5 max-sm:px-8`}
    >
      <div className="flex gap-3">
        <div className="w-1/2 flex flex-col gap-3 items-end">
          <label htmlFor="lastName" className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
            الاسم الاخير
          </label>
          <input
            type="text"
            id="lastName"
            placeholder="الاسم الاخير"
            dir="auto"
            className={inputClass(!!errors.lastName, false)}
            aria-invalid={!!errors.lastName}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
            {...register("lastName")}
          />
          <FieldError id="lastName-error" message={errors.lastName?.message} />
        </div>
        <div className="w-1/2 flex flex-col gap-3 items-end">
          <label htmlFor="firstName" className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
            الاسم الاول
          </label>
          <input
            type="text"
            id="firstName"
            placeholder="الاسم الاول"
            dir="auto"
            className={inputClass(!!errors.firstName, false)}
            aria-invalid={!!errors.firstName}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
            {...register("firstName")}
          />
          <FieldError id="firstName-error" message={errors.firstName?.message} />
        </div>
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label htmlFor="email" className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
          البريد الالكترونى
        </label>
        <div className="relative w-full">
          <Mail
            className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="email"
            id="email"
            placeholder="البريد الالكترونى"
            dir="auto"
            autoComplete="email"
            className={inputClass(!!errors.email, true)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </div>
        <FieldError id="email-error" message={errors.email?.message} />
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label htmlFor="username" className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
          اسم المستخدم
        </label>
        <div className="relative w-full">
          <AtSign
            className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="text"
            id="username"
            placeholder="اسم المستخدم"
            dir="auto"
            autoComplete="username"
            className={inputClass(!!errors.username, true)}
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "username-error" : undefined}
            {...register("username")}
          />
        </div>
        <FieldError id="username-error" message={errors.username?.message} />
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
            placeholder="اسم المستخدم لمن دعاك"
            dir="auto"
            className={inputClass(!!errors.referrer, true)}
            aria-invalid={!!errors.referrer}
            aria-describedby={errors.referrer ? "referrer-error" : undefined}
            {...register("referrer")}
          />
        </div>
        <FieldError id="referrer-error" message={errors.referrer?.message} />
      </div>
      <div className="flex flex-col gap-3 items-end">
        <label htmlFor="password" className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
          كلمة السر
        </label>
        <div className="relative w-full">
          <Lock
            className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="password"
            id="password"
            placeholder="كلمة السر"
            dir="auto"
            autoComplete="new-password"
            className={inputClass(!!errors.password, true)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </div>
        <FieldError id="password-error" message={errors.password?.message} />
      </div>
      <FieldError message={errors.root?.message} />
      <button
        disabled={isSubmitting}
        type="submit"
        className="rounded-[7px] flex justify-center items-center w-full bg-[#BEE663] h-14 max-sm:h-11 font-extrabold text-[20px] text-[#043F2E] cursor-pointer"
      >
        {isSubmitting ? <Spinner /> : "إنشاء حساب"}
      </button>
    </form>
  );
}

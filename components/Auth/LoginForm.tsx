"use client";
import { Tajawal } from "next/font/google";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, User as UserIcon } from "lucide-react";
import { login } from "@/actions/auth-actions";
import { loginSchema, type LoginValues } from "@/lib/schemas";
import { Spinner } from "../ui/spinner";
import FieldError from "../ui/field-error";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: "700",
});

function inputClass(hasError: boolean) {
  return [
    "bg-white w-full h-14 max-sm:h-11 rounded-[7px] border placeholder:text-end pr-11 pl-5 focus:placeholder:opacity-0 outline-none transition-colors",
    hasError
      ? "border-[#9B3D2E] focus:border-[#9B3D2E]"
      : "border-[#043F2E] focus:border-[#043F2E]",
  ].join(" ");
}

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  // A rejected login names no field; the backend deliberately won't say which
  // half was wrong, so it marks both inputs and speaks once, above the button.
  const badCredentials = !!errors.root;

  const onSubmit = handleSubmit(async (values) => {
    // A successful login redirects from the server action and never returns
    const result = await login(values);
    for (const [field, message] of Object.entries(result?.errors ?? {})) {
      setError(field === "general" ? "root" : (field as keyof LoginValues), { message });
    }
  });

  return (
    <form
      id="auth-form"
      onSubmit={onSubmit}
      noValidate
      className={`${tajawal.className} px-20 py-5 flex flex-col gap-5 max-sm:px-8`}
    >
      <div className="flex flex-col gap-3 items-end">
        <label htmlFor="username" className="text-[#043F2E] text-[20px] max-sm:text-[16px]">
          اسم المستخدم
        </label>
        <div className="relative w-full">
          <UserIcon
            className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
            strokeWidth={2.2}
          />
          <input
            type="text"
            id="username"
            placeholder="اسم المستخدم"
            dir="auto"
            autoComplete="username"
            className={inputClass(!!errors.username || badCredentials)}
            aria-invalid={!!errors.username || badCredentials}
            aria-describedby={errors.username ? "username-error" : undefined}
            {...register("username")}
          />
        </div>
        <FieldError id="username-error" message={errors.username?.message} />
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
            autoComplete="current-password"
            className={inputClass(!!errors.password || badCredentials)}
            aria-invalid={!!errors.password || badCredentials}
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
        {isSubmitting ? <Spinner /> : "تسجيل الدخول"}
      </button>
    </form>
  );
}

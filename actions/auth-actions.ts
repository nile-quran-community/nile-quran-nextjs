"use server";

import { getUserRole, Login } from "@/lib/user";
import createUser from "@/lib/user";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtDecode, JwtPayload } from "jwt-decode";
import type { SignupErrors, SignupFormState } from "@/lib/types";

const API_BASE = process.env.BASE_URL;

const COOKIE_NAME1 = "access";
const COOKIE_NAME2 = "refresh";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function login(
  prevState: { errors: Record<string, string> },
  formData: FormData,
) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const existingUser = await Login(username, password);

  if (!existingUser.access) {
    return {
      errors: {
        email:
          existingUser?.detail ||
          "فشل تسجيل الدخول، تأكد من اسم المستخدم وكلمة المرور.",
      },
    };
  }

  if (existingUser.access) {
    const cookieStore = await cookies();

    await cookieStore.set(COOKIE_NAME1, existingUser.access, COOKIE_OPTIONS);
    await cookieStore.set(COOKIE_NAME2, existingUser.refresh, COOKIE_OPTIONS);

    redirect("/");
  } else {
    return {
      errors: {
        email: `حدث خطأ أثناء تسجيل الدخول: ${existingUser.detail}`,
      },
    };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("access");
  cookieStore.delete("refresh");

  redirect("/auth");
}

function isAccessTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const now = Date.now() / 1000;

    if (!decoded.exp) return true;

    return decoded.exp < now;
  } catch {
    return true;
  }
}

async function refreshAccessToken() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get("refresh");

  if (!refresh) throw new Error("لا يوجد رمز تحديث");

  const res = await fetch(`${API_BASE}auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept-Language": "ar" },
    body: JSON.stringify({ refresh: refresh.value }),
  });

  if (!res.ok) throw new Error("رمز التحديث منتهي أو غير صالح");

  const data = await res.json();

  await cookieStore.set("access", data.access, COOKIE_OPTIONS);

  return data.access;
}

export async function checkTokenValidity() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access");
  const refresh = cookieStore.get("refresh");

  const user = access ? await getUserRole(access.value) : undefined;

  if (!refresh) {
    return {
      isValid: false,
      user: user,
    };
  }

  if (access && !isAccessTokenExpired(access.value)) {
    return {
      isValid: true,
      user: user,
    };
  }

  try {
    await refreshAccessToken();

    return {
      isValid: true,
      user: user,
    };
  } catch {
    return {
      isValid: false,
      user: user,
    };
  }
}

export async function signup(prevState: SignupFormState, formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const referrer = formData.get("referrer") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const values = { firstName, lastName, email, referrer, username };

  const errors: SignupErrors = {};

  // First Name
  if (!firstName || firstName.trim().length === 0) {
    errors.firstName = "الاسم الأول مطلوب";
  } else if (firstName.trim().length < 2) {
    errors.firstName = "يجب أن يحتوي الاسم الأول على حرفين على الأقل";
  } else if (firstName.trim().length > 50) {
    errors.firstName = "يجب ألا يتجاوز الاسم الأول 50 حرفًا";
  } else if (
    !/^[\u0621-\u064A\u0660-\u0669a-zA-Z\s'-]+$/.test(firstName.trim())
  ) {
    errors.firstName =
      "يسمح فقط بالحروف العربية أو الإنجليزية والمسافات والواصلات";
  }

  // Last Name
  if (!lastName || lastName.trim().length === 0) {
    errors.lastName = "اسم العائلة مطلوب";
  } else if (lastName.trim().length < 2) {
    errors.lastName = "يجب أن يحتوي اسم العائلة على حرفين على الأقل";
  } else if (lastName.trim().length > 50) {
    errors.lastName = "يجب ألا يتجاوز اسم العائلة 50 حرفًا";
  } else if (
    !/^[\u0621-\u064A\u0660-\u0669a-zA-Z\s'-]+$/.test(lastName.trim())
  ) {
    errors.lastName =
      "يسمح فقط بالحروف العربية أو الإنجليزية والمسافات والواصلات";
  }

  // Email
  if (!email || email.trim().length === 0) {
    errors.email = "البريد الإلكتروني مطلوب";
  } else if (!email.includes("@")) {
    errors.email = "يرجى إدخال بريد إلكتروني صحيح";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "يرجى إدخال بريد إلكتروني صحيح";
  } else if (email.trim().length > 254) {
    errors.email = "البريد الإلكتروني طويل جدًا";
  }

  // Referrer
  if (!referrer || referrer.trim().length === 0) {
    errors.referrer = "يجب اختيار جهة الإحالة";
  }

  // Username
  if (!username || username.trim().length === 0) {
    errors.username = "اسم المستخدم مطلوب";
  }

  // Password
  if (!password || password.length === 0) {
    errors.password = "كلمة المرور مطلوبة";
  } else if (password.length < 8) {
    errors.password = "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل";
  } else if (password.length > 128) {
    errors.password = "كلمة المرور طويلة جدًا";
  } else if (!/(?=.*[a-z])/.test(password)) {
    errors.password = "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل";
  } else if (!/(?=.*[A-Z])/.test(password)) {
    errors.password = "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل";
  } else if (!/(?=.*\d)/.test(password)) {
    errors.password = "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل";
  } else if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    errors.password = "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  try {
    const result = await createUser({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      referrer: referrer.toLowerCase(),
      username: username.trim(),
    });
    console.log(result);
    if (result?.errors) {
      return {
        values,
        errors: result.errors,
        success: result.success,
        data: result.data,
      };
    }

    redirect("/auth");
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return {
      values,
      errors: {
        email: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.",
      },
    };
  }
}

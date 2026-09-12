"use server";

import { getUserRole, Login } from "@/lib/user";
import createUser from "@/lib/user";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { cache } from "react";
import { jwtDecode, JwtPayload } from "jwt-decode";
import type { ZodError } from "zod";
import { loginSchema, signupSchema, type LoginValues, type SignupValues } from "@/lib/schemas";

const API_BASE = process.env.BASE_URL;

const COOKIE_NAME1 = "access";
const COOKIE_NAME2 = "refresh";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Field errors keyed the way the form names its inputs; "general" is anything
// that belongs to no single field.
export type FormErrors = Record<string, string>;

export async function login(values: LoginValues): Promise<{ errors: FormErrors } | undefined> {
  // The browser already checks these, but a server action is a public endpoint sooo
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const existingUser = await Login(parsed.data.username, parsed.data.password);

  if (!existingUser.access) {
    return {
      errors: {
        general:
          existingUser?.errors?.email ||
          existingUser?.detail ||
          "فشل تسجيل الدخول، تأكد من اسم المستخدم وكلمة المرور.",
      },
    };
  }

  const cookieStore = await cookies();
  await cookieStore.set(COOKIE_NAME1, existingUser.access, COOKIE_OPTIONS);
  await cookieStore.set(COOKIE_NAME2, existingUser.refresh, COOKIE_OPTIONS);

  redirect("/");
}

// zod reports every failing rule; the forms show one message per field, so keep the first
function fieldErrors(error: ZodError): FormErrors {
  const errors: FormErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "general");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
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

// NavBar and every page under (main) each call checkTokenValidity() on their own
// during the same request/render pass. cache() dedupes those into a single
// cookie read, token-role lookup, and (if needed) refresh call per request,
// instead of repeating all of that once per caller.
const checkTokenValidityCached = cache(async function checkTokenValidityInternal() {
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
});

export async function checkTokenValidity() {
  return checkTokenValidityCached();
}

// DRF answers with one message or a list of them per field.
// The form shows a single line, so take the first.
function flattenApiErrors(errors: Record<string, unknown>): FormErrors {
  const flat: FormErrors = {};
  for (const [key, value] of Object.entries(errors)) {
    const message = Array.isArray(value) ? value[0] : value;
    if (message) flat[key] = String(message);
  }

  return flat;
}

export async function signup(values: SignupValues): Promise<{ errors: FormErrors } | undefined> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const { firstName, lastName, email, referrer, username, password } = parsed.data;

  try {
    const result = await createUser({
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      password,
      referrer: referrer.toLowerCase(),
      username,
    });

    if (result?.errors) {
      return { errors: flattenApiErrors(result.errors) };
    }

    // The account is created but inactive until an administrator approves it.
    // The login page says so but the login endpoint itself cannot, because it
    // answers identically for a wrong password and a pending account.
    redirect("/auth?mode=login&pending=1");
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

    return { errors: { general: "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى." } };
  }
}

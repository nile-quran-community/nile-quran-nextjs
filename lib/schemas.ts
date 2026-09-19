import { z } from "zod";
// Imported from libphonenumber-js directly (not react-phone-number-input).
// This schema is evaluated on the server too, and react-phone-number-input's
// entry point also bundles its React input component, which breaks server-side
// evaluation. libphonenumber-js is the pure-JS library the input wraps.
import { isValidPhoneNumber } from "libphonenumber-js";

export const passwordSchema = z
  .string()
  .min(1, "كلمة المرور مطلوبة")
  .min(8, "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل")
  .max(128, "كلمة المرور طويلة جدًا")
  .regex(/[a-z]/, "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل")
  .regex(/[A-Z]/, "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل")
  .regex(/\d/, "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل")
  .regex(
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل",
  );

// Arabic or Latin letters, spaces, apostrophes and hyphens
const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} مطلوب`)
    .min(2, `يجب أن يحتوي ${label} على حرفين على الأقل`)
    .max(50, `يجب ألا يتجاوز ${label} 50 حرفًا`)
    .regex(
      /^[\u0621-\u064A\u0660-\u0669a-zA-Z\s'-]+$/,
      "يسمح فقط بالحروف العربية أو الإنجليزية والمسافات والواصلات",
    );

const emailSchema = z
  .string()
  .trim()
  .min(1, "البريد الإلكتروني مطلوب")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "يرجى إدخال بريد إلكتروني صحيح")
  .max(254, "البريد الإلكتروني طويل جدًا");

export const loginSchema = z.object({
  username: z.string().trim().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const signupSchema = z.object({
  firstName: nameSchema("الاسم الأول"),
  lastName: nameSchema("اسم العائلة"),
  email: emailSchema,
  username: z.string().trim().min(1, "اسم المستخدم مطلوب"),
  referrer: z.string().trim().min(1, "يجب اختيار جهة الإحالة"),
  password: passwordSchema,
});

// The profile modal edits names and email, and, only if the member typed
// anything into either password box, changes the password too. An untouched
// pair stays out of the request entirely, so it must not be validated.
export const editProfileSchema = z
  .object({
    firstName: nameSchema("الاسم الأول"),
    lastName: nameSchema("اسم العائلة"),
    email: emailSchema,
    password: z.string(),
    confirmPassword: z.string(),
  })
  .check((ctx) => {
    const { password, confirmPassword } = ctx.value;
    if (!password && !confirmPassword) return;

    const strength = passwordSchema.safeParse(password);
    if (!strength.success) {
      ctx.issues.push({
        code: "custom",
        path: ["password"],
        message: strength.error.issues[0].message,
        input: password,
      });
      return;
    }
    if (password !== confirmPassword) {
      ctx.issues.push({
        code: "custom",
        path: ["confirmPassword"],
        message: "كلمتا المرور غير متطابقتين",
        input: confirmPassword,
      });
    }
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type EditProfileValues = z.infer<typeof editProfileSchema>;

// ===============================
// Community Profile ("complete your info") Form
// ===============================
// Mirrors User.is_profile_complete on the backend (users/models.py): every
// field required except `skills`, with academic_status/faculty's "other" free
// text and islamic_studies_source only required when the field they depend on
// calls for them. The backend re-validates all of this independently — this
// schema exists so a member sees the same message before submitting instead
// of after.

const requiredText = (message: string) => z.string().trim().min(1, message);

export const profileInfoSchema = z
  .object({
    phone_number: z
      .string({ error: "رقم الهاتف مطلوب" })
      .min(1, "رقم الهاتف مطلوب")
      .refine((v) => isValidPhoneNumber(v), "رقم الهاتف غير صالح"),
    birth_date: requiredText("تاريخ الميلاد مطلوب"),
    academic_status: requiredText("الحالة الدراسية مطلوبة"),
    academic_status_other: z.string().trim(),
    faculty: requiredText("الكلية مطلوبة"),
    faculty_other: z.string().trim(),
    academic_year: requiredText("السنة الدراسية مطلوبة"),
    residence: requiredText("مكان الإقامة الحالي مطلوب"),
    hometown: requiredText("الموطن الأصلي مطلوب"),
    memorized_juz: z
      .number({ error: "عدد الأجزاء المحفوظة مطلوب" })
      .int()
      .min(0, "عدد الأجزاء لا يقل عن 0")
      .max(30, "عدد الأجزاء لا يتجاوز 30"),
    tajweed_level: requiredText("مستوى إتقان التجويد مطلوب"),
    has_islamic_studies: z.enum(["yes", "no"], {
      error: "الإجابة على هذا السؤال مطلوبة",
    }),
    islamic_studies_source: z.string().trim(),
    skills: z.string().trim(),
  })
  .check((ctx) => {
    const v = ctx.value;
    if (v.academic_status === "other" && !v.academic_status_other) {
      ctx.issues.push({
        code: "custom",
        path: ["academic_status_other"],
        message: "يرجى تحديد الحالة الدراسية",
        input: v.academic_status_other,
      });
    }
    if (v.faculty === "other" && !v.faculty_other) {
      ctx.issues.push({
        code: "custom",
        path: ["faculty_other"],
        message: "يرجى تحديد الكلية",
        input: v.faculty_other,
      });
    }
    if (v.has_islamic_studies === "yes" && !v.islamic_studies_source) {
      ctx.issues.push({
        code: "custom",
        path: ["islamic_studies_source"],
        message: "يرجى ذكر مصدر تلقي العلم الشرعي",
        input: v.islamic_studies_source,
      });
    }
  });

export type ProfileInfoValues = z.infer<typeof profileInfoSchema>;

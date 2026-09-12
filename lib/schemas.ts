import { z } from "zod";

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

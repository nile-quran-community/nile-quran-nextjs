"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneInputField from "react-phone-number-input/react-hook-form";
import { Tajawal } from "next/font/google";
import {
  Pencil,
  Phone,
  Cake,
  GraduationCap,
  Building2,
  CalendarRange,
  MapPin,
  Home,
  BookOpen,
  Sparkles,
  HeartHandshake,
  Wrench,
  Loader2,
  Check,
  AlertCircle,
  IdCard,
} from "lucide-react";
import { updateUser } from "@/actions/profile";
import FieldError from "@/components/ui/field-error";
import SectionHeading from "./SectionHeading";
import { profileInfoSchema, type ProfileInfoValues } from "@/lib/schemas";
import {
  ACADEMIC_STATUS_OPTIONS,
  FACULTY_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  TAJWEED_LEVEL_OPTIONS,
  type ProfileFields,
} from "@/lib/profile-fields";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

interface Props {
  userId: number;
  fields: ProfileFields;
}

/**
 * The community-profile questions (faculty, Quran progress, tajweed level, …)
 * collected once after signup. Read-only summary by default; "تعديل" swaps in
 * the form. Opens on the form directly when the profile is still incomplete.
 * This is also where the nag banner/modal send a member.
 */
export default function PersonalInfoSection({ userId, fields }: Props) {
  const [isEditing, setIsEditing] = useState(!fields.is_profile_complete);

  return (
    <section
      id="personal-info"
      aria-labelledby="personal-info-heading"
      className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-4 scroll-mt-24"
    >
      <div className="flex items-center justify-between gap-2">
        <SectionHeading
          id="personal-info-heading"
          icon={<IdCard className="w-4 h-4" strokeWidth={2.2} />}
          title="بيانات إضافية"
          sub={fields.is_profile_complete ? undefined : "أكمل بياناتك ليتعرف عليك مجتمعك"}
        />
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={`${tajawal.className} shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#F7FBEA] border border-[#043F2E]/15 text-[#043F2E] text-xs font-bold hover:bg-[#BEE663]/30 transition-colors`}
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2.4} />
            تعديل
          </button>
        )}
      </div>

      {isEditing ? (
        <PersonalInfoForm userId={userId} fields={fields} onDone={() => setIsEditing(false)} />
      ) : (
        <ReadOnlyGrid fields={fields} />
      )}
    </section>
  );
}

function Tile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3">
      <div
        className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 text-[#043F2E]/70"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/60`}>
          {label}
        </span>
        <span className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function ReadOnlyGrid({ fields: f }: { fields: ProfileFields }) {
  const items = [
    { icon: <Phone className="w-4 h-4" strokeWidth={2.2} />, label: "رقم الهاتف", value: f.phone_number },
    { icon: <Cake className="w-4 h-4" strokeWidth={2.2} />, label: "تاريخ الميلاد", value: f.birth_date ?? "" },
    {
      icon: <GraduationCap className="w-4 h-4" strokeWidth={2.2} />,
      label: "الحالة الدراسية",
      value:
        f.academic_status === "other"
          ? f.academic_status_other
          : labelFor(ACADEMIC_STATUS_OPTIONS, f.academic_status),
    },
    {
      icon: <Building2 className="w-4 h-4" strokeWidth={2.2} />,
      label: "الكلية",
      value: f.faculty === "other" ? f.faculty_other : labelFor(FACULTY_OPTIONS, f.faculty),
    },
    {
      icon: <CalendarRange className="w-4 h-4" strokeWidth={2.2} />,
      label: "السنة الدراسية",
      value: labelFor(ACADEMIC_YEAR_OPTIONS, f.academic_year),
    },
    { icon: <Home className="w-4 h-4" strokeWidth={2.2} />, label: "مكان الإقامة الحالي", value: f.residence },
    { icon: <MapPin className="w-4 h-4" strokeWidth={2.2} />, label: "الموطن الأصلي", value: f.hometown },
    {
      icon: <BookOpen className="w-4 h-4" strokeWidth={2.2} />,
      label: "الأجزاء المحفوظة",
      value: f.memorized_juz === null ? "" : `${f.memorized_juz} جزء`,
    },
    {
      icon: <Sparkles className="w-4 h-4" strokeWidth={2.2} />,
      label: "مستوى التجويد",
      value: labelFor(TAJWEED_LEVEL_OPTIONS, f.tajweed_level),
    },
    {
      icon: <HeartHandshake className="w-4 h-4" strokeWidth={2.2} />,
      label: "علم شرعي سابق",
      value:
        f.has_islamic_studies === null
          ? ""
          : f.has_islamic_studies
            ? f.islamic_studies_source || "نعم"
            : "لا",
    },
    { icon: <Wrench className="w-4 h-4" strokeWidth={2.2} />, label: "المهارات", value: f.skills },
  ].filter((item) => item.value);

  if (items.length === 0) {
    return (
      <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>
        لم تُضَف أي بيانات بعد — اضغط &quot;تعديل&quot; للبدء.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" dir="rtl">
      {items.map((item) => (
        <Tile key={item.label} icon={item.icon} label={item.label} value={item.value} />
      ))}
    </div>
  );
}

function PersonalInfoForm({
  userId,
  fields: f,
  onDone,
}: {
  userId: number;
  fields: ProfileFields;
  onDone: () => void;
}) {
  const router = useRouter();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sameAsResidence, setSameAsResidence] = useState(
    Boolean(f.residence) && f.residence === f.hometown,
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInfoValues>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues: {
      phone_number: f.phone_number || "",
      birth_date: f.birth_date || "",
      academic_status: f.academic_status || "",
      academic_status_other: f.academic_status_other || "",
      faculty: f.faculty || "",
      faculty_other: f.faculty_other || "",
      academic_year: f.academic_year || "",
      residence: f.residence || "",
      hometown: f.hometown || "",
      memorized_juz: f.memorized_juz ?? (undefined as unknown as number),
      tajweed_level: f.tajweed_level || "",
      has_islamic_studies: (f.has_islamic_studies === true
        ? "yes"
        : f.has_islamic_studies === false
          ? "no"
          : "") as ProfileInfoValues["has_islamic_studies"],
      islamic_studies_source: f.islamic_studies_source || "",
      skills: f.skills || "",
    },
  });

  const academicStatus = watch("academic_status");
  const faculty = watch("faculty");
  const hasIslamicStudies = watch("has_islamic_studies");
  const residence = watch("residence");

  // The hometown input is unmounted while this is checked, so its RHF value
  // would otherwise sit frozen (usually empty) and fail the "required" check
  // silently — the field owning that error isn't even on screen to show it.
  useEffect(() => {
    if (sameAsResidence) setValue("hometown", residence, { shouldValidate: true });
  }, [sameAsResidence, residence, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setResult(null);

    const res = await updateUser(userId, {
      phone_number: values.phone_number,
      birth_date: values.birth_date,
      academic_status: values.academic_status as ProfileFields["academic_status"],
      academic_status_other: values.academic_status === "other" ? values.academic_status_other : "",
      faculty: values.faculty as ProfileFields["faculty"],
      faculty_other: values.faculty === "other" ? values.faculty_other : "",
      academic_year: values.academic_year as ProfileFields["academic_year"],
      residence: values.residence,
      hometown: sameAsResidence ? values.residence : values.hometown,
      memorized_juz: values.memorized_juz,
      tajweed_level: values.tajweed_level as ProfileFields["tajweed_level"],
      has_islamic_studies: values.has_islamic_studies === "yes",
      islamic_studies_source:
        values.has_islamic_studies === "yes" ? values.islamic_studies_source : "",
      skills: values.skills,
    });

    if (res.success) {
      setResult({ success: true, message: "تم حفظ بياناتك بنجاح" });
      router.refresh();
      setTimeout(onDone, 1200);
    } else {
      setResult({ success: false, message: res.error || "تعذّر حفظ البيانات" });
    }
  });

  const inputClass = `${tajawal.className} w-full h-11 px-4 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors text-sm font-medium`;
  const labelClass = `${tajawal.className} text-xs font-bold text-[#043F2E]/70`;

  return (
    <form onSubmit={onSubmit} noValidate dir="rtl" className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>رقم الهاتف</label>
          <PhoneInputField
            name="phone_number"
            control={control}
            defaultCountry="EG"
            international
            countryCallingCodeEditable={false}
          />
          <FieldError message={errors.phone_number?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>تاريخ الميلاد</label>
          <input type="date" className={inputClass} {...register("birth_date")} />
          <FieldError message={errors.birth_date?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>الحالة الدراسية</label>
          <select className={inputClass} {...register("academic_status")}>
            <option value="">اختر...</option>
            {ACADEMIC_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.academic_status?.message} />
        </div>

        {academicStatus === "other" && (
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>حدد الحالة الدراسية</label>
            <input className={inputClass} {...register("academic_status_other")} />
            <FieldError message={errors.academic_status_other?.message} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>الكلية</label>
          <select className={inputClass} {...register("faculty")}>
            <option value="">اختر...</option>
            {FACULTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.faculty?.message} />
        </div>

        {faculty === "other" && (
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>حدد الكلية</label>
            <input className={inputClass} {...register("faculty_other")} />
            <FieldError message={errors.faculty_other?.message} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>السنة الدراسية</label>
          <select className={inputClass} {...register("academic_year")}>
            <option value="">اختر...</option>
            {ACADEMIC_YEAR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.academic_year?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>عدد الأجزاء المحفوظة من القرآن</label>
          <input
            type="number"
            min={0}
            max={30}
            className={inputClass}
            {...register("memorized_juz", { valueAsNumber: true })}
          />
          <FieldError message={errors.memorized_juz?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>مكان الإقامة الحالي (السكن الجامعي)</label>
          <input className={inputClass} {...register("residence")} />
          <FieldError message={errors.residence?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className={labelClass}>الموطن الأصلي</label>
            <label className={`${tajawal.className} flex items-center gap-1.5 text-[11px] text-[#043F2E]/60`}>
              <input
                type="checkbox"
                checked={sameAsResidence}
                onChange={(e) => setSameAsResidence(e.target.checked)}
                className="accent-[#043F2E]"
              />
              نفس مكان الإقامة الحالي
            </label>
          </div>
          {sameAsResidence ? (
            <div className={`${inputClass} flex items-center text-[#043F2E]/60`}>
              {residence || "—"}
            </div>
          ) : (
            <>
              <input className={inputClass} {...register("hometown")} />
              <FieldError message={errors.hometown?.message} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>مستوى إتقان التجويد</label>
          <select className={inputClass} {...register("tajweed_level")}>
            <option value="">اختر...</option>
            {TAJWEED_LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.tajweed_level?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>هل تعلمت علمًا شرعيًا من قبل؟</label>
          <select className={inputClass} {...register("has_islamic_studies")}>
            <option value="">اختر...</option>
            <option value="yes">نعم</option>
            <option value="no">لا</option>
          </select>
          <FieldError message={errors.has_islamic_studies?.message} />
        </div>

        {hasIslamicStudies === "yes" && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelClass}>مصدر تلقي العلم الشرعي</label>
            <input className={inputClass} {...register("islamic_studies_source")} />
            <FieldError message={errors.islamic_studies_source?.message} />
          </div>
        )}

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className={labelClass}>المهارات (تقنية أو شخصية) — اختياري</label>
          <textarea
            rows={2}
            className={`${inputClass} h-auto py-2.5 resize-none`}
            {...register("skills")}
          />
          <FieldError message={errors.skills?.message} />
        </div>
      </div>

      {result && (
        <div
          role={result.success ? "status" : "alert"}
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${
            result.success
              ? "bg-[#DEFF90] border border-[#9ADD00]/40 text-[#043F2E]"
              : "bg-[#F4E0D6] border border-[#9B3D2E]/30 text-[#9B3D2E]"
          }`}
        >
          {result.success ? (
            <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          )}
          <span className={`${tajawal.className} text-xs font-medium`}>{result.message}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${tajawal.className} h-11 px-6 rounded-xl bg-[#043F2E] text-white text-sm font-bold hover:bg-[#065f46] transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
              جارٍ الحفظ...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" strokeWidth={2.4} />
              حفظ البيانات
            </>
          )}
        </button>
        {f.is_profile_complete && (
          <button
            type="button"
            onClick={onDone}
            disabled={isSubmitting}
            className={`${tajawal.className} h-11 px-5 rounded-xl text-[#043F2E]/70 text-sm font-bold hover:bg-[#F7FBEA] transition-colors`}
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
}

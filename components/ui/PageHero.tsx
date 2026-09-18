import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Lalezar, Tajawal } from "next/font/google";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

interface PageHeroProps {
  children: ReactNode;
  // Override the inner container's flex gap when a page's content needs more room than the
  // default heading (e.g. About's logo + tagline + paragraphs).
  innerClassName?: string;
}

// The dark hero band at the top of every main page (control board, about, goals) — background,
// decorative lime corner blurs, and the max-w-4xl container are defined once here so a page's
// header can't drift out of sync with the others by re-implementing its own variant.
export function PageHero({ children, innerClassName = "gap-4" }: PageHeroProps) {
  return (
    <section dir="rtl" className="relative bg-[#043F2E] text-white overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#BEE663]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-[#BEE663]/5 blur-3xl"
      />
      <div
        className={`relative max-w-4xl mx-auto px-6 md:px-10 py-16 md:py-20 flex flex-col ${innerClassName}`}
      >
        {children}
      </div>
    </section>
  );
}

interface PageHeroHeadingProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle?: string;
}

// The icon-badge + eyebrow + title + subtitle heading shared by pages whose hero is just a title
// bar (control board, goals) — as opposed to About's fuller identity section, which supplies its
// own children to PageHero instead.
export function PageHeroHeading({ icon: Icon, eyebrow, title, subtitle }: PageHeroHeadingProps) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-[#BEE663] text-[#043F2E] flex items-center justify-center">
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
        <span
          className={`${tajawal.className} text-[11px] font-bold text-[#BEE663]/70 uppercase tracking-wider`}
        >
          {eyebrow}
        </span>
      </div>
      <h1 className={`${lalezar.className} text-3xl md:text-5xl leading-tight`}>{title}</h1>
      {subtitle && (
        <p className={`${tajawal.className} text-white/70 text-sm md:text-base max-w-xl`}>
          {subtitle}
        </p>
      )}
    </>
  );
}

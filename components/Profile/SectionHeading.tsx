import { Lalezar, Tajawal } from "next/font/google";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

/**
 * The heading every card on the profile opens with: a tinted chip holding the
 * card's icon, the title, and an optional line of context under it.
 *
 * It lives here rather than in each view so the three profile surfaces cannot
 * drift apart — a card on the student dashboard and a card on the supervisor
 * dashboard are one click from each other, and they should look it.
 */
export default function SectionHeading({
  id,
  icon,
  title,
  sub,
  as: Heading = "h2",
}: {
  /** Ties the heading to its section via aria-labelledby */
  id: string;
  icon: React.ReactNode;
  title: string;
  sub?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="w-8 h-8 rounded-lg bg-[#F7FBEA] text-[#043F2E] flex items-center justify-center shrink-0"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <Heading
          id={id}
          className={`${lalezar.className} text-lg text-[#043F2E] leading-tight truncate`}
        >
          {title}
        </Heading>
        {sub && (
          <p className={`${tajawal.className} text-[11px] text-[#043F2E]/60 leading-tight truncate`}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

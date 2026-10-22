import Link from "next/link";
import { Lalezar, Tajawal } from "next/font/google";
import { libraryCategoryLabel, libraryTypeLabel, type LibraryItem } from "@/lib/library";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

export default function LibraryCard({ item }: { item: LibraryItem }) {
  const isBook = item.type === "book";

  return (
    <Link
      href={`/library/${item.id}`}
      dir="rtl"
      className="flex min-w-0 flex-col gap-3 rounded-3xl border border-[#043F2E]/10 bg-white p-4 text-right sm:flex-row sm:items-start sm:gap-4 sm:p-5"
    >
      {item.cover ? (
        <span className="flex w-full shrink-0 items-center justify-center bg-transparent sm:w-40 md:w-48">
          <img
            src={item.cover}
            alt=""
            className={
              isBook
                ? "mx-auto h-auto max-h-52 w-auto max-w-40 object-contain sm:m-3.5 sm:max-h-56 sm:max-w-36"
                : "h-auto w-full max-w-full rounded-xl object-contain"
            }
          />
        </span>
      ) : (
        <span
          className={`${tajawal.className} grid h-28 w-full shrink-0 place-items-center rounded-xl bg-[#043F2E] text-sm font-bold text-[#BEE663] sm:h-36 sm:w-40 md:w-48`}
        >
          {libraryTypeLabel(item.type)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <MixedTitle
          text={item.title}
          className={`${lalezar.className} block text-xl leading-snug text-[#043F2E] sm:text-2xl`}
        />
        <span className="mt-3 flex flex-wrap gap-2">
          <span
            className={`${tajawal.className} rounded-full bg-[#F7FBEA] px-2.5 py-1 text-[13px] font-bold text-[#043F2E] sm:text-xs`}
          >
            {libraryTypeLabel(item.type)}
          </span>
          {item.categories.map((id) => (
            <span
              key={id}
              className={`${tajawal.className} rounded-full bg-[#F7FBEA] px-2.5 py-1 text-[13px] font-bold text-[#043F2E] sm:text-xs`}
            >
              {libraryCategoryLabel(id)}
            </span>
          ))}
        </span>
      </span>
    </Link>
  );
}

export function MixedTitle({ text, className }: { text: string; className: string }) {
  return <span className={className}>{text}</span>;
}

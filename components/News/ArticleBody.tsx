import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import { Tajawal, Lalezar } from "next/font/google";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

// Bodies are written for Discord, so these cover what Discord renders (headings, bold,
// lists, quotes, links). `dir="auto"` on text blocks because one body mixes Arabic, Latin
// and numbers, but not on lists: a list takes its direction from its first letter, so an
// item opening with an @handle or a Latin word turned the whole list (bullets included)
// left to right. Lists follow the page instead. `whitespace-pre-line` keeps Discord's
// single line breaks (the verse in the monthly leaderboard post), which plain Markdown
// would fold into one line.
const components: Components = {
  h1: (p) => (
    <h2 dir="auto" className={`${lalezar.className} text-2xl text-[#043F2E] mt-2`} {...strip(p)} />
  ),
  h2: (p) => (
    <h2 dir="auto" className={`${lalezar.className} text-2xl text-[#043F2E] mt-2`} {...strip(p)} />
  ),
  h3: (p) => (
    <h3 dir="auto" className={`${lalezar.className} text-xl text-[#043F2E] mt-1`} {...strip(p)} />
  ),
  p: (p) => <p dir="auto" className="whitespace-pre-line" {...strip(p)} />,
  ul: (p) => <ul className="list-disc ps-6 flex flex-col gap-1.5" {...strip(p)} />,
  ol: (p) => <ol className="list-[arabic-indic] ps-6 flex flex-col gap-1.5" {...strip(p)} />,
  li: (p) => <li {...strip(p)} />,
  strong: (p) => <strong className="font-bold text-[#043F2E]" {...strip(p)} />,
  blockquote: (p) => (
    <blockquote
      dir="auto"
      className="border-s-4 border-[#BEE663] bg-[#F7FBEA] rounded-e-xl px-4 py-2"
      {...strip(p)}
    />
  ),
  hr: () => <div className="h-px bg-[#043F2E]/10" />,
  a: ({ href, children }) => {
    const className = "text-[#065f46] underline underline-offset-2 font-medium";
    // A site path (a member's profile, from a mention) stays in this tab; anything else is
    // someone else's page and opens in a new one.
    if (href?.startsWith("/") && !href.startsWith("//")) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  },
};

// react-markdown passes the parsed `node` along with the DOM props; it isn't an attribute
function strip<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const { node, ...rest } = props;
  void node;
  return rest;
}

export default function ArticleBody({ content }: { content: string }) {
  return (
    // lang="ar", not just dir: the CSS build turns logical utilities (ps-6, border-s-4,
    // rounded-e-xl) into :lang(ar) rules, and the root <html> is lang="en" (Gotcha #4), so
    // without it list indents and the quote bar land on the left.
    <div
      lang="ar"
      className={`${tajawal.className} text-[#043F2E] text-base leading-8 flex flex-col gap-4`}
    >
      {/* No rehype-raw: raw HTML in a body is dropped, never rendered. Images are refused too,
          so a body can't make every reader's browser fetch an arbitrary URL. */}
      <Markdown components={components} disallowedElements={["img"]}>
        {content}
      </Markdown>
    </div>
  );
}

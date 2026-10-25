// The site's calligraphy pattern, cropped from the auth-page art (public/abstract.png) to
// its dark-green right-hand side. Announcements have no cover images, so this is what
// stands in for one on every card and article header.
export default function Pattern({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`bg-[#043F2E] bg-[url('/abstract.png')] bg-[length:300%_auto] bg-[position:100%_55%] ${className}`}
    />
  );
}

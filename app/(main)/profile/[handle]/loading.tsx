// Branded skeleton shown while the profile page's server data loads
export default function ProfileLoading() {
  return (
    <div className="w-full min-h-screen bg-[#EBF0EB] py-8" dir="rtl">
      <div className="container mx-auto px-4 lg:px-12 max-w-5xl flex flex-col gap-6">
        {/* Header skeleton */}
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#F7FBEA] animate-pulse shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-7 w-48 max-w-full rounded-lg bg-[#F7FBEA] animate-pulse" />
              <div className="h-4 w-32 rounded-lg bg-[#F7FBEA] animate-pulse" />
            </div>
            <div className="h-10 w-28 rounded-xl bg-[#F7FBEA] animate-pulse hidden md:block" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl px-4 py-4 border border-[#043F2E]/10 bg-white shadow-sm flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F7FBEA] animate-pulse shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-3 w-16 rounded bg-[#F7FBEA] animate-pulse" />
                <div className="h-6 w-10 rounded bg-[#F7FBEA] animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Info card skeleton */}
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-3">
          <div className="h-5 w-24 rounded bg-[#F7FBEA] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#F7FBEA] animate-pulse" />
            ))}
          </div>
        </div>

        {/* Content card skeleton */}
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-3">
          <div className="h-5 w-32 rounded bg-[#F7FBEA] animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-[#F7FBEA] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

import Auth from "@/components/Auth/Auth";
import Abstract from "@/public/abstract.png";
import AbstractMob from "@/public/abstract mob.svg";
import { redirect } from "next/navigation";
import { checkTokenValidity } from "@/actions/auth-actions";

export default async function Page({ searchParams }: { searchParams: { mode?: string } }) {
  const User = await checkTokenValidity();
  if (User.isValid) {
    redirect("/");
  }
  const formMode = searchParams.mode || "login";
  return (
    <div className="w-full py-10 min-h-screen bg-[#EBF0EB] flex items-start justify-center max-sm:px-5 max-sm:py-7">
      <div className="relative w-full h-full pl-44 flex flex-col justify-center items-start max-sm:pl-0">
        <div className="fixed z-10 right-0 w-[660px] h-full bottom-0 max-sm:-bottom-60 max-sm:-right-3 max-sm:w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="max-sm:hidden"
            src={Abstract.src}
            alt=""
            style={{
              position: "absolute",
              height: "100%",
              width: "100%",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="sm:hidden"
            src={AbstractMob.src}
            alt=""
            style={{
              position: "absolute",
              height: "100%",
              width: "100%",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
            }}
          />
        </div>
        <Auth mode={formMode} />
      </div>
    </div>
  );
}

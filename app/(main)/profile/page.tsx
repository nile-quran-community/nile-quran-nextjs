import { redirect } from "next/navigation";
import { checkTokenValidity } from "@/actions/auth-actions";

export default async function ProfileRedirect() {
  const { isValid, user } = await checkTokenValidity();

  if (!isValid || !user) {
    redirect("/auth");
  }

  // Aim straight at the readable address. Redirecting to the numeric id first
  // made [handle] redirect a second time, and each hop re-rendered loading.tsx —
  // the skeleton flashed, vanished, then flashed again before the data arrived.
  redirect(`/profile/${encodeURIComponent(user.username ?? user.id)}`);
}

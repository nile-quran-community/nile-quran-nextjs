import { redirect } from "next/navigation";
import { checkTokenValidity } from "@/actions/auth-actions";

export default async function ProfileRedirect() {
  const { isValid, user } = await checkTokenValidity();

  if (!isValid || !user) {
    redirect("/auth");
  }

  redirect(`/profile/${user.id}`);
}

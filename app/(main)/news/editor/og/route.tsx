import { checkTokenValidity } from "@/actions/auth-actions";
import { canEditAnnouncements } from "@/lib/profile-types";
import { renderCard } from "../../_og/card";

// The editor's live preview of the link card, drawn by the same code as the real one but from
// what is typed in the form, so a draft or an unsaved edit can be previewed (the public image
// route only knows published announcements). Editors only: it would otherwise be a way for
// anyone to have this site draw arbitrary text.
export async function GET(request: Request) {
  const User = await checkTokenValidity();
  if (!User.isValid || !canEditAnnouncements(User.user.groups || [])) {
    return new Response(null, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const date = params.get("date");
  return renderCard({
    title: params.get("title")?.slice(0, 255) || undefined,
    typeLabel: params.get("type")?.slice(0, 60) || undefined,
    publishAt: date && !Number.isNaN(new Date(date).getTime()) ? date : null,
    cacheControl: "private, no-store",
  });
}

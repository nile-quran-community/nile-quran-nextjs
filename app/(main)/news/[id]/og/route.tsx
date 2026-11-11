import { getAnnouncementPreview } from "@/actions/announcements";
import { renderCard } from "../../_og/card";

// The link-preview image for /news/<id>, built from the public preview alone (type, title,
// date), never the body, because link crawlers fetch it without logging in. A route handler
// rather than the opengraph-image file convention on purpose: that convention's URL came out
// as http://localhost:<port> in metadata instead of resolving against metadataBase, which
// leaves a crawler with an image it can't fetch. A predictable URL is declared in page.tsx.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const res = Number.isInteger(id) && id > 0 ? await getAnnouncementPreview(id) : null;
  const a = res?.success ? res.data : null;
  return renderCard({ title: a?.title, typeLabel: a?.type_display, publishAt: a?.publish_at });
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { formatHijriDate } from "@/lib/utils";

// Not `next/og`: Next 15.5 bundles Satori 0.15, which can't shape or order Arabic (joined
// letters came out at the wrong width, so word gaps were uneven, and RTL was ignored). Current
// Satori lays text out with HarfBuzz and honours `direction: rtl`, so the card is rendered with
// it directly and turned into a PNG with resvg. Gotcha #16 has the history.
const size = { width: 1200, height: 630 };

interface Card {
  title?: string;
  typeLabel?: string;
  // ISO; shown as a Hijri date
  publishAt?: string | null;
  // The public image is cached briefly; the editor's is per-user and always fresh
  cacheControl?: string;
}

// The one link-preview card, used by the public image for a published announcement
// (/news/<id>/og) and by the editor's live preview of what is being written
// (/news/editor/og), so the preview can't drift from what a crawler gets. Built from the
// public fields only (type, title, date), never the body.
export async function renderCard({
  title,
  typeLabel,
  publishAt,
  cacheControl = "public, max-age=300",
}: Card): Promise<Response> {
  // Read from public/, which the Docker runner copies next to server.js; app/ source isn't there
  const asset = (file: string) => readFile(join(process.cwd(), "public", file));
  const [font, pattern] = await Promise.all([
    asset("fonts/Lalezar-Regular.ttf"),
    asset("og-pattern.png"),
  ]);

  const heading = title || "صحبة صالحة حول القرآن";
  const svg = await satori(
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box", // current Satori is content-box like CSS, so padding would overflow
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        direction: "rtl",
        padding: 72,
        fontFamily: "Lalezar",
        backgroundColor: "#043F2E",
        // A 1200x630 slice of the dark calligraphy in abstract.png, cropped offline into
        // og-pattern.png, so no oversized CSS background crop is needed at render time.
        backgroundImage: `url(data:image/png;base64,${pattern.toString("base64")})`,
        backgroundSize: "100% 100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 48, color: "#BEE663" }}>مقرأة النيل</div>
        {typeLabel && (
          <div
            style={{
              display: "flex",
              background: "#BEE663",
              padding: "4px 26px",
              borderRadius: 999,
              fontSize: 32,
              color: "#043F2E",
            }}
          >
            {typeLabel}
          </div>
        )}
      </div>
      <div
        style={{
          display: "block", // line clamping only applies to a block
          fontSize: heading.length > 80 ? 56 : heading.length > 40 ? 68 : 84,
          lineHeight: 1.3,
          color: "#ffffff",
          lineClamp: 3,
        }}
      >
        {heading}
      </div>
      <div style={{ display: "flex", fontSize: 34, color: "rgba(255,255,255,0.75)" }}>
        {publishAt ? formatHijriDate(publishAt) : "نحو أثر باقٍ"}
      </div>
    </div>,
    { ...size, fonts: [{ name: "Lalezar", data: font, style: "normal", weight: 400 }] },
  );

  return new Response(new Uint8Array(new Resvg(svg).render().asPng()), {
    headers: { "Content-Type": "image/png", "Cache-Control": cacheControl },
  });
}

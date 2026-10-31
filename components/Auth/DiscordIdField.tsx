import { Info } from "lucide-react";

// Where a member can find their Discord user ID — shared by every form that
// collects it (signup + the profile info form).
export const DISCORD_ID_HELP_URL =
  "https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID#h_01HRSTXPS5CRSRTWYCGPHZQ37H";

export default function DiscordIdHelp() {
  return (
    <a
      href={DISCORD_ID_HELP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="كيف أجد معرف ديسكورد الخاص بي؟ (يفتح في تبويب جديد)"
      title="كيف أجد معرف ديسكورد الخاص بي؟"
      className="w-5 h-5 shrink-0 rounded-full bg-[#043F2E]/10 hover:bg-[#BEE663] flex items-center justify-center transition-colors"
    >
      <Info className="w-2.5 h-2.5 text-[#043F2E]" strokeWidth={2.4} />
    </a>
  );
}

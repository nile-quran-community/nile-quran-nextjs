import { Home, Info, LayoutDashboard, Target } from "lucide-react";

export const NAV_LINKS = [
  { href: "/", label: "الصفحة الرئيسية", Icon: Home },
  { href: "/goals", label: "الأهداف", Icon: Target },
  { href: "/about", label: "عن المجتمع", Icon: Info },
  { href: "/control-board", label: "لوحة التحكم", Icon: LayoutDashboard, adminOnly: true },
];

export function isNavLinkActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

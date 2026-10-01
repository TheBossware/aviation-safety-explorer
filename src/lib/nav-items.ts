import type { LucideIcon } from "lucide-react";
import { ClipboardCheck, LayoutDashboard, Newspaper } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Left out of the sidebar but still named in the header; reached by URL or in-page links. */
  hidden?: boolean;
}

export const navMain: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Aviation News", url: "/aviation-news", icon: Newspaper },
  { title: "ISIT Review", url: "/isit-review", icon: ClipboardCheck, hidden: true },
];

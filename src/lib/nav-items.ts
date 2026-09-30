import type { LucideIcon } from "lucide-react";
import { ClipboardCheck, LayoutDashboard, Newspaper } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const navMain: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Aviation News", url: "/aviation-news", icon: Newspaper },
  { title: "ISIT Review", url: "/isit-review", icon: ClipboardCheck },
];

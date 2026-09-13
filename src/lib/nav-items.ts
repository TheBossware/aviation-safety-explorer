import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Newspaper, Users2, Rss } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export const navMain: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Aviation News", url: "/aviation-news", icon: Newspaper },
  // { title: "Recipient Groups", url: "/recipient-groups", icon: Users2 },
  // { title: "Sources", url: "/sources", icon: Rss },
];

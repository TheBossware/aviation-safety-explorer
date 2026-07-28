"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, Database, MessageSquare, ShieldCheck, Settings, LifeBuoy } from "lucide-react";
import clsx from "clsx";

const nav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Browse", href: "/browse", icon: Compass },
  { name: "Sources", href: "/sources", icon: Database },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">Safety Explorer</div>
          <div className="text-[11px] text-slate-400">Intelligence Platform</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </p>
        {nav.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 pb-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LifeBuoy className="h-[18px] w-[18px]" />
          Help & Support
        </Link>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-sm font-semibold">
            JC
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">Jordan Carter</div>
            <div className="text-[11px] text-slate-400">Safety Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

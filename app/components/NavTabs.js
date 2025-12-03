"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "SQL Explorer" },
  { href: "/pivot", label: "Pivot Table" },
];

export default function NavTabs({ className = "" }) {
  const pathname = usePathname();

  return (
    <nav
      className={`flex items-center justify-between rounded-full border border-amber-200 bg-white/80 px-3 py-2 text-sm text-stone-800 shadow-md shadow-amber-100/50 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-800">
          BRFSS
        </div>
        <span className="text-xs text-stone-500">Browser tools</span>
      </div>
      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                active
                  ? "bg-amber-600 text-white shadow" 
                  : "bg-white text-stone-800 hover:bg-amber-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

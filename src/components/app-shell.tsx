"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  ClipboardCheck,
  FileBarChart,
  LayoutDashboard,
  Menu,
  RotateCcw,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn, Button } from "@/components/ui";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck },
  { href: "/review", label: "Human Review", icon: ShieldCheck },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { resetDemo } = useStore();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(href)
              ? "bg-teal-500/15 text-teal-300"
              : "text-navy-200 hover:bg-white/5 hover:text-white"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-navy-50">
      {/* Demo-mode banner */}
      <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-center text-xs font-medium text-amber-900">
        Demo mode — all properties, inspections, findings and reviews are fictional demo data. No real AI is connected; suggestions are scripted examples. Uploads persist only in this browser session/storage.
      </div>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between bg-navy-950 px-4 py-5 lg:flex">
          <div>
            <Link href="/" className="mb-6 flex items-center gap-2.5 px-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 text-navy-950">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold tracking-tight text-white">AssetSentinel AI</span>
                <span className="block text-[10px] font-medium uppercase tracking-widest text-teal-400">Demo build</span>
              </span>
            </Link>
            {nav}
          </div>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-navy-300 hover:bg-white/5 hover:text-white"
              onClick={() => {
                if (window.confirm("Reset all demo data back to the seeded demo dataset?")) resetDemo();
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset demo data
            </Button>
            <p className="px-3 text-[10px] leading-relaxed text-navy-400">
              Phase 1 MVP — static demo. Not a structural certification. No real customer data.
            </p>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-navy-950 px-4 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-navy-950">
              <ShieldCheck className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm font-bold text-white">AssetSentinel AI</span>
          </Link>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-navy-200 hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open ? (
          <div className="fixed inset-x-0 top-[57px] z-40 border-b border-navy-800 bg-navy-950 px-4 py-3 shadow-pop lg:hidden">
            {nav}
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start text-navy-300"
              onClick={() => {
                setOpen(false);
                if (window.confirm("Reset all demo data back to the seeded demo dataset?")) resetDemo();
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset demo data
            </Button>
          </div>
        ) : null}

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 pb-16 pt-[72px] sm:px-6 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

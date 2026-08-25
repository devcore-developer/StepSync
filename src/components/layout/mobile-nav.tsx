"use client";

import { useState } from "react";
import DashboardSidebar from "./dashboard-sidebar";
import { Menu, X } from "lucide-react";
import NotificationBell from "@/components/shared/notification-bell";
import Link from "next/link";

interface MobileNavProps {
  userName?: string;
}

export default function MobileNav({ userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-brand-surface transition-colors"
        >
          <Menu className="h-5 w-5 text-brand-navy" />
        </button>

        <Link
          href="/dashboard"
          className="text-base font-bold text-brand-navy"
        >
          StepSync
        </Link>

        <div className="flex items-center gap-1">
          <NotificationBell />
        </div>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-over */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-64 transform transition-transform duration-200 ease-out lg:hidden"
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-surface hover:bg-brand-surface-alt transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <DashboardSidebar userName={userName} onClose={() => setOpen(false)} />
      </div>
    </>
  );
}
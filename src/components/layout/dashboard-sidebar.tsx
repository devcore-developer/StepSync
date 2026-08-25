"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Users,
  MessageSquare,
  Bell,
  UserCircle,
  Settings,
  LogOut,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const NAV_SECTIONS = [
  {
    label: "الرئيسية",
    items: [
      { label: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "الدراسة",
    items: [
      { label: "خطتي الدراسية", href: "/study-plan", icon: BookOpen },
      { label: "التحليلات", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "المجتمع",
    items: [
      { label: "المجموعات", href: "/groups", icon: Users },
      { label: "الشركاء", href: "/partners", icon: Stethoscope },
      { label: "الرسائل", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    label: "الحساب",
    items: [
      { label: "الإشعارات", href: "/notifications", icon: Bell },
      { label: "الملف الشخصي", href: "/profile", icon: UserCircle },
      { label: "الإعدادات", href: "/settings/notifications", icon: Settings },
    ],
  },
];

interface DashboardSidebarProps {
  userName?: string;
  onClose?: () => void;
}

export default function DashboardSidebar({
  userName,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-l bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red">
          <Stethoscope className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-brand-navy tracking-tight">
          StepSync
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-blue text-white"
                      : "text-muted-foreground hover:bg-brand-surface hover:text-brand-navy"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t p-3">
        {userName && (
          <div className="mb-2 px-3">
            <p className="text-sm font-medium text-brand-navy truncate">
              {userName}
            </p>
          </div>
        )}
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-brand-light-red hover:text-brand-red transition-colors"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
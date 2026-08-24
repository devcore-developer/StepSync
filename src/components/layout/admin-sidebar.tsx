"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  BookOpen,
  MessageSquare,
  UsersRound,
  Settings,
  ShieldCheck,
  Activity,
  FolderTree,
  FileText,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    label: "نظرة عامة",
    items: [
      { label: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
      { label: "التحليلات", href: "/admin/analytics", icon: BarChart3 },
      { label: "سجل النشاط", href: "/admin/activity", icon: Activity },
    ],
  },
  {
    label: "المستخدمون",
    items: [
      { label: "إدارة المستخدمين", href: "/admin/users", icon: Users },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { label: "الأنظمة", href: "/admin/systems", icon: Layers },
      { label: "الفصول", href: "/admin/chapters", icon: BookOpen },
      { label: "المصادر", href: "/admin/resources", icon: FileText },
      { label: "القوالب", href: "/admin/templates", icon: FolderTree },
    ],
  },
  {
    label: "الاجتماعي",
    items: [
      { label: "المجموعات", href: "/admin/groups", icon: UsersRound },
      { label: "الشركاء", href: "/admin/partners", icon: ShieldCheck },
      { label: "الرسائل", href: "/admin/messages", icon: MessageSquare },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      { label: "الإعدادات", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col bg-sidebar text-sidebar-foreground shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 font-bold text-sm"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-red">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span>لوحة التحكم</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 mb-1 text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                  pathname === item.href &&
                    "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          العودة للموقع
        </Link>
      </div>
    </aside>
  );
}
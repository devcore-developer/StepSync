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
  ArrowRight,
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
    items: [{ label: "إدارة المستخدمين", href: "/admin/users", icon: Users }],
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
    items: [{ label: "الإعدادات", href: "/admin/settings", icon: Settings }],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col bg-brand-navy text-white/80 shrink-0">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-red">
          <ShieldCheck className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-white">لوحة الإدارة</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2.5">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-3 mb-1 text-[10px] font-semibold text-white/35 uppercase tracking-wider">
              {section.label}
            </p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-brand-blue text-white font-medium"
                    : "text-white/55 hover:bg-white/8 hover:text-white/90"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          العودة للموقع
        </Link>
      </div>
    </aside>
  );
}
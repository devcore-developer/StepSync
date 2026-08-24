// src/app/(admin)/admin/page.tsx
import { getDashboardStats } from "@/actions/admin/dashboard";
import {
  Users,
  BookOpen,
  CheckCircle2,
  MessageSquare,
  UsersRound,
  Bell,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards: Array<{
    label: string;
    value?: string | number;
    icon: typeof Users;
    sub?: string;
    href?: string;
    color?: string;
  }> = [
    {
      label: "إجمالي المستخدمين",
      value: stats.totalUsers,
      icon: Users,
      sub: `+${stats.newUsers} أسبوع الماضي`,
      href: "/admin/users",
    },
    {
      label: "خطط دراسية نشطة",
      value: stats.activePlans,
      icon: BookOpen,
      sub: `${stats.completedPlans} مكتملة`,
      color: "text-green-600",
    },
    {
      label: "شركاء مقبولين",
      value: stats.totalPartners,
      icon: CheckCircle2,
      href: "/admin/partners",
    },
    {
      label: "مجموعات دراسية",
      value: stats.totalGroups,
      icon: UsersRound,
      href: "/admin/groups",
    },
    {
      label: "رسائل",
      value: stats.totalMessages,
      icon: MessageSquare,
    },
    {
      label: "إشعارات غير مقروءة",
      value: stats.unreadNotifications,
      icon: Bell,
      sub: `من ${stats.totalNotifications} إشعار`,
      href: "/admin/analytics",
    },
    {
      label: "معدل الإنجاز اليومي",
      value: `${Math.round((stats.completedPlans / Math.max(stats.activePlans, 1)) * 100)}%`,
      icon: TrendingUp,
      color: "text-blue-600",
      href: "/admin/analytics",
    },
    {
      label: "تحليلات",
      icon: BarChart3,
      href: "/admin/analytics",
      sub: "تفاصيل استخدام المنصة",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">
          نظرة شاملة على منصة StepSync
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const content = (
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Icon className={card.color ?? "text-muted-foreground"} />
              </div>
              {card.value != null && (
                <p className="text-2xl font-bold">
                  {card.value.toLocaleString("ar-EG")}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              {card.sub && (
                <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
              )}
            </CardContent>
          );

          return (
            <Card
              key={card.label}
              className={
                card.href
                  ? "cursor-pointer hover:shadow-md transition-shadow"
                  : ""
              }
            >
              {card.href ? (
                <Link href={card.href} className="block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
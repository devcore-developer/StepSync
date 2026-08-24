// src/app/(admin)/admin/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getAnalytics } from "@/actions/admin/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Activity,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import type { PlatformAnalytics } from "@/lib/analytics/types";

const RANGES = [
  { value: "7d", label: "آخر 7 أيام" },
  { value: "30d", label: "آخر 30 يوم" },
  { value: "90d", label: "آخر 90 يوم" },
];

function MiniBar({ value, max, color = "bg-primary/70" }: { value: number; max: number; color?: string }) {
  const m = max > 0 ? max : 1;
  return (
    <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
      <div
        className={`h-full rounded-sm ${color}`}
        style={{ width: `${Math.max((value / m) * 100, value > 0 ? 3 : 0)}%` }}
      />
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Icon className="text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function DetailBlock({ title, items }: { title: string; items: Array<{ label: string; value: string | number }> }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DistributionBar({ items }: { items: Array<{ label: string; count: number }> }) {
  const total = items.reduce((s, x) => s + x.count, 0);
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
        return (
          <div key={item.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="truncate max-w-[140px]">{item.label}</span>
              <span className="text-muted-foreground tabular-nums">{item.count} ({pct}%)</span>
            </div>
            <MiniBar value={item.count} max={total} color={colors[i % colors.length]} />
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnalytics({ range })
      .then((d) => setData(d as unknown as PlatformAnalytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range]);

  const newUsersArr = data?.userGrowth.map((u) => u.newUsers) ?? [];
  const activeUsersArr = data?.userGrowth.map((u) => u.activeUsers) ?? [];
  const completionsArr = data?.taskCompletions.map((t) => t.completions) ?? [];

  const maxNewUsers = newUsersArr.length > 0 ? Math.max(...newUsersArr) : 0;
  const maxActiveUsers = activeUsersArr.length > 0 ? Math.max(...activeUsersArr) : 0;
  const maxCompletions = completionsArr.length > 0 ? Math.max(...completionsArr) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تحليلات المنصة</h1>
          <p className="text-muted-foreground mt-1">إحصائيات استخدام المنصة</p>
        </div>
        <Select value={range} onValueChange={(v) => { if (v) setRange(v); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4 py-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="إجمالي المستخدمين" value={data.users.total} sub={`+${data.users.newInPeriod} في هذه الفترة`} />
            <KpiCard icon={Activity} label="مستخدمون نشطون" value={data.engagement.usersActive7d} sub={`من ${data.users.total} مستخدم`} />
            <KpiCard icon={BookOpen} label="خطط نشطة" value={data.studyPlans.active} sub={`${data.studyPlans.completed} مكتملة`} />
            <KpiCard icon={TrendingUp} label="متوسط التقدم" value={`${data.engagement.avgPlanProgress}%`} sub={`${data.studyPlans.behind} متأخرة`} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">نمو المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500" /> مستخدمون جدد</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500" /> نشطون</span>
              </div>
              <div className="space-y-1.5">
                {data.userGrowth.map((d) => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0 tabular-nums">
                      {new Date(d.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                    </span>
                    <MiniBar value={d.newUsers} max={maxNewUsers} color="bg-blue-500" />
                    <MiniBar value={d.activeUsers} max={maxActiveUsers} color="bg-green-500" />
                    <span className="text-[10px] tabular-nums w-8 text-right shrink-0">{d.newUsers}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">إنجاز المهام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {data.taskCompletions.map((d) => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0 tabular-nums">
                      {new Date(d.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                    </span>
                    <MiniBar value={d.completions} max={maxCompletions} />
                    <span className="text-[10px] tabular-nums w-8 text-right shrink-0">{d.completions}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailBlock title="المستخدمون" items={[
              { label: "إجمالي", value: data.users.total },
              { label: "جدد هذا الأسبوع", value: data.users.newThisWeek },
              { label: "جدد هذا الشهر", value: data.users.newThisMonth },
              { label: "مستكملين", value: data.users.onboarded },
              { label: "معدل الاستكمال", value: `${data.users.onboardingRate}%` },
            ]} />
            <DetailBlock title="الخطط الدراسية" items={[
              { label: "إجمالي", value: data.studyPlans.total },
              { label: "نشطة", value: data.studyPlans.active },
              { label: "مكتملة", value: data.studyPlans.completed },
              { label: "متأخرة", value: data.studyPlans.behind },
              { label: "في خطر", value: data.studyPlans.atRisk },
            ]} />
            <DetailBlock title="التفاعل" items={[
              { label: "نشطين (7 أيام)", value: data.engagement.usersActive7d },
              { label: "نشطين (30 يوم)", value: data.engagement.usersActive30d },
              { label: "متوسط مهمات/مستخدم", value: data.engagement.avgTasksPerActiveUser },
              { label: "متوسط تقدم", value: `${data.engagement.avgPlanProgress}%` },
              { label: "إنجازات (7 أيام)", value: data.engagement.taskCompletions7d },
            ]} />
            <DetailBlock title="الاجتماعي" items={[
              { label: "شركاء مقبولين", value: data.social.totalPartners },
              { label: "طلبات معلقة", value: data.social.pendingRequests },
              { label: "مجموعات نشطة", value: data.social.activeGroups },
              { label: "أعضاء المجموعات", value: data.social.totalGroupMembers },
              { label: "محادثات", value: data.social.totalConversations },
            ]} />
            <DetailBlock title="الرسائل" items={[
              { label: "إجمالي", value: data.messaging.totalMessages },
              { label: "هذا الأسبوع", value: data.messaging.messagesThisWeek },
              { label: "محادثات نشطة", value: data.messaging.activeConversations },
            ]} />
            <DetailBlock title="الإشعارات" items={[
              { label: "إجمالي", value: data.notifications.total },
              { label: "غير مقروءة", value: data.notifications.unread },
              { label: "هذا الأسبوع", value: data.notifications.createdThisWeek },
            ]} />
          </div>

          {data.ai.total > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">الذكاء الاصطناعي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold">{data.ai.total}</p>
                    <p className="text-[10px] text-muted-foreground">إجمالي</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold">{data.ai.thisWeek}</p>
                    <p className="text-[10px] text-muted-foreground">هذا الأسبوع</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-xl font-bold">{data.ai.byType.length}</p>
                    <p className="text-[10px] text-muted-foreground">أنواع</p>
                  </div>
                </div>
                <DistributionBar items={data.ai.byType.map((a) => ({ label: a.type, count: a.count }))} />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">حسب المرحلة</CardTitle></CardHeader>
              <CardContent>
                {data.distribution.byUsmleStage.length > 0 ? (
                  <DistributionBar items={data.distribution.byUsmleStage.map((s) => ({ label: s.stage, count: s.count }))} />
                ) : <p className="text-xs text-muted-foreground text-center py-6">لا توجد بيانات</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">حسب السنة الدراسية</CardTitle></CardHeader>
              <CardContent>
                {data.distribution.byAcademicYear.length > 0 ? (
                  <DistributionBar items={data.distribution.byAcademicYear.map((y) => ({ label: y.year, count: y.count }))} />
                ) : <p className="text-xs text-muted-foreground text-center py-6">لا توجد بيانات</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">حالة الخطط</CardTitle></CardHeader>
              <CardContent>
                {data.distribution.plansByStatus.length > 0 ? (
                  <DistributionBar items={data.distribution.plansByStatus.map((p) => ({ label: p.status, count: p.count }))} />
                ) : <p className="text-xs text-muted-foreground text-center py-6">لا توجد بيانات</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
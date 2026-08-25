import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudyPlan, getUserDrift } from "@/actions/student/study-plans";
import { getMyGroups } from "@/actions/student/groups";
import {
  getPlanProgress,
  isPlanCompleted,
  getLatestCompletionDate,
  getTodayTasks,
} from "@/lib/progress";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AccountabilityCard from "@/components/shared/accountability-card";
import PageHeader from "@/components/shared/page-header";
import StatCard from "@/components/shared/stat-card";
import AIInsightCard from "@/components/shared/ai-insight-card";
import EmptyState from "@/components/shared/empty-state";
import { getUnreadMessageCount } from "@/actions/student/messages";
import {
  BookOpen,
  Users,
  MessageSquare,
  Handshake,
  Trophy,
  Target,
  CheckCircle2,
} from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  return "مساء الخير";
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [plan, drift, myGroups, unreadCount] = await Promise.all([
    getStudyPlan(session.user.id!).catch(() => null),
    getUserDrift().catch(() => null),
    getMyGroups().catch(() => null),
    getUnreadMessageCount().catch(() => 0),
  ]);

  if (!plan) {
    return (
      <div>
        <PageHeader
          title={`${getGreeting()}، ${session.user.name || "مستخدم"}`}
          description="ابدأ رحلتك التعليمية"
        />
        <EmptyState
          icon={BookOpen}
          title="ابدأ رحلتك"
          description="لم تنشئ خطة دراسية بعد. اختر قالباً للبدء في التعلم المنظم."
          actionLabel="تصفح القوالب"
          actionHref="/plans"
        />
      </div>
    );
  }

  const progress = getPlanProgress(plan.milestones);
  const completed = isPlanCompleted(plan.milestones);
  const completionDate = completed
    ? getLatestCompletionDate(plan.milestones)
    : null;
  const todayTasks = getTodayTasks(plan.milestones);

  const currentMilestone = plan.milestones.find((m) => {
    const mp = m.tasks.filter((t) => !t.isOptional);
    return mp.length > 0 && mp.some((t) => t.status !== "COMPLETED");  });

  const allMyGroups = [
    ...(myGroups?.owned ?? []),
    ...(myGroups?.admin ?? []),
    ...(myGroups?.member ?? []),
  ].slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()}، ${session.user.name || "مستخدم"}`}
        description={plan.title}
      />

      {completed && (
        <div className="rounded-xl border border-brand-gold/25 bg-brand-light-gold p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gold/20">
            <Trophy className="h-5 w-5 text-brand-gold" />
          </div>
          <div>
            <p className="font-semibold text-brand-navy">تم إكمال الخطة!</p>
            {completionDate && (
              <p className="text-sm text-muted-foreground">
                تاريخ الإكمال:{" "}
                {new Date(completionDate).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {drift && (
        <AccountabilityCard
          drift={drift}
          variant="full"
          onReschedule={async () => {
            "use server";
          }}
          canReschedule={
            drift.status !== "ON_TRACK" && drift.status !== "COMPLETED"
          }
        />
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="التقدم العام"
          value={`${progress.percentage}%`}
          subtitle={`${progress.completed} من ${progress.total}`}
          icon={Target}
          iconColor="blue"
          progress={progress.percentage}
        />
        <StatCard
          label="مهام متبقية"
          value={todayTasks.length}
          subtitle={todayTasks.length === 0 ? "مكتملة" : "بحاجة للإنجاز"}
          icon={CheckCircle2}
          iconColor={todayTasks.length === 0 ? "gold" : "blue"}
        />
        <StatCard
          label="المرحلة الحالية"
          value={currentMilestone ? currentMilestone.title.slice(0, 15) : "—"}
          subtitle={currentMilestone ? "جاري الدراسة" : ""}
          icon={BookOpen}
          iconColor="navy"
        />
        <StatCard
          label="رسائل جديدة"
          value={unreadCount}
          subtitle={unreadCount === 0 ? "صفر رسائل" : "بحاجة للقراءة"}
          icon={MessageSquare}
          iconColor={unreadCount > 0 ? "red" : "navy"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ملخص المهام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayTasks.length === 0 ? (
                <div className="flex items-center justify-between rounded-lg border border-brand-gold/20 bg-brand-light-gold p-4">
                  <div>
                    <p className="text-sm font-medium text-brand-navy">
                      أكملت جميع المهام
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      لا توجد مهام متبقية — أحسنت!
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/20">
                    <Trophy className="h-5 w-5 text-brand-gold" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium text-brand-navy">
                      مهام متبقية للإنجاز
                    </p>
                    <p className="text-2xl font-bold text-brand-blue mt-1">
                      {todayTasks.length}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light-blue">
                    <CheckCircle2 className="h-6 w-6 text-brand-blue" />
                  </div>
                </div>
              )}
              <Link href="/study-plan" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  عرض الخطة كاملة
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <AIInsightCard
            description="بناءً على أدائك الحالي، ننصحك بالتركيز على المواضيع ذات التقدم الأقل لتحقيق توازن أفضل في دراستك."
            action="عرض التوصيات"
          />

          <div className="grid grid-cols-2 gap-3">
            <Link href="/partners">
              <div className="rounded-xl border bg-card p-3.5 text-center transition-shadow hover:shadow-sm cursor-pointer">
                <Handshake className="mx-auto h-5 w-5 text-brand-blue mb-1.5" />
                <p className="text-xs font-medium text-brand-navy">الشركاء</p>
              </div>
            </Link>
            <Link href="/groups">
              <div className="rounded-xl border bg-card p-3.5 text-center transition-shadow hover:shadow-sm cursor-pointer">
                <Users className="mx-auto h-5 w-5 text-brand-blue mb-1.5" />
                <p className="text-xs font-medium text-brand-navy">المجموعات</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {progress.bySystem.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-brand-navy mb-3">
            التقدم حسب النظام
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {progress.bySystem.map((sys) => (
              <Card key={sys.systemId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-brand-navy">
                      {sys.systemName}
                    </p>
                    {sys.percentage === 100 && (
                      <Badge variant="gold" className="text-[10px]">
                        مكتمل
                      </Badge>
                    )}
                  </div>
                  <p className="text-xl font-bold text-brand-navy mb-1">
                    {sys.percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground mb-2.5">
                    {sys.completed} من {sys.total} مهمة
                  </p>
                  <div className="h-1.5 rounded-full bg-brand-surface-alt overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sys.percentage === 100
                          ? "bg-brand-gold"
                          : "bg-brand-blue"
                      }`}
                      style={{ width: `${sys.percentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {allMyGroups.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-brand-navy">
              مجموعاتي الدراسية
            </h2>
            <Link href="/groups/my">
              <Button variant="ghost" size="sm">
                عرض الكل
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {allMyGroups.map((m: any) => {
              const g = m.group;
              return (
                <Link key={g.id} href={`/groups/${g.id}`}>
                  <Card className="hover:shadow-sm transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-brand-navy truncate">
                        {g.name}
                      </p>
                      {g.currentSystem && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {g.currentSystem.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {g._count.members} عضو
                        {g.visibility === "PRIVATE" ? " · خاص" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
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
import { getUnreadMessageCount } from "@/actions/student/messages";
import {
  BookOpen,
  Users,
  MessageSquare,
  Handshake,
  Trophy,
} from "lucide-react";

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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">
            مرحباً، {session.user.name || "مستخدم"}
          </h1>
          <p className="text-muted-foreground mt-1">ابدأ رحلتك التعليمية</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10">
              <BookOpen className="h-7 w-7 text-brand-blue" />
            </div>
            <h2 className="text-xl font-semibold text-brand-navy">
              ابدأ رحلتك
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              لم تنشئ خطة دراسية بعد. اختر قالباً للبدء في التعلم المنظم.
            </p>
            <Link href="/plans" className="mt-6">
              <Button variant="cta" size="xl">
                تصفح القوالب
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = getPlanProgress(plan.milestones);
  const completed = isPlanCompleted(plan.milestones);
  const completionDate = completed
    ? getLatestCompletionDate(plan.milestones)
    : null;
  const todayTasks = getTodayTasks(plan.milestones);
  const todayCompleted = todayTasks.filter(
    (t) => t.status === "COMPLETED"
  ).length;

  const currentMilestone = plan.milestones.find((m) => {
    const mp = m.tasks.filter((t) => !t.isOptional);
    return mp.length > 0 && mp.some((t) => t.status !== "COMPLETED");
  });

  const allMyGroups = [
    ...(myGroups?.owned ?? []),
    ...(myGroups?.admin ?? []),
    ...(myGroups?.member ?? []),
  ].slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-navy">
          مرحباً، {session.user.name || "مستخدم"}
        </h1>
        <p className="text-muted-foreground mt-1">تابع تقدمك في خطة الدراسة</p>
      </div>

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

      {completed && (
        <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/5 p-6 text-center">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold/15">
            <Trophy className="h-6 w-6 text-brand-gold" />
          </div>
          <h2 className="text-xl font-bold text-brand-navy">تم إكمال الخطة!</h2>
          {completionDate && (
            <p className="text-sm text-muted-foreground mt-1">
              تاريخ الإكمال:{" "}
              {new Date(completionDate).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{plan.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">التقدم العام</span>
            <span className="text-sm font-semibold text-brand-blue">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`rounded-full h-3 transition-all duration-500 ${
                completed ? "bg-brand-gold" : "bg-brand-blue"
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-left text-sm font-bold text-brand-navy">
            {progress.percentage}%
          </p>

          {currentMilestone && !completed && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                المرحلة الحالية
              </p>
              <p className="text-sm font-medium">{currentMilestone.title}</p>
            </div>
          )}

          {!completed && (
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">مهام اليوم</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {todayCompleted} / {todayTasks.length} مكتملة
                </p>
                {todayCompleted === todayTasks.length &&
                  todayTasks.length > 0 && (
                    <Badge variant="gold">مكتمل</Badge>
                  )}
              </div>
              {todayTasks.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  لا توجد مهام متبقية اليوم
                </p>
              )}
            </div>
          )}

          <Link href="/study-plan" className="block pt-2">
            <Button variant="blue-outline" className="w-full">
              عرض الخطة كاملة
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* ── My Study Groups ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-brand-navy">مجموعاتي الدراسية</h2>
          <div className="flex gap-2">
            <Link href="/groups/my">
              <Button variant="ghost" size="sm">
                عرض الكل
              </Button>
            </Link>
            <Link href="/groups/create">
              <Button variant="ghost" size="sm">
                إنشاء مجموعة
              </Button>
            </Link>
          </div>
        </div>
        {allMyGroups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                لم تنضم لأي مجموعة دراسية بعد
              </p>
              <Link href="/groups" className="inline-block mt-3">
                <Button variant="blue-outline" size="sm">
                  تصفح المجموعات
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allMyGroups.map((m: any) => {
              const g = m.group;
              return (
                <Link key={g.id} href={`/groups/${g.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-4 space-y-2">
                      <p className="font-medium text-sm text-brand-navy truncate">
                        {g.name}
                      </p>
                      {g.currentSystem && (
                        <p className="text-xs text-muted-foreground">
                          {g.currentSystem.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {g._count.members} عضو
                        {g.visibility === "PRIVATE" ? " · خاص" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Access ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/partners">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue/10">
                <Handshake className="h-4.5 w-4.5 text-brand-blue" />
              </div>
              <p className="font-medium text-sm text-brand-navy">
                شركاء الدراسة
              </p>
              <p className="text-xs text-muted-foreground">
                اعثر على شريك دراسي
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/partners/my">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gold/15">
                <Users className="h-4.5 w-4.5 text-brand-gold" />
              </div>
              <p className="font-medium text-sm text-brand-navy">شركائي</p>
              <p className="text-xs text-muted-foreground">
                الطلبات والشراكات
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/messages" className="relative">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue/10">
                <MessageSquare className="h-4.5 w-4.5 text-brand-blue" />
              </div>
              <p className="font-medium text-sm text-brand-navy">الرسائل</p>
              <p className="text-xs text-muted-foreground">مراسلة الشركاء</p>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-white text-[10px] font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/groups">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue/10">
                <BookOpen className="h-4.5 w-4.5 text-brand-blue" />
              </div>
              <p className="font-medium text-sm text-brand-navy">المجموعات</p>
              <p className="text-xs text-muted-foreground">مجتمع دراسي</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Progress by System ── */}
      {progress.bySystem.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {progress.bySystem.map((sys) => (
            <Card key={sys.systemId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-brand-navy">
                  {sys.systemName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-brand-navy">
                    {sys.percentage}%
                  </span>
                  {sys.percentage === 100 && (
                    <Badge variant="gold" className="text-[10px]">مكتمل</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sys.completed} من {sys.total} مهمة
                </p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-3">
                  <div
                    className={`rounded-full h-1.5 transition-all duration-500 ${
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
      )}
    </div>
  );
}
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
import AccountabilityCard from "@/components/shared/accountability-card";
import { getUnreadMessageCount } from "@/actions/student/messages";

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
          <h1 className="text-3xl font-bold">
            مرحباً، {session.user.name || "مستخدم"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">ابدأ رحلتك التعليمية</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-xl font-semibold">ابدأ رحلتك</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              لم تنشئ خطة دراسية بعد. اختر قالباً للبدء في التعلم
              المنظم.
            </p>
            <Link href="/plans" className="mt-6">
              <Button size="lg">تصفح القوالب</Button>
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

  // Gather up to 3 groups for the dashboard
  const allMyGroups = [
    ...(myGroups?.owned ?? []),
    ...(myGroups?.admin ?? []),
    ...(myGroups?.member ?? []),
  ].slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          مرحباً، {session.user.name || "مستخدم"} 👋
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
        <div className="rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-950/30 p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-green-700 dark:text-green-400">
            تم إكمال الخطة!
          </h2>
          {completionDate && (
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
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
            <span className="text-sm text-muted-foreground">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className={`rounded-full h-3 transition-all duration-500 ${
                completed ? "bg-green-500" : "bg-primary"
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-right text-sm font-medium">
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
              <p className="text-sm font-medium">
                {todayCompleted} / {todayTasks.length} مكتملة
              </p>
              {todayTasks.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  لا توجد مهام متبقية اليوم
                </p>
              )}
            </div>
          )}

          <Link href="/study-plan" className="block pt-2">
            <Button variant="outline" className="w-full">
              عرض الخطة كاملة
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* ── My Study Groups ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">مجموعاتي الدراسية</h2>
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
                <Button variant="outline" size="sm">
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
                      <p className="font-medium text-sm truncate">
                        {g.name}
                      </p>
                      {g.currentSystem && (
                        <p className="text-xs text-muted-foreground">
                          {g.currentSystem.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {g._count.members} عضو
                        {g.visibility === "PRIVATE"
                          ? " · خاص"
                          : ""}
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
              <p className="text-2xl mb-1">🤝</p>
              <p className="font-medium text-sm">شركاء الدراسة</p>
              <p className="text-xs text-muted-foreground">
                اعثر على شريك دراسي
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/partners/my">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-2xl mb-1">👥</p>
              <p className="font-medium text-sm">شركائي</p>
              <p className="text-xs text-muted-foreground">
                الطلبات والشراكات
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/messages" className="relative">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-2xl mb-1">💬</p>
              <p className="font-medium text-sm">الرسائل</p>
              <p className="text-xs text-muted-foreground">مراسلة الشركاء</p>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/groups">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <p className="text-2xl mb-1">📚</p>
              <p className="font-medium text-sm">المجموعات</p>
              <p className="text-xs text-muted-foreground">مجتمع دراسي</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {progress.bySystem.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {progress.bySystem.map((sys) => (
            <Card key={sys.systemId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {sys.systemName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sys.percentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {sys.completed} من {sys.total} مهمة
                </p>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-3">
                  <div
                    className={`rounded-full h-1.5 transition-all duration-500 ${
                      sys.percentage === 100
                        ? "bg-green-500"
                        : "bg-primary"
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
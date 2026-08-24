import { getStudentAnalytics } from "@/actions/student/analytics";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Flame, Target, Activity, Brain } from "lucide-react";
import {
  HEALTH_STATUS_LABELS,
  HEALTH_STATUS_COLORS,
  MILESTONE_STATUS_LABELS,
  RESCHEDULE_TRIGGER_LABELS,
  AI_TYPE_LABELS,
  DAY_NAMES_AR,
} from "@/lib/analytics/constants";

function ProgressBar({
  value,
  max = 100,
  className = "",
  barClassName = "bg-primary/70",
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className={`h-2 bg-muted rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${barClassName}`}
        style={{ width: `${Math.max(pct, 1)}%` }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        {Icon && (
          <div className="mb-2">
            <Icon className={`h-5 w-5 ${color ?? "text-muted-foreground"}`} />
          </div>
        )}
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <p className="text-muted-foreground">{message}</p>
        <Link
          href="/dashboard"
          className="text-sm text-primary hover:underline mt-2 inline-block"
        >
          <ArrowLeft className="h-3 w-3 inline ml-1" />
          العودة للوحة التحكم
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function StudentAnalyticsPage() {
  const data = await getStudentAnalytics();

  if (!data) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">التحليلات الدراسية</h1>
        <EmptyState message="لا يوجد خطة دراسية نشطة حالياً. أنشئ خطة لرؤية تحليلاتك." />
      </div>
    );
  }

  const { plan, overallProgress, consistency, weeklyActivity, systemProgress, milestoneAnalytics, planHealth, rescheduleHistory, aiUsage } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">التحليلات الدراسية</h1>
        <p className="text-muted-foreground mt-1">
          رؤية شاملة لتقدمك في {plan.title}
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          color="text-primary"
          label="التقدم الكلي"
          value={`${overallProgress.completionPercentage}%`}
          sub={`${overallProgress.completedRequiredTasks} / ${overallProgress.totalRequiredTasks} مهمة`}
        />
        <StatCard
          icon={Flame}
          color="text-orange-500"
          label="الانضباط الحالي"
          value={consistency.currentStreak}
          sub={`أطول سلسلة: ${consistency.longestStreak} يوم`}
        />
        <StatCard
          icon={Activity}
          color={HEALTH_STATUS_COLORS[planHealth.status]?.split(" ")[0]}
          label="صحة الخطة"
          value={HEALTH_STATUS_LABELS[planHealth.status]}
          sub={planHealth.daysBehind > 0 ? `متأخر ${planHealth.daysBehind} يوم` : undefined}
        />
        <StatCard
          icon={Brain}
          color="text-purple-500"
          label="توصيات AI"
          value={aiUsage.total}
          sub={aiUsage.lastRecommendationDate ? `آخر: ${new Date(aiUsage.lastRecommendationDate).toLocaleDateString("ar-EG")}` : undefined}
        />
      </div>

      {/* Overall Progress Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">التقدم الكلي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar
            value={overallProgress.completionPercentage}
            barClassName={
              overallProgress.completionPercentage >= 80
                ? "bg-green-500"
                : overallProgress.completionPercentage >= 50
                  ? "bg-primary"
                  : "bg-amber-500"
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">المهمة الحالية</p>
              <p className="font-medium">{overallProgress.currentMilestone ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">المراحل</p>
              <p className="font-medium">
                {overallProgress.completedMilestones} / {overallProgress.totalMilestones}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">تاريخ الانتهاء المتوقع</p>
              <p className="font-medium">
                {overallProgress.expectedEndDate
                  ? new Date(overallProgress.expectedEndDate).toLocaleDateString("ar-EG")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">الفارق</p>
              <p className="font-medium">
                {overallProgress.daysDifference == null
                  ? "—"
                  : overallProgress.daysDifference > 0
                    ? `متقدم ${overallProgress.daysDifference} يوم`
                    : overallProgress.daysDifference < 0
                      ? `متأخر ${Math.abs(overallProgress.daysDifference)} يوم`
                      : "على المسار"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">النشاط الأسبوعي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weeklyActivity.daily.map((day) => {
              const dayName =
                DAY_NAMES_AR[new Date(day.date).getDay()] ?? "";
              const isToday = day.date === new Date().toISOString().split("T")[0];
              return (
                <div key={day.date} className="flex items-center gap-3">
                  <span
                    className={`text-xs w-16 text-right shrink-0 ${isToday ? "font-bold text-foreground" : "text-muted-foreground"}`}
                  >
                    {dayName}
                    {isToday && " *"}
                  </span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-primary/30 rounded-full"
                      style={{
                        width: `${day.scheduledRequired > 0 ? 100 : 0}%`,
                      }}
                    />
                    <div
                      className="h-full bg-primary/70 rounded-full absolute inset-y-0 left-0"
                      style={{
                        width: `${day.scheduledRequired > 0 ? Math.max((day.completedRequired / day.scheduledRequired) * 100, day.completedRequired > 0 ? 4 : 0) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium w-16 text-right tabular-nums">
                    {day.completedRequired}/{day.scheduledRequired}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-sm">
            <div className="text-center">
              <p className="font-bold">{weeklyActivity.weeklySummary.totalCompleted}</p>
              <p className="text-xs text-muted-foreground">مكتملة (4 أسابيع)</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{weeklyActivity.weeklySummary.avgDailyCompletion}</p>
              <p className="text-xs text-muted-foreground">متوسط يومي</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{consistency.activeStudyDays}</p>
              <p className="text-xs text-muted-foreground">يوم نشط</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column: System Progress + Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">تقدم الأنظمة</CardTitle>
          </CardHeader>
          <CardContent>
            {systemProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                لا توجد بيانات أنظمة بعد
              </p>
            ) : (
              <div className="space-y-3">
                {systemProgress.map((sys) => (
                  <div key={sys.systemSlug}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="truncate max-w-[160px]">
                        {sys.systemName}
                      </span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {sys.percentage}%
                      </span>
                    </div>
                    <ProgressBar value={sys.percentage} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المراحل</CardTitle>
          </CardHeader>
          <CardContent>
            {milestoneAnalytics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                لا توجد مراحل بعد
              </p>
            ) : (
              <div className="space-y-3">
                {milestoneAnalytics.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-lg border ${m.isCurrent ? "border-primary/50 bg-primary/5" : "border-transparent"}`}
                  >
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {m.isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <span className="truncate font-medium">
                          {m.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.isAtRisk && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-300"
                          >
                            في خطر
                          </Badge>
                        )}
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {m.progressPercentage}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={m.progressPercentage}
                      barClassName={
                        m.status === "COMPLETED"
                          ? "bg-green-500"
                          : m.isAtRisk
                            ? "bg-amber-500"
                            : "bg-primary/70"
                      }
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                      <span>
                        {m.completedTaskCount}/{m.requiredTaskCount}
                      </span>
                      <span>
                        {MILESTONE_STATUS_LABELS[m.status] ?? m.status}
                        {m.targetEndDate &&
                          ` · ${new Date(m.targetEndDate).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column: Plan Health + Consistency Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">صحة الخطة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${HEALTH_STATUS_COLORS[planHealth.status]}`}
            >
              {HEALTH_STATUS_LABELS[planHealth.status]}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-bold">{planHealth.expectedProgress}%</p>
                <p className="text-[10px] text-muted-foreground">التقدم المتوقع</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-bold">{planHealth.actualProgress}%</p>
                <p className="text-[10px] text-muted-foreground">التقدم الفعلي</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الفارق</span>
                <span
                  className={planHealth.difference >= 0 ? "text-green-600" : "text-red-600"}
                >
                  {planHealth.difference >= 0 ? "+" : ""}
                  {planHealth.difference}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">مهمات متأخرة</span>
                <span>{planHealth.overdueTaskCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">متبقي</span>
                <span>{planHealth.remainingTasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consistency Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">الانضباط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-bold">{consistency.currentStreak}</p>
                <p className="text-[10px] text-muted-foreground">سلسلة حالية</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 text-center">
                <p className="text-lg font-bold">{consistency.longestStreak}</p>
                <p className="text-[10px] text-muted-foreground">أطول سلسلة</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">أيام نشطة</span>
                <span>{consistency.activeStudyDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">أيام غير نشطة</span>
                <span>{consistency.inactiveDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">معدل الإنجاز</span>
                <span>{consistency.completionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">متوسط مهمات/يوم نشط</span>
                <span>{consistency.avgTasksPerActiveDay}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column: Rescheduling + AI Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rescheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">إعادة الجدولة</CardTitle>
          </CardHeader>
          <CardContent>
            {rescheduleHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                لا توجد عمليات إعادة جدولة
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  {rescheduleHistory.length} عملية إعادة جدولة
                </p>
                <div className="space-y-2">
                  {rescheduleHistory.slice(0, 8).map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.date).toLocaleDateString("ar-EG", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <p className="text-xs">
                          {r.tasksMoved} مهمة ·{" "}
                          {RESCHEDULE_TRIGGER_LABELS[r.trigger] ?? r.trigger}
                        </p>
                      </div>
                      <Badge
                        variant={r.daysShifted > 0 ? "outline" : "secondary"}
                        className="text-[10px]"
                      >
                        {r.daysShifted > 0 ? `+${r.daysShifted} يوم` : "0"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* AI Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">توصيات الذكاء الاصطناعي</CardTitle>
          </CardHeader>
          <CardContent>
            {aiUsage.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                لا توجد توصيات بعد
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-sm font-bold">{aiUsage.planReviews}</p>
                    <p className="text-[10px] text-muted-foreground">مراجعات</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-sm font-bold">{aiUsage.rescheduleRecommendations}</p>
                    <p className="text-[10px] text-muted-foreground">جدولة</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-sm font-bold">{aiUsage.capacityRecommendations}</p>
                    <p className="text-[10px] text-muted-foreground">سعة</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {aiUsage.recent.slice(0, 5).map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between text-sm p-2 rounded-lg bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] mb-1"
                        >
                          {AI_TYPE_LABELS[r.type] ?? r.type}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.summary}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mr-2">
                        {new Date(r.date).toLocaleDateString("ar-EG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
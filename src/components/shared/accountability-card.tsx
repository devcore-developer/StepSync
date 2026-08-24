"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DriftResult } from "@/lib/drift";
import { ACCOUNTABILITY_MESSAGES } from "@/lib/constants/drift";

interface AccountabilityCardProps {
  drift: DriftResult;
  variant?: "full" | "banner";
  onReschedule?: () => void;  // ← جديد
  canReschedule?: boolean;    // ← جديد
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; bar: string; badge: string }> = {
  ON_TRACK: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/50",
    text: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
  AT_RISK: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800/50",
    text: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500",
    badge: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  BEHIND: {
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800/50",
    text: "text-orange-700 dark:text-orange-400",
    bar: "bg-orange-500",
    badge: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  CRITICAL: {
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800/50",
    text: "text-red-700 dark:text-red-400",
    bar: "bg-red-500",
    badge: "bg-red-500 hover:bg-red-600 text-white",
  },
  COMPLETED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800/50",
    text: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500",
    badge: "bg-emerald-500 hover:bg-emerald-600 text-white",
  },
};

function getStatusMessage(drift: DriftResult): { title: string; description: string } {
  if (drift.status === "COMPLETED") {
    return { title: "تم إكمال الخطة!", description: "ممتاز — أنهيت كل المهام المطلوبة." };
  }
  const msg = ACCOUNTABILITY_MESSAGES[drift.status];
  return {
    title: msg.title.replace("{days}", String(drift.daysBehind)),
    description: msg.description,
  };
}

function ProgressComparison({ expected, actual, difference, barColor }: {
  expected: number;
  actual: number;
  difference: number;
  barColor: string;
}) {
  if (expected === 0 && actual === 0) return null;

  return (
    <div className="space-y-2 pt-3 border-t border-current/10">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">المتوقع</span>
          <span className="text-muted-foreground">{expected}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-muted-foreground/30 rounded-full h-2 transition-all duration-500" style={{ width: `${expected}%` }} />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">الفعلي</span>
          <span className="font-medium">{actual}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className={`${barColor} rounded-full h-2 transition-all duration-500`} style={{ width: `${actual}%` }} />
        </div>
      </div>
      {difference !== 0 && (
        <p className="text-xs text-center pt-1">
          {difference < 0
            ? `${Math.abs(difference)}% أقل من المتوقع`
            : `${difference}% أكثر من المتوقع`}
        </p>
      )}
    </div>
  );
}

export default function AccountabilityCard({ drift, variant = "full", onReschedule, canReschedule = false }: AccountabilityCardProps) {
  const styles = STATUS_STYLES[drift.status] ?? STATUS_STYLES.ON_TRACK;
  const { title, description } = getStatusMessage(drift);
  const showRescheduleButton = canReschedule && onReschedule && drift.status !== "ON_TRACK" && drift.status !== "COMPLETED";

  if (variant === "banner") {
    return (
      <div className={`rounded-lg border p-4 ${styles.bg} ${styles.border}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={styles.text}>
              {drift.status === "ON_TRACK" ? "✓" : drift.status === "COMPLETED" ? "🎉" : "⚡"}
            </span>
            <p className={`text-sm font-medium ${styles.text}`}>{title}</p>
          </div>
          {showRescheduleButton && (
            <button
              onClick={onReschedule}
              className="text-xs px-3 py-1.5 rounded-md bg-white dark:bg-black/30 border border-current/20 hover:bg-white/80 dark:hover:bg-black/50 transition-colors"
            >
              تعديل خطتي
            </button>
          )}
        </div>
        {drift.overdueTaskCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {drift.overdueTaskCount} مهمة متأخرة — أنت متأخر {drift.daysBehind} أيام عن خطتك.
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className={`${styles.bg} ${styles.border}`}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {drift.status === "ON_TRACK"
                  ? "✓"
                  : drift.status === "COMPLETED"
                    ? "🎉"
                    : drift.status === "AT_RISK"
                      ? "⚡"
                      : drift.status === "BEHIND"
                        ? "⚠"
                        : "🔴"}
              </span>
              <h3 className={`font-semibold ${styles.text}`}>{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Badge className={styles.badge} variant="secondary">
            {drift.status === "COMPLETED"
              ? "مكتمل"
              : drift.status === "ON_TRACK"
                ? "على المسار"
                : drift.status === "AT_RISK"
                  ? "خطر طفيف"
                  : drift.status === "BEHIND"
                    ? "متأخر"
                    : "حرج"}
          </Badge>
        </div>

        {/* Days behind */}
        {drift.daysBehind > 0 && drift.status !== "COMPLETED" && (
          <div className="flex items-center gap-2 text-sm">
            <span className={styles.text}>متأخر {drift.daysBehind} أيام</span>
            {drift.overdueTaskCount > 0 && (
              <span className="text-muted-foreground">· {drift.overdueTaskCount} مهمة متأخرة</span>
            )}
          </div>
        )}

        {/* Next task */}
        {drift.nextTask && drift.status !== "COMPLETED" && (
          <div className="pt-2 border-t border-current/10">
            <p className="text-xs text-muted-foreground mb-1">التالية</p>
            <p className="text-sm font-medium">{drift.nextTask.title}</p>
            <p className="text-xs text-muted-foreground">{drift.nextTask.milestoneTitle}</p>
            {drift.nextTask.type === "overdue" && (
              <Badge variant="outline" className="mt-1 text-xs text-orange-600 border-orange-300">
                متأخرة
              </Badge>
            )}
          </div>
        )}

        {/* Progress comparison */}
        <ProgressComparison
          expected={drift.expectedProgress}
          actual={drift.actualProgress}
          difference={drift.progressDifference}
          barColor={styles.bar}
        />

        {/* Reschedule Button */}
        {showRescheduleButton && (
          <div className="pt-3 border-t border-current/10">
            <p className="text-sm text-muted-foreground mb-2">
              يمكنك تعديل خطتك لتعود للمسار الصحيح.
            </p>
            <button
              onClick={onReschedule}
              className="w-full text-sm px-4 py-2.5 rounded-md bg-white dark:bg-black/30 border border-current/20 hover:bg-white/80 dark:hover:bg-black/50 transition-colors font-medium"
            >
              تعديل خطتي الدراسية
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
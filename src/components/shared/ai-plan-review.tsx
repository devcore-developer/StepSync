"use client";

import { useState, useTransition } from "react";
import { getAIPlanReview } from "@/actions/student/ai-planner";
import { AIClientError } from "@/lib/ai/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlanReviewRecommendation } from "@/lib/ai/schemas";

type State = "idle" | "loading" | "result" | "error";

const HEALTH_STYLES: Record<string, { label: string; className: string; icon: string }> = {
  ON_TRACK: { label: "على المسار", className: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-800/50", icon: "✓" },
  SLIGHTLY_BEHIND: { label: "تأخر قليلاً", className: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-800/50", icon: "⚡" },
  SIGNIFICANTLY_BEHIND: { label: "تأخر بشكل ملحوظ", className: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/20 dark:border-orange-800/50", icon: "⚠" },
  AT_RISK: { label: "في خطر", className: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800/50", icon: "🔴" },
};

export default function AIPlanReview() {
  const [state, setState] = useState<State>("idle");
  const [review, setReview] = useState<PlanReviewRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReview() {
    startTransition(async () => {
      setState("loading");
      setError(null);
      try {
        const result = await getAIPlanReview();
        setReview(result);
        setState("result");
      } catch (err: any) {
        const message =
          err instanceof AIClientError
            ? err.message
            : "حدث خطأ أثناء تحليل الخطة.";
        setError(message);
        setState("error");
        toast.error(message);
      }
    });
  }

  if (state === "idle") {
    return (
      <Button
        variant="outline"
        onClick={handleReview}
        className="border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
        disabled={isPending}
      >
        ✨ مراجعة ذكية للخطة
      </Button>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent animate-spin" />
        جاري تحليل الخطة...
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-center">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        <Button variant="outline" size="sm" onClick={handleReview} className="mt-2" disabled={isPending}>
          حاول مرة أخرى
        </Button>
      </div>
    );
  }

  if (!review) return null;

  const health = HEALTH_STYLES[review.healthAssessment] ?? HEALTH_STYLES.ON_TRACK;

  return (
    <Card className="border-cyan-200/60 dark:border-cyan-800/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span>📋</span>
          مراجعة الخطة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Assessment */}
        <div className={`rounded-lg border p-3 ${health.className}`}>
          <p className="text-sm font-medium">{health.icon} صحة الخطة: {health.label}</p>
          <p className="text-xs text-muted-foreground mt-1">{review.summary}</p>
        </div>

        {/* Strengths */}
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">نقاط القوة</p>
          <ul className="space-y-1">
            {review.strengths.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        {review.risks.length > 0 && (
          <div>
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">المخاطر</p>
            <ul className="space-y-1">
              {review.risks.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <p className="text-sm font-medium mb-2">التوصيات</p>
          <ul className="space-y-1">
            {review.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
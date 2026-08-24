"use client";

import { useState, useTransition } from "react";
import { getDailyAIRecommendation } from "@/actions/student/ai-planner";
import { AIClientError } from "@/lib/ai/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DailyRecommendation } from "@/lib/ai/schemas";

type State = "idle" | "loading" | "result" | "error";

const PRIORITY_STYLES: Record<string, { label: string; className: string; dot: string }> = {
  HIGH: { label: "أولوية عالية", className: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50", dot: "bg-blue-500" },
  MEDIUM: { label: "أولوية متوسطة", className: "text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800/50", dot: "bg-slate-400" },
  LOW: { label: "أولوية منخفضضة", className: "text-muted-foreground bg-muted/50 border-muted", dot: "bg-muted-foreground/50" },
};

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

export default function AIStudyAssistant() {
  const [state, setState] = useState<State>("idle");
  const [recommendation, setRecommendation] = useState<DailyRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGetRecommendation() {
    startTransition(async () => {
      setState("loading");
      setError(null);
      try {
        const result = await getDailyAIRecommendation();
        setRecommendation(result);
        setState("result");
      } catch (err: any) {
        const message =
          err instanceof AIClientError
            ? err.message
            : "حدث خطأ غير متوقع. حاول مرة أخرى.";
        setError(message);
        setState("error");
        toast.error(message);
      }
    });
  }

  function handleDismiss() {
    setState("idle");
    setRecommendation(null);
    setError(null);
  }

  return (
    <Card className="border-cyan-200/60 dark:border-cyan-800/30 bg-gradient-to-br from-cyan-50/30 to-white dark:from-cyan-950/10 dark:to-gray-950">
      <CardContent className="p-4">
        {state === "idle" && (
          <div className="text-center space-y-3">
            <div className="text-2xl">✨</div>
            <p className="text-sm font-medium text-cyan-800 dark:text-cyan-300">
              تحتاج مساعدة في تخطيط يومك؟
            </p>
            <Button
              onClick={handleGetRecommendation}
              variant="outline"
              className="border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-950/30"
              disabled={isPending}
            >
              {isPending ? "جاري التحليل..." : "خطط لي يوم الدراسة"}
            </Button>
          </div>
        )}

        {state === "loading" && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 w-48 bg-cyan-200/50 dark:bg-cyan-800/20 rounded" />
            <div className="h-4 w-36 bg-cyan-200/50 dark:bg-cyan-800/20 rounded" />
            <div className="h-4 w-40 bg-cyan-200/50 dark:bg-cyan-800/20 rounded" />
          </div>
        )}

        {state === "result" && recommendation && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-cyan-800 dark:text-cyan-300">
                توصية اليوم
              </p>
              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                إغلاق
              </button>
            </div>

            <div className="space-y-2">
              {recommendation.recommendations.map((rec) => {
                const style = PRIORITY_STYLES[rec.priority] ?? PRIORITY_STYLES.LOW;
                return (
                  <div
                    key={rec.taskId}
                    className={`rounded-lg border p-3 ${style.className} transition-colors`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                        <span className="text-sm font-medium">{rec.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {formatMinutes(rec.estimatedMinutes)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="text-center space-y-3">
            <div className="text-lg">⚠️</div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetRecommendation}
              disabled={isPending}
            >
              حاول مرة أخرى
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import type { RescheduleResult } from "@/lib/rescheduler";

interface ReschedulePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: RescheduleResult | null;
  isLoading: boolean;
  onApply: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "غير محدد";
  try {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function ReschedulePreview({
  open,
  onOpenChange,
  preview,
  isLoading,
  onApply,
}: ReschedulePreviewProps) {
  const [isApplying, setIsApplying] = useState(false);

  if (!preview) return null;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply();
      onOpenChange(false);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            تعديل خطتك الدراسية
          </DialogTitle>
            <DialogDescription>
            {preview.summary}
            </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold">{preview.tasksMoved}</p>
              <p className="text-xs text-muted-foreground">مهمة سيتم نقلها</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold">{preview.daysShifted}</p>
              <p className="text-xs text-muted-foreground">أيام تأخير</p>
            </div>
          </div>

          {/* End Date Comparison */}
          {preview.originalProjectedEndDate && preview.projectedEndDate && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-medium">تاريخ الانتهاء</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">قبل</span>
                <span className="text-sm">{formatDate(preview.originalProjectedEndDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">بعد</span>
                <span
                  className={`text-sm font-medium ${
                    !preview.canFitWithinCurrentEndDate
                      ? "text-orange-600"
                      : "text-emerald-600"
                  }`}
                >
                  {formatDate(preview.projectedEndDate)}
                </span>
              </div>
              {!preview.canFitWithinCurrentEndDate && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠ تاريخ الانتهاء سيتأخر عن الموعد الأصلي
                </p>
              )}
            </div>
          )}

          {/* Overloaded Days Warning */}
          {preview.overloadedDays.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-4">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                أيام بعبء زائد
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {preview.overloadedDays.length} {preview.overloadedDays.length === 1 ? "يوم" : "أيام"} ستحتوي على ساعات دراسة أكثر من المعتاد.
              </p>
            </div>
          )}

          {/* Task Changes Preview */}
          {preview.proposedChanges.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">المهام المنقولة</p>
              <div className="max-h-40 overflow-y-auto rounded-lg border p-2 space-y-1">
                {preview.proposedChanges.slice(0, 10).map((change) => (
                  <div
                    key={change.taskId}
                    className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30"
                  >
                    <span className="truncate flex-1">{change.taskTitle}</span>
                    <div className="flex items-center gap-1 text-muted-foreground mr-2">
                      <span className="line-through">{formatDate(change.oldScheduledDate)}</span>
                      <span>→</span>
                      <span className="font-medium">{formatDate(change.newScheduledDate)}</span>
                    </div>
                  </div>
                ))}
                {preview.proposedChanges.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{preview.proposedChanges.length - 10} مهمة أخرى
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Required vs Optional */}
          {preview.optionalTasksMoved > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {preview.requiredTasksMoved} أساسية
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {preview.optionalTasksMoved} اختيارية
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleApply} disabled={isLoading || isApplying}>
            {isApplying ? "جاري التطبيق..." : "تطبيق الجدول الجديد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
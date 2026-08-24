"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sendPartnerRequest } from "@/actions/student/partners";
import {
  USMLE_STAGE_LABELS,
  STUDY_TIME_LABELS,
} from "@/lib/constants/matching";
import type { PartnerCandidate } from "@/types/partner";

interface PartnerCardProps {
  candidate: PartnerCandidate;
}

export default function PartnerCard({ candidate }: PartnerCardProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const stageLabel = candidate.currentUsmleStage
    ? USMLE_STAGE_LABELS[candidate.currentUsmleStage] ?? candidate.currentUsmleStage
    : null;

  const timeLabel = candidate.preferredStudyTime
    ? STUDY_TIME_LABELS[candidate.preferredStudyTime] ?? candidate.preferredStudyTime
    : null;

  async function handleSendRequest() {
    setSending(true);
    try {
      await sendPartnerRequest(candidate.userId);
      setSent(true);
      toast.success("تم إرسال الطلب بنجاح");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-3">
        {/* الاسم والجامعة */}
        <div>
          <h3 className="font-semibold text-base">{candidate.displayName}</h3>
          <p className="text-xs text-muted-foreground">
            جامعة الإسكندرية
            {candidate.academicYear && ` · ${candidate.academicYear}`}
          </p>
          {stageLabel && (
            <p className="text-xs text-muted-foreground">USMLE {stageLabel}</p>
          )}
        </div>

        {/* النظام والفصل الحالي */}
        {(candidate.currentSystem || candidate.currentChapter) && (
          <div className="text-sm">
            <p className="text-xs text-muted-foreground mb-0.5">يدرس حالياً</p>
            <p>
              {candidate.currentSystem?.name ?? "—"}
              {candidate.currentChapter &&
                ` → ${candidate.currentChapter.name}`}
            </p>
          </div>
        )}

        {/* الوقت والمكان */}
        {(timeLabel || candidate.preferredStudyLocation) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {timeLabel && <span>🕐 {timeLabel}</span>}
            {candidate.preferredStudyLocation && (
              <span>📍 {candidate.preferredStudyLocation.name}</span>
            )}
          </div>
        )}

        {/* درجة التطابق */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {candidate.matchScore}% تطابق
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className={`rounded-full h-1.5 transition-all duration-300 ${
                candidate.matchScore >= 80
                  ? "bg-green-500"
                  : candidate.matchScore >= 50
                    ? "bg-amber-500"
                    : "bg-muted-foreground"
              }`}
              style={{ width: `${candidate.matchScore}%` }}
            />
          </div>
          {candidate.matchReasons.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {candidate.matchReasons.map((reason, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  ✓ {reason}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* الأزرار */}
        <div className="flex gap-2 pt-1">
          <Link href={`/partners/${candidate.userId}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              عرض البروفايل
            </Button>
          </Link>
          <Button
            size="sm"
            className="flex-1"
            disabled={sent || sending}
            onClick={handleSendRequest}
          >
            {sent ? "تم الإرسال" : sending ? "جارٍ الإرسال..." : "إرسال طلب"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
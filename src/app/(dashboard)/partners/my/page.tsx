"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getMyPartnerRequests,
  acceptPartnerRequest,
  rejectPartnerRequest,
  cancelPartnerRequest,
} from "@/actions/student/partners";
import { USMLE_STAGE_LABELS } from "@/lib/constants/matching";
import type { MyPartnersData } from "@/types/partner";
import { ArrowRight, Clock, Check, X } from "lucide-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return new Date(dateStr).toLocaleDateString("ar-EG");
}

function RequestCard({
  request,
  type,
}: {
  request: MyPartnersData["incoming"][0];
  type: "incoming" | "outgoing" | "accepted";
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const stageLabel = request.otherUser.currentUsmleStage
    ? USMLE_STAGE_LABELS[request.otherUser.currentUsmleStage]
    : null;

  async function handleAction(action: string) {
    setLoading(action);
    try {
      if (action === "accept") await acceptPartnerRequest(request.id);
      else if (action === "reject") await rejectPartnerRequest(request.id);
      else if (action === "cancel") await cancelPartnerRequest(request.id);
      toast.success("تم بنجاح");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/partners/${request.otherUser.userId}`}
              className="font-medium hover:underline"
            >
              {request.otherUser.displayName}
            </Link>
            <p className="text-xs text-muted-foreground">
              {request.otherUser.academicYear ?? "—"}
              {stageLabel && ` · USMLE ${stageLabel}`}
              {request.otherUser.currentSystem &&
                ` · ${request.otherUser.currentSystem.name}`}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo(request.createdAt)}
          </span>
        </div>

        {request.otherUser.currentChapter && (
          <p className="text-xs text-muted-foreground">
            يدرس: {request.otherUser.currentChapter.name}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          {type === "incoming" && (
            <>
              <Button
                size="sm"
                className="flex-1"
                disabled={loading !== null}
                onClick={() => handleAction("accept")}
              >
                <Check className="h-3.5 w-3.5 ml-1" />
                قبول
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={loading !== null}
                onClick={() => handleAction("reject")}
              >
                <X className="h-3.5 w-3.5 ml-1" />
                رفض
              </Button>
            </>
          )}

          {type === "outgoing" && (
            <>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                قيد الانتظار
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={loading !== null}
                onClick={() => handleAction("cancel")}
              >
                إلغاء
              </Button>
            </>
          )}

          {type === "accepted" && (
            <Link
              href={`/partners/${request.otherUser.userId}`}
              className="flex-1"
            >
              <Button size="sm" variant="outline" className="w-full">
                عرض البروفايل
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyPartnersPage() {
  const [data, setData] = useState<MyPartnersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPartnerRequests()
      .then(setData)
      .catch(() => toast.error("فشل تحميل البيانات"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">
        جارٍ التحميل...
      </div>
    );
  }

  const total = data
    ? data.incoming.length + data.outgoing.length + data.accepted.length
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* رجوع */}
      <Link
        href="/partners"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 ml-1" />
        شركاء الدراسة
      </Link>

      <div>
        <h1 className="text-2xl font-bold">شركائي</h1>
        <p className="text-muted-foreground mt-1">
          إدارة طلبات الشراكة الدراسية
        </p>
      </div>

      {total === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium mb-1">لا توجد طلبات بعد</p>
            <p className="text-sm text-muted-foreground">
              ابدأ بالبحث عن شريك دراسة من صفحة شركاء الدراسة.
            </p>
            <Link href="/partners" className="inline-block mt-4">
              <Button>بحث عن شركاء</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* طلبات واردة */}
      {data && data.incoming.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            طلبات واردة
            <Badge>{data.incoming.length}</Badge>
          </h2>
          <div className="space-y-3">
            {data.incoming.map((r) => (
              <RequestCard key={r.id} request={r} type="incoming" />
            ))}
          </div>
        </section>
      )}

      {/* طلبات مرسلة */}
      {data && data.outgoing.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              طلبات مرسلة
              <Badge variant="secondary">{data.outgoing.length}</Badge>
            </h2>
            <div className="space-y-3">
              {data.outgoing.map((r) => (
                <RequestCard key={r.id} request={r} type="outgoing" />
              ))}
            </div>
          </section>
        </>
      )}

      {/* شركاء مقبولين */}
      {data && data.accepted.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              شركائي
              <Badge variant="default">{data.accepted.length}</Badge>
            </h2>
            <div className="space-y-3">
              {data.accepted.map((r) => (
                <RequestCard key={r.id} request={r} type="accepted" />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
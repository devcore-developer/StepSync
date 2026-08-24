import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getPartnerProfile } from "@/actions/student/partners";
import { startConversation } from "@/actions/student/messages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  USMLE_STAGE_LABELS,
  STUDY_TIME_LABELS,
  GENDER_LABELS,
} from "@/lib/constants/matching";
import { ArrowRight } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerProfilePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const profile = await getPartnerProfile(id);

  if (!profile) notFound();

  // التحقق من شراكة مقبولة
  const [countA, countB] = await Promise.all([
    db.studyPartnerRequest.count({
      where: { senderId: session.user.id, receiverId: id, status: "ACCEPTED" },
    }),
    db.studyPartnerRequest.count({
      where: { senderId: id, receiverId: session.user.id, status: "ACCEPTED" },
    }),
  ]);
  const isPartner = countA + countB > 0;

  // التحقق من وجود طلب معلق
  const [pendingA, pendingB] = await Promise.all([
    db.studyPartnerRequest.count({
      where: { senderId: session.user.id, receiverId: id, status: "PENDING" },
    }),
    db.studyPartnerRequest.count({
      where: { senderId: id, receiverId: session.user.id, status: "PENDING" },
    }),
  ]);
  const hasPending = pendingA + pendingB > 0;

  const stageLabel = profile.currentUsmleStage
    ? USMLE_STAGE_LABELS[profile.currentUsmleStage]
    : null;

  const timeLabel = profile.preferredStudyTime
    ? STUDY_TIME_LABELS[profile.preferredStudyTime]
    : null;

  const genderLabel = profile.gender
    ? GENDER_LABELS[profile.gender]
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* رجوع */}
      <Link
        href="/partners"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 ml-1" />
        العودة لشركاء الدراسة
      </Link>

      {/* البطاقة الرئيسية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{profile.displayName}</CardTitle>
          <p className="text-sm text-muted-foreground">جامعة الإسكندرية</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* معلومات أساسية */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {profile.academicYear && (
              <div>
                <p className="text-xs text-muted-foreground">السنة الدراسية</p>
                <p className="font-medium">{profile.academicYear}</p>
              </div>
            )}
            {genderLabel && (
              <div>
                <p className="text-xs text-muted-foreground">الجنس</p>
                <p className="font-medium">{genderLabel}</p>
              </div>
            )}
            {stageLabel && (
              <div>
                <p className="text-xs text-muted-foreground">مرحلة USMLE</p>
                <p className="font-medium">USMLE {stageLabel}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* التقدم الحالي */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">يدرس حالياً</p>
            <p className="font-medium">
              {profile.currentSystem?.name ?? "غير محدد"}
              {profile.currentChapter &&
                ` → ${profile.currentChapter.name}`}
            </p>
          </div>

          <Separator />

          {/* التفضيلات */}
          <div className="space-y-2 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              تفضيلات الدراسة
            </p>
            {timeLabel && (
              <p>
                <span className="text-muted-foreground">وقت الدراسة: </span>
                {timeLabel}
              </p>
            )}
            {profile.preferredStudyLocation && (
              <p>
                <span className="text-muted-foreground">مكان الدراسة: </span>
                {profile.preferredStudyLocation.name}
              </p>
            )}
            {!timeLabel && !profile.preferredStudyLocation && (
              <p className="text-muted-foreground">لم يحدد تفضيلات بعد</p>
            )}
          </div>

          {profile.bio && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  نبذة
                </p>
                <p className="text-sm">{profile.bio}</p>
              </div>
            </>
          )}

          {/* درجة التطابق */}
          {profile.matchScore !== null && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {profile.matchScore}% تطابق
                  </span>
                  <Badge
                    variant={
                      profile.matchScore >= 80
                        ? "default"
                        : profile.matchScore >= 50
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {profile.matchScore >= 80
                      ? "تطابق ممتاز"
                      : profile.matchScore >= 50
                        ? "تطابق جيد"
                        : "تطابق جزئي"}
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`rounded-full h-2 transition-all duration-300 ${
                      profile.matchScore >= 80
                        ? "bg-green-500"
                        : profile.matchScore >= 50
                          ? "bg-amber-500"
                          : "bg-muted-foreground"
                    }`}
                    style={{ width: `${profile.matchScore}%` }}
                  />
                </div>
                {profile.matchReasons.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    <p className="text-xs text-muted-foreground mb-1">
                      لأنكما تشتركان في:
                    </p>
                    {profile.matchReasons.map((r, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        ✓ {r}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* أزرار الإجراء */}
          <div className="space-y-2">
            {isPartner && (
              <form action={startConversation.bind(null, id)}>
                <Button type="submit" variant="outline" className="w-full">
                  💬 رسالة
                </Button>
              </form>
            )}

            {!isPartner && !hasPending && (
              <Link href="/partners" className="block">
                <Button className="w-full">إرسال طلب شراكة</Button>
              </Link>
            )}

            {!isPartner && hasPending && (
              <Link href="/partners/my" className="block">
                <Button variant="outline" className="w-full">
                  طلب معلّق — راجع شركائي
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
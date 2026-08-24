import { getUserDetails } from "@/actions/admin/users";   // ← كانت get_user_details as
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { AdminRoleChangeDialog } from "../role-change-dialog";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STAGE_LABELS: Record<string, string> = {
  PREPARING_STEP1: "Step 1",
  PREPARING_STEP2CK: "Step 2 CK",
  PREPARING_STEP3: "Step 3",
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getUserDetails({ userId: id });
  if (!data) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/users"
          className="hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4 ml-1" /> المستخدمون
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">{data.user.email}</span>
        <Badge variant={data.user.role === "ADMIN" ? "default" : "secondary"}>
          {data.user.role}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">الاسم الأول</dt>
              <dd className="font-medium mt-0.5">
                {data.profile?.firstName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">الاسم الأخير</dt>
              <dd className="font-medium mt-0.5">
                {data.profile?.lastName ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">الجامعة</dt>
              <dd className="font-medium mt-0.5">
                {data.profile?.university ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">المرحلة الدراسية</dt>
              <dd className="font-medium mt-0.5">
                {data.profile?.currentUsmleStage
                  ? STAGE_LABELS[data.profile.currentUsmleStage] ?? data.profile.currentUsmleStage
                  : "لم يحدد بعد"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">السنة الدراسية</dt>
              <dd className="font-medium mt-0.5">
                {data.profile?.academicYear ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-foreground">تاريخ الانضمام</dt>
              <dd className="font-medium mt-0.5">
                {new Date(data.user.createdAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">آخر تحديث</dt>
              <dd className="font-medium mt-0.5">
                {new Date(data.user.updatedAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الإحصائيات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold">{data.planCount}</p>
              <p className="text-xs text-muted-foreground">خطط دراسية</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold">{data.groupCount}</p>
              <p className="text-xs text-muted-foreground">مجموعة</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold">{data.partnerCount}</p>
              <p className="text-xs text-muted-foreground">شريك</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold">{data.messageCount}</p>
              <p className="text-xs text-muted-foreground">رسالة</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold">{data.aiRecommendationCount}</p>
              <p className="text-xs text-muted-foreground">توصية AI</p>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <AdminRoleChangeDialog
              userId={data.user.id}
              currentRole={data.user.role}
              userName={data.user.email}
              onDone={() => window.location.reload()}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
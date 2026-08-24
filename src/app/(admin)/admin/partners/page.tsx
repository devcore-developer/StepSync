import { db } from "@/lib/db";
import { requireAdmin } from "@/actions/admin/common";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default async function AdminPartnersPage() {
  await requireAdmin();

  const [total, pending, accepted, rejected, cancelled] = await Promise.all([
    db.studyPartnerRequest.count(),
    db.studyPartnerRequest.count({ where: { status: "PENDING" } }),
    db.studyPartnerRequest.count({ where: { status: "ACCEPTED" } }),
    db.studyPartnerRequest.count({ where: { status: "REJECTED" } }),
    db.studyPartnerRequest.count({ where: { status: "CANCELLED" } }),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin"
          className="hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4 ml-1" /> لوحة التحكم
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">الشركاء</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">إحصائيات الشركاء</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
            </div>
            <div className="-rounded-lg bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {pending}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">معلّق</p>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {accepted}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">مقبول</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {rejected}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500">مرفوض</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
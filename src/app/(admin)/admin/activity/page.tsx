import { getActivityLog } from "@/actions/admin/activity";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

const ACTION_LABELS: Record<string, string> = {
  CHANGE_ROLE: "تغيير دور",
  DELETE_GROUP: "حذف مجموعة",
  DELETE_USER: "حذف مستخدم",
  DELETE_MESSAGE: "حذف رسالة",
};

export default async function AdminActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;                              // ← كان ناقص await
  const page = Number(params.page || "1");                        // ← كان ناقص ) وكان 1 رقم مش نص
  const limit = 50;

  const { entries, total } = await getActivityLog({ page, limit });

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
        <span className="font-medium text-foreground">سجل النشاط</span>
      </div>

      <p className="text-sm text-muted-foreground">
        {total} سجل — صفحة {page}
      </p>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا يوجد سجل نشاط بعد.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 px-4 py-3"
              >
                <div className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                  {new Date(entry.createdAt).toLocaleDateString("ar-EG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </p>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {entry.adminName}
                    {entry.targetType && (
                      <span className="mx-1">
                        →{" "}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {entry.targetType}
                        </Badge>
                        {entry.targetId && (
                          <span className="mx-1 font-mono text-[10px]">
                            {entry.targetId.slice(0, 8)}...
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {total > limit && (
        <div className="flex justify-center py-4">
          <Link
            href={`/admin/activity?page=${page + 1}`}
            className="text-sm text-primary hover:underline"
          >
            الصفحة التالية
          </Link>
        </div>
      )}
    </div>
  );
}
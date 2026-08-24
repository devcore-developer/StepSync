import { db } from "@/lib/db";
import { requireAdmin } from "@/actions/admin/common";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default async function AdminGroupsPage() {
  await requireAdmin();

  const groups = await db.studyGroup.findMany({
    include: {
      currentSystem: { select: { name: true } },
      currentChapter: { select: { name: true } },
      studyLocation: { select: { name: true } },
      members: {
        where: { role: "OWNER" },
        select: {
          user: {
            select: {
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
        take: 1,
      },
      conversation: {
        select: {
          _count: { select: { messages: true } },
        },
      },
      _count: {
        select: {
          members: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin"
          className="hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4 ml-1" /> لوحة التحكم
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">المجموعات الدراسية</span>
      </div>

      <p className="text-sm text-muted-foreground">{groups.length} مجموعة</p>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا توجد مجموعات بعد.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">كل المجموعات</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {groups.map((g) => {
              const ownerProfile = g.members[0]?.user.profile;
              const ownerName = ownerProfile
                ? `${ownerProfile.firstName ?? ""} ${ownerProfile.lastName ?? ""}`.trim() || "—"
                : "—";
              const messageCount = g.conversation?._count.messages ?? 0;

              return (
                <div
                  key={g.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{g.name}</p>
                    {g.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {g.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={g.visibility === "PUBLIC" ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {g.visibility === "PUBLIC" ? "عام" : "خاص"}
                    </Badge>
                    <Badge
                      variant={g.status === "ACTIVE" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {g.status === "ACTIVE" ? "نشط" : g.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {ownerName}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {g._count.members} عضو · {messageCount} رسالة
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(g.createdAt).toLocaleDateString("ar-EG")}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
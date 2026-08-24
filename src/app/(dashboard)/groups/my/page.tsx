"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMyGroups, cancelJoinRequest } from "@/actions/student/groups";
import StudyGroupCard from "@/components/shared/study-group-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, XCircle } from "lucide-react";
import type { StudyGroupSummary } from "@/types/groups";

export default function MyGroupsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyGroups()
      .then((d) => setData(d))
      .catch(() => toast.error("فشل التحميل"))
      .finally(() => setLoading(false));
  }, []);

  const hasAny =
    data &&
    (data.owned?.length > 0 ||
      data.admin?.length > 0 ||
      data.member?.length > 0 ||
      data.pending?.length > 0);

  function toSummary(g: any): StudyGroupSummary {
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      visibility: g.visibility,
      status: g.status,
      memberCount: typeof g._count?.members === "number" ? g._count.members : 0,
      maxMembers: g.maxMembers,
      currentSystem: g.currentSystem,
      currentChapter: g.currentChapter,
      studyLocation: g.studyLocation,
    };
  }

  function Section({
    title,
    items,
  }: {
    title: string;
    items: any[];
  }) {
    if (!items || items.length === 0) return null;
    return (
      <section>
        <h2 className="font-semibold mb-3">
          {title} ({items.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((m: any) => (
            <StudyGroupCard key={m.group.id} group={toSummary(m.group)} />
          ))}
        </div>
      </section>
    );
  }

  async function handleCancel(groupId: string) {
    try {
      await cancelJoinRequest(groupId);
      if (data) {
        setData({
          ...data,
          pending: data.pending.filter(
            (p: any) => p.group.id !== groupId
          ),
        });
      }
      toast.success("تم إلغاء الطلب");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مجموعاتي</h1>
        <Link href="/groups/create">
          <Button size="sm">
            <Users className="h-4 w-4 ml-2" /> إنشاء مجموعة
          </Button>
        </Link>
      </div>

      {!hasAny && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">👥</p>
          <p className="font-medium">لم تنضم لأي مجموعة بعد</p>
          <p className="text-sm text-muted-foreground">
            استكشف المجموعات أو أنشئ مجموعتك الخاصة
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Link href="/groups">
              <Button variant="outline">تصفح المجموعات</Button>
            </Link>
            <Link href="/groups/create">
              <Button>إنشاء مجموعة</Button>
            </Link>
          </div>
        </div>
      )}

      <Section title="أملك" items={data?.owned} />
      <Section title="أشرف عليها" items={data?.admin} />
      <Section title="عضو فيها" items={data?.member} />

      {(data?.pending?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-semibold mb-3">
            طلبات معلّقة ({data.pending.length})
          </h2>
          <div className="space-y-2">
            {data.pending.map((p: any) => (
              <div
                key={p.id}
                className="rounded-lg border bg-muted/30 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{p.group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    طلب انضمام قيد المراجعة
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => handleCancel(p.group.id)}
                >
                  <XCircle className="h-4 w-4 ml-1" /> إلغاء
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
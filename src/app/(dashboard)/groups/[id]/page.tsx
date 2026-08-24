import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  getStudyGroup,
  joinPublicGroup,
  requestToJoinGroup,
  leaveGroup,
  cancelJoinRequest,
} from "@/actions/student/groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Users, Settings, LogOut, XCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const group = await getStudyGroup(id);
  if (!group) notFound();

  async function joinAction() {
    "use server";
    await joinPublicGroup(id);
    redirect(`/groups/${id}`);
  }

  async function requestAction() {
    "use server";
    await requestToJoinGroup(id);
    redirect(`/groups/${id}`);
  }

  async function leaveAction() {
    "use server";
    await leaveGroup(id);
    redirect(`/groups/${id}`);
  }

  async function cancelAction() {
    "use server";
    await cancelJoinRequest(id);
    redirect(`/groups/${id}`);
  }

  const ms = group.membershipState;
  const canManage = ms.isOwner || ms.isAdmin;
  const showJoin =
    !ms.isMember &&
    !ms.isPending &&
    !ms.isBanned &&
    group.visibility === "PUBLIC";
  const showRequest =
    !ms.isMember &&
    !ms.isPending &&
    !ms.isBanned &&
    group.visibility === "PRIVATE";
  const showLeave = ms.isMember && !ms.isOwner;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/groups"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 ml-1" /> المجموعات
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{group.name}</CardTitle>
            <Badge
              variant={
                group.visibility === "PUBLIC" ? "secondary" : "outline"
              }
            >
              {group.visibility === "PUBLIC" ? "عام" : "خاص"}
            </Badge>
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground">
              {group.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {group.currentSystem && (
              <div>
                <p className="text-xs text-muted-foreground">النظام</p>
                <p className="font-medium">{group.currentSystem.name}</p>
              </div>
            )}
            {group.currentChapter && (
              <div>
                <p className="text-xs text-muted-foreground">الفصل</p>
                <p className="font-medium">{group.currentChapter.name}</p>
              </div>
            )}
            {group.studyLocation && (
              <div>
                <p className="text-xs text-muted-foreground">مكان الدراسة</p>
                <p className="font-medium">{group.studyLocation.name}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">الأعضاء</p>
              <p className="font-medium">
                {group.memberCount}
                {group.maxMembers ? ` / ${group.maxMembers}` : ""}
              </p>
            </div>
            {group.ownerName && (
              <div>
                <p className="text-xs text-muted-foreground">المالك</p>
                <p className="font-medium">{group.ownerName}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
              <p className="font-medium">
                {new Date(group.createdAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {group.goal && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">الهدف</p>
                <p className="text-sm">{group.goal}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            {(canManage || ms.isMember) && (
              <Link href={`/groups/${id}/members`}>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 ml-1" /> الأعضاء
                </Button>
              </Link>
            )}
            {canManage && (
              <>
                <Link href={`/groups/${id}/manage`}>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 ml-1" /> إدارة المجموعة
                  </Button>
                </Link>
                <Link href={`/groups/${id}/settings`}>
                  <Button variant="outline" size="sm">
                    تعديل المعلومات
                  </Button>
                </Link>
              </>
            )}
            {showLeave && (
              <form action={leaveAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 ml-1" /> مغادرة
                </Button>
              </form>
            )}
          </div>

          {ms.isPending && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center justify-between">
              <p className="text-sm">طلب انضمامك قيد المراجعة</p>
              <form action={cancelAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <XCircle className="h-4 w-4 ml-1" /> إلغاء الطلب
                </Button>
              </form>
            </div>
          )}

          {ms.isBanned && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-center text-sm text-destructive">
              تم حظرك من هذه المجموعة
            </div>
          )}

          {showJoin && (
            <>
              <Separator />
              <form action={joinAction}>
                <Button type="submit" className="w-full">
                  انضم للمجموعة
                </Button>
              </form>
            </>
          )}

          {showRequest && (
            <>
              <Separator />
              <form action={requestAction}>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                >
                  طلب انضمام
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
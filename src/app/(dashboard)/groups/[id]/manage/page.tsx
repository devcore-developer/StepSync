"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getStudyGroup,
  getGroupMembers,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  promoteMember,
  demoteMember,
  transferOwnership,
  archiveStudyGroup,
  deleteGroup,
} from "@/actions/student/groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  ArrowRight,
  UserMinus,
  ChevronUp,
  ChevronDown,
  Crown,
  Archive,
  Trash2,
  Users,
  Clock,
  Settings,
  ShieldCheck,
  ShieldMinus,
} from "lucide-react";
import type { GroupMemberInfo, StudyGroupDetails } from "@/types/groups";

interface Props {
  params: Promise<{ id: string }>;
}

function getInitial(name: string) {
  return name.charAt(0).toUpperCase() || "م";
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "مالك",
  ADMIN: "مشرف",
  MEMBER: "عضو",
};

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

type Tab = "members" | "pending" | "danger";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative bg-background rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={onCancel}>
            إلغاء
          </Button>
          <Button
            size="sm"
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ManageGroupPage({ params }: Props) {
  const router = useRouter();
  const [group, setGroup] = useState<StudyGroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("members");
  const [groupId, setGroupId] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    label: string;
    destructive?: boolean;
    action: () => void;
  } | null>(null);

  useEffect(() => {
    params.then((p) => {
      setGroupId(p.id);
      Promise.all([getStudyGroup(p.id), getGroupMembers(p.id)])
        .then(([groupData, membersData]) => {
          if (
            !groupData ||
            (!groupData.membershipState.isOwner &&
              !groupData.membershipState.isAdmin)
          ) {
            router.push(`/groups/${p.id}`);
            return;
          }
          setGroup(groupData);
          setIsOwner(groupData.membershipState.isOwner);
          setMembers(membersData);
        })
        .catch(() => {
          toast.error("فشل التحميل");
          router.push("/groups");
        })
        .finally(() => setLoading(false));
    });
  }, [router]);

  const activeMembers = members.filter((m) => m.status === "ACTIVE");
  const pendingMembers = members.filter((m) => m.status === "PENDING");

  async function handleApprove(mid: string) {
    try {
      await approveJoinRequest(mid);
      setMembers((prev) =>
        prev.map((m) =>
          m.membershipId === mid ? { ...m, status: "ACTIVE" } : m
        )
      );
      toast.success("تم القبول");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  }

  async function handleReject(mid: string) {
    try {
      await rejectJoinRequest(mid);
      setMembers((prev) => prev.filter((m) => m.membershipId !== mid));
      toast.success("تم الرفض");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  }

  async function handleRemove(mid: string) {
    try {
      await removeMember(mid);
      setMembers((prev) => prev.filter((m) => m.membershipId !== mid));
      toast.success("تمت الإزالة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  }

  async function handlePromote(mid: string) {
    try {
      await promoteMember(mid);
      setMembers((prev) =>
        prev.map((m) =>
          m.membershipId === mid ? { ...m, role: "ADMIN" } : m
        )
      );
      toast.success("تمت الترقية");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  }

  async function handleDemote(mid: string) {
    try {
      await demoteMember(mid);
      setMembers((prev) =>
        prev.map((m) =>
          m.membershipId === mid ? { ...m, role: "MEMBER" } : m
        )
      );
      toast.success("تم التخفيض");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  }

  async function handleTransfer(mid: string) {
    try {
      await transferOwnership(mid);
      toast.success("تم نقل الملكية");
      router.push(`/groups/${groupId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  }

  async function handleArchive() {
    try {
      await archiveStudyGroup(groupId);
      toast.success("تمت أرشفة المجموعة");
      router.push("/groups/my");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  }

  async function handleDelete() {
    try {
      await deleteGroup(groupId);
      toast.success("تم حذف المجموعة");
      router.push("/groups/my");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8">
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!group) return null;

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      key: "members",
      label: "الأعضاء",
      icon: <Users className="h-4 w-4" />,
      count: activeMembers.length,
    },
    {
      key: "pending",
      label: "الطلبات المعلّقة",
      icon: <Clock className="h-4 w-4" />,
      count: pendingMembers.length,
    },
    { key: "danger", label: "خطر", icon: <Trash2 className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.label ?? ""}
        destructive={confirm?.destructive}
        onConfirm={() => {
          confirm?.action();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />

      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 ml-1" /> تفاصيل المجموعة
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            {group.memberCount} عضو
            {group.maxMembers ? ` / ${group.maxMembers}` : ""}
            {group.visibility === "PUBLIC" ? " · عام" : " · خاص"}
          </p>
        </div>
        <Link href={`/groups/${groupId}/settings`}>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 ml-1" /> تعديل
          </Button>
        </Link>
      </div>

      <div className="flex gap-1 border-b pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {t.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <div className="space-y-2">
          {activeMembers.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">
              لا يوجد أعضاء نشطين
            </p>
          )}
          <div className="divide-y rounded-lg border">
            {activeMembers.map((m) => (
              <div
                key={m.membershipId}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">
                  {getInitial(m.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {m.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.academicYear ?? ""}
                    {m.currentUsmleStage
                      ? ` · USMLE ${m.currentUsmleStage}`
                      : ""}
                  </p>
                </div>
                <Badge
                  variant={ROLE_VARIANT[m.role] ?? "outline"}
                  className="text-[10px] shrink-0"
                >
                  {m.role === "OWNER" && (
                    <Crown className="h-3 w-3 ml-0.5" />
                  )}
                  {ROLE_LABELS[m.role]}
                </Badge>
                // ✅ بعد — OWNER فقط يقدر يرقّي
                {isOwner && m.role !== "OWNER" && (
                  <div className="flex gap-0.5 shrink-0">
                    {m.role === "MEMBER" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => handlePromote(m.membershipId)}
                        title="ترقية لمشرف"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {m.role === "ADMIN" && isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleDemote(m.membershipId)}
                        title="تخفيض لعضو"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {m.role === "ADMIN" && isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        title="نقل الملكية"
                        onClick={() =>
                          setConfirm({
                            title: "نقل الملكية",
                            description: `هل أنت متأكد من نقل ملكية المجموعة إلى "${m.displayName}"؟ ستتحول إلى مشرف.`,
                            label: "نقل الملكية",
                            action: () => handleTransfer(m.membershipId),
                          })
                        }
                      >
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive"
                      onClick={() =>
                        setConfirm({
                          title: "إزالة العضو",
                          description: `هل أنت متأكد من إزالة "${m.displayName}" من المجموعة؟`,
                          label: "إزالة",
                          destructive: true,
                          action: () => handleRemove(m.membershipId),
                        })
                      }
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "pending" && (
        <div className="space-y-2">
          {pendingMembers.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">
              لا توجد طلبات معلّقة
            </p>
          )}
          <div className="divide-y rounded-lg border">
            {pendingMembers.map((m) => (
              <div
                key={m.membershipId}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm font-medium shrink-0">
                  {getInitial(m.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {m.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.academicYear ?? ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleApprove(m.membershipId)}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-0.5" />
                    قبول
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-destructive"
                    onClick={() => handleReject(m.membershipId)}
                  >
                    <ShieldMinus className="h-3.5 w-3.5 mr-0.5" />
                    رفض
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "danger" && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive text-base">
              منطقة الخطر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              هذه الإجراءات لا يمكن التراجع عنها. تأكد قبل المتابعة.
            </p>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">أرشفة المجموعة</p>
                <p className="text-xs text-muted-foreground">
                  إخفاء المجموعة دون حذف البيانات
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirm({
                    title: "أرشفة المجموعة",
                    description: `هل أنت متأكد من أرشفة "${group.name}"؟ لن يتم حذف البيانات لكن المجموعة ستختفي من البحث.`,
                    label: "أرشفة",
                    destructive: true,
                    action: handleArchive,
                  })
                }
              >
                <Archive className="h-4 w-4 ml-1" /> أرشفة
              </Button>
            </div>
            {isOwner && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    حذف المجموعة نهائياً
                  </p>
                  <p className="text-xs text-muted-foreground">
                    حذف المجموعة وجميع بياناتها بشكل نهائي
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    setConfirm({
                      title: "حذف المجموعة نهائياً",
                      description: `هل أنت متأكد من حذف "${group.name}" نهائياً؟ سيتم حذف جميع الأعضاء والبيانات المرتبطة ولا يمكن التراجع.`,
                      label: "حذف نهائياً",
                      destructive: true,
                      action: handleDelete,
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 ml-1" /> حذف
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
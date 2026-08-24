"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getGroupMembers,
  getStudyGroup,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  promoteMember,
  demoteMember,
} from "@/actions/student/groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  ShieldMinus,
  UserMinus,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { GroupMemberInfo } from "@/types/groups";

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
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
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

export default function MembersPage({ params }: Props) {
  const [members, setMembers] = useState<GroupMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupId, setGroupId] = useState("");
  const [canManage, setCanManage] = useState(false);
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
      Promise.all([getGroupMembers(p.id), getStudyGroup(p.id)])
        .then(([membersData, groupData]) => {
          setMembers(membersData);
          if (groupData) {
            setCanManage(
              groupData.membershipState.isOwner ||
                groupData.membershipState.isAdmin
            );
            setIsOwner(groupData.membershipState.isOwner);
          }
        })
        .catch(() => toast.error("فشل تحميل الأعضاء"))
        .finally(() => setLoading(false));
    });
  }, []);

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

  const activeMembers = members.filter((m) => m.status === "ACTIVE");
  const pendingMembers = members.filter((m) => m.status === "PENDING");

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
      <h1 className="text-xl font-bold">
        الأعضاء ({activeMembers.length})
      </h1>

      {loading ? (
        <div className="space-y-3 py-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          {activeMembers.length === 0 && pendingMembers.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">
              لا يوجد أعضاء بعد
            </p>
          )}

          {activeMembers.length > 0 && (
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
                    {ROLE_LABELS[m.role]}
                  </Badge>
                  {canManage && m.role !== "OWNER" && (
                    <div className="flex gap-0.5 shrink-0">
                      {m.role === "MEMBER" && isOwner && (
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
          )}

          {pendingMembers.length > 0 && canManage && (
            <div className="space-y-2">
              <h2 className="font-semibold text-sm">
                طلبات معلّقة ({pendingMembers.length})
              </h2>
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
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      معلق
                    </Badge>
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
        </>
      )}
    </div>
  );
}
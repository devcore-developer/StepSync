"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUsers } from "@/actions/admin/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminRoleChangeDialog } from "./role-change-dialog";

interface UserRow {
  id: string;
  email: string;
  role: string;
  isOnboarded: boolean;
  usmleStage: string | null;
  academicYear: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    studyPlans: number;
    sentPartnerRequests: number;
    receivedPartnerRequests: number;
    groupMemberships: number;
    sentMessages: number;
  };
}

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "طالب",
  ADMIN: "مدير",
};

const STAGE_LABELS: Record<string, string> = {
  PREPARING_STEP1: "Step 1",
  PREPARING_STEP2CK: "Step 2 CK",
  PREPARING_STEP3: "Step 3",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const search = String(searchParams.get("search") ?? "");
  const role = String(searchParams.get("role") ?? "ALL");
  const onboarding = String(searchParams.get("onboarding") ?? "ALL");

  useEffect(() => {
    setLoading(true);
    getUsers({
      search: search || undefined,
      role,
      onboarding,
      page,
      limit,
    })
      .then((res: { users: UserRow[]; total: number }) => {
        setUsers(res.users);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, role, onboarding, page]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/admin/users?${params.toString()}`);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
      <p className="text-muted-foreground">تصفح وإدارة حسابات الطلاب</p>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="بحث بالبريد..."
          defaultValue={search}
          className="w-64"
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParams({ search: e.currentTarget.value });
          }}
        />
        <Select
          value={role}
          onValueChange={(v) => { if (v) updateParams({ role: v, page: "1" }); }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="الدور" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            <SelectItem value="STUDENT">طالب</SelectItem>
            <SelectItem value="ADMIN">مدير</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={onboarding}
          onValueChange={(v) => { if (v) updateParams({ onboarding: v, page: "1" }); }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الاستكمال" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">الكل</SelectItem>
            <SelectItem value="COMPLETE">مكتمل</SelectItem>
            <SelectItem value="INCOMPLETE">غير مكتمل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3 py-8">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {total} مستخدم {search && `← "${search}"`}
          </p>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground">
                  <th className="text-right px-4 py-2.5 font-medium">البريد</th>
                  <th className="text-right px-3 py-2.5 font-medium w-20">الدور</th>
                  <th className="text-right px-3 py-2.5 font-medium w-24">الحالة</th>
                  <th className="text-right px-3 py-2.5 font-medium w-24">المرحلة</th>
                  <th className="text-right px-3 py-2.5 font-medium w-28">السنة الدراسية</th>
                  <th className="text-right px-3 py-2.5 font-medium w-28">المجموعات</th>
                  <th className="text-right px-3 py-2.5 font-medium w-24">الرسائل</th>
                  <th className="text-right px-3 py-2.5 font-medium w-24">الانضمام</th>
                  <th className="px-3 py-2.5 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-right font-mono text-xs truncate max-w-[200px]">
                      {u.email}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Badge
                        variant={u.role === "ADMIN" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {u.isOnboarded ? (
                        <span className="text-green-600 text-xs">مكتمل</span>
                      ) : (
                        <span className="text-amber-600 text-xs">غير مكتمل</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs">
                      {u.usmleStage
                        ? (STAGE_LABELS[u.usmleStage] ?? u.usmleStage)
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs">
                      {u.academicYear ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs">
                      {u._count.groupMemberships}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs">
                      {u._count.sentMessages}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-3 py-2.5">
                      <AdminRoleChangeDialog
                        userId={u.id}
                        currentRole={u.role}
                        userName={u.email}
                        onDone={() =>
                          setUsers((prev) =>
                            prev.map((user) =>
                              user.id === u.id
                                ? { ...user, role: user.role === "ADMIN" ? "STUDENT" : "ADMIN" }
                                : user
                            )
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > limit && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
              >
                التالي
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { changeUserRole } from "@/actions/admin/users";

interface Props {
  userId: string;
  currentRole: string;
  userName: string;
  onDone: () => void;
}

export function AdminRoleChangeDialog({ userId, currentRole, userName, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const newRole = currentRole === "ADMIN" ? "STUDENT" : "ADMIN";

  async function handleConfirm() {
    setChanging(true);
    try {
      await changeUserRole({ userId, role: newRole });
      onDone();
      setOpen(false);
      toast.success("تم تغيير الدور");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تغيير الدور");
    } finally {
      setChanging(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className="text-muted-foreground hover:text-foreground transition-colors p-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تغيير الدور</AlertDialogTitle>
          <AlertDialogDescription>
            هل تريد تغيير دور{" "}
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
              {userName}
            </span>{" "}
            من{" "}
            <span className="font-semibold">{currentRole === "ADMIN" ? "مدير" : "طالب"}</span>{" "}
            إلى{" "}
            <span className="font-semibold">{newRole === "ADMIN" ? "مدير" : "طالب"}</span>
            ؟
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={changing}>
            {changing ? "جاري التغيير..." : "تأكيد"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
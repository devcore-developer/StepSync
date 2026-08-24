"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/actions/student/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Prefs {
  study: boolean;
  partners: boolean;
  messages: boolean;
  groups: boolean;
  ai: boolean;
}

const CATEGORIES: { key: keyof Prefs; label: string; description: string }[] = [
  {
    key: "study",
    label: "الدراسة والخطط",
    description: "تذكيرات المهام، التأخر، إنجاز المراحل، إعادة الجدولة",
  },
  {
    key: "partners",
    label: "شركاء الدراسة",
    description: "طلبات الشراكة، القبول، الرفض",
  },
  {
    key: "messages",
    label: "الرسائل",
    description: "رسائل جديدة من الشركاء والمجموعات",
  },
  {
    key: "groups",
    label: "المجموعات الدراسية",
    description: "طلبات الانضمام، القبول، الإزالة، الترقية",
  },
  {
    key: "ai",
    label: "الذكاء الاصطناعي",
    description: "توصيات الخطة، التحليل الذكي",
  },
];

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    getNotificationPreferences()
      .then((p) => setPrefs(p))
      .catch(() => toast.error("فشل تحميل التفضيلات"))
      .finally(() => setLoading(false));
  }, []);

  function toggle(key: keyof Prefs) {
    if (!prefs) return;
    setPrefs((prev) => ({ ...prev!, [key]: !prev![key] }));
    setChanged(true);
  }

  async function handleSave() {
    if (!prefs || !changed) return;
    setSaving(true);
    try {
      await updateNotificationPreferences(prefs as unknown as Record<string, boolean>);
      setChanged(false);
      toast.success("تم حفظ التفضيلات");
    } catch {
      toast.error("فشل حفظ التفضيلات");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/settings"
          className="hover:text-foreground transition-colors"
        >
          الإعدادات
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">الإشعارات</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تفضيلات الإشعارات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-5 w-9 bg-muted animate-pulse rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.key}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                  <Switch
                    checked={prefs?.[cat.key] ?? true}
                    onCheckedChange={() => toggle(cat.key)}
                  />
                </div>
              ))}
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              تعطيل الفئات اللي مش مهمة عشان تقلل الإزعاج.
            </p>
            <button
              onClick={handleSave}
              disabled={saving || !changed}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
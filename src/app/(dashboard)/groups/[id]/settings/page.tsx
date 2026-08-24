"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getStudyGroup,
  updateStudyGroup,
  archiveStudyGroup,
  getGroupFormOptions,
} from "@/actions/student/groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default function GroupSettingsPage({ params }: Props) {
  const router = useRouter();
  const [groupId, setGroupId] = useState("");
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [systemId, setSystemId] = useState<string | undefined>();
  const [chapterId, setChapterId] = useState<string | undefined>();
  const [locationId, setLocationId] = useState<string | undefined>();
  const [maxMembers, setMaxMembers] = useState("");
  const [opts, setOpts] = useState<{
    systems: { id: string; name: string }[];
    chapters: { id: string; name: string; systemId: string }[];
    locations: { id: string; name: string }[];
  } | null>(null);

  useEffect(() => {
    params.then((p) => setGroupId(p.id));
  }, [params]);

  useEffect(() => {
    getGroupFormOptions().then(setOpts).catch(() => {});
  }, []);

  useEffect(() => {
    if (!groupId) return;
    getStudyGroup(groupId).then((g) => {
      if (!g) {
        router.push(`/groups/${groupId}`);
        return;
      }
      setIsOwner(g.membershipState.isOwner);
      setName(g.name ?? "");
      setDescription(g.description ?? "");
      setGoal(g.goal ?? "");
      setVisibility(g.visibility);
      setSystemId(g.currentSystem?.id);
      setChapterId(g.currentChapter?.id);
      setLocationId(g.studyLocation?.id);
      setMaxMembers(g.maxMembers?.toString() ?? "");
    }).catch(() => toast.error("فشل التحميل"));
  }, [groupId, router]);

  const filteredChapters = opts?.chapters.filter(
    (c: { id: string; name: string; systemId: string }) =>
      c.systemId === systemId
  );

  function clean(v: string | null): string | undefined {
    return !v || v === "_" ? undefined : v;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateStudyGroup(groupId, {
        name: name.trim(),
        description: description.trim() || undefined,
        goal: goal.trim() || undefined,
        visibility: visibility as "PUBLIC" | "PRIVATE",
        currentSystemId: systemId || undefined,
        currentChapterId: chapterId || undefined,
        studyLocationId: locationId || undefined,
        maxMembers: maxMembers ? parseInt(maxMembers) : undefined,
      });
      toast.success("تم تحديث المجموعة");
      router.push(`/groups/${groupId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل التحديث");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!confirm("هل أنت متأكد من أرشفة المجموعة؟")) return;
    try {
      await archiveStudyGroup(groupId);
      toast.success("تمت أرشفة المجموعة");
      router.push("/groups/my");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الأرشفة");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4 ml-1" /> تفاصيل المجموعة
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>إعدادات المجموعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">اسم المجموعة *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              placeholder="مثال: Cardiology Study Group"
              maxLength={80}
            />
          </div>
          <div>
            <label className="text-sm font-medium">الوصف</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={3}
              placeholder="ما هدف هذه المجموعة؟"
              maxLength={500}
            />
          </div>
          <div>
            <label className="text-sm font-medium">الهدف</label>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="mt-1"
              placeholder="مثال: إكمال الفصل بحل نهاية الشهر"
              maxLength={300}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">الظهور *</label>
              <Select
                value={visibility}
                onValueChange={(v) => {
                  if (v) setVisibility(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="عام أو خاص" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    عام — يمكن لأي شخص الانضمام
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    خاص — يحتاج موافقة
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">نظام USMLE</label>
              <div className="mt-1">
                <Select
                  value={systemId ?? "_"}
                  onValueChange={(v) => {
                    setSystemId(clean(v));
                    setChapterId(undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">بدون</SelectItem>
                    {opts?.systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">الفصل</label>
              <div className="mt-1">
                <Select
                  value={chapterId ?? "_"}
                  onValueChange={(v) => setChapterId(clean(v))}
                  disabled={!systemId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نظاماً أولاً" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">بدون</SelectItem>
                    {filteredChapters?.map(
                      (c: { id: string; name: string }) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">مكان الدراسة</label>
              <div className="mt-1">
                <Select
                  value={locationId ?? "_"}
                  onValueChange={(v) => setLocationId(clean(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">بدون</SelectItem>
                    {opts?.locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">
              الحد الأقصى للأعضاء
            </label>
            <Input
              type="number"
              min={2}
              max={50}
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
              className="mt-1"
              placeholder="مثال: 10"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/groups/${groupId}`)}
            >
              إلغاء
            </Button>
            {isOwner && (
              <Button variant="destructive" onClick={handleArchive}>
                أرشفة المجموعة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
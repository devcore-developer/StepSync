"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { completeOnboarding } from "@/actions/onboarding";
import { createStudyPlanFromTemplate } from "@/actions/student/study-plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Stethoscope,
  CalendarDays,
  Clock,
  CheckCircle2,
  ChevronLeft,
  BookOpen,
  Target,
} from "lucide-react";

const STEPS = [
  { title: "المرحلة الدراسية", icon: Target },
  { title: "الجدول الزمني", icon: CalendarDays },
  { title: "اختيار القالب", icon: BookOpen },
];

const LEVELS = [
  { value: "STARTING", label: "لم أبدأ بعد", desc: "بداية من الصفر" },
  { value: "STUDYING", label: "أدرس حالياً", desc: "لدي خلفية" },
  { value: "DEDICATED", label: "فترة مركزة", desc: "أخصص وقت كامل" },
  { value: "MIDWAY", label: "في منتصف الطريق", desc: "أنجزت جزء" },
];

const HOURS_OPTIONS = [
  { value: "2-3", label: "2–3 ساعات" },
  { value: "4-5", label: "4–5 ساعات" },
  { value: "6-8", label: "6–8 ساعات" },
  { value: "8+", label: "8+ ساعات" },
];

const DAYS_OPTIONS = [
  { value: "5", label: "5 أيام" },
  { value: "6", label: "6 أيام" },
  { value: "7", label: "7 أيام" },
];

const TEMPLATE_SLUG = "marathoprint-8-month-step1";

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [level, setLevel] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [studyDays, setStudyDays] = useState("");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );

  const canProceed = step === 0 ? level !== "" : step === 1 ? studyHours !== "" && studyDays !== "" && startDate !== "" : true;

  function onNext() {
    if (step < 2) {
      setStep(step + 1);
      return;
    }

    handleSubmit();
  }

  async function handleSubmit() {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.set("academicYear", "5th Year");
      fd.set("currentUsmleStage", "PREPARING_STEP1");
      fd.set("availableHours", studyHours);
      fd.set("preferredStudyTime", "Morning");
      fd.set("preferredDays", `${studyDays} days/week`);
      fd.set("interestedInPartners", "on");
      fd.set("interestedInGroups", "on");

      await completeOnboarding(fd);

      await createStudyPlanFromTemplate(TEMPLATE_SLUG, {
        startDate,
      });

      if (session?.user) {
        await update({
          session: { ...session, user: { ...session.user, isOnboarded: true } },
        });
      }

      toast.success("تم إنشاء خطتك الدراسية بنجاح!");
      router.replace("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إنشاء الخطة");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-brand-red mb-4">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-brand-navy">StepSync</h1>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => i < step && setStep(i)}
                className="flex flex-col items-center gap-1.5 flex-1"
              >
                <div
                  className={`h-1 w-full rounded-full transition-colors ${
                    i <= step
                      ? "bg-brand-blue"
                      : "bg-brand-surface-alt"
                  }`}
                />
                <span
                  className={`text-[10px] ${
                    i <= step
                      ? "text-brand-blue font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                {(() => {
                  const Icon = STEPS[step].icon;
                  return <Icon className="h-4.5 w-4.5" />;
                })()}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  خطوة {step + 1} من {STEPS.length}
                </p>
                <h2 className="text-lg font-bold text-brand-navy">
                  {STEPS[step].title}
                </h2>
              </div>
            </div>

            {/* Step 0: Level */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  هذا يساعدنا على تخصيص تجربتك
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setLevel(level.value)}
                      className={`rounded-xl border-2 p-4 text-right transition-all ${
                        level.value === level
                          ? "border-brand-blue bg-brand-light-blue"
                          : "border-transparent bg-brand-surface hover:border-brand-blue/30"
                      }`}
                    >
                      <p className="text-sm font-semibold text-brand-navy">
                        {level.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {level.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Schedule */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>ساعات الدراسة اليومية</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {HOURS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStudyHours(opt.value)}
                        className={`rounded-lg border-2 p-3 text-center transition-all ${
                          studyHours === opt.value
                            ? "border-brand-blue bg-brand-light-blue"
                            : "border-transparent bg-brand-surface hover:border-brand-blue/30"
                        }`}
                      >
                        <p className="text-sm font-semibold text-brand-navy">{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>أيام الدراسة أسبوعياً</Label>
                  <div className="flex gap-2">
                    {DAYS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStudyDays(opt.value)}
                        className={`rounded-lg border-2 px-5 py-3 flex-1 transition-all ${
                          studyDays === opt.value
                            ? "border-brand-blue bg-brand-light-blue"
                            : "border-transparent bg-brand-surface hover:border-brand-blue/30"
                        }`}
                      >
                        <p className="text-sm font-semibold text-brand-navy">{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>تاريخ البداية</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    dir="ltr"
                    className="text-left"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Template Confirmation */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-brand-blue/20 bg-brand-light-blue p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-brand-navy">MARATHOPRINT</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        8 Month USMLE Step 1
                      </p>
                    </div>
                    <Badge variant="blue">مُوصى به</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs mt-3">
                    <div>
                      <p className="text-lg font-bold text-brand-blue">240</p>
                      <p className="text-muted-foreground">يوم</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-brand-gold">~3,645</p>
                      <p className="text-muted-foreground">سؤال UWorld</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-brand-navy">19</p>
                      <p className="text-muted-foreground">نظام</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                      <span>مراجعة First Aid + أسئلة UWorld</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                      <span>أيام مراجعة وcheckpoint</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                      <span>فترات راحة + جلسات UW Life</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                      <span>إعادة جدولة تكيفية + توصيات AI</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  تاريخ البداية:{" "}
                  {new Date(startDate).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              {step > 0 && (
                <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 ml-1" />
                  رجوع
                </Button>
              )}
              {step < 2 ? (
                <Button type="button" onClick={onNext} disabled={!canProceed}>
                  التالي
                </Button>
              ) : (
                <Button
                  type="button"
                  className="bg-brand-red hover:bg-brand-red/90"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "جارٍ الإنشاء..." : "إنشاء خطتي الدراسية"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Alexandria University — © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
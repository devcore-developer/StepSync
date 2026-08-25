import Link from "next/link";
import HeroCta from "@/components/shared/hero-cta";
import {
  BookOpen,
  BarChart3,
  Brain,
  Users,
  MessageSquare,
  Bell,
  Target,
  CalendarCheck,
  Check,
  Stethoscope,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";

export const metadata = {
  title: "StepSync — منصة التخطيط الدراسي الذكية لطلاب الطب",
  description:
    "خطط دراستك، تابع تقدمك، أعد جدولة مهامك، وابقَ مسؤولاً مع StepSync.",
};

const features = [
  {
    icon: CalendarCheck,
    title: "خطط دراسية ذكية",
    description: "خطة مخصصة لمرحلة USMLE مع milestones وجدول زمني واقعي.",
  },
  {
    icon: Target,
    title: "تتبع المهام والتقدم",
    description: "تابع تقدمك بشكل مرئي مع مؤشرات أداء واضحة.",
  },
  {
    icon: Brain,
    title: "توصيات ذكية",
    description: "توصيات مخصصة بناءً على أدائك الفعلي.",
  },
  {
    icon: Users,
    title: "شركاء دراسة",
    description: "اعثر على شركاء دراسة مناسبين.",
  },
  {
    icon: MessageSquare,
    title: "مجموعات دراسية",
    description: "انضم لمجموعات أو أنشئ مجموعتك.",
  },
  {
    icon: Bell,
    title: "إشعارات ذكية",
    description: "تنبيهات فورية مع تفضيلات قابلة للتخصيص.",
  },
  {
    icon: BarChart3,
    title: "تحليلات شاملة",
    description: "رؤى تحليلية عن أدائك عبر الأنظمة والفصول.",
  },
  {
    icon: BookOpen,
    title: "محتوى USMLE منظّم",
    description: "وصول كامل لأنظمة USMLE والموارد الدراسية.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-brand-blue">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(242,193,78,0.08)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-sm text-white/80">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>لطلاب الطب — USMLE</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-[3.4rem]">
              خطط دراستك بذكاء
              <br />
              <span className="text-brand-gold">وابقَ على المسار</span>
            </h1>
            <p className="text-lg leading-relaxed text-white/75">
              منصة ذكية تساعدك على التخطيط والتنظيم والمتابعة والمساءلة خلال
              رحلة التحضير لامتحان USMLE
            </p>
            <HeroCta />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t bg-brand-surface py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <h2 className="text-2xl font-bold text-brand-navy sm:text-3xl">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              أدوات متكاملة مصممة خصيصاً لطلاب الطب
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light-blue text-brand-blue">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-brand-navy mb-1.5">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why StepSync ── */}
      <section className="border-t bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold text-brand-navy mb-7 sm:text-3xl">
                لماذا StepSync؟
              </h2>
              <ul className="space-y-3.5">
                {[
                  "خطط دراسي مخصص مع جدول زمني واقعي",
                  "تتبع يومي للمهام والتقدم",
                  "كشف التأخر تلقائياً وإعادة جدولة ذكية",
                  "شريك دراسة متوافق مع أهدافك",
                  "مجموعات دراسية للتعلم الجماعي",
                  "تحليلات مفصلة لأدائك",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light-blue">
                      <Check className="h-3 w-3 text-brand-blue" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border bg-brand-surface p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-2.5 w-2.5 rounded-full bg-brand-blue" />
                <span className="text-sm font-semibold text-brand-navy">
                  خطة نشطة
                </span>
                <span className="mr-auto text-[11px] font-semibold text-brand-gold bg-brand-light-gold px-2 py-0.5 rounded-full">
                  Step 1
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "الجهاز الهضمي", pct: 80 },
                  { name: "الجهاز العصبي", pct: 65 },
                  { name: "الجهاز الدوري", pct: 50 },
                ].map((sys) => (
                  <div
                    key={sys.name}
                    className="rounded-lg border bg-white p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-navy">
                        {sys.name}
                      </span>
                      <span className="text-xs font-semibold text-brand-blue">
                        {sys.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-brand-surface-alt overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-blue transition-all"
                        style={{ width: `${sys.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-dashed p-3 text-center">
                  <p className="text-xs text-muted-foreground">+3 مراحل قادمة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Section ── */}
      <section className="border-t bg-brand-navy py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "توصيات ذكية",
                desc: "تحليل أنماط دراستك وتقديم توصيات مخصصة لتحسين أدائك.",
              },
              {
                icon: TrendingUp,
                title: "إعادة جدولة تكيفية",
                desc: "تعديل تلقائي للخطة عند التأخر مع الحفاظ على الأهداف.",
              },
              {
                icon: UserCheck,
                title: "مساءلة ذكية",
                desc: "تتبع انضباطك وتنبيهات مبكرة قبل التأخر.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/10">
                  <item.icon className="h-6 w-6 text-brand-gold" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t bg-brand-blue py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3 sm:text-3xl">
            ابدأ رحلتك الدراسية الآن
          </h2>
          <p className="text-white/70 max-w-md mx-auto mb-7">
            انضم لطلاب الطب الذين يستخدمون StepSync للتحضير لامتحان USMLE
          </p>
          <HeroCta />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-brand-navy py-6">
        <div className="mx-auto max-w-6xl px-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
          <span className="font-bold text-white">StepSync</span>
          <span className="text-white/40">
            © {new Date().getFullYear()} — Alexandria University
          </span>
        </div>
      </footer>
    </div>
  );
}
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
  GraduationCap,
  Stethoscope,
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
    description:
      "أنشئ خطة دراسية مخصصة لمرحلة USMLE مع milestones وجدول زمني واقعي.",
  },
  {
    icon: Target,
    title: "تتبع المهام والتقدم",
    description:
      "أكمل المهام اليومية وتابع تقدمك بشكل مرئي مع مؤشرات أداء واضحة.",
  },
  {
    icon: Brain,
    title: "توصيات ذكية",
    description:
      "احصل على توصيات مخصصة بناءً على أدائك الفعلي وأنماط تعلمك.",
  },
  {
    icon: Users,
    title: "شركاء دراسة",
    description:
      "اعثر على شركاء دراسة مناسبين وابدأ رحلة التعلم معاً.",
  },
  {
    icon: MessageSquare,
    title: "مجموعات دراسية",
    description:
      "انضم لمجموعات دراسية أو أنشئ مجموعتك وتواصل مع أعضائك.",
  },
  {
    icon: Bell,
    title: "إشعارات ذكية",
    description:
      "تنبيهات فورية للمهام والتأخر مع تفضيلات قابلة للتخصيص.",
  },
  {
    icon: BarChart3,
    title: "تحليلات شاملة",
    description:
      "رؤى تحليلات مفصلة عن أدائك الدراسي عبر الأنظمة والفصول.",
  },
  {
    icon: BookOpen,
    title: "محتوى USMLE منظّم",
    description:
      "وصول كامل لأنظمة USMLE والفصول والموارد الدراسية المنظمة.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero: Deep Medical Blue ── */}
      <section className="relative overflow-hidden bg-brand-blue text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue via-brand-blue to-brand-blue/90" />
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm">
              <Stethoscope className="h-4 w-4" />
              <span>لطلاب الطب — USMLE</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              خطط دراستك بذكاء
              <br />
              <span className="text-brand-gold">وابقَ على المسار</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/80 leading-relaxed">
              منصة ذكية تساعدك على التخطيط والتنظيم والمتابعة والمساءلة خلال رحلة
              التحضير لامتحان USMLE
            </p>
            <HeroCta />
          </div>
        </div>
      </section>

      {/* ── Features: Clean White ── */}
      <section className="border-t bg-background">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
              كل ما تحتاجه في مكان واحد
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              أدوات متكاملة مصممة خصيصاً لطلاب الطب لتخطيط وتنفيذ ومتابعة خطة
              الدراسة
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-brand-blue/20"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-brand-navy mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why StepSync ── */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy mb-6">
                لماذا StepSync؟
              </h2>
              <ul className="space-y-4">
                {[
                  "خطط دراسي مخصص مع جدول زمني واقعي",
                  "تتبع يومي للمهام والتقدم",
                  "كشف التأخر تلقائياً وإعادة جدولة ذكية",
                  "شريك دراسة متوافق مع أهدافك",
                  "مجموعات دراسية للتعلم الجماعي",
                  "تحليلات مفصلة لأدائك",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/10">
                      <Check className="h-3 w-3 text-brand-blue" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-brand-blue" />
                  <span className="text-sm font-semibold text-brand-navy">
                    خطة نشطة
                  </span>
                  <span className="mr-auto text-xs text-brand-gold font-semibold bg-brand-gold/10 px-2 py-0.5 rounded-full">
                    Step 1
                  </span>
                </div>
                {[
                  { name: "الجهاز الهضمي", pct: 80 },
                  { name: "الجهاز العصبي", pct: 65 },
                  { name: "الجهاز الدوري", pct: 50 },
                ].map((sys) => (
                  <div key={sys.name} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-brand-navy">
                        {sys.name}
                      </span>
                      <span className="text-xs font-semibold text-brand-blue">
                        {sys.pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-blue transition-all"
                        style={{ width: `${sys.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    +3 مراحل قادمة
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t bg-brand-blue text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 mb-6">
            <GraduationCap className="h-4 w-4" />
            <span>انضم لمجتمع طلاب الطب</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            ابدأ رحلتك الدراسية الآن
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8">
            انضم لطلاب الطب الذين يستخدمون StepSync للتحضير لامتحان USMLE
            بذكاء وانضباط
          </p>
          <HeroCta />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-brand-navy text-white/60 py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <span className="font-bold text-white">StepSync</span>
          <span>© {new Date().getFullYear()} — Alexandria University</span>
        </div>
      </footer>
    </div>
  );
}
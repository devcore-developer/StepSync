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
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

export const metadata = {
  title: "StepSync — منصة التخطيط الدراسي الذكية لطلاب الطب",
  description:
    "خطط دراستك، تابع تقدمك، adapt schedules، وابقَ مسؤولاً مع StepSync.",
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              <span>لطلاب الطب</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              خطط دراستك بذكاء
              <br />
              <span className="text-primary">وابقَ على المسار</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
              منصة ذكية تساعدك على التخطيط والتنظيم والمتابعة والمساءلة خلال رحلة التحضير
              لامتحان USMLE
            </p>
            <HeroCta />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold">
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
                className="rounded-xl border bg-card p-6 transition-colors hover:border-primary/20"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">لماذا StepSync؟</h2>
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
                    <ArrowLeft className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">خطة نشطة</span>
                </div>
                {["الجهاز الهضمي", "الجهاز العصبي", "الجهاز الدوري"].map(
                  (sys, i) => (
                    <div key={sys} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{sys}</span>
                        <span className="text-xs text-muted-foreground">
                          {80 - i * 15}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${80 - i * 15}%` }}
                        />
                      </div>
                    </div>
                  )
                )}
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

      {/* Final CTA */}
      <section className="border-t bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            ابدأ رحلتك الدراسية الآن
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            انضم لطلاب الطب الذين يستخدمون StepSync للتحضير لامتحان USMLE
            بذكاء وانضباط
          </p>
          <HeroCta />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">StepSync</span>
          <span>
            © {new Date().getFullYear()} — Alexandria University
          </span>
        </div>
      </footer>
    </div>
  );
}
"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope } from "lucide-react";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await register(formData);

    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      router.push("/login");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-blue items-center justify-center p-12">
        <div className="max-w-md text-white space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">StepSync</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight">
            ابدأ رحلتك في التحضير
            <br />
            <span className="text-brand-gold">لامتحان USMLE</span>
          </h2>
          <p className="text-white/70 leading-relaxed">
            منصة ذكية تساعدك على التخطيط والتنظيم والمتابعة خلال رحلة
            التحضير لأهم امتحان في مسيرتك الطبية.
          </p>
          <div className="pt-4 border-t border-white/10 text-sm text-white/50">
            © {new Date().getFullYear()} — Alexandria University
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex flex-1 items-center justify-center bg-brand-surface px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-brand-navy">StepSync</span>
            </Link>
          </div>

          <div>
            <h1 className="text-xl font-bold text-brand-navy">
              إنشاء حساب جديد
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ابدأ رحلتك في التحضير لامتحان USMLE
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-xl border bg-card p-5 shadow-sm"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="أحمد"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">اسم العائلة</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="محمد"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ahmed@example.com"
                dir="ltr"
                className="text-left"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                dir="ltr"
                className="text-left"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                8 أحرف على الأقل، حرف كبير واحد، رقم واحد
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                dir="ltr"
                className="text-left"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-blue hover:bg-brand-blue/90"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/login"
              className="font-medium text-brand-blue hover:underline"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
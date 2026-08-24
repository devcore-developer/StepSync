"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-brand-blue">
              StepSync
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-brand-navy">
            إنشاء حساب جديد
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ابدأ رحلتك في التحضير لامتحان USMLE
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl bg-card p-6 shadow-sm ring-1 ring-foreground/5"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">الاسم الأول</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="أحمد"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">اسم العائلة</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="محمد"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              dir="ltr"
              className="text-left"
              required
            />
            <p className="text-xs text-muted-foreground">
              8 أحرف على الأقل، حرف كبير واحد، رقم واحد
            </p>
          </div>

          <div className="space-y-2">
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
            variant="cta"
            size="xl"
            className="w-full"
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
  );
}
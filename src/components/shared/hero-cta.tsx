"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function HeroCta() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-3">
        <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" />
        الذهاب إلى لوحة التحكم
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <Link
        href="/register"
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        ابدأ الآن
      </Link>
      <Link
        href="/login"
        className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        تسجيل الدخول
      </Link>
    </div>
  );
}
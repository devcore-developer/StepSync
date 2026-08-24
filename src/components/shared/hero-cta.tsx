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
        <div className="h-11 w-32 animate-pulse rounded-lg bg-white/10" />
        <div className="h-11 w-32 animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  if (session?.user) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-red px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90 shadow-lg shadow-brand-red/20"
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
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-red px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-red/90 shadow-lg shadow-brand-red/20"
      >
        ابدأ الآن
      </Link>
      <Link
        href="/login"
        className="inline-flex h-11 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-7 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        تسجيل الدخول
      </Link>
    </div>
  );
}
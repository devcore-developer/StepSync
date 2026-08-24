"use client";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-bold">حدث خطأ</h2>
      <p className="text-muted-foreground text-center max-w-md">
        حدث خطأ أثناء تسجيل الدخول.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-bold">خطأ في لوحة الإدارة</h2>
      <p className="text-muted-foreground text-center max-w-md">
        حدث خطأ أثناء تحميل بيانات الإدارة.
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
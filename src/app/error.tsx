"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <h2 className="text-2xl font-bold">حدث خطأ غير متوقع</h2>
          <p className="text-muted-foreground text-center max-w-md">
            نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
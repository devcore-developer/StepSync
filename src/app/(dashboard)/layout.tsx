import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NotificationBell from "@/components/shared/notification-bell";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  // 🟡 FIX: redirect لـ onboarding لو المستخدم ما كملش
  if (!session.user.isOnboarded) redirect("/onboarding");

  const user = session.user;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <nav className="flex items-center gap-5">
            <Link
              href="/dashboard"
              className="font-bold text-sm tracking-tight"
            >
              StepSync
            </Link>
            <Link
              href="/groups"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              المجموعات
            </Link>
            <Link
              href="/partners"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              الشركاء
            </Link>
            <Link
              href="/messages"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              الرسائل
            </Link>
            <Link
              href="/study-plan"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              خطتي
            </Link>
            <Link
              href="/analytics"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="h-4 w-4 inline ml-1" />
              التحليلات
            </Link>
          </nav>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link href="/profile">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {(user.name ?? "م")[0].toUpperCase()}
              </button>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
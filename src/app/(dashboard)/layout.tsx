import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NotificationBell from "@/components/shared/notification-bell";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { label: "المجموعات", href: "/groups" },
  { label: "الشركاء", href: "/partners" },
  { label: "الرسائل", href: "/messages" },
  { label: "خطتي", href: "/study-plan" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  if (!session.user.isOnboarded) redirect("/onboarding");

  const user = session.user;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="font-bold text-sm tracking-tight text-brand-blue"
            >
              StepSync
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/analytics"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
              >
                <BarChart3 className="h-4 w-4" />
                التحليلات
              </Link>
            </div>
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/profile">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-semibold text-brand-blue hover:bg-brand-blue/20 transition-colors">
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
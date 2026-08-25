import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardSidebar from "@/components/layout/dashboard-sidebar";
import MobileNav from "@/components/layout/mobile-nav";

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
    <div className="flex h-dvh overflow-hidden bg-brand-surface">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <DashboardSidebar userName={user.name ?? undefined} />
      </div>

      {/* Mobile Nav */}
      <MobileNav userName={user.name ?? undefined} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
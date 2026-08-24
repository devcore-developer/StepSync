import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudyPlan, getUserDrift } from "@/actions/student/study-plans";
import StudyPlanView from "./study-plan-view";

export default async function StudyPlanPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const plan = await getStudyPlan(session.user.id!);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-bold">لا توجد خطة دراسية بعد</h2>
        <p className="text-muted-foreground mt-2">
          اختر قالباً لإنشاء خطة الدراسة الخاصة بك
        </p>
        <a
          href="/plans"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          تصفح القوالب
        </a>
      </div>
    );
  }

  const drift = await getUserDrift();

  return <StudyPlanView plan={plan} drift={drift} />;
}
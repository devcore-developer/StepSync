import { getServerSession } from "next-auth";         // ← بدل auth
import { authOptions } from "@/lib/auth";              // ← بدل auth
import { redirect } from "next/navigation";
import { getTemplateDetails } from "@/actions/student/templates"; // ← الاسم الصحيح
import { createStudyPlanFromTemplate } from "@/actions/student/study-plans";
// شلت استيراد setup-form — مش موجود

export default async function SetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);  // ← الطريقة الصحيحة
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const template = await getTemplateDetails(id);

  if (!template) {
    redirect("/plans");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إعداد خطة الدراسة</h1>
        <p className="text-muted-foreground mt-1">
          أنت على وشك إنشاء خطة من القالب: <strong>{template.title}</strong>
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">مراحل القالب</h2>
        {/* ⚠️ عدّل هيكل البيانات حسب ما ترجعه getTemplateDetails فعلياً */}
        {(template as { milestones?: { id: string; title: string; tasks?: { id: string; title: string }[] }[] }).milestones?.map(
          (milestone: { id: string; title: string; tasks?: { id: string; title: string }[] }) => (
            <div key={milestone.id} className="border rounded-lg p-4">
              <h3 className="font-medium">{milestone.title}</h3>
              {milestone.tasks && milestone.tasks.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {milestone.tasks.map((task) => (
                    <li key={task.id}>• {task.title}</li>
                  ))}
                </ul>
              )}
            </div>
          )
        )}
      </div>

      <form
        action={async () => {
          "use server";
          await createStudyPlanFromTemplate(id);
          redirect("/study-plan");
        }}
      >
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          إنشاء الخطة
        </button>
      </form>
    </div>
  );
}
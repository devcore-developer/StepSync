import { getPublishedTemplates } from '@/actions/student/templates';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default async function PlansPage() {
  const templates = await getPublishedTemplates();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Study Plans</h1>
        <p className="text-gray-500 text-sm mt-1">Choose a schedule template to start your journey</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {templates.map(t => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="text-lg">{t.title}</CardTitle>
              {t.description && <p className="text-sm text-gray-500">{t.description}</p>}
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex gap-4">
                <span>📅 {t.durationWeeks} weeks</span>
                {t.recommendedStudyHours && <span>⏱ {t.recommendedStudyHours}h / week</span>}
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{t._count.milestones} Milestones</Badge>
                <Badge variant="outline">Published</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/plans/${t.slug}`} className="w-full bg-blue-600 text-white text-center py-2 rounded-md text-sm hover:bg-blue-700">View Details</Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
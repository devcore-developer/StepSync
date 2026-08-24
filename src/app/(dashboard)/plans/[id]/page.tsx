import { getTemplateDetails, selectTemplate } from '@/actions/student/templates';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import SelectButton from './select-button';

export default async function PlanDetailPage({ params }: { params: { id: string } }) {
  const template = await getTemplateDetails(params.id);
  if (!template) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{template.title}</h1>
        <p className="text-gray-600 mt-2">{template.description}</p>
        <div className="flex gap-4 mt-4 text-sm">
          <span>📅 {template.durationWeeks} weeks</span>
          {template.recommendedStudyHours && <span>⏱ {template.recommendedStudyHours}h / week</span>}
          <span>🎯 {template.milestones.length} milestones</span>
        </div>
      </div>

      <SelectButton slug={template.slug} />

      <div className="space-y-4">
        {template.milestones.map(m => (
          <div key={m.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{m.title}</h3>
                {m.system && <p className="text-xs text-gray-500">{m.system.name}</p>}
              </div>
              <div className="text-xs text-gray-500 text-right">
                {m.startDayOffset && m.endDayOffset && <span>Day {m.startDayOffset} - {m.endDayOffset}</span>}
                {m.estimatedWeeks && <span> (~{m.estimatedWeeks} wk)</span>}
              </div>
            </div>
            <ul className="space-y-1 border-t pt-2">
              {m.tasks.map(t => (
                <li key={t.id} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></span>
                  <span>{t.title}</span>
                  {t.isOptional && <Badge variant="outline" className="text-xs">Optional</Badge>}
                  {t.estimatedHours && <span className="text-xs text-gray-400 ml-auto">{t.estimatedHours}h</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
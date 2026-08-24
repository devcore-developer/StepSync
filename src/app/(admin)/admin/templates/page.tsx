import { db } from '@/lib/db';
import { publishTemplate, archiveTemplate } from '@/actions/admin/templates';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function TemplatesPage() {
  const templates = await db.scheduleTemplate.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { milestones: true } } } });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Schedule Templates</h1>
        <Link href="/admin/templates/new" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Create Template</Link>
      </div>
      <div className="bg-white border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr><th className="p-3 text-left">Title</th><th className="p-3 text-left">Duration</th><th className="p-3 text-left">Milestones</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th></tr></thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="border-b">
                <td className="p-3 font-medium">{t.title}</td>
                <td className="p-3">{t.durationWeeks} weeks</td>
                <td className="p-3">{t._count.milestones}</td>
                <td className="p-3"><Badge variant={t.status === 'PUBLISHED' ? 'default' : t.status === 'DRAFT' ? 'secondary' : 'outline'}>{t.status}</Badge></td>
                <td className="p-3 space-x-2">
                  <Link href={`/admin/templates/${t.id}`} className="text-blue-600 text-xs">Edit</Link>
                  {t.status === 'DRAFT' && <form action={async () => { 'use server'; await publishTemplate(t.id); }}><button type="submit" className="text-green-600 text-xs">Publish</button></form>}
                  {t.status === 'PUBLISHED' && <form action={async () => { 'use server'; await archiveTemplate(t.id); }}><button type="submit" className="text-orange-600 text-xs">Archive</button></form>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
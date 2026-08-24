import { db } from '@/lib/db';
import { createChapter, updateChapter } from '@/actions/admin/chapters';
import ChapterForm from './chapter-form';
import Link from 'next/link';

export default async function ChaptersPage({ searchParams }: { searchParams: { systemId?: string, editId?: string, new?: string } }) {
  const systems = await db.usmleSystem.findMany({ orderBy: { order: 'asc' } });
  const selectedSystem = searchParams.systemId || systems[0]?.id;
  const chapters = await db.chapter.findMany({ where: { systemId: selectedSystem! }, orderBy: { order: 'asc' }, include: { system: true } });
  const editChapter = searchParams.editId ? await db.chapter.findUnique({ where: { id: searchParams.editId } }) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chapters</h1>
        <Link href={`/admin/chapters?new=true&systemId=${selectedSystem}`} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Add Chapter</Link>
      </div>

      <select name="systemFilter" className="border rounded-md p-2 text-sm" onChange={(e) => window.location.href = `/admin/chapters?systemId=${e.target.value}`} defaultValue={selectedSystem}>
        {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {(searchParams.new === 'true' || editChapter) && (
        <ChapterForm systems={systems} data={editChapter} defaultSystemId={selectedSystem} action={editChapter ? updateChapter.bind(null, editChapter.id) : createChapter} />
      )}

      <div className="bg-white border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr><th className="p-3 text-left">Order</th><th className="p-3 text-left">Name</th><th className="p-3 text-left">Slug</th><th className="p-3 text-left">Actions</th></tr></thead>
          <tbody>
            {chapters.map(c => (
              <tr key={c.id} className="border-b">
                <td className="p-3">{c.order}</td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-500">{c.slug}</td>
                <td className="p-3"><Link href={`/admin/chapters?editId=${c.id}&systemId=${c.systemId}`} className="text-blue-600 text-xs">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
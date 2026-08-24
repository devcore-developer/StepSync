import { db } from '@/lib/db';
import { createSystem, updateSystem, toggleSystemActive } from '@/actions/admin/systems';
import SystemForm from './system-form';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function SystemsPage({ searchParams }: { searchParams: { editId?: string, new?: string } }) {
  const systems = await db.usmleSystem.findMany({ orderBy: { order: 'asc' } });
  const editSystem = searchParams.editId ? await db.usmleSystem.findUnique({ where: { id: searchParams.editId } }) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">USMLE Systems</h1>
        <Link href="/admin/systems?new=true" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">Add System</Link>
      </div>

      {(searchParams.new === 'true' || editSystem) && (
        <SystemForm data={editSystem} action={editSystem ? updateSystem.bind(null, editSystem.id) : createSystem} />
      )}

      <div className="bg-white border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr><th className="p-3 text-left">Order</th><th className="p-3 text-left">Name</th><th className="p-3 text-left">Slug</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th></tr>
          </thead>
          <tbody>
            {systems.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-3">{s.order}</td>
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3 text-gray-500">{s.slug}</td>
                <td className="p-3"><Badge variant={s.isActive ? 'default' : 'secondary'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></td>
                <td className="p-3 space-x-2">
                  <Link href={`/admin/systems?editId=${s.id}`} className="text-blue-600 text-xs">Edit</Link>
                  <form action={async () => { 'use server'; await toggleSystemActive(s.id); }}><button type="submit" className="text-xs text-gray-500">Toggle</button></form>
                  <Link href={`/admin/chapters?systemId=${s.id}`} className="text-xs text-purple-600">Chapters</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
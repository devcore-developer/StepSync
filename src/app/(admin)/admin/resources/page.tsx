import { db } from '@/lib/db';
import { createResource, updateResource } from '@/actions/admin/resources';
import ResourceForm from './resource-form';
import Link from 'next/link';

export default async function ResourcesPage({ searchParams }: { searchParams: { editId?: string, new?: string } }) {
  const resources = await db.resource.findMany({ orderBy: { order: 'asc' }, include: { chapter: { include: { system: true } } } });
  const editResource = searchParams.editId ? await db.resource.findUnique({ where: { id: searchParams.editId } }) : null;
  const systems = await db.usmleSystem.findMany({ include: { chapters: true } });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Resources</h1>
        <Link href="/admin/resources?new=true" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Add Resource</Link>
      </div>

      {(searchParams.new === 'true' || editResource) && (
        <ResourceForm systems={systems} data={editResource} action={editResource ? updateResource.bind(null, editResource.id) : createResource} />
      )}

      <div className="bg-white border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">System/Chapter</th><th className="p-3 text-left">Actions</th></tr></thead>
          <tbody>
            {resources.map(r => (
              <tr key={r.id} className="border-b">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{r.type}</span></td>
                <td className="p-3 text-gray-500 text-xs">{r.chapter?.system?.name} / {r.chapter?.name || 'General'}</td>
                <td className="p-3"><Link href={`/admin/resources?editId=${r.id}`} className="text-blue-600 text-xs">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TemplateEditor({ data, action }: { data?: any, action: (formData: FormData) => Promise<any> }) {
  const router = useRouter();
  const [milestones, setMilestones] = useState(data?.milestones || []);
  const [newMilestone, setNewMilestone] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Append milestones as JSON for now (in a real app, these would be separate API calls)
    formData.append('milestonesData', JSON.stringify(milestones));
    const res = await action(formData);
    if (res.error) toast.error(res.error); else { toast.success(res.success); router.push('/admin/templates'); router.refresh(); }
  }

  function addMilestone() {
    if (!newMilestone.trim()) return;
    setMilestones([...milestones, { id: Date.now().toString(), title: newMilestone, order: milestones.length + 1, tasks: [] }]);
    setNewMilestone('');
  }

  function removeMilestone(id: string) {
    setMilestones(milestones.filter((m: any) => m.id !== id));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border rounded-md p-4 space-y-4">
        <h2 className="font-semibold text-lg">Template Details</h2>
        <div><label className="text-sm font-medium">Title</label><input name="title" defaultValue={data?.title} className="w-full border rounded-md p-2 mt-1" required /></div>
        <div><label className="text-sm font-medium">Slug</label><input name="slug" defaultValue={data?.slug} className="w-full border rounded-md p-2 mt-1" required /></div>
        <div><label className="text-sm font-medium">Description</label><textarea name="description" defaultValue={data?.description || ''} className="w-full border rounded-md p-2 mt-1" rows={3} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="text-sm font-medium">Duration (weeks)</label><input name="durationWeeks" type="number" defaultValue={data?.durationWeeks || 12} className="w-full border rounded-md p-2 mt-1" required /></div>
          <div><label className="text-sm font-medium">Recommended Hours/Week</label><input name="recommendedStudyHours" type="number" defaultValue={data?.recommendedStudyHours || ''} className="w-full border rounded-md p-2 mt-1" /></div>
          <div><label className="text-sm font-medium">Status</label><select name="status" defaultValue={data?.status || 'DRAFT'} className="w-full border rounded-md p-2 mt-1"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div>
        </div>
      </div>

      <div className="bg-white border rounded-md p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Milestones ({milestones.length})</h2>
        </div>
        <div className="flex gap-2">
          <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)} placeholder="New milestone title" className="flex-1 border rounded-md p-2 text-sm" />
          <button type="button" onClick={addMilestone} className="bg-gray-100 px-4 py-2 rounded-md text-sm font-medium">Add</button>
        </div>
        <div className="space-y-2">
          {milestones.map((m: any) => (
            <div key={m.id} className="border rounded-md p-3 flex justify-between items-center">
              <div>
                <span className="font-medium text-sm">{m.title}</span>
                <span className="text-xs text-gray-500 ml-2">Order: {m.order}</span>
              </div>
              <button type="button" onClick={() => removeMilestone(m.id)} className="text-red-500 text-xs">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm">Save Template</button>
        <button type="button" onClick={() => router.push('/admin/templates')} className="border px-6 py-2 rounded-md text-sm">Cancel</button>
      </div>
    </form>
  );
}
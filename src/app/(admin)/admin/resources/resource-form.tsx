'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ResourceForm({ systems, data, action }: { systems: any[], data: any, action: (formData: FormData) => Promise<any> }) {
  const router = useRouter();
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await action(new FormData(e.currentTarget));
    if (res.error) toast.error(res.error); else { toast.success(res.success); router.push('/admin/resources'); router.refresh(); }
  }
  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-md p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium">Name</label><input name="name" defaultValue={data?.name} className="w-full border rounded-md p-2 mt-1" required /></div>
        <div><label className="text-sm font-medium">Slug</label><input name="slug" defaultValue={data?.slug} className="w-full border rounded-md p-2 mt-1" required /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="text-sm font-medium">Type</label><select name="type" defaultValue={data?.type || 'READING'} className="w-full border rounded-md p-2 mt-1">{['VIDEO','READING','QBANK','NOTES','LECTURE','REVIEW','OTHER'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <div><label className="text-sm font-medium">Duration (min)</label><input name="estimatedDuration" type="number" defaultValue={data?.estimatedDuration || ''} className="w-full border rounded-md p-2 mt-1" /></div>
        <div><label className="text-sm font-medium">Order</label><input name="order" type="number" defaultValue={data?.order || 0} className="w-full border rounded-md p-2 mt-1" /></div>
      </div>
      <div><label className="text-sm font-medium">URL</label><input name="url" defaultValue={data?.url || ''} className="w-full border rounded-md p-2 mt-1" placeholder="https://..." /></div>
      <div><label className="text-sm font-medium">Description</label><textarea name="description" defaultValue={data?.description || ''} className="w-full border rounded-md p-2 mt-1" rows={2} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium">System (Optional)</label><select name="systemId" defaultValue={data?.systemId || ''} className="w-full border rounded-md p-2 mt-1"><option value="">None</option>{systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div><label className="text-sm font-medium">Chapter (Optional)</label><select name="chapterId" defaultValue={data?.chapterId || ''} className="w-full border rounded-md p-2 mt-1"><option value="">None</option>{systems.map(s => <optgroup key={s.id} label={s.name}>{s.chapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}</select></div>
      </div>
      <div className="flex gap-2"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Save</button><button type="button" onClick={() => router.push('/admin/resources')} className="border px-4 py-2 rounded-md text-sm">Cancel</button></div>
    </form>
  );
}
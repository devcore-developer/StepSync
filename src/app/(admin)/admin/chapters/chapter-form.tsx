'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ChapterForm({ systems, data, defaultSystemId, action }: { systems: any[], data: any, defaultSystemId: string, action: (formData: FormData) => Promise<any> }) {
  const router = useRouter();
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await action(new FormData(e.currentTarget));
    if (res.error) toast.error(res.error); else { toast.success(res.success); router.push(`/admin/chapters?systemId=${data?.systemId || defaultSystemId}`); router.refresh(); }
  }
  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-md p-4 space-y-4">
      <div><label className="text-sm font-medium">System</label><select name="systemId" defaultValue={data?.systemId || defaultSystemId} className="w-full border rounded-md p-2 mt-1">{systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium">Name</label><input name="name" defaultValue={data?.name} className="w-full border rounded-md p-2 mt-1" required /></div>
        <div><label className="text-sm font-medium">Slug</label><input name="slug" defaultValue={data?.slug} className="w-full border rounded-md p-2 mt-1" required /></div>
      </div>
      <div><label className="text-sm font-medium">Description</label><textarea name="description" defaultValue={data?.description || ''} className="w-full border rounded-md p-2 mt-1" rows={2} /></div>
      <div><label className="text-sm font-medium">Order</label><input name="order" type="number" defaultValue={data?.order || 0} className="w-full border rounded-md p-2 mt-1" /></div>
      <div className="flex gap-2"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Save</button><button type="button" onClick={() => router.back()} className="border px-4 py-2 rounded-md text-sm">Cancel</button></div>
    </form>
  );
}
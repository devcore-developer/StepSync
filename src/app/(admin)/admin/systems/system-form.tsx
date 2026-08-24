'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SystemForm({ data, action }: { data: any, action: (formData: FormData) => Promise<any> }) {
  const router = useRouter();
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await action(new FormData(e.currentTarget));
    if (res.error) toast.error(res.error);
    else { toast.success(res.success); router.push('/admin/systems'); router.refresh(); }
  }
  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-md p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium">Name</label><input name="name" defaultValue={data?.name} className="w-full border rounded-md p-2 mt-1" required /></div>
        <div><label className="text-sm font-medium">Slug</label><input name="slug" defaultValue={data?.slug} className="w-full border rounded-md p-2 mt-1" required /></div>
      </div>
      <div><label className="text-sm font-medium">Description</label><textarea name="description" defaultValue={data?.description || ''} className="w-full border rounded-md p-2 mt-1" rows={2} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium">Order</label><input name="order" type="number" defaultValue={data?.order || 0} className="w-full border rounded-md p-2 mt-1" /></div>
        <div className="flex items-end gap-2 pb-1"><input name="isActive" type="checkbox" defaultChecked={data?.isActive ?? true} className="h-4 w-4" /><label className="text-sm font-medium">Active</label></div>
      </div>
      <div className="flex gap-2"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">Save</button><button type="button" onClick={() => router.push('/admin/systems')} className="border px-4 py-2 rounded-md text-sm">Cancel</button></div>
    </form>
  );
}
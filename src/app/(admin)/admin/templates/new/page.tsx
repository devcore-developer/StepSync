import { redirect } from 'next/navigation';
import { createTemplate } from '@/actions/admin/templates';
import TemplateEditor from '../template-editor';

export default function NewTemplatePage() {
  async function createAction(formData: FormData) {
    'use server';
    const res = await createTemplate(formData);
    if (res.success) {
      const title = formData.get('title') as string;
      const slug = (title as string).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      redirect(`/admin/templates/${slug}`);
    }
    return res;
  }
  return <TemplateEditor action={createAction} />;
}
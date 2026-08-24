import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { updateTemplate } from '@/actions/admin/templates';
import TemplateEditor from '../template-editor';

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const template = await db.scheduleTemplate.findUnique({ 
    where: { id: params.id }, 
    include: { milestones: { orderBy: { order: 'asc' }, include: { tasks: { orderBy: { order: 'asc' } }, system: true } } } 
  });
  
  if (!template) notFound();
  const templateId = template.id;

  async function updateAction(formData: FormData) {
    'use server';
    return updateTemplate(templateId, formData);
  }
  return <TemplateEditor data={template} action={updateAction} />;
}
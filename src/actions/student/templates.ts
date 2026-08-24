'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function getPublishedTemplates() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  return db.scheduleTemplate.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { milestones: true } },
    },
  });
}

export async function getTemplateDetails(slug: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  return db.scheduleTemplate.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      milestones: {
        orderBy: { order: 'asc' },
        include: {
          tasks: { orderBy: { order: 'asc' }, include: { resource: true, chapter: { include: { system: true } } } },
          system: true,
        },
      },
    },
  });
}

// Foundation action for Phase 5
export async function selectTemplate(templateId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: 'Unauthorized' };
  // StudyPlan creation will be implemented in Phase 5
  return { success: 'Template selected! Study plan creation coming soon.' };
}
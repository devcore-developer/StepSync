import { PrismaClient, ResourceType, ScheduleTemplateStatus, TaskType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // SYSTEMS
  const cardio = await prisma.usmleSystem.create({
    data: { name: 'Cardiovascular', slug: 'cardiovascular', description: 'Heart and blood vessels', order: 1 },
  });
  const neuro = await prisma.usmleSystem.create({
    data: { name: 'Neurology', slug: 'neurology', description: 'Nervous system', order: 2 },
  });
  const renal = await prisma.usmleSystem.create({
    data: { name: 'Renal', slug: 'renal', description: 'Kidneys and urinary tract', order: 3 },
  });
  const pulmonary = await prisma.usmleSystem.create({
    data: { name: 'Pulmonary', slug: 'pulmonary', description: 'Lungs and respiratory system', order: 4 },
  });
  const gi = await prisma.usmleSystem.create({
    data: { name: 'Gastrointestinal', slug: 'gastrointestinal', description: 'Digestive system', order: 5 },
  });

  // CHAPTERS
  const ch1 = await prisma.chapter.create({ data: { systemId: cardio.id, name: 'Heart Failure', slug: 'heart-failure', order: 1 } });
  const ch2 = await prisma.chapter.create({ data: { systemId: cardio.id, name: 'Arrhythmias', slug: 'arrhythmias', order: 2 } });
  const ch3 = await prisma.chapter.create({ data: { systemId: neuro.id, name: 'Stroke', slug: 'stroke', order: 1 } });
  const ch4 = await prisma.chapter.create({ data: { systemId: neuro.id, name: 'Seizures', slug: 'seizures', order: 2 } });
  const ch5 = await prisma.chapter.create({ data: { systemId: renal.id, name: 'Acute Kidney Injury', slug: 'acute-kidney-injury', order: 1 } });
  const ch6 = await prisma.chapter.create({ data: { systemId: pulmonary.id, name: 'COPD', slug: 'copd', order: 1 } });
  const ch7 = await prisma.chapter.create({ data: { systemId: gi.id, name: 'Crohns Disease', slug: 'crohns-disease', order: 1 } });

  // RESOURCES
  await prisma.resource.createMany({
    data: [
      { name: 'First Aid - Heart Failure', slug: 'fa-heart-failure', type: ResourceType.READING, chapterId: ch1.id, systemId: cardio.id, estimatedDuration: 60 },
      { name: 'Pathoma - Heart Failure', slug: 'pathoma-heart-failure', type: ResourceType.LECTURE, chapterId: ch1.id, systemId: cardio.id, estimatedDuration: 45, url: 'https://example.com/pathoma/hf' },
      { name: 'UWorld - Cardio', slug: 'uworld-cardio', type: ResourceType.QBANK, systemId: cardio.id, estimatedDuration: 120 },
      { name: 'First Aid - Stroke', slug: 'fa-stroke', type: ResourceType.READING, chapterId: ch3.id, systemId: neuro.id, estimatedDuration: 45 },
      { name: 'Sketchy - Stroke', slug: 'sketchy-stroke', type: ResourceType.VIDEO, chapterId: ch3.id, systemId: neuro.id, estimatedDuration: 20 },
    ],
    skipDuplicates: true,
  });

  // SCHEDULE TEMPLATE (Published)
  const template = await prisma.scheduleTemplate.create({
    data: {
      title: 'USMLE Step 1 — 6 Month Standard Plan',
      slug: 'step1-6-month-standard',
      description: 'A balanced 6-month plan covering all major systems. Ideal for full-time dedicated study.',
      durationWeeks: 24,
      recommendedStudyHours: 40,
      status: ScheduleTemplateStatus.PUBLISHED,
    },
  });

  // MILESTONES & TASKS for Published Template
  const m1 = await prisma.scheduleTemplateMilestone.create({
    data: { templateId: template.id, title: 'Cardiovascular System', systemId: cardio.id, order: 1, startDayOffset: 1, endDayOffset: 14, estimatedWeeks: 2 },
  });
  await prisma.scheduleTemplateMilestone.create({
    data: { templateId: template.id, title: 'Neurology System', systemId: neuro.id, order: 2, startDayOffset: 15, endDayOffset: 28, estimatedWeeks: 2 },
  });
  await prisma.scheduleTemplateMilestone.create({
    data: { templateId: template.id, title: 'Renal & Pulmonary', order: 3, startDayOffset: 29, endDayOffset: 42, estimatedWeeks: 2 },
  });

  // Tasks for Milestone 1
  await prisma.scheduleTemplateTask.createMany({
    data: [
      { milestoneId: m1.id, title: 'Read First Aid - Heart Failure', type: TaskType.NOTES, chapterId: ch1.id, startDayOffset: 1, estimatedHours: 1, order: 1 },
      { milestoneId: m1.id, title: 'Watch Pathoma - Heart Failure', type: TaskType.VIDEO, chapterId: ch1.id, startDayOffset: 2, estimatedHours: 0.75, order: 2 },
      { milestoneId: m1.id, title: 'Read First Aid - Arrhythmias', type: TaskType.NOTES, chapterId: ch2.id, startDayOffset: 3, estimatedHours: 1, order: 3 },
      { milestoneId: m1.id, title: 'UWorld Cardio Block (40qs)', type: TaskType.QBANK, startDayOffset: 7, estimatedHours: 2, order: 4 },
      { milestoneId: m1.id, title: 'Review Anki Cards', type: TaskType.REVIEW, startDayOffset: 10, estimatedHours: 1, order: 5, isOptional: true },
    ],
  });

  // DRAFT TEMPLATE
  await prisma.scheduleTemplate.create({
    data: {
      title: 'USMLE Step 1 — 3 Month Intensive',
      slug: 'step1-3-month-intensive',
      description: 'An aggressive 3-month plan for students with strong baseline knowledge.',
      durationWeeks: 12,
      recommendedStudyHours: 60,
      status: ScheduleTemplateStatus.DRAFT,
    },
  });

  console.log('Seeding completed.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
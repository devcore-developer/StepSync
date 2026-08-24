import z from 'zod';

export const systemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const chapterSchema = z.object({
  systemId: z.string().min(1, 'System is required'),
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const resourceSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  type: z.enum(['VIDEO', 'READING', 'QBANK', 'NOTES', 'LECTURE', 'REVIEW', 'OTHER']),
  description: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  estimatedDuration: z.coerce.number().int().positive().optional().or(z.literal('')),
  systemId: z.string().optional(),
  chapterId: z.string().optional(),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const templateSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  durationWeeks: z.coerce.number().int().positive('Duration must be positive'),
  recommendedStudyHours: z.coerce.number().int().positive().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});
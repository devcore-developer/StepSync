import type { GroupMatchResult } from "@/types/groups";

const WEIGHTS = {
  SYSTEM: 35,
  CHAPTER: 25,
  LOCATION: 20,
  ACTIVE: 10,
  CAPACITY: 10,
} as const;

export function calculateGroupMatchScore(
  profile: {
    currentSystemId: string | null;
    currentChapterId: string | null;
    preferredStudyLocationId: string | null;
  },
  group: {
    currentSystemId: string | null;
    currentChapterId: string | null;
    studyLocationId: string | null;
    memberCount: number;
    maxMembers: number | null;
  }
): GroupMatchResult {
  let raw = 0;
  let max = 0;
  const reasons: string[] = [];

  if (profile.currentSystemId) {
    max += WEIGHTS.SYSTEM;
    if (profile.currentSystemId === group.currentSystemId) {
      raw += WEIGHTS.SYSTEM;
      reasons.push("نفس النظام");
    }
  }

  if (profile.currentChapterId) {
    max += WEIGHTS.CHAPTER;
    if (profile.currentChapterId === group.currentChapterId) {
      raw += WEIGHTS.CHAPTER;
      reasons.push("نفس الفصل");
    }
  }

  if (profile.preferredStudyLocationId) {
    max += WEIGHTS.LOCATION;
    if (profile.preferredStudyLocationId === group.studyLocationId) {
      raw += WEIGHTS.LOCATION;
      reasons.push("نفس مكان الدراسة");
    }
  }

  max += WEIGHTS.ACTIVE;
  if (group.memberCount > 0) {
    raw += WEIGHTS.ACTIVE;
  }

  max += WEIGHTS.CAPACITY;
  if (group.maxMembers && group.memberCount < group.maxMembers) {
    raw += WEIGHTS.CAPACITY;
  }

  const score = max > 0 ? Math.round((raw / max) * 100) : 0;
  return { score, reasons };
}
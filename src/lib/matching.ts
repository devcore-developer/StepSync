import { MATCHING_WEIGHTS, MATCHING_CONFIG } from "@/lib/constants/matching";
import type { MatchingProfile, MatchResult, PartnerCandidate } from "@/types/partner";

/**
 * محرك المطابقة — دالة نقية بدون أي جانبية.
 * يحسب درجة التطابق بين مستخدمين.
 */
export function calculateMatchScore(
  user: MatchingProfile,
  candidate: MatchingProfile
): MatchResult {
  let rawScore = 0;
  let maxPossible = 0;
  const reasons: string[] = [];

  // النظام: 40
  if (user.currentSystemId) {
    maxPossible += MATCHING_WEIGHTS.SYSTEM;
    if (user.currentSystemId === candidate.currentSystemId) {
      rawScore += MATCHING_WEIGHTS.SYSTEM;
      reasons.push("نفس النظام");
    }
  }

  // الفصل: 30
  if (user.currentChapterId) {
    maxPossible += MATCHING_WEIGHTS.CHAPTER;
    if (user.currentChapterId === candidate.currentChapterId) {
      rawScore += MATCHING_WEIGHTS.CHAPTER;
      reasons.push("نفس الفصل");
    }
  }

  // وقت الدراسة: 15
  if (user.preferredStudyTime && user.preferredStudyTime !== "FLEXIBLE") {
    maxPossible += MATCHING_WEIGHTS.STUDY_TIME;
    if (candidate.preferredStudyTime === user.preferredStudyTime) {
      rawScore += MATCHING_WEIGHTS.STUDY_TIME;
      reasons.push("نفس وقت الدراسة");
    } else if (
      !candidate.preferredStudyTime ||
      candidate.preferredStudyTime === "FLEXIBLE"
    ) {
      rawScore += Math.floor(MATCHING_WEIGHTS.STUDY_TIME * 0.5);
    }
  }

  // السنة الدراسية: 10
  if (user.academicYear) {
    maxPossible += MATCHING_WEIGHTS.ACADEMIC_YEAR;
    if (user.academicYear === candidate.academicYear) {
      rawScore += MATCHING_WEIGHTS.ACADEMIC_YEAR;
      reasons.push("نفس السنة الدراسية");
    }
  }

  // مكان الدراسة: 10
  if (user.preferredStudyLocationId) {
    maxPossible += MATCHING_WEIGHTS.LOCATION;
    if (user.preferredStudyLocationId === candidate.preferredStudyLocationId) {
      rawScore += MATCHING_WEIGHTS.LOCATION;
      reasons.push("نفس مكان الدراسة المفضل");
    } else if (!candidate.preferredStudyLocationId) {
      rawScore += Math.floor(MATCHING_WEIGHTS.LOCATION * 0.5);
    }
  }

  // مرحلة USMLE: 10
  if (user.currentUsmleStage) {
    maxPossible += MATCHING_WEIGHTS.USMLE_STAGE;
    if (user.currentUsmleStage === candidate.currentUsmleStage) {
      rawScore += MATCHING_WEIGHTS.USMLE_STAGE;
      reasons.push("نفس مرحلة USMLE");
    }
  }

  // الجنس: 5
  if (user.gender && user.gender !== "PREFER_NOT_TO_SAY") {
    maxPossible += MATCHING_WEIGHTS.GENDER;
    if (user.gender === candidate.gender) {
      rawScore += MATCHING_WEIGHTS.GENDER;
      reasons.push("نفس الجنس");
    }
  }

  const score =
    maxPossible > 0 ? Math.round((rawScore / maxPossible) * 100) : 0;

  return { score, reasons };
}

/**
 * يرتب النتائج مع عشوائية مضبوطة ضمن نطاق درجات متقاربة.
 * المرشحون الأعلى درجة يبقون أولاً، لكن المتقاربين يُخلطون.
 */
export function rankCandidates(
  candidates: PartnerCandidate[]
): PartnerCandidate[] {
  const band = MATCHING_CONFIG.RANDOMIZATION_BAND;

  candidates.sort((a, b) => b.matchScore - a.matchScore);

  const grouped = new Map<number, PartnerCandidate[]>();
  for (const c of candidates) {
    const key = Math.floor(c.matchScore / band) * band;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  }

  for (const [, items] of grouped) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => b - a)
    .flatMap(([, items]) => items)
    .slice(0, MATCHING_CONFIG.MAX_RESULTS);
}
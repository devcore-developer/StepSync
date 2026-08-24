export interface PartnerFilters {
  systemId?: string;
  chapterId?: string;
  gender?: string;
  academicYear?: string;
  usmleStage?: string;
  studyTime?: string;
  locationId?: string;
}

export interface PartnerCandidate {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  academicYear: string | null;
  gender: string | null;
  currentUsmleStage: string | null;
  currentSystem: { id: string; name: string } | null;
  currentChapter: { id: string; name: string } | null;
  preferredStudyTime: string | null;
  preferredStudyLocation: { id: string; name: string } | null;
  matchScore: number;
  matchReasons: string[];
}

export interface MatchResult {
  score: number;
  reasons: string[];
}

export interface MatchingProfile {
  currentSystemId: string | null;
  currentChapterId: string | null;
  preferredStudyTime: string | null;
  academicYear: string | null;
  preferredStudyLocationId: string | null;
  currentUsmleStage: string | null;
  gender: string | null;
}

export interface PartnerRequestWithUser {
  id: string;
  senderId: string;
  receiverId: string;
  message: string | null;
  status: string;
  createdAt: string;
  otherUser: {
    userId: string;
    displayName: string;
    academicYear: string | null;
    currentUsmleStage: string | null;
    currentSystem: { id: string; name: string } | null;
    currentChapter: { id: string; name: string } | null;
  };
}

export interface MyPartnersData {
  incoming: PartnerRequestWithUser[];
  outgoing: PartnerRequestWithUser[];
  accepted: PartnerRequestWithUser[];
}

export interface PartnerFilterOptions {
  systems: { id: string; name: string }[];
  chapters: { id: string; name: string; systemId: string }[];
  locations: { id: string; name: string }[];
  academicYears: string[];
}

export interface PublicPartnerProfile {
  displayName: string;
  academicYear: string | null;
  gender: string | null;
  currentUsmleStage: string | null;
  currentSystem: { id: string; name: string } | null;
  currentChapter: { id: string; name: string } | null;
  preferredStudyTime: string | null;
  preferredStudyLocation: { id: string; name: string } | null;
  bio: string | null;
  matchScore: number | null;
  matchReasons: string[];
}
export interface StudyGroupSummary {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  status: string;
  memberCount: number;
  maxMembers: number | null;
  currentSystem: { id: string; name: string } | null;
  currentChapter: { id: string; name: string } | null;
  studyLocation: { id: string; name: string } | null;
  matchScore?: number;
  matchReasons?: string[];
}

export interface StudyGroupDetails extends StudyGroupSummary {
  goal: string | null;
  preferredStudyTime: string | null;
  createdAt: string;
  ownerName: string | null;
  membershipState: MembershipState;
  userRole: string | null;
}

export interface MembershipState {
  isMember: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isPending: boolean;
  isBanned: boolean;
  membershipId: string | null;
}

export interface GroupMemberInfo {
  membershipId: string;
  userId: string;
  displayName: string;
  role: string;
  status: string;
  joinedAt: string | null;
  academicYear: string | null;
  currentUsmleStage: string | null;
}

export interface GroupFilters {
  systemId?: string;
  chapterId?: string;
  visibility?: string;
  locationId?: string;
  search?: string;
}

export interface GroupFormOptions {
  systems: { id: string; name: string }[];
  chapters: { id: string; name: string; systemId: string }[];
  locations: { id: string; name: string }[];
}

export interface GroupMatchResult {
  score: number;
  reasons: string[];
}
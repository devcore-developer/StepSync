export interface DashboardStats {
  totalUsers: number;
  newUsers: number;
  activePlans: number;
  completedPlans: number;
  totalPartners: number;
  totalGroups: number;
  totalMessages: number;
  totalNotifications: number;
  unreadNotifications: number;
}

export interface UserAdminRow {
  id: string;
  email: string;
  role: string;
  isOnboarded: boolean;
  usmleStage: string | null;
  academicYear: string | null;
  createdAt: string;
  updatedAt: string;
    _count: {
      studyPlans: number;
      sentPartnerRequests: number;
      receivedPartnerRequests: number;
      groupMemberships: number;
      sentMessages: number;
    };
}

export interface UserAdminDetails {
  user: UserAdminRow;
  profile: {
    firstName: string | null;
    lastName: string | null;
    university: string | null;
    bio: string | null;
    gender: string | null;
    currentUsmleStage: string | null;
    academicYear: string | null;   // ← كان ناقص
    residenceArea: string | null;
  } | null;
  planCount: number;
  activePlanCount: number;
  completedPlanCount: number;
  groupCount: number;
  partnerCount: number;
  messageCount: number;
  aiRecommendationCount: number;
}

export type AnalyticsRange = "7d" | "30d" | "90d" | "all";

export interface AnalyticsData {
  range: AnalyticsRange;
  users: {
    total: number;
    newInPeriod: number;
  };
  study: {
    activePlans: number;
    completedPlans: number;
    rescheduleCount: number;
  };
  social: {
    acceptedPartners: number;
    totalGroups: number;
    activeMemberships: number;
    conversations: number;
    messages: number;
  };
  ai: {
    total: number;
    byType: { type: string; count: number }[];
  };
  notifications: {
    total: number;
    read: number;
    byType: { type: string; count: number }[];
  };
  newUsersByDay: { date: string; count: number }[];
}

export interface ActivityLogEntry {
  id: string;
  adminUserId: string;
  adminName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminGroupRow {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  status: string;
  currentSystem: { name: string } | null;
  currentChapter: { name: string } | null;
  studyLocation: { name: string } | null;
  createdAt: string;
  _count: { members: number; messages: number };
  owner: {
    profile: { firstName: string | null; lastName: string | null } | null;
  };
}

export interface AdminPartnerStat {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
}
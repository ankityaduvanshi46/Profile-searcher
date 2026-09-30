export interface InstagramPost {
  id: string;
  mediaType: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  timestamp: string;
  caption?: string;
  permalink?: string;
}

export interface CandidateProfile {
  username: string;
  fullName?: string;
  profilePicUrl?: string;
  source: "hashtag" | "niche" | "seed";
  seedOrTag?: string;
}

export interface ProfileDetails {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  isVerified: boolean;
  profilePicUrl?: string;
  externalUrl?: string;
  reels: InstagramPost[];
}

export interface ScoredProfile {
  rank: number;
  username: string;
  fullName: string;
  profileUrl: string;
  followersCount: number;
  avgReelViews: number;
  engagementRate: number;
  score: number;
  niche: string;
  biography: string;
  managerExcluded: boolean;
  dateAdded: string;
}

export interface SearchFilters {
  niche: string;
  hashtag?: string;
  seedAccounts: string[];
  minFollowers: number;
  maxFollowers: number;
  minAvgReelViews: number;
  maxAvgReelViews: number;
  minEngagementRate: number;
  excludeManagerKeywords: string[];
  customManagerKeywords: string[];
  country?: string;
}

export type AgentName = 
  | "discovery"
  | "metrics"
  | "bio_filter"
  | "ranking"
  | "deduplication"
  | "sheets_writer";

export type AgentStatus = "idle" | "running" | "completed" | "failed" | "skipped";

export interface AgentProgress {
  name: AgentName;
  status: AgentStatus;
  message: string;
  processedCount: number;
  totalCount: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export type JobStatus = "queued" | "running" | "completed" | "failed" | "paused";

export type JobStep = 
  | "init"
  | "discovery"
  | "metrics"
  | "bio_filter"
  | "ranking"
  | "deduplication"
  | "sheets_writer"
  | "done";

export interface SearchJob {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: JobStatus;
  currentStep: JobStep;
  filters: SearchFilters;
  agents: Record<AgentName, AgentProgress>;
  candidateProfiles: CandidateProfile[];
  profileDetails: ProfileDetails[];
  acceptedProfiles: ProfileDetails[];
  rejectedProfiles: { username: string; reason: string }[];
  rankedProfiles: ScoredProfile[];
  writtenProfiles: ScoredProfile[];
  error?: string;
  totalExecutionTimeMs?: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: "failed_login" | "rate_limit_exceeded" | "ip_blocked" | "suspicious_user_agent" | "csrf_failure";
  ip: string;
  userAgent: string;
  path: string;
  details?: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  createdAt: string;
  filters: SearchFilters;
}

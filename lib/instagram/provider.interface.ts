import { CandidateProfile, ProfileDetails } from "../types";

export interface SearchProfilesQuery {
  niche?: string;
  hashtag?: string;
  seedAccounts?: string[];
  limit?: number;
}

export interface InstagramProvider {
  name: string;
  searchCandidates(query: SearchProfilesQuery): Promise<CandidateProfile[]>;
  getProfileDetails(username: string): Promise<ProfileDetails | null>;
  getLastReelsViews(username: string, count?: number): Promise<number[]>;
}

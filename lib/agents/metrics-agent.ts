import { CandidateProfile, ProfileDetails, SearchFilters } from "../types";
import { getInstagramProvider } from "../instagram/factory";

export interface MetricsResult {
  accepted: ProfileDetails[];
  rejected: { username: string; reason: string }[];
}

export class MetricsAgent {
  public readonly name = "metrics" as const;

  async execute(candidates: CandidateProfile[], filters: SearchFilters): Promise<MetricsResult> {
    const provider = getInstagramProvider();
    const accepted: ProfileDetails[] = [];
    const rejected: { username: string; reason: string }[] = [];

    for (const candidate of candidates) {
      try {
        const details = await provider.getProfileDetails(candidate.username);
        if (!details) {
          rejected.push({
            username: candidate.username,
            reason: "Profile not found or inaccessible"
          });
          continue;
        }

        if (filters.minFollowers > 0 && details.followersCount < filters.minFollowers) {
          rejected.push({
            username: candidate.username,
            reason: `Followers (${details.followersCount}) below minimum threshold (${filters.minFollowers})`
          });
          continue;
        }

        if (filters.maxFollowers > 0 && details.followersCount > filters.maxFollowers) {
          rejected.push({
            username: candidate.username,
            reason: `Followers (${details.followersCount}) exceeds maximum threshold (${filters.maxFollowers})`
          });
          continue;
        }

        const reels = details.reels || [];
        const last10Reels = reels.slice(0, 10);
        const totalViews = last10Reels.reduce((acc, r) => acc + (r.viewCount || 0), 0);
        const avgViews = last10Reels.length > 0 ? Math.round(totalViews / last10Reels.length) : 0;

        if (filters.minAvgReelViews > 0 && avgViews < filters.minAvgReelViews) {
          rejected.push({
            username: candidate.username,
            reason: `Average reel views (${avgViews}) below minimum threshold (${filters.minAvgReelViews})`
          });
          continue;
        }

        if (filters.maxAvgReelViews > 0 && avgViews > filters.maxAvgReelViews) {
          rejected.push({
            username: candidate.username,
            reason: `Average reel views (${avgViews}) exceeds maximum threshold (${filters.maxAvgReelViews})`
          });
          continue;
        }

        const totalInteractions = last10Reels.reduce((acc, r) => acc + (r.likeCount || 0) + (r.commentCount || 0), 0);
        const avgInteractions = last10Reels.length > 0 ? totalInteractions / last10Reels.length : 0;
        const engagementRate = details.followersCount > 0
          ? Number(((avgInteractions / details.followersCount) * 100).toFixed(2))
          : 0;

        if (filters.minEngagementRate > 0 && engagementRate < filters.minEngagementRate) {
          rejected.push({
            username: candidate.username,
            reason: `Engagement rate (${engagementRate}%) below minimum threshold (${filters.minEngagementRate}%)`
          });
          continue;
        }

        accepted.push(details);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error fetching metrics";
        rejected.push({
          username: candidate.username,
          reason: message
        });
      }
    }

    return { accepted, rejected };
  }
}

import { ProfileDetails, ScoredProfile, SearchFilters } from "../types";

export class RankingAgent {
  public readonly name = "ranking" as const;

  execute(profiles: ProfileDetails[], filters: SearchFilters): ScoredProfile[] {
    if (profiles.length === 0) return [];

    let maxFollowers = 1;
    let maxViews = 1;
    let maxEngagement = 1;

    for (const p of profiles) {
      if (p.followersCount > maxFollowers) maxFollowers = p.followersCount;

      const last10Reels = (p.reels || []).slice(0, 10);
      const totalViews = last10Reels.reduce((sum, r) => sum + (r.viewCount || 0), 0);
      const avgViews = last10Reels.length > 0 ? Math.round(totalViews / last10Reels.length) : 0;
      if (avgViews > maxViews) maxViews = avgViews;

      const totalInteractions = last10Reels.reduce((acc, r) => acc + (r.likeCount || 0) + (r.commentCount || 0), 0);
      const avgInteractions = last10Reels.length > 0 ? totalInteractions / last10Reels.length : 0;
      const rate = p.followersCount > 0 ? (avgInteractions / p.followersCount) * 100 : 0;
      if (rate > maxEngagement) maxEngagement = rate;
    }

    const scoredList: ScoredProfile[] = profiles.map((p) => {
      const last10Reels = (p.reels || []).slice(0, 10);
      const totalViews = last10Reels.reduce((sum, r) => sum + (r.viewCount || 0), 0);
      const avgViews = last10Reels.length > 0 ? Math.round(totalViews / last10Reels.length) : 0;

      const totalInteractions = last10Reels.reduce((acc, r) => acc + (r.likeCount || 0) + (r.commentCount || 0), 0);
      const avgInteractions = last10Reels.length > 0 ? totalInteractions / last10Reels.length : 0;
      const engagementRate = p.followersCount > 0
        ? Number(((avgInteractions / p.followersCount) * 100).toFixed(2))
        : 0;

      const followerScore = (p.followersCount / maxFollowers) * 30;
      const viewsScore = (avgViews / maxViews) * 45;
      const engagementScore = Math.min(1, engagementRate / maxEngagement) * 25;
      const totalScore = Number((followerScore + viewsScore + engagementScore).toFixed(1));

      return {
        rank: 0,
        username: p.username,
        fullName: p.fullName || p.username,
        profileUrl: `https://www.instagram.com/${p.username}/`,
        followersCount: p.followersCount,
        avgReelViews: avgViews,
        engagementRate,
        score: totalScore,
        niche: filters.niche || filters.hashtag || "General",
        biography: p.biography || "",
        managerExcluded: false,
        dateAdded: new Date().toISOString().split("T")[0]
      };
    });

    scoredList.sort((a, b) => b.score - a.score);

    return scoredList.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }
}

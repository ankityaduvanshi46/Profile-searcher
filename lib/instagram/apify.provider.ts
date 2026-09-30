import { CandidateProfile, InstagramPost, ProfileDetails } from "../types";
import { InstagramProvider, SearchProfilesQuery } from "./provider.interface";

export class ApifyInstagramProvider implements InstagramProvider {
  public readonly name = "Apify Third-Party Instagram Provider";
  private readonly baseUrl = "https://api.apify.com/v2";
  private readonly maxRetries = 3;
  private readonly baseBackoffMs = 1500;

  private async fetchWithRetry(url: string, options: RequestInit, retries = this.maxRetries): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
          if (attempt === retries) return response;
          const backoff = this.baseBackoffMs * Math.pow(2, attempt) + Math.random() * 500;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }
        return response;
      } catch (error) {
        if (attempt === retries) throw error;
        const backoff = this.baseBackoffMs * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    throw new Error("Maximum retry attempts reached for Apify API");
  }

  async searchCandidates(query: SearchProfilesQuery): Promise<CandidateProfile[]> {
    const token = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID || "apify/instagram-scraper";

    if (!token) {
      throw new Error("APIFY_API_TOKEN must be configured in environment");
    }

    const searchQueries: string[] = [];
    if (query.seedAccounts && query.seedAccounts.length > 0) {
      searchQueries.push(...query.seedAccounts.map((s) => s.replace("@", "").trim()));
    }
    if (query.hashtag) {
      searchQueries.push(`https://www.instagram.com/explore/tags/${query.hashtag.replace("#", "")}/`);
    }

    if (searchQueries.length === 0) {
      return [];
    }

    const runUrl = `${this.baseUrl}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${token}`;
    const response = await this.fetchWithRetry(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        directUrls: searchQueries,
        resultsType: "details",
        resultsLimit: query.limit || 15
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Apify execution error (${response.status}): ${err}`);
    }

    const items = await response.json();
    const candidates: CandidateProfile[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const username = item.username || item.ownerUsername;
      if (username && !seen.has(username)) {
        seen.add(username);
        candidates.push({
          username,
          fullName: item.fullName || username,
          profilePicUrl: item.profilePicUrl,
          source: query.hashtag ? "hashtag" : "seed",
          seedOrTag: query.hashtag || query.niche
        });
      }
    }

    return candidates;
  }

  async getProfileDetails(username: string): Promise<ProfileDetails | null> {
    const token = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID || "apify/instagram-scraper";

    if (!token) {
      throw new Error("APIFY_API_TOKEN must be configured in environment");
    }

    const clean = username.replace("@", "").trim();
    const runUrl = `${this.baseUrl}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${token}`;

    const response = await this.fetchWithRetry(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        directUrls: [`https://www.instagram.com/${clean}/`],
        resultsType: "details",
        resultsLimit: 1
      })
    });

    if (!response.ok) {
      return null;
    }

    const items = await response.json();
    const profile = items?.[0];
    if (!profile) return null;

    const latestPosts = profile.latestPosts || [];
    const reels: InstagramPost[] = latestPosts.map((p: Record<string, unknown>) => {
      const views = Number(p.videoViewCount || p.videoPlayCount) || (Number(p.likesCount) || 0) * 10;
      return {
        id: String(p.id || ""),
        mediaType: String(p.type || "video"),
        viewCount: views,
        likeCount: Number(p.likesCount) || 0,
        commentCount: Number(p.commentsCount) || 0,
        timestamp: String(p.timestamp || ""),
        caption: typeof p.caption === "string" ? p.caption : undefined,
        permalink: typeof p.url === "string" ? p.url : undefined
      };
    });

    return {
      username: profile.username || clean,
      fullName: profile.fullName || clean,
      biography: profile.biography || "",
      followersCount: Number(profile.followersCount) || 0,
      followsCount: Number(profile.followsCount) || 0,
      mediaCount: Number(profile.postsCount) || 0,
      isVerified: Boolean(profile.verified),
      profilePicUrl: profile.profilePicUrl,
      externalUrl: profile.externalUrl,
      reels
    };
  }

  async getLastReelsViews(username: string, count = 10): Promise<number[]> {
    const details = await this.getProfileDetails(username);
    if (!details || !details.reels) return [];
    return details.reels.slice(0, count).map((r) => r.viewCount);
  }
}

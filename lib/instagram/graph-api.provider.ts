import { CandidateProfile, InstagramPost, ProfileDetails } from "../types";
import { InstagramProvider, SearchProfilesQuery } from "./provider.interface";

export class InstagramGraphApiProvider implements InstagramProvider {
  public readonly name = "Instagram Graph API (Business Discovery)";
  private readonly baseUrl = "https://graph.facebook.com/v19.0";
  private readonly maxRetries = 3;
  private readonly baseBackoffMs = 1000;

  private async fetchWithRetry(url: string, retries = this.maxRetries): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        });

        if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
          if (attempt === retries) {
            return response;
          }
          const backoff = this.baseBackoffMs * Math.pow(2, attempt) + Math.random() * 500;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        return response;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        const backoff = this.baseBackoffMs * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    throw new Error("Maximum retry attempts reached for Instagram Graph API");
  }

  async searchCandidates(query: SearchProfilesQuery): Promise<CandidateProfile[]> {
    const accessToken = process.env.IG_ACCESS_TOKEN;
    const businessAccountId = process.env.IG_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !businessAccountId) {
      throw new Error("IG_ACCESS_TOKEN and IG_BUSINESS_ACCOUNT_ID must be configured in environment");
    }

    const candidates: CandidateProfile[] = [];
    const seen = new Set<string>();

    if (query.seedAccounts && query.seedAccounts.length > 0) {
      for (const seed of query.seedAccounts) {
        const clean = seed.replace("@", "").trim();
        if (clean && !seen.has(clean)) {
          seen.add(clean);
          candidates.push({
            username: clean,
            source: "seed",
            seedOrTag: seed
          });
        }
      }
    }

    if (query.hashtag) {
      const cleanTag = query.hashtag.replace("#", "").trim();
      const tagUrl = `${this.baseUrl}/ig_hashtag_search?user_id=${businessAccountId}&q=${encodeURIComponent(cleanTag)}&access_token=${accessToken}`;
      
      const tagRes = await this.fetchWithRetry(tagUrl);
      if (tagRes.ok) {
        const tagData = await tagRes.json();
        const hashtagId = tagData.data?.[0]?.id;
        if (hashtagId) {
          const mediaUrl = `${this.baseUrl}/${hashtagId}/top_media?user_id=${businessAccountId}&fields=id,permalink,media_type&limit=25&access_token=${accessToken}`;
          const mediaRes = await this.fetchWithRetry(mediaUrl);
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            const items = mediaData.data || [];
            for (const item of items) {
              if (item.permalink) {
                const match = item.permalink.match(/instagram\.com\/([^/]+)/);
                if (match && match[1] && match[1] !== "p" && match[1] !== "reel" && !seen.has(match[1])) {
                  seen.add(match[1]);
                  candidates.push({
                    username: match[1],
                    source: "hashtag",
                    seedOrTag: cleanTag
                  });
                }
              }
            }
          }
        }
      }
    }

    return candidates;
  }

  async getProfileDetails(username: string): Promise<ProfileDetails | null> {
    const accessToken = process.env.IG_ACCESS_TOKEN;
    const businessAccountId = process.env.IG_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !businessAccountId) {
      throw new Error("IG_ACCESS_TOKEN and IG_BUSINESS_ACCOUNT_ID must be configured in environment");
    }

    const cleanUsername = username.replace("@", "").trim();
    const fields = `business_discovery.username(${cleanUsername}){username,name,biography,followers_count,follows_count,media_count,profile_picture_url,media.limit(15){id,caption,media_type,like_count,comments_count,timestamp,permalink}}`;
    const url = `${this.baseUrl}/${businessAccountId}?fields=${encodeURIComponent(fields)}&access_token=${accessToken}`;

    const res = await this.fetchWithRetry(url);
    if (!res.ok) {
      if (res.status === 404 || res.status === 400) {
        return null;
      }
      const err = await res.text();
      throw new Error(`Graph API discovery error (${res.status}): ${err}`);
    }

    const json = await res.json();
    const discovery = json.business_discovery;
    if (!discovery) return null;

    const mediaList = discovery.media?.data || [];
    const reels: InstagramPost[] = mediaList.map((m: Record<string, unknown>) => {
      const likes = Number(m.like_count) || 0;
      const comments = Number(m.comments_count) || 0;
      const estimatedViews = (likes * 12) + (comments * 25);
      return {
        id: String(m.id || ""),
        mediaType: String(m.media_type || ""),
        viewCount: estimatedViews,
        likeCount: likes,
        commentCount: comments,
        timestamp: String(m.timestamp || ""),
        caption: typeof m.caption === "string" ? m.caption : undefined,
        permalink: typeof m.permalink === "string" ? m.permalink : undefined
      };
    });

    return {
      username: discovery.username,
      fullName: discovery.name || discovery.username,
      biography: discovery.biography || "",
      followersCount: Number(discovery.followers_count) || 0,
      followsCount: Number(discovery.follows_count) || 0,
      mediaCount: Number(discovery.media_count) || 0,
      isVerified: false,
      profilePicUrl: discovery.profile_picture_url,
      reels
    };
  }

  async getLastReelsViews(username: string, count = 10): Promise<number[]> {
    const details = await this.getProfileDetails(username);
    if (!details || !details.reels) return [];
    return details.reels.slice(0, count).map((r) => r.viewCount);
  }
}

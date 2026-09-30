import { CandidateProfile, SearchFilters } from "../types";
import { getInstagramProvider } from "../instagram/factory";

export class DiscoveryAgent {
  public readonly name = "discovery" as const;

  async execute(filters: SearchFilters): Promise<CandidateProfile[]> {
    const provider = getInstagramProvider();
    const candidates = await provider.searchCandidates({
      niche: filters.niche,
      hashtag: filters.hashtag,
      seedAccounts: filters.seedAccounts,
      limit: 30
    });

    const uniqueMap = new Map<string, CandidateProfile>();
    for (const c of candidates) {
      const clean = c.username.toLowerCase().trim();
      if (!uniqueMap.has(clean)) {
        uniqueMap.set(clean, { ...c, username: clean });
      }
    }

    return Array.from(uniqueMap.values());
  }
}

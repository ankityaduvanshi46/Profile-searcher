import { ProfileDetails, SearchFilters } from "../types";

export interface BioFilterResult {
  accepted: ProfileDetails[];
  rejected: { username: string; reason: string }[];
}

export const DEFAULT_MANAGER_KEYWORDS = [
  "manager",
  "management",
  "mgmt",
  "mgt",
  "for collabs contact",
  "business inquiries",
  "business enquiry",
  "booking",
  "bookings",
  "agency",
  "talent management",
  "representation",
  "rep by",
  "represented by",
  "pr / collabs",
  "pr:",
  "dm for bookings",
  "collab inquiries"
];

export class BioFilterAgent {
  public readonly name = "bio_filter" as const;

  execute(profiles: ProfileDetails[], filters: SearchFilters): BioFilterResult {
    const accepted: ProfileDetails[] = [];
    const rejected: { username: string; reason: string }[] = [];

    const activeKeywords = new Set<string>();
    for (const kw of DEFAULT_MANAGER_KEYWORDS) {
      activeKeywords.add(kw.toLowerCase().trim());
    }
    for (const kw of filters.excludeManagerKeywords || []) {
      if (kw.trim()) activeKeywords.add(kw.toLowerCase().trim());
    }
    for (const kw of filters.customManagerKeywords || []) {
      if (kw.trim()) activeKeywords.add(kw.toLowerCase().trim());
    }

    const keywordList = Array.from(activeKeywords);

    for (const profile of profiles) {
      const bio = (profile.biography || "").toLowerCase();
      let matchedKeyword: string | null = null;

      for (const kw of keywordList) {
        if (bio.includes(kw)) {
          matchedKeyword = kw;
          break;
        }
      }

      if (matchedKeyword) {
        rejected.push({
          username: profile.username,
          reason: `Bio contains manager/agency keyword: "${matchedKeyword}"`
        });
      } else {
        accepted.push(profile);
      }
    }

    return { accepted, rejected };
  }
}

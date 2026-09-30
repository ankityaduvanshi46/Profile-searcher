import { ScoredProfile } from "../types";
import { kv } from "../storage/kv";

const DEDUP_KNOWN_HANDLES_KEY = "influencer_known_handles";

export interface DedupResult {
  uniqueProfiles: ScoredProfile[];
  duplicateProfiles: { username: string; reason: string }[];
}

export class DeduplicationAgent {
  public readonly name = "deduplication" as const;

  async execute(profiles: ScoredProfile[]): Promise<DedupResult> {
    const knownHandlesList = (await kv.get<string[]>(DEDUP_KNOWN_HANDLES_KEY)) || [];
    const knownSet = new Set<string>(knownHandlesList.map((h) => h.toLowerCase().trim()));

    const uniqueProfiles: ScoredProfile[] = [];
    const duplicateProfiles: { username: string; reason: string }[] = [];
    const seenInBatch = new Set<string>();

    for (const profile of profiles) {
      const clean = profile.username.toLowerCase().trim();

      if (seenInBatch.has(clean)) {
        duplicateProfiles.push({
          username: profile.username,
          reason: "Duplicate entry within the current search batch"
        });
        continue;
      }

      if (knownSet.has(clean)) {
        duplicateProfiles.push({
          username: profile.username,
          reason: "Profile already discovered and stored in historical database / Google Sheet"
        });
        continue;
      }

      seenInBatch.add(clean);
      uniqueProfiles.push(profile);
    }

    return {
      uniqueProfiles: uniqueProfiles.map((p, idx) => ({ ...p, rank: idx + 1 })),
      duplicateProfiles
    };
  }

  async markAsRecorded(usernames: string[]): Promise<void> {
    const existing = (await kv.get<string[]>(DEDUP_KNOWN_HANDLES_KEY)) || [];
    const set = new Set<string>(existing.map((h) => h.toLowerCase().trim()));

    for (const u of usernames) {
      set.add(u.toLowerCase().trim());
    }

    await kv.set(DEDUP_KNOWN_HANDLES_KEY, Array.from(set));
  }
}

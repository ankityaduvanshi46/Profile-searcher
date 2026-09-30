import { FilterPreset, SearchFilters } from "../types";
import { kv } from "./kv";

const PRESETS_KEY = "filter_presets_list";

export const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: "preset_fitness_micro",
    name: "Fitness Micro-Influencers (10k-50k)",
    createdAt: new Date().toISOString(),
    filters: {
      niche: "Fitness",
      hashtag: "fitnessmotivation",
      seedAccounts: [],
      minFollowers: 10000,
      maxFollowers: 50000,
      minAvgReelViews: 15000,
      maxAvgReelViews: 200000,
      minEngagementRate: 2.5,
      excludeManagerKeywords: [],
      customManagerKeywords: []
    }
  },
  {
    id: "preset_beauty_rising",
    name: "Beauty & Skincare Creators",
    createdAt: new Date().toISOString(),
    filters: {
      niche: "Beauty",
      hashtag: "skincareroutine",
      seedAccounts: [],
      minFollowers: 20000,
      maxFollowers: 150000,
      minAvgReelViews: 30000,
      maxAvgReelViews: 500000,
      minEngagementRate: 3.0,
      excludeManagerKeywords: [],
      customManagerKeywords: []
    }
  }
];

export async function getFilterPresets(): Promise<FilterPreset[]> {
  const custom = await kv.get<FilterPreset[]>(PRESETS_KEY);
  if (!custom || custom.length === 0) {
    return DEFAULT_PRESETS;
  }
  return [...DEFAULT_PRESETS, ...custom];
}

export async function saveFilterPreset(name: string, filters: SearchFilters): Promise<FilterPreset> {
  const newPreset: FilterPreset = {
    id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    createdAt: new Date().toISOString(),
    filters
  };

  const existing = (await kv.get<FilterPreset[]>(PRESETS_KEY)) || [];
  await kv.set(PRESETS_KEY, [newPreset, ...existing]);
  return newPreset;
}

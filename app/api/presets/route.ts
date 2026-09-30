import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFilterPresets, saveFilterPreset } from "@/lib/storage/presets";

export const dynamic = "force-dynamic";

const PresetCreateSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.object({
    niche: z.string(),
    hashtag: z.string().optional(),
    seedAccounts: z.array(z.string()).default([]),
    minFollowers: z.number().default(0),
    maxFollowers: z.number().default(0),
    minAvgReelViews: z.number().default(0),
    maxAvgReelViews: z.number().default(0),
    minEngagementRate: z.number().default(0),
    excludeManagerKeywords: z.array(z.string()).default([]),
    customManagerKeywords: z.array(z.string()).default([]),
    country: z.string().optional()
  })
});

export async function GET() {
  try {
    const presets = await getFilterPresets();
    return NextResponse.json({ presets });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load presets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const parse = PresetCreateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const preset = await saveFilterPreset(parse.data.name, parse.data.filters);
    return NextResponse.json({ preset });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save preset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

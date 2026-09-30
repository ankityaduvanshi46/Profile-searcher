import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { orchestrator } from "@/lib/agents/orchestrator";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { SECURITY_CONFIG } from "@/lib/security/config";
import { logSecurityEvent } from "@/lib/security/logger";

const SearchFiltersSchema = z.object({
  niche: z.string().min(1, "Niche is required").max(100),
  hashtag: z.string().max(100).optional(),
  seedAccounts: z.array(z.string().max(50)).default([]),
  minFollowers: z.number().int().nonnegative().default(0),
  maxFollowers: z.number().int().nonnegative().default(0),
  minAvgReelViews: z.number().int().nonnegative().default(0),
  maxAvgReelViews: z.number().int().nonnegative().default(0),
  minEngagementRate: z.number().nonnegative().default(0),
  excludeManagerKeywords: z.array(z.string().max(50)).default([]),
  customManagerKeywords: z.array(z.string().max(50)).default([]),
  country: z.string().max(50).optional()
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "";

  const rateCheck = await checkRateLimit("jobs", ip, SECURITY_CONFIG.jobsRateLimitPerMinute, 60);
  if (!rateCheck.allowed) {
    await logSecurityEvent("rate_limit_exceeded", ip, userAgent, "/api/jobs", "Jobs rate limit reached");
    return NextResponse.json(
      { error: "Job creation rate limit exceeded. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request payload" }, { status: 400 });
  }

  const parseResult = SearchFiltersSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.format() },
      { status: 400 }
    );
  }

  try {
    const job = await orchestrator.createJob(parseResult.data);
    return NextResponse.json({ jobId: job.id, job });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to initiate search job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

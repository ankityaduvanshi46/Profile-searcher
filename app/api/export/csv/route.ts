import { NextRequest, NextResponse } from "next/server";
import { orchestrator } from "@/lib/agents/orchestrator";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "jobId query parameter required" }, { status: 400 });
  }

  const job = await orchestrator.getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const profiles = job.rankedProfiles || [];

  const headers = [
    "Rank",
    "Profile Name",
    "Username",
    "Profile URL",
    "Followers",
    "Avg Reel Views (last 10)",
    "Engagement Rate (%)",
    "Score",
    "Niche",
    "Date Added"
  ];

  const escapeCsv = (val: string | number) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = profiles.map((p) => [
    p.rank,
    escapeCsv(p.fullName),
    escapeCsv(p.username),
    escapeCsv(p.profileUrl),
    p.followersCount,
    p.avgReelViews,
    p.engagementRate.toFixed(2),
    p.score,
    escapeCsv(p.niche),
    escapeCsv(p.dateAdded)
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="influencers_${jobId}.csv"`
    }
  });
}

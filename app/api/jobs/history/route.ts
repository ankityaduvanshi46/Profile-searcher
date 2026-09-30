import { NextResponse } from "next/server";
import { orchestrator } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = await orchestrator.listJobs();
    return NextResponse.json({ jobs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load job history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

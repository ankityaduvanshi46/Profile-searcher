import { NextRequest, NextResponse } from "next/server";
import { orchestrator } from "@/lib/agents/orchestrator";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Job ID required" }, { status: 400 });
  }

  try {
    const updatedJob = await orchestrator.executeStep(id);
    return NextResponse.json({ job: updatedJob });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Step execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

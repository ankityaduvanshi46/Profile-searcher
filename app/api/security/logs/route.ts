import { NextResponse } from "next/server";
import { getSecurityLogs } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await getSecurityLogs();
    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load security logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

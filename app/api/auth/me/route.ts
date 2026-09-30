import { NextResponse } from "next/server";
import { getSession } from "@/lib/security/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuth = await getSession();
  return NextResponse.json({ authenticated: Boolean(isAuth) });
}

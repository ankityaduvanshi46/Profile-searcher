import { NextResponse } from "next/server";
import { SECURITY_CONFIG } from "@/lib/security/config";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SECURITY_CONFIG.sessionCookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}

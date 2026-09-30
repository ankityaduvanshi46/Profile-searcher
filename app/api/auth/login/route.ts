import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  checkFailedLoginLockout,
  clearFailedLoginAttempts,
  createSessionToken,
  recordFailedLoginAttempt,
  verifyAdminPassword
} from "@/lib/security/auth";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { logSecurityEvent } from "@/lib/security/logger";
import { SECURITY_CONFIG } from "@/lib/security/config";

const LoginSchema = z.object({
  password: z.string().min(1, "Password required").max(256)
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "";

  const rateCheck = await checkRateLimit("login", ip, SECURITY_CONFIG.loginRateLimitPerMinute, 60);
  if (!rateCheck.allowed) {
    await logSecurityEvent("rate_limit_exceeded", ip, userAgent, "/api/auth/login", "Login rate limit exceeded");
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  const lockout = await checkFailedLoginLockout(ip);
  if (lockout.locked) {
    await logSecurityEvent("ip_blocked", ip, userAgent, "/api/auth/login", "IP currently locked out due to failed attempts");
    return NextResponse.json(
      { error: "Account locked out due to multiple failed login attempts. Try again in 15 minutes." },
      { status: 423 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request payload" }, { status: 400 });
  }

  const parseResult = LoginSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const { password } = parseResult.data;
  const isValid = verifyAdminPassword(password);

  if (!isValid) {
    const attempts = await recordFailedLoginAttempt(ip);
    await logSecurityEvent(
      "failed_login",
      ip,
      userAgent,
      "/api/auth/login",
      `Failed attempt #${attempts}`
    );

    if (attempts >= SECURITY_CONFIG.failedLoginLockoutMaxAttempts) {
      return NextResponse.json(
        { error: "Account locked out due to 5 consecutive failed attempts. Please try again in 15 minutes." },
        { status: 423 }
      );
    }

    const remaining = SECURITY_CONFIG.failedLoginLockoutMaxAttempts - attempts;
    return NextResponse.json(
      { error: `Invalid password. ${remaining} attempts remaining before temporary lockout.` },
      { status: 401 }
    );
  }

  await clearFailedLoginAttempts(ip);
  const sessionToken = await createSessionToken();

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SECURITY_CONFIG.sessionCookieName,
    value: sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SECURITY_CONFIG.sessionMaxAgeSeconds
  });

  return response;
}

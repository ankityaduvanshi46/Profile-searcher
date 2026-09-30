import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SECURITY_CONFIG, getIpLists, isSuspiciousUserAgent } from "./lib/security/config";

const getSessionSecret = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET || "default_fallback_secret_must_change_in_production_min_32_characters";
  return new TextEncoder().encode(secret);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const userAgent = request.headers.get("user-agent") || "";

  const { blocklist, allowlist } = getIpLists();
  if (allowlist.length > 0 && !allowlist.includes(rawIp)) {
    return new NextResponse(JSON.stringify({ error: "Access Denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (blocklist.includes(rawIp)) {
    return new NextResponse(JSON.stringify({ error: "Access Denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (isSuspiciousUserAgent(userAgent)) {
    return new NextResponse(JSON.stringify({ error: "Access Denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const isStateChanging = ["POST", "PUT", "DELETE", "PATCH"].includes(request.method);
  if (isStateChanging && pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse(JSON.stringify({ error: "CSRF Validation Failed" }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
          });
        }
      } catch {
        return new NextResponse(JSON.stringify({ error: "Invalid Request Origin" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }

  const isApi = pathname.startsWith("/api/");
  const isAuthEndpoint = pathname === "/api/auth/login" || pathname === "/api/auth/logout";
  const isPublicAsset = pathname.startsWith("/_next") || pathname.includes(".");

  if (isApi && !isAuthEndpoint && !isPublicAsset) {
    const token = request.cookies.get(SECURITY_CONFIG.sessionCookieName)?.value;
    if (!token) {
      return new NextResponse(JSON.stringify({ error: "Authentication Required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const { payload } = await jwtVerify(token, getSessionSecret());
      if (payload.authorized !== true) {
        return new NextResponse(JSON.stringify({ error: "Invalid Session" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch {
      return new NextResponse(JSON.stringify({ error: "Session Expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  const response = NextResponse.next();

  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  );
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

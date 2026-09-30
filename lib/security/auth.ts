import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SECURITY_CONFIG } from "./config";
import { kv } from "../storage/kv";

const getSessionSecret = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET || "default_fallback_secret_must_change_in_production_min_32_characters";
  return new TextEncoder().encode(secret);
};

export function verifyAdminPassword(candidatePassword: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !candidatePassword) {
    return false;
  }

  const candidateHash = crypto.createHash("sha256").update(candidatePassword).digest();
  const adminHash = crypto.createHash("sha256").update(adminPassword).digest();

  return crypto.timingSafeEqual(candidateHash, adminHash);
}

export async function checkFailedLoginLockout(ip: string): Promise<{ locked: boolean; remainingSeconds: number }> {
  const lockoutKey = `lockout:${ip}`;
  const attemptsKey = `login_attempts:${ip}`;

  const isLocked = await kv.get<boolean>(lockoutKey);
  if (isLocked) {
    return { locked: true, remainingSeconds: SECURITY_CONFIG.failedLoginLockoutDurationSeconds };
  }

  const attempts = (await kv.get<number>(attemptsKey)) || 0;
  if (attempts >= SECURITY_CONFIG.failedLoginLockoutMaxAttempts) {
    await kv.set(lockoutKey, true, { ex: SECURITY_CONFIG.failedLoginLockoutDurationSeconds });
    await kv.del(attemptsKey);
    return { locked: true, remainingSeconds: SECURITY_CONFIG.failedLoginLockoutDurationSeconds };
  }

  return { locked: false, remainingSeconds: 0 };
}

export async function recordFailedLoginAttempt(ip: string): Promise<number> {
  const attemptsKey = `login_attempts:${ip}`;
  const count = await kv.incr(attemptsKey);
  if (count === 1) {
    await kv.expire(attemptsKey, SECURITY_CONFIG.failedLoginLockoutDurationSeconds);
  }
  if (count >= SECURITY_CONFIG.failedLoginLockoutMaxAttempts) {
    await kv.set(`lockout:${ip}`, true, { ex: SECURITY_CONFIG.failedLoginLockoutDurationSeconds });
  }
  return count;
}

export async function clearFailedLoginAttempts(ip: string): Promise<void> {
  await kv.del(`login_attempts:${ip}`);
  await kv.del(`lockout:${ip}`);
}

export async function createSessionToken(): Promise<string> {
  const token = await new SignJWT({ role: "admin", authorized: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SECURITY_CONFIG.sessionMaxAgeSeconds}s`)
    .sign(getSessionSecret());

  return token;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    return payload.authorized === true;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(SECURITY_CONFIG.sessionCookieName)?.value;
  if (!token) return false;
  return await verifySessionToken(token);
}

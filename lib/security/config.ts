export const SECURITY_CONFIG = {
  sessionCookieName: "if_session_token",
  sessionMaxAgeSeconds: 60 * 60 * 8,
  failedLoginLockoutMaxAttempts: 5,
  failedLoginLockoutDurationSeconds: 15 * 60,
  defaultRateLimitPerMinute: Number(process.env.RATE_LIMIT_API_MAX) || 60,
  loginRateLimitPerMinute: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  jobsRateLimitPerMinute: 20,
  suspiciousUserAgents: [
    "sqlmap",
    "nikto",
    "masscan",
    "nmap",
    "acunetix",
    "havij",
    "gobuster",
    "dirbuster",
    "wpscan",
    "zgrab",
    "censys",
    "shodan"
  ]
};

export function getIpLists() {
  const blocklistRaw = process.env.IP_BLOCKLIST || "";
  const allowlistRaw = process.env.IP_ALLOWLIST || "";

  const blocklist = blocklistRaw
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  const allowlist = allowlistRaw
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  return { blocklist, allowlist };
}

export function isIpBlocked(clientIp: string): boolean {
  const { blocklist, allowlist } = getIpLists();
  if (allowlist.length > 0 && !allowlist.includes(clientIp)) {
    return true;
  }
  if (blocklist.includes(clientIp)) {
    return true;
  }
  return false;
}

export function isSuspiciousUserAgent(userAgent: string): boolean {
  if (!userAgent || userAgent.trim().length === 0) return true;
  const lower = userAgent.toLowerCase();
  return SECURITY_CONFIG.suspiciousUserAgents.some((pattern) => lower.includes(pattern));
}

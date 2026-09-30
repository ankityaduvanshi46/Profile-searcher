import { kv } from "../storage/kv";
import { SecurityEvent } from "../types";

const SECURITY_LOGS_KEY = "security_events_list";
const MAX_LOGS_RETAINED = 200;

export async function logSecurityEvent(
  type: SecurityEvent["type"],
  ip: string,
  userAgent: string,
  path: string,
  details?: string
): Promise<void> {
  const event: SecurityEvent = {
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    ip,
    userAgent,
    path,
    details
  };

  const existing = (await kv.get<SecurityEvent[]>(SECURITY_LOGS_KEY)) || [];
  const updated = [event, ...existing].slice(0, MAX_LOGS_RETAINED);
  await kv.set(SECURITY_LOGS_KEY, updated);
}

export async function getSecurityLogs(): Promise<SecurityEvent[]> {
  const logs = await kv.get<SecurityEvent[]>(SECURITY_LOGS_KEY);
  return logs || [];
}

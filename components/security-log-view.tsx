"use client";

import React, { useEffect, useState } from "react";
import { SecurityEvent } from "@/lib/types";
import { ShieldAlert, RefreshCw } from "lucide-react";

export const SecurityLogView: React.FC = () => {
  const [logs, setLogs] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/security/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="bg-cyber-darker border border-cyber-border rounded-lg p-5 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-cyber-border pb-3">
        <div className="flex items-center space-x-2 text-neon-green">
          <ShieldAlert className="w-4 h-4" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Firewall &amp; Security Audit Telemetry
          </h2>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyber-card hover:bg-cyber-hover border border-cyber-border rounded text-cyber-text transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-cyber-card rounded border border-cyber-border">
          <div className="text-cyber-muted text-[10px] uppercase">Failed Logins</div>
          <div className="text-lg font-bold text-red-400 mt-1">
            {logs.filter((l) => l.type === "failed_login").length}
          </div>
        </div>
        <div className="p-3 bg-cyber-card rounded border border-cyber-border">
          <div className="text-cyber-muted text-[10px] uppercase">Rate Limit Hits</div>
          <div className="text-lg font-bold text-yellow-400 mt-1">
            {logs.filter((l) => l.type === "rate_limit_exceeded").length}
          </div>
        </div>
        <div className="p-3 bg-cyber-card rounded border border-cyber-border">
          <div className="text-cyber-muted text-[10px] uppercase">Firewall Blocked IPs</div>
          <div className="text-lg font-bold text-neon-green mt-1">
            {logs.filter((l) => l.type === "ip_blocked").length}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-cyber-muted">
          PULLING SECURITY TELEMETRY...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-cyber-muted">
          NO SECURITY ANOMALIES DETECTED &bull; ZERO FIREWALL VIOLATIONS
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cyber-border bg-cyber-card/60 text-cyber-muted text-[10px] uppercase tracking-wider">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Event Type</th>
                <th className="py-2 px-3">Client IP</th>
                <th className="py-2 px-3">Target Path</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border text-cyber-text">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-cyber-card/30 transition-colors">
                  <td className="py-2.5 px-3 text-cyber-muted whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.type === "failed_login"
                          ? "bg-red-950/40 text-red-400 border border-red-500/30"
                          : log.type === "rate_limit_exceeded"
                          ? "bg-yellow-950/40 text-yellow-400 border border-yellow-500/30"
                          : "bg-blue-950/40 text-cyan-400 border border-cyan-500/30"
                      }`}
                    >
                      {log.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-neon-green">{log.ip}</td>
                  <td className="py-2.5 px-3 text-cyber-muted">{log.path}</td>
                  <td className="py-2.5 px-3 text-cyber-muted truncate max-w-xs">{log.details || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

"use client";

import React from "react";
import { Settings, Shield, Server, Check, X } from "lucide-react";

export const SettingsView: React.FC = () => {
  return (
    <div className="bg-cyber-darker border border-cyber-border rounded-lg p-5 space-y-6 font-mono text-xs">
      <div className="flex items-center space-x-2 text-neon-green border-b border-cyber-border pb-3">
        <Settings className="w-4 h-4" />
        <h2 className="text-sm font-bold uppercase tracking-wider">
          System Configuration &amp; Provider Registry
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-cyber-text font-bold uppercase">
            <Server className="w-4 h-4 text-neon-green" />
            <span>Infrastructure &amp; Storage</span>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-cyber-card rounded border border-cyber-border space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-cyber-text">Upstash Redis / Vercel KV</span>
                <span className="text-neon-green text-[10px] flex items-center">
                  <Check className="w-3 h-3 mr-0.5" /> READY
                </span>
              </div>
              <p className="text-[11px] text-cyber-muted">
                Persistent state storage for chunked job orchestrator, rate limits, and deduplication index.
              </p>
            </div>

            <div className="p-3 bg-cyber-card rounded border border-cyber-border space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-cyber-text">Serverless Chunking Engine</span>
                <span className="text-neon-green text-[10px] flex items-center">
                  <Check className="w-3 h-3 mr-0.5" /> ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-cyber-muted">
                Splits multi-agent operations into step-by-step 3s micro-tasks fitting within Vercel execution limits.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-cyber-text font-bold uppercase">
            <Shield className="w-4 h-4 text-neon-green" />
            <span>Data Providers &amp; Connectors</span>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-cyber-card rounded border border-cyber-border space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-cyber-text">Instagram Graph API (Business Discovery)</span>
                <span className="text-neon-green text-[10px]">PRIMARY</span>
              </div>
              <p className="text-[11px] text-cyber-muted">
                Meta official Graph API discovery using business account anchor with backoff retry.
              </p>
            </div>

            <div className="p-3 bg-cyber-card rounded border border-cyber-border space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-cyber-text">Apify Instagram Actor Adapter</span>
                <span className="text-cyan-400 text-[10px]">STANDBY ADAPTER</span>
              </div>
              <p className="text-[11px] text-cyber-muted">
                Third-party scraper provider configured via APIFY_API_TOKEN and INSTAGRAM_PROVIDER env.
              </p>
            </div>

            <div className="p-3 bg-cyber-card rounded border border-cyber-border space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-cyber-text">Google Sheets Service Account</span>
                <span className="text-neon-green text-[10px] flex items-center">
                  <Check className="w-3 h-3 mr-0.5" /> INTEGRATED
                </span>
              </div>
              <p className="text-[11px] text-cyber-muted">
                Writes frozen headers, alternating colors, formulas, and auto-sorted ranking rows directly into spreadsheet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import { AgentName, AgentProgress, SearchJob } from "@/lib/types";
import {
  Search,
  BarChart2,
  Filter,
  TrendingUp,
  CopyCheck,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";

interface AgentStatusCardProps {
  job: SearchJob | null;
}

const AGENTS_CONFIG: { name: AgentName; label: string; icon: React.ElementType; description: string }[] = [
  {
    name: "discovery",
    label: "1. Discovery Agent",
    icon: Search,
    description: "Crawls niches, hashtags & seed network"
  },
  {
    name: "metrics",
    label: "2. Metrics Agent",
    icon: BarChart2,
    description: "Evaluates followers & 10 reels views"
  },
  {
    name: "bio_filter",
    label: "3. Bio Filter Agent",
    icon: Filter,
    description: "Detects & rejects manager mentions"
  },
  {
    name: "ranking",
    label: "4. Ranking Agent",
    icon: TrendingUp,
    description: "Transparent multi-factor scoring"
  },
  {
    name: "deduplication",
    label: "5. Deduplication Agent",
    icon: CopyCheck,
    description: "Prevents duplicates vs live records"
  },
  {
    name: "sheets_writer",
    label: "6. Sheets Writer Agent",
    icon: FileSpreadsheet,
    description: "Appends styled rows into Google Sheets"
  }
];

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ job }) => {
  if (!job) {
    return (
      <div className="bg-cyber-darker border border-cyber-border rounded-lg p-6 text-center text-cyber-muted font-mono text-xs">
        ORCHESTRATOR STANDBY &bull; CONFIGURE TARGET FILTERS AND LAUNCH TO ACTIVATE MULTI-AGENT SWARM
      </div>
    );
  }

  const completedCount = Object.values(job.agents).filter((a) => a.status === "completed").length;
  const overallPercentage = Math.round((completedCount / 6) * 100);

  return (
    <div className="bg-cyber-darker border border-cyber-border rounded-lg p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse"></span>
            <h2 className="text-sm font-bold tracking-wider uppercase font-mono text-neon-green glow-green">
              Multi-Agent Orchestrator Pipeline
            </h2>
          </div>
          <p className="text-[11px] text-cyber-muted font-mono mt-1">
            Job ID: <span className="text-cyber-text">{job.id}</span> &bull; Status:{" "}
            <span
              className={`font-bold uppercase ${
                job.status === "completed"
                  ? "text-neon-green"
                  : job.status === "failed"
                  ? "text-red-400"
                  : "text-yellow-400"
              }`}
            >
              {job.status}
            </span>
          </p>
        </div>

        <div className="text-right font-mono">
          <div className="text-xs text-neon-green font-bold">{overallPercentage}% COMPLETED</div>
          <div className="w-36 h-2 bg-cyber-black border border-cyber-border rounded overflow-hidden mt-1">
            <div
              className="h-full bg-neon-green transition-all duration-300"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS_CONFIG.map((agentCfg) => {
          const progress: AgentProgress = job.agents[agentCfg.name] || {
            name: agentCfg.name,
            status: "idle",
            message: "Standby",
            processedCount: 0,
            totalCount: 0
          };

          const Icon = agentCfg.icon;

          return (
            <div
              key={agentCfg.name}
              className={`p-4 rounded border transition-all duration-200 font-mono text-xs ${
                progress.status === "running"
                  ? "bg-neon-dark/20 border-neon-green shadow-neon"
                  : progress.status === "completed"
                  ? "bg-cyber-card/80 border-neon-green/40"
                  : progress.status === "failed"
                  ? "bg-red-950/20 border-red-500/60"
                  : "bg-cyber-card/40 border-cyber-border opacity-70"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon
                    className={`w-4 h-4 ${
                      progress.status === "running"
                        ? "text-neon-green animate-pulse"
                        : progress.status === "completed"
                        ? "text-neon-green"
                        : progress.status === "failed"
                        ? "text-red-400"
                        : "text-cyber-muted"
                    }`}
                  />
                  <span className="font-bold text-cyber-text">{agentCfg.label}</span>
                </div>

                <div>
                  {progress.status === "running" && (
                    <span className="flex items-center space-x-1 text-yellow-400 text-[10px]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>ACTIVE</span>
                    </span>
                  )}
                  {progress.status === "completed" && (
                    <span className="flex items-center space-x-1 text-neon-green text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>DONE</span>
                    </span>
                  )}
                  {progress.status === "failed" && (
                    <span className="flex items-center space-x-1 text-red-400 text-[10px]">
                      <AlertCircle className="w-3 h-3" />
                      <span>ERROR</span>
                    </span>
                  )}
                  {progress.status === "idle" && (
                    <span className="flex items-center space-x-1 text-cyber-muted text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>IDLE</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-cyber-muted mb-3">{agentCfg.description}</p>

              <div className="p-2 bg-cyber-black/70 rounded border border-cyber-border text-[11px] text-cyber-text truncate">
                &gt; {progress.message}
              </div>

              {progress.totalCount > 0 && (
                <div className="mt-2 flex justify-between text-[10px] text-cyber-muted">
                  <span>Processed:</span>
                  <span className="text-cyber-text">
                    {progress.processedCount} / {progress.totalCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {job.error && (
        <div className="p-3 bg-red-950/40 border border-red-500 rounded text-red-400 text-xs font-mono flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Pipeline Error: {job.error}</span>
        </div>
      )}
    </div>
  );
};

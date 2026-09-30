"use client";

import React, { useEffect, useState } from "react";
import { SearchJob } from "@/lib/types";
import { History, CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react";

interface JobHistoryViewProps {
  onSelectJob: (job: SearchJob) => void;
}

export const JobHistoryView: React.FC<JobHistoryViewProps> = ({ onSelectJob }) => {
  const [jobs, setJobs] = useState<SearchJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/jobs/history");
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="bg-cyber-darker border border-cyber-border rounded-lg p-5 space-y-4 font-mono">
      <div className="flex items-center space-x-2 text-neon-green border-b border-cyber-border pb-3">
        <History className="w-4 h-4" />
        <h2 className="text-sm font-bold uppercase tracking-wider">
          Job Execution History &bull; Vercel KV Records
        </h2>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-cyber-muted text-xs">
          LOADING ARCHIVED SEARCH RUNS...
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-12 text-center text-cyber-muted text-xs">
          NO HISTORICAL SEARCH RUNS FOUND.
        </div>
      ) : (
        <div className="divide-y divide-cyber-border">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-cyber-card/30 px-2 rounded transition-colors text-xs"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-cyber-text">{job.id}</span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      job.status === "completed"
                        ? "bg-neon-dark/40 text-neon-green border border-neon-green/30"
                        : job.status === "failed"
                        ? "bg-red-950/40 text-red-400 border border-red-500/30"
                        : "bg-yellow-950/40 text-yellow-400 border border-yellow-500/30"
                    }`}
                  >
                    {job.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                    {job.status === "failed" && <AlertCircle className="w-3 h-3" />}
                    {job.status === "running" && <Clock className="w-3 h-3 animate-spin" />}
                    <span>{job.status}</span>
                  </span>
                </div>
                <div className="text-[11px] text-cyber-muted mt-1 space-x-3">
                  <span>Target: <strong className="text-cyber-text">{job.filters?.niche || "N/A"}</strong></span>
                  {job.filters?.hashtag && <span>#{job.filters.hashtag}</span>}
                  <span>&bull; Date: {new Date(job.createdAt).toLocaleString()}</span>
                  <span>&bull; Results: <strong className="text-neon-green">{job.rankedProfiles?.length || 0}</strong></span>
                </div>
              </div>

              <button
                onClick={() => onSelectJob(job)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyber-card hover:bg-cyber-hover border border-cyber-border rounded text-xs text-neon-green transition-colors"
              >
                <span>View Results</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

"use client";

import React, { useState, useMemo } from "react";
import { ScoredProfile } from "@/lib/types";
import {
  ExternalLink,
  ArrowUpDown,
  Download,
  Search as SearchIcon,
  CheckCircle,
  Database
} from "lucide-react";

interface ResultsTableProps {
  profiles: ScoredProfile[];
  jobId?: string;
  sheetUrl?: string;
  isLoading: boolean;
}

type SortField = "rank" | "followersCount" | "avgReelViews" | "engagementRate" | "score";

export const ResultsTable: React.FC<ResultsTableProps> = ({
  profiles,
  jobId,
  sheetUrl,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "rank");
    }
  };

  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let result = profiles.filter((p) => {
      if (!term) return true;
      return (
        p.username.toLowerCase().includes(term) ||
        p.fullName.toLowerCase().includes(term) ||
        p.niche.toLowerCase().includes(term)
      );
    });

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [profiles, searchTerm, sortField, sortAsc]);

  const handleExportCsv = () => {
    if (!jobId) return;
    window.open(`/api/export/csv?jobId=${encodeURIComponent(jobId)}`, "_blank");
  };

  return (
    <div className="bg-cyber-darker border border-cyber-border rounded-lg p-5 space-y-4 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-neon-green glow-green flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Discovered Influencers ({profiles.length})</span>
          </h2>
          <p className="text-[11px] text-cyber-muted mt-0.5">
            Ranked by multi-factor score &bull; Cleaned of agency/management bios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search handle or name..."
              className="bg-cyber-black border border-cyber-border text-xs px-3 py-1.5 pl-8 rounded text-cyber-text focus:border-neon-green outline-none w-48 sm:w-64"
            />
            <SearchIcon className="w-3.5 h-3.5 text-cyber-muted absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {jobId && profiles.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyber-card hover:bg-cyber-hover border border-cyber-border rounded text-xs text-cyber-text transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-neon-green" />
              <span>Export CSV</span>
            </button>
          )}

          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/40 rounded text-xs text-neon-green transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Open in Google Sheets</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-cyber-muted text-xs">
          <span className="inline-block w-5 h-5 border-2 border-neon-green border-t-transparent rounded-full animate-spin mb-3"></span>
          <p>PROCESSING CREATOR DATASET...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="py-16 text-center text-cyber-muted text-xs">
          NO PROFILES IN CURRENT DATASET. RUN SEARCH TO DISCOVER MATCHING INFLUENCERS.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-cyber-border bg-cyber-card/60 text-cyber-muted text-[11px] uppercase tracking-wider">
                <th
                  onClick={() => handleSort("rank")}
                  className="py-2.5 px-3 cursor-pointer hover:text-neon-green transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Rank</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Profile Name</th>
                <th className="py-2.5 px-3">Username</th>
                <th
                  onClick={() => handleSort("followersCount")}
                  className="py-2.5 px-3 cursor-pointer hover:text-neon-green transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Followers</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("avgReelViews")}
                  className="py-2.5 px-3 cursor-pointer hover:text-neon-green transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Avg Views (10 Reels)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("engagementRate")}
                  className="py-2.5 px-3 cursor-pointer hover:text-neon-green transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Engagement</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("score")}
                  className="py-2.5 px-3 cursor-pointer hover:text-neon-green transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Niche</th>
                <th className="py-2.5 px-3">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {filteredAndSorted.map((p) => (
                <tr
                  key={p.username}
                  className="hover:bg-cyber-card/40 transition-colors text-cyber-text"
                >
                  <td className="py-3 px-3 font-bold text-neon-green">#{p.rank}</td>
                  <td className="py-3 px-3 font-semibold">{p.fullName}</td>
                  <td className="py-3 px-3">
                    <a
                      href={p.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neon-green hover:underline flex items-center space-x-1"
                    >
                      <span>@{p.username}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </td>
                  <td className="py-3 px-3">{p.followersCount.toLocaleString()}</td>
                  <td className="py-3 px-3">{p.avgReelViews.toLocaleString()}</td>
                  <td className="py-3 px-3 text-cyan-400 font-semibold">{p.engagementRate.toFixed(2)}%</td>
                  <td className="py-3 px-3 font-bold text-neon-green glow-green">{p.score}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-cyber-card rounded border border-cyber-border text-[10px]">
                      {p.niche}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-cyber-muted text-[11px]">{p.dateAdded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

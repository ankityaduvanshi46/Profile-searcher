"use client";

import React, { useEffect, useState, useCallback } from "react";
import { SearchFilters, FilterPreset, SearchJob } from "@/lib/types";
import { BootScreen } from "@/components/boot-screen";
import { LoginForm } from "@/components/login-form";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FiltersPanel } from "@/components/filters-panel";
import { AgentStatusCard } from "@/components/agent-status-card";
import { ResultsTable } from "@/components/results-table";
import { JobHistoryView } from "@/components/job-history-view";
import { SecurityLogView } from "@/components/security-log-view";
import { SettingsView } from "@/components/settings-view";
import { DEFAULT_PRESETS } from "@/lib/storage/presets";

export default function HomePage() {
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("filters");
  const [currentJob, setCurrentJob] = useState<SearchJob | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>(DEFAULT_PRESETS);

  const [filters, setFilters] = useState<SearchFilters>({
    niche: "Fitness",
    hashtag: "fitnessmotivation",
    seedAccounts: [],
    minFollowers: 5000,
    maxFollowers: 100000,
    minAvgReelViews: 10000,
    maxAvgReelViews: 250000,
    minEngagementRate: 2.0,
    excludeManagerKeywords: [],
    customManagerKeywords: []
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(data.authenticated === true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const hasBooted = sessionStorage.getItem("if_boot_sequence_viewed");
    if (hasBooted === "true") {
      setShowBootScreen(false);
    }
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      const loadPresets = async () => {
        try {
          const res = await fetch("/api/presets");
          if (res.ok) {
            const data = await res.json();
            if (data.presets && data.presets.length > 0) {
              setPresets(data.presets);
            }
          }
        } catch {
        }
      };
      loadPresets();
    }
  }, [isAuthenticated]);

  const handleBootComplete = () => {
    setShowBootScreen(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsAuthenticated(false);
    }
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
  };

  const handleSavePreset = async (name: string) => {
    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, filters })
      });
      if (res.ok) {
        const data = await res.json();
        setPresets((prev) => [data.preset, ...prev]);
      }
    } catch {
    }
  };

  const runChunkedPipeline = async (jobId: string) => {
    let completed = false;

    while (!completed) {
      try {
        const stepRes = await fetch(`/api/jobs/${jobId}/step`, {
          method: "POST"
        });

        if (!stepRes.ok) {
          const err = await stepRes.json();
          throw new Error(err.error || "Step failed");
        }

        const data = await stepRes.json();
        const updatedJob: SearchJob = data.job;
        setCurrentJob(updatedJob);

        if (updatedJob.status === "completed" || updatedJob.status === "failed") {
          completed = true;
          if (updatedJob.status === "completed") {
            setTimeout(() => {
              setActiveTab("results");
            }, 600);
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } catch (error: unknown) {
        completed = true;
        setCurrentJob((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: "failed",
            error: error instanceof Error ? error.message : "Chunk execution failed"
          };
        });
      }
    }
  };

  const handleRunSearch = async () => {
    setIsRunning(true);
    setActiveTab("pipeline");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters)
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to start search job");
        setIsRunning(false);
        return;
      }

      const data = await res.json();
      setCurrentJob(data.job);
      await runChunkedPipeline(data.jobId);
    } catch {
      alert("Failed to connect to search coordinator");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSelectJob = (job: SearchJob) => {
    setCurrentJob(job);
    setActiveTab("results");
  };

  if (showBootScreen) {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-black text-neon-green font-mono text-xs">
        <span className="w-3 h-3 bg-neon-green animate-ping mr-2"></span>
        INITIALIZING SECURITY CONTEXT...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onSuccess={handleLoginSuccess} />;
  }

  const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID}`
    : undefined;

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
      isRunning={isRunning}
    >
      <div className="space-y-6">
        {activeTab === "filters" && (
          <FiltersPanel
            filters={filters}
            presets={presets}
            onChange={setFilters}
            onApplyPreset={handleApplyPreset}
            onSavePreset={handleSavePreset}
            onRunSearch={handleRunSearch}
            isRunning={isRunning}
          />
        )}

        {activeTab === "pipeline" && (
          <AgentStatusCard job={currentJob} />
        )}

        {activeTab === "results" && (
          <ResultsTable
            profiles={currentJob?.rankedProfiles || []}
            jobId={currentJob?.id}
            sheetUrl={sheetUrl}
            isLoading={isRunning}
          />
        )}

        {activeTab === "history" && (
          <JobHistoryView onSelectJob={handleSelectJob} />
        )}

        {activeTab === "security" && (
          <SecurityLogView />
        )}

        {activeTab === "settings" && (
          <SettingsView />
        )}
      </div>
    </DashboardLayout>
  );
}

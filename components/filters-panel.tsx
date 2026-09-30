"use client";

import React, { useState } from "react";
import { SearchFilters, FilterPreset } from "@/lib/types";
import { DEFAULT_MANAGER_KEYWORDS } from "@/lib/agents/bio-filter-agent";
import { Sliders, Bookmark, Plus, X, Play } from "lucide-react";

interface FiltersPanelProps {
  filters: SearchFilters;
  presets: FilterPreset[];
  onChange: (updated: SearchFilters) => void;
  onApplyPreset: (preset: FilterPreset) => void;
  onSavePreset: (name: string) => void;
  onRunSearch: () => void;
  isRunning: boolean;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filters,
  presets,
  onChange,
  onApplyPreset,
  onSavePreset,
  onRunSearch,
  isRunning
}) => {
  const [newKeyword, setNewKeyword] = useState("");
  const [newSeed, setNewSeed] = useState("");
  const [presetName, setPresetName] = useState("");
  const [showSavePreset, setShowSavePreset] = useState(false);

  const addCustomKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (trimmed && !filters.customManagerKeywords.includes(trimmed)) {
      onChange({
        ...filters,
        customManagerKeywords: [...filters.customManagerKeywords, trimmed]
      });
      setNewKeyword("");
    }
  };

  const removeCustomKeyword = (kw: string) => {
    onChange({
      ...filters,
      customManagerKeywords: filters.customManagerKeywords.filter((k) => k !== kw)
    });
  };

  const addSeedAccount = () => {
    const trimmed = newSeed.trim().replace("@", "");
    if (trimmed && !filters.seedAccounts.includes(trimmed)) {
      onChange({
        ...filters,
        seedAccounts: [...filters.seedAccounts, trimmed]
      });
      setNewSeed("");
    }
  };

  const removeSeedAccount = (acc: string) => {
    onChange({
      ...filters,
      seedAccounts: filters.seedAccounts.filter((a) => a !== acc)
    });
  };

  const handleSavePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (presetName.trim()) {
      onSavePreset(presetName.trim());
      setPresetName("");
      setShowSavePreset(false);
    }
  };

  return (
    <div className="bg-cyber-darker border border-cyber-border rounded-lg p-5 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div className="flex items-center space-x-2 text-neon-green">
          <Sliders className="w-5 h-5" />
          <h2 className="text-sm font-bold tracking-wider uppercase font-mono">
            Search Filters &amp; Target Parameters
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <select
            onChange={(e) => {
              const selected = presets.find((p) => p.id === e.target.value);
              if (selected) onApplyPreset(selected);
            }}
            defaultValue=""
            className="bg-cyber-black border border-cyber-border text-xs text-cyber-text rounded px-3 py-1.5 outline-none font-mono focus:border-neon-green"
          >
            <option value="" disabled>
              Load Preset...
            </option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowSavePreset(!showSavePreset)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyber-card hover:bg-cyber-hover border border-cyber-border rounded text-xs text-cyber-text transition-colors font-mono"
          >
            <Bookmark className="w-3.5 h-3.5 text-neon-green" />
            <span>Save Preset</span>
          </button>
        </div>
      </div>

      {showSavePreset && (
        <form onSubmit={handleSavePresetSubmit} className="flex gap-2 p-3 bg-cyber-card rounded border border-cyber-border">
          <input
            type="text"
            placeholder="Preset Name (e.g., Tech Creators Under 100k)"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="flex-1 bg-cyber-black border border-cyber-border text-xs px-3 py-1.5 text-cyber-text font-mono rounded outline-none focus:border-neon-green"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-neon-green/20 text-neon-green border border-neon-green/50 text-xs font-mono rounded hover:bg-neon-green/30"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setShowSavePreset(false)}
            className="px-2 py-1.5 text-cyber-muted text-xs hover:text-white"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-neon-green/80 mb-1.5 font-mono">
            Niche / Category
          </label>
          <input
            type="text"
            value={filters.niche}
            onChange={(e) => onChange({ ...filters, niche: e.target.value })}
            placeholder="e.g. Fitness, Tech, Beauty, Travel"
            className="w-full bg-cyber-black border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-neon-green/80 mb-1.5 font-mono">
            Hashtag Discovery (Optional)
          </label>
          <input
            type="text"
            value={filters.hashtag || ""}
            onChange={(e) => onChange({ ...filters, hashtag: e.target.value })}
            placeholder="e.g. techreviewers, foodvlogger"
            className="w-full bg-cyber-black border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-neon-green/80 mb-1.5 font-mono">
            Target Country (Optional)
          </label>
          <input
            type="text"
            value={filters.country || ""}
            onChange={(e) => onChange({ ...filters, country: e.target.value })}
            placeholder="e.g. US, UK, IN, CA"
            className="w-full bg-cyber-black border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-neon-green/80 mb-1.5 font-mono">
            Followers Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={filters.minFollowers || ""}
              onChange={(e) => onChange({ ...filters, minFollowers: Number(e.target.value) || 0 })}
              placeholder="Min Followers (e.g. 10000)"
              className="bg-cyber-black border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
            />
            <input
              type="number"
              value={filters.maxFollowers || ""}
              onChange={(e) => onChange({ ...filters, maxFollowers: Number(e.target.value) || 0 })}
              placeholder="Max Followers (e.g. 150000)"
              className="bg-cyber-black border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-neon-green/80 mb-1.5 font-mono">
            Average Views of Last 10 Reels
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={filters.minAvgReelViews || ""}
              onChange={(e) => onChange({ ...filters, minAvgReelViews: Number(e.target.value) || 0 })}
              placeholder="Min Avg Views (e.g. 20000)"
              className="bg-cyber-black border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
            />
            <input
              type="number"
              value={filters.maxAvgReelViews || ""}
              onChange={(e) => onChange({ ...filters, maxAvgReelViews: Number(e.target.value) || 0 })}
              placeholder="Max Avg Views (e.g. 500000)"
              className="bg-cyber-black border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-neon-green/80 mb-1.5 font-mono">
          Minimum Engagement Rate (%)
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            step="0.1"
            value={filters.minEngagementRate || ""}
            onChange={(e) => onChange({ ...filters, minEngagementRate: Number(e.target.value) || 0 })}
            placeholder="Min Engagement % (e.g. 2.5)"
            className="w-48 bg-cyber-black border border-cyber-border rounded px-3 py-2 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
          />
          <span className="text-xs text-cyber-muted font-mono">
            Calculated as: ((Likes + Comments) / Followers) &times; 100 on recent reels
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-neon-green/80 mb-1.5 font-mono">
          Seed Influencer Accounts (To anchor graph discovery)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSeed}
            onChange={(e) => setNewSeed(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSeedAccount();
              }
            }}
            placeholder="Add seed account username (e.g. mkbhd)"
            className="flex-1 max-w-sm bg-cyber-black border border-cyber-border rounded px-3 py-1.5 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
          />
          <button
            type="button"
            onClick={addSeedAccount}
            className="px-3 py-1.5 bg-cyber-card hover:bg-cyber-hover border border-cyber-border text-neon-green rounded text-xs font-mono flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Seed</span>
          </button>
        </div>
        {filters.seedAccounts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.seedAccounts.map((acc) => (
              <span
                key={acc}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-cyber-card border border-cyber-border rounded text-xs text-cyber-text font-mono"
              >
                <span>@{acc}</span>
                <button
                  type="button"
                  onClick={() => removeSeedAccount(acc)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2 border-t border-cyber-border">
        <div className="flex items-center justify-between">
          <label className="block text-xs uppercase tracking-wider text-neon-green/80 font-mono">
            Bio Manager Exclusion Keywords
          </label>
          <span className="text-[11px] text-cyber-muted font-mono">
            {DEFAULT_MANAGER_KEYWORDS.length} built-in keywords active
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-cyber-black rounded border border-cyber-border text-[11px] text-cyber-muted font-mono">
          {DEFAULT_MANAGER_KEYWORDS.map((kw) => (
            <span key={kw} className="px-2 py-0.5 bg-cyber-card/60 rounded border border-cyber-border/40">
              {kw}
            </span>
          ))}
        </div>

        <div>
          <span className="block text-[11px] uppercase tracking-wider text-cyber-muted mb-1 font-mono">
            Custom Exclusion Keywords
          </span>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomKeyword();
                }
              }}
              placeholder="e.g. agent, direct booking, collab@agency.com"
              className="flex-1 max-w-sm bg-cyber-black border border-cyber-border rounded px-3 py-1.5 text-xs text-cyber-text font-mono focus:border-neon-green outline-none"
            />
            <button
              type="button"
              onClick={addCustomKeyword}
              className="px-3 py-1.5 bg-cyber-card hover:bg-cyber-hover border border-cyber-border text-neon-green rounded text-xs font-mono flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Keyword</span>
            </button>
          </div>
          {filters.customManagerKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.customManagerKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-red-950/40 border border-red-500/40 text-red-300 rounded text-xs font-mono"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomKeyword(kw)}
                    className="hover:text-red-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-cyber-border flex justify-end">
        <button
          type="button"
          onClick={onRunSearch}
          disabled={isRunning || !filters.niche.trim()}
          className="px-6 py-3 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green rounded text-sm font-bold tracking-wider uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 font-mono shadow-neon hover:shadow-neon-strong"
        >
          {isRunning ? (
            <>
              <span className="w-4 h-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></span>
              <span>AGENT PIPELINE RUNNING...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-neon-green" />
              <span>LAUNCH AGENT DISCOVERY PIPELINE</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

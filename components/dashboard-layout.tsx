"use client";

import React, { useState } from "react";
import {
  Sliders,
  Database,
  Cpu,
  History,
  ShieldAlert,
  Settings,
  LogOut,
  Terminal
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isRunning: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onLogout,
  isRunning
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "filters", label: "Search & Filters", icon: Sliders },
    { id: "pipeline", label: "Live Agents", icon: Cpu },
    { id: "results", label: "Results Table", icon: Database },
    { id: "history", label: "Job History", icon: History },
    { id: "security", label: "Security Log", icon: ShieldAlert },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-text font-mono flex flex-col">
      <header className="border-b border-cyber-border bg-cyber-darker sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded border border-neon-green/40 flex items-center justify-center bg-neon-dark/30 shadow-neon">
              <Terminal className="w-4 h-4 text-neon-green" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-wider text-neon-green glow-green">
                INFLUENCER FINDER
              </span>
              <span className="text-[10px] text-cyber-muted block sm:inline sm:ml-2">
                v1.0 &bull; SECURE ENGINE
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? "bg-neon-dark/40 text-neon-green border border-neon-green/40 shadow-neon"
                      : "text-cyber-muted hover:text-cyber-text hover:bg-cyber-card"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.id === "pipeline" && isRunning && (
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-ping ml-1" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1 text-[11px] text-neon-green bg-neon-dark/30 border border-neon-green/30 px-2 py-0.5 rounded">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
              <span>AUTHENTICATED</span>
            </div>

            <button
              onClick={onLogout}
              title="Terminate Operator Session"
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-cyber-muted hover:text-red-400 bg-cyber-card hover:bg-red-950/30 border border-cyber-border rounded transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="md:hidden border-t border-cyber-border px-4 py-2 flex overflow-x-auto space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex-shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] ${
                  isActive
                    ? "bg-neon-dark/40 text-neon-green border border-neon-green/40"
                    : "text-cyber-muted bg-cyber-card"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="border-t border-cyber-border py-4 bg-cyber-darker text-center text-[10px] text-cyber-muted font-mono">
        INFLUENCER FINDER &bull; ZERO CLIENT STORAGE &bull; ENCRYPTED SERVERLESS CHUNKS &bull; VERCEL DEPLOYMENT
      </footer>
    </div>
  );
};

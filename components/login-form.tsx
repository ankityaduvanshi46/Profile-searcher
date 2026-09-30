"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, AlertTriangle, Key } from "lucide-react";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setIsLoading(false);
        return;
      }

      onSuccess();
    } catch {
      setError("Network or security connection error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cyber-black crt-overlay">
      <div className="w-full max-w-md bg-cyber-darker border border-neon-green/30 rounded-lg p-6 sm:p-8 glow-box">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 rounded-full border border-neon-green/40 flex items-center justify-center bg-neon-dark/40 shadow-neon">
            <Lock className="w-6 h-6 text-neon-green" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold tracking-wider text-neon-green glow-green">
            INFLUENCER FINDER
          </h1>
          <p className="text-xs text-cyber-muted mt-1 uppercase tracking-widest">
            Security Gate &bull; Restricted Operator Access
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-500/50 rounded flex items-start space-x-3 text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neon-green/80 mb-2 font-mono">
              Access Key / Admin Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                placeholder="Enter authorized passkey"
                className="w-full bg-cyber-black border border-cyber-border focus:border-neon-green focus:ring-1 focus:ring-neon-green rounded px-3 py-2.5 text-sm text-cyber-text placeholder-cyber-muted/50 font-mono outline-none transition-colors"
              />
              <Key className="w-4 h-4 text-cyber-muted absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password.trim()}
            className="w-full py-2.5 px-4 bg-neon-green/20 hover:bg-neon-green/30 text-neon-green border border-neon-green/50 rounded text-sm font-semibold tracking-wider uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-neon hover:shadow-neon-strong"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></span>
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>VERIFY & ENTER</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-cyber-border text-center">
          <p className="text-[10px] text-cyber-muted tracking-widest uppercase">
            Constant-time verification &bull; 5-attempt rate lockout &bull; Encrypted sessions
          </p>
        </div>
      </div>
    </div>
  );
};

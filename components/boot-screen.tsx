"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  "INITIALIZING SECURE ENVIRONMENT",
  "LOADING FIREWALL MODULES & WAF FILTERS",
  "VERIFYING ENCRYPTION KEYS & JWT REGISTRY",
  "STARTING MULTI-AGENT ORCHESTRATION NETWORK",
  "CONNECTING DATA PROVIDERS: GRAPH API & APIFY",
  "ESTABLISHING GOOGLE SHEETS SERVICE ACCOUNT",
  "ACCESS RESTRICTED: OPERATOR AUTHENTICATION REQUIRED"
];

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [completedLines, setCompletedLines] = useState<{ text: string; done: boolean }[]>([]);
  const [progress, setProgress] = useState(0);
  const [glitchTitle, setGlitchTitle] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const isReducedMotionRef = useRef(false);

  const handleFinish = useCallback(() => {
    sessionStorage.setItem("if_boot_sequence_viewed", "true");
    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [onComplete]);

  useEffect(() => {
    const handleSkip = () => {
      handleFinish();
    };

    window.addEventListener("keydown", handleSkip);
    window.addEventListener("click", handleSkip);

    return () => {
      window.removeEventListener("keydown", handleSkip);
      window.removeEventListener("click", handleSkip);
    };
  }, [handleFinish]);

  useEffect(() => {
    isReducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReducedMotionRef.current) {
      setCompletedLines(BOOT_LINES.map((text) => ({ text, done: true })));
      setProgress(100);
      const timer = setTimeout(() => {
        handleFinish();
      }, 1000);
      return () => clearTimeout(timer);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const fontSize = 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    let animationFrameId: number;

    const renderMatrix = () => {
      ctx.fillStyle = "rgba(5, 6, 8, 0.15)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#00ff41";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle = Math.random() > 0.9 ? "#ffffff" : "#00ff41";
        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(renderMatrix);
    };

    renderMatrix();

    const totalDuration = 3400;
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / totalDuration) * 100));
      setProgress(pct);

      if (pct >= 75) {
        setGlitchTitle(true);
      }

      if (elapsed >= totalDuration) {
        clearInterval(progressInterval);
        handleFinish();
      }
    }, 40);

    const lineDelay = Math.floor(totalDuration / BOOT_LINES.length);
    BOOT_LINES.forEach((line, index) => {
      setTimeout(() => {
        setCompletedLines((prev) => [...prev, { text: line, done: false }]);
        setTimeout(() => {
          setCompletedLines((prev) =>
            prev.map((item) => (item.text === line ? { ...item, done: true } : item))
          );
        }, 150);
      }, index * lineDelay);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(progressInterval);
    };
  }, [handleFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 sm:p-12 bg-black text-[#00ff41] crt-overlay select-none transition-opacity duration-500 ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-40 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between border-b border-[#00ff41]/20 pb-4">
        <div className="flex items-center space-x-3">
          <span className="inline-block w-3 h-3 bg-[#00ff41] animate-pulse"></span>
          <span
            className={`text-xl sm:text-2xl font-bold tracking-widest ${
              glitchTitle ? "glitch-text glow-green text-white" : "glow-green"
            }`}
          >
            INFLUENCER FINDER // BOOT SEQUENCE
          </span>
        </div>
        <div className="text-xs text-[#00ff41]/60 tracking-wider">
          PRESS ANY KEY TO SKIP [ESC/SPACE]
        </div>
      </div>

      <div className="relative z-10 max-w-4xl my-auto space-y-3 font-mono text-xs sm:text-sm">
        {completedLines.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between sm:justify-start sm:space-x-4">
            <span className="text-[#00ff41]/80">&gt; {item.text}</span>
            <span className="ml-auto font-bold">
              {item.done ? (
                <span className="text-[#00ff41] glow-green">[ OK ]</span>
              ) : (
                <span className="text-yellow-400 animate-pulse">[ LOAD ]</span>
              )}
            </span>
          </div>
        ))}
        {progress < 100 && (
          <div className="text-[#00ff41]/60 blinking-cursor">
            &gt; processing agent system directives
          </div>
        )}
      </div>

      <div className="relative z-10 space-y-2 border-t border-[#00ff41]/20 pt-4">
        <div className="flex justify-between text-xs tracking-widest text-[#00ff41]">
          <span>SYSTEM_INTEGRITY_CHECK</span>
          <span className="font-bold">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-black/60 border border-[#00ff41]/40 rounded-none overflow-hidden">
          <div
            className="h-full bg-[#00ff41] shadow-[0_0_12px_#00ff41] transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

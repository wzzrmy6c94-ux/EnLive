"use client";

import React from "react";

export type TabType = "artist" | "venue" | "city";

interface LeaderboardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function LeaderboardTabs({ 
  activeTab, 
  onTabChange,
  showFilters,
  onToggleFilters
}: LeaderboardTabsProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        role="tablist"
        aria-label="Leaderboard category"
        className="flex flex-1 rounded-xl border p-1"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface-muted)",
        }}
      >
        <TabButton
          active={activeTab === "artist"}
          onClick={() => onTabChange("artist")}
          label="Artists"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          }
        />
        <TabButton
          active={activeTab === "venue"}
          onClick={() => onTabChange("venue")}
          label="Venues"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M3 7v1a3 3 0 0 0 6 0V7m6 0v1a3 3 0 0 0 6 0V7" />
              <path d="M9 7h6" />
              <path d="M9 7a3 3 0 0 1 6 0v1a3 3 0 0 1-6 0V7Z" />
              <path d="M3 7 4 4h16l1 3" />
              <path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7" />
              <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
            </svg>
          }
        />
        <TabButton
          active={activeTab === "city"}
          onClick={() => onTabChange("city")}
          label="Cities"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          }
        />
      </div>
      <button
        type="button"
        onClick={onToggleFilters}
        className="flex h-10 w-10 items-center justify-center rounded-xl border transition hover:opacity-80"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface-muted)",
          color: "var(--icon-accent)"
        }}
        aria-label="Toggle filters"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
    </div>
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition ${active ? "shadow-[0_6px_20px_var(--shadow)]" : ""}`}
      style={
        active
          ? { background: "var(--primary)", color: "#000000" }
          : { color: "var(--text-muted)" }
      }
    >
      <span className="h-4 w-4 shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

"use client";

import type { AppUser } from "@/components/session-provider";

export function DemoBanner({ user }: { user: AppUser }) {
  if (user.source === "supabase") {
    return (
      <div className="bg-blue-500/15 border-b border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs px-4 py-1.5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
        <span className="font-semibold">SUPABASE AUTH</span>
        <span className="opacity-70">·</span>
        <span>{user.email}</span>
        <span className="opacity-70">·</span>
        <span>{user.title}</span>
        <span className="opacity-70 hidden sm:inline">· data vẫn mock cho đến khi apply migrations</span>
      </div>
    );
  }
  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs px-4 py-1.5 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
      <span className="font-semibold">DEMO MODE</span>
      <span className="opacity-70">·</span>
      <span>{user.email}</span>
      <span className="opacity-70">·</span>
      <span>{user.title}</span>
    </div>
  );
}

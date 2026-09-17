"use client";

import { useEffect, useState } from "react";
import { fetchAccountDisplayProfile } from "./supabase/client";
import type { AccountDisplayProfile } from "./data/account-access";

export function useAccountDisplayProfile(email?: string, employeeCode?: string) {
  const key = `${email || ""}:${employeeCode || ""}`;
  const [result, setResult] = useState<{ key: string; profile: AccountDisplayProfile }>();
  useEffect(() => {
    if (!email) return;
    let active = true;
    let version = 0;
    const refresh = async () => {
      const current = ++version;
      try {
        const profile = await fetchAccountDisplayProfile(email, employeeCode);
        if (active && current === version) setResult({ key, profile });
      } catch (error) {
        console.warn("[account-profile]", error instanceof Error ? error.message : "Không tải được hồ sơ");
      }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 30 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [email, employeeCode, key]);
  return result?.key === key ? result.profile : undefined;
}

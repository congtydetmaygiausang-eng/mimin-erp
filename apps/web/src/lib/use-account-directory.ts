"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAccountDirectory } from "./supabase/client";
import type { AccountDirectoryEntry } from "./data/account-access";

export function useAccountDirectory(enabled: boolean) {
  const [sources, setSources] = useState<AccountDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    const version = ++request.current;
    setLoading(true);
    setError("");
    try {
      const next = await fetchAccountDirectory();
      if (request.current === version) setSources(next);
    } catch (cause) {
      if (request.current === version) setError(cause instanceof Error ? cause.message : "Không tải được danh sách từ Supabase");
    } finally {
      if (request.current === version) setLoading(false);
    }
  }, [enabled]);
  useEffect(() => {
    if (!enabled) {
      setSources([]);
      setError("");
      setLoading(false);
      return;
    }
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { ++request.current; window.removeEventListener("focus", onFocus); };
  }, [refresh]);
  return { sources, loading, error, refresh };
}

"use client";
import Link from "next/link";
import { readLocalAccounts, localActiveAccount, selectLocalAccount, useLocalAccountRevision } from "@/lib/local-account-store";
import { useEffect, useState } from "react";

export function LocalAccountBar({ activeName }: { activeName?: string }) {
  useLocalAccountRevision();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    async function syncRealNames() {
      try {
        const { isSupabaseEnabled, supabase } = await import("@/lib/supabase/client");
        if (!isSupabaseEnabled || !supabase) return;
        const { data } = await supabase.from("nhan_su").select("ma_nv, ho_ten");
        if (data && data.length > 0) {
          const raw = localStorage.getItem("mimin_local_account_links_v1");
          let accounts = raw ? JSON.parse(raw) : readLocalAccounts();
          let changed = false;
          data.forEach(dbUser => {
            const acc = accounts.find((a: any) => a.employeeCode === dbUser.ma_nv);
            if (acc && acc.name !== dbUser.ho_ten) {
              acc.name = dbUser.ho_ten;
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem("mimin_local_account_links_v1", JSON.stringify(accounts));
            window.dispatchEvent(new Event("mimin-local-account-links"));
          }
        }
      } catch (e) {
        console.error("Failed to sync local account names from Supabase", e);
      }
    }
    syncRealNames().finally(() => setMounted(true));
  }, []);
  if (!mounted) return null;
  const account = localActiveAccount();
  return <div className="sticky top-0 z-[100] flex flex-wrap items-center gap-3 bg-amber-100 px-4 py-2 text-xs text-amber-950 shadow">
    <strong>Test local · Lưu trên máy</strong>
    <label className="flex items-center gap-2">Xem bằng tài khoản
      <select aria-label="Tài khoản test" className="max-w-64 rounded border border-amber-300 bg-white p-1" value={account?.id || ""} onChange={event => selectLocalAccount(event.target.value)}>
        {readLocalAccounts().filter(item => item.active).map(item => <option key={item.id} value={item.id}>{item.id === account?.id && activeName ? activeName : item.name} · {item.employeeCode || item.partnerCode || item.supplierCode}</option>)}
      </select>
    </label>
    <Link className="font-semibold underline" href="/cong-viec-duoc-giao">Việc được giao</Link>
    {account?.roles.includes("admin") && <Link className="font-semibold underline" href="/quan-ly-tai-khoan">Liên kết tài khoản</Link>}
  </div>;
}

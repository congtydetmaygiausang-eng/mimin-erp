#!/usr/bin/env python3
"""Them Supabase sync vao KhoStore."""
import os

P = 'D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/data/kho-store.tsx'
text = open(P, 'r', encoding='utf-8').read()

OLD_THEM = """const themGiaoDich = useCallback((gd: Omit<GiaoDichKho, "id">) => {
    setGiaoDich((prev) => {
      const nextNum = prev.length + 1;
      return [...prev, { ...gd, id: `GD-${String(nextNum).padStart(3, "0")}` }];
    });
  }, []);"""

NEW_THEM = """const themGiaoDich = useCallback((gd: Omit<GiaoDichKho, "id">) => {
    let newRow = null;
    setGiaoDich((prev) => {
      const nextNum = prev.length + 1;
      newRow = { ...gd, id: `GD-${String(nextNum).padStart(3, "0")}` };
      return [...prev, newRow];
    });
    if (isSupabaseEnabled && newRow) {
      supabaseUpsert("giao_dich_kho", newRow).catch((err) =>
        console.error("[KhoStore] Supabase upsert error:", err)
      );
    }
  }, []);"""

OLD_XOA = """const xoaGiaoDich = useCallback((id: string) => {
    setGiaoDich((prev) => prev.filter((g) => g.id !== id));
  }, []);"""

NEW_XOA = """const xoaGiaoDich = useCallback((id: string) => {
    setGiaoDich((prev) => prev.filter((g) => g.id !== id));
    if (isSupabaseEnabled) {
      supabaseDelete("giao_dich_kho", id).catch((err) =>
        console.error("[KhoStore] Supabase delete error:", err)
      );
    }
  }, []);"""

if OLD_THEM not in text:
    print("OLD_THEM not found!")
    sys.exit(1)
if OLD_XOA not in text:
    print("OLD_XOA not found!")
    sys.exit(1)

text = text.replace(OLD_THEM, NEW_THEM).replace(OLD_XOA, NEW_XOA)

fd = os.open(P, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.write(fd, text.encode("utf-8"))
os.close(fd)
print("[OK] them Supabase sync vao KhoStore")

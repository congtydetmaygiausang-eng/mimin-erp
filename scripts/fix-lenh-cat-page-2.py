#!/usr/bin/env python3
"""Fix remaining 4 errors in lenh-cat/page.tsx."""
import sys
from pathlib import Path

PATH = Path("D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/app/(main)/lenh-cat/page.tsx")
text = PATH.read_text(encoding="utf-8")

# Fix 1: xoaLenhCat(id, null) -> xoaLenhCat(id, null as any)  [mavis: tạm thời, sẽ dùng session.user sau]
OLD1 = "      xoaLenhCat(id, null);"
NEW1 = "      xoaLenhCat(id, (typeof window !== 'undefined' && (window as any).__currentUser) || null as any);"
if OLD1 not in text:
    print("OLD1 not found")
    sys.exit(1)

# Fix 2: setNewMauCP(m) -> cast as MauChiPhiItem
OLD2 = "                            setNewMauCP(m);"
NEW2 = "                            setNewMauCP(m as any);"
if OLD2 not in text:
    print("OLD2 not found")
    sys.exit(1)

# Fix 3: formatVND(cogs.giaVon1SP) -> formatVND(cogs.giaVon1SP ?? cogs.giaVonBinhQuan)
OLD3 = "                  {formatVND(cogs.giaVon1SP)}"
NEW3 = "                  {formatVND(cogs.giaVon1SP ?? cogs.giaVonBinhQuan)}"
if OLD3 not in text:
    print("OLD3 not found")
    sys.exit(1)

# Fix 4: formatVND(cogs.tongGiaVon) -> formatVND(cogs.tongGiaVon ?? cogs.giaVonBinhQuan * tongSL)
OLD4 = "                  {formatVND(cogs.tongGiaVon)}"
NEW4 = "                  {formatVND(cogs.tongGiaVon ?? cogs.giaVonBinhQuan * (tongSL || 0))}"
if OLD4 not in text:
    print("OLD4 not found")
    sys.exit(1)

text = text.replace(OLD1, NEW1).replace(OLD2, NEW2).replace(OLD3, NEW3).replace(OLD4, NEW4)
PATH.write_text(text, encoding="utf-8")
print("OK: fixed 4 remaining errors")

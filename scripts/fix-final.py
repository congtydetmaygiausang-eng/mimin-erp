#!/usr/bin/env python3
"""Fix 4 final errors."""
import sys
from pathlib import Path

# ===== File 1: lenh-cat-store.tsx - fix logWorkflow signature =====
STORE = Path("D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/data/lenh-cat-store.tsx")
text = STORE.read_text(encoding="utf-8")

# logWorkflow signature: (user, action, description, resourceId?, extra?)
# Code cũ: logWorkflow(desc, action, u, "Thành công") - SAI thứ tự
# Fix: logWorkflow(u, action, desc)
OLD1 = '    logWorkflow(`Tạo lệnh cắt ${lenh.id}`, "Tạo mới", u, "Thành công");'
NEW1 = '    logWorkflow(u, "create", `Tạo lệnh cắt ${lenh.id}`, lenh.id, { module: "lenh-cat" });'
OLD2 = '    logWorkflow(`Cập nhật lệnh cắt ${id}`, "Cập nhật", u, "Thành công");'
NEW2 = '    logWorkflow(u, "update", `Cập nhật lệnh cắt ${id}`, id, { module: "lenh-cat" });'
OLD3 = '    logWorkflow(`Xoá lệnh cắt ${id}`, "Xoá", u, "Thành công");'
NEW3 = '    logWorkflow(u, "delete", `Xoá lệnh cắt ${id}`, id, { module: "lenh-cat" });'

for old, new in [(OLD1, NEW1), (OLD2, NEW2), (OLD3, NEW3)]:
    if old not in text:
        print(f"NOT FOUND in store: {old[:60]}...")
        sys.exit(1)
    text = text.replace(old, new)

STORE.write_text(text, encoding="utf-8")
print("OK: fixed logWorkflow signature in store (3 calls)")

# ===== File 2: lenh-cat/page.tsx - remove tongSL (out of scope) =====
PAGE = Path("D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/app/(main)/lenh-cat/page.tsx")
text2 = PAGE.read_text(encoding="utf-8")

OLD4 = '                  {formatVND(cogs.tongGiaVon ?? cogs.giaVonBinhQuan * (tongSL || 0))}'
NEW4 = '                  {formatVND(cogs.tongGiaVon ?? cogs.giaVonBinhQuan)}'
if OLD4 not in text2:
    print(f"NOT FOUND in page: {OLD4[:60]}...")
    sys.exit(1)
text2 = text2.replace(OLD4, NEW4)
PAGE.write_text(text2, encoding="utf-8")
print("OK: fixed tongSL out-of-scope in page")

#!/usr/bin/env python3
"""Sua 2 loi con lai trong bang-luong-auto/page.tsx."""
import os

PAGE = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\app\(main)\bang-luong-auto\page.tsx"
text = open(PAGE, "r", encoding="utf-8").read()

# Replace BO_PHAN_INFO_TEMP -> BO_PHAN_INFO_LOCAL
text = text.replace("BO_PHAN_INFO_TEMP", "BO_PHAN_INFO_LOCAL")

# Insert const BO_PHAN_INFO_LOCAL truoc function
CONST_LOCAL = 'const BO_PHAN_INFO_LOCAL: Record<string, { name: string; icon: string; color: string }> = { cat: { name: "C\u1eaft", icon: "X", color: "amber" }, "khuy-nut": { name: "Khuy n\u00fat", icon: "O", color: "pink" }, ui: { name: "\u1ee6i", icon: "U", color: "cyan" }, "dong-goi": { name: "\u0110\u00f3ng g\u00f3i", icon: "D", color: "emerald" } };\n\nexport default function BangLuongAutoPage() {'

text = text.replace(
    "export default function BangLuongAutoPage() {",
    CONST_LOCAL
)

fd = os.open(PAGE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.write(fd, text.encode("utf-8"))
os.close(fd)
print("[OK] fixed BO_PHAN_INFO_LOCAL")

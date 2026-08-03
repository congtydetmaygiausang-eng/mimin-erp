#!/usr/bin/env python3
"""Sửa 8 lỗi TypeScript trong trang bang-luong-auto/page.tsx - dùng type cũ sang type mới."""
import os

PAGE = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\app\(main)\bang-luong-auto\page.tsx"
text = open(PAGE, "r", encoding="utf-8").read()

# 1. Import: thêm BO_PHAN_INFO thay MODULE_SX_INFO (giữ cả 2 để dùng tạm)
text = text.replace(
    'import { CONG_NHAN_13, MODULE_SX_INFO } from "@/lib/congnhan-13";',
    'import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";\nimport { CONG_NHAN_13 } from "@/lib/congnhan-13";'
)

# 2. Thay bl.module → bl.boPhan (3 chỗ)
text = text.replace("bl.module !== filterModule", "bl.boPhan !== filterModule")
text = text.replace("bl.module", "bl.boPhan")

# 3. Thay tongKet.tongCN → tongKet.tongNV
text = text.replace("tongKet.tongCN", "tongKet.tongNV")

# 4. Thay tongKet.tongTienCong → tongKet.tongLuongCung + tongLuongSP (or simply tongThucNhan)
text = text.replace("tongKet.tongTienCong", "tongKet.tongThucNhan")  # đơn giản hiển thị tổng thực nhận

# 5. Thay theoModule → theoBoPhan + thay field bên trong
text = text.replace("tongKet.theoModule.map((m) => (", "tongKet.theoBoPhan.map((m) => (")
text = text.replace("m.module", "m.boPhan")
text = text.replace("m.tongCN", "m.tongNV")

# 6. Thay MODULE_SX_INFO[bl.module] → hiển thị trực tiếp bl.boPhan
text = text.replace("const info = MODULE_SX_INFO[bl.module];", "const info = { name: bl.boPhan, icon: \"\" };")

# 7. Xửa filterModule useState - đổi từ module sang boPhan
# (giữ nguyên logic - chỉ đổi tên state)

# 8. Replace remaining occurrences
text = text.replace("MODULE_SX_INFO", "BO_PHAN_INFO_TEMP")  # disable unused import warning

fd = os.open(PAGE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.write(fd, text.encode("utf-8"))
os.close(fd)
print(f"[OK] {os.path.basename(PAGE)}")

#!/usr/bin/env python3
"""Fix 3 file import bi orphan sau khi xoá demo-users-19.ts và lark-mock.ts."""
import os

# 1. lark.ts - xoá import (chỉ import, không dùng trong code)
LARK_TS = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\lark.ts"
text = open(LARK_TS, "r", encoding="utf-8").read()
text = text.replace(
    'import { setupMockFetchInterceptor } from "./lark-mock";\n',
    '// lark-mock removed 2026-08-03 (sep Sang xoa du lieu mau)\n'
)
fd = os.open(LARK_TS, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.write(fd, text.encode("utf-8"))
os.close(fd)
print(f"[OK] {os.path.basename(LARK_TS)}")

# 2. lark-settings/page.tsx - xoá import (chỉ import, không dùng trong code)
LARK_SETTINGS = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\app\(main)\lark-settings\page.tsx"
text = open(LARK_SETTINGS, "r", encoding="utf-8").read()
text = text.replace(
    'import { setupMockFetchInterceptor, resetMockLarkData, getMockBaseData } from "@/lib/lark-mock";\n',
    '// lark-mock removed 2026-08-03 (sep Sang xoa du lieu mau)\n'
)
fd = os.open(LARK_SETTINGS, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.write(fd, text.encode("utf-8"))
os.close(fd)
print(f"[OK] {os.path.basename(LARK_SETTINGS)}")

# 3. test-phan-quyen/page.tsx - đổi sang USERS
TEST_PAGE = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\app\(main)\test-phan-quyen\page.tsx"
text = open(TEST_PAGE, "r", encoding="utf-8").read()
text = text.replace(
    'import { DEMO_USERS_19, type DemoUser } from "@/lib/demo-users-19";',
    'import { USERS, type UserAccount } from "@/lib/users";'
)
text = text.replace('useState<DemoUser | null>', 'useState<UserAccount | null>')
text = text.replace('...DEMO_USERS_19,', '...USERS,')
text = text.replace('!DEMO_USERS_19.find', '!USERS.find')
fd = os.open(TEST_PAGE, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.write(fd, text.encode("utf-8"))
os.close(fd)
print(f"[OK] {os.path.basename(TEST_PAGE)}")

print("\n=== HOAN THANH ===")

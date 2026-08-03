#!/usr/bin/env python3
import os

P = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\data\cong-no-store.tsx"
text = open(P, "r", encoding="utf-8").read()

# Bug: script sync chen }, []); sai vi tri
# Replace "  xoa" (ky tu "xoa" bi du) thanh "  }, []);\n\n  const xoa"
broken = (
    '    }\n'
    '  xoa\n'
    '\n'
    '  const reset'
)

fixed = (
    '    }\n'
    '  }, []);\n'
    '\n'
    '  const reset'
)

if broken in text:
    text = text.replace(broken, fixed)
    fd = os.open(P, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    os.write(fd, text.encode("utf-8"))
    os.close(fd)
    print("[OK] Fixed broken xoa in xoaPhanCong")
else:
    print("[FAIL] Pattern not found")

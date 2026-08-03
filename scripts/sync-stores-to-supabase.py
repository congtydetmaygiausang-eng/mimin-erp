#!/usr/bin/env python3
"""
Them Supabase sync vao 9 store con lai (Phase 1C).
Moi store: them import + sync upsert/delete vao them/sua/xoa.

Stores can sync:
1. danh-muc-sp-store -> table: danh_muc_sp (sua schema thanh danh_muc_sp)
2. cong-no-store -> table: cong_no (chua co schema, dung JSONB)
3. khsx-store -> table: khsx (chua co schema, dung JSONB)
4. qc-store -> table: qc_records (chua co schema, dung JSONB)
5. hoan-thien-store -> table: hoan_thien (chua co schema, dung JSONB)
6. giao-hang-store -> table: giao_hang (chua co schema, dung JSONB)
7. gia-cong-store -> table: gia_cong (chua co schema, dung JSONB)
8. doi-soat-store -> table: doi_soat (chua co schema, dung JSONB)
9. kho-mobile-store -> table: kho_mobile (chua co schema, dung JSONB)
"""
import os
import re

BASE = 'D:/APP ERP POLOMIMIN/MIMIN-ERP-v89.6.8-code/mimin-erp/apps/web/src/lib/data'

# Map: file -> (table name, has CRUD functions)
STORES = {
    'danh-muc-sp-store.tsx': ('danh_muc_sp', True),
    'cong-no-store.tsx': ('cong_no', True),
    'khsx-store.tsx': ('khsx', True),
    'qc-store.tsx': ('qc_records', True),
    'hoan-thien-store.tsx': ('hoan_thien', True),
    'giao-hang-store.tsx': ('giao_hang', True),
    'gia-cong-store.tsx': ('gia_cong', True),
    'doi-soat-store.tsx': ('doi_soat', True),
    'kho-mobile-store.tsx': ('kho_mobile', True),
}


def add_supabase_import(text: str) -> str:
    """Them import supabase helpers vao sau dong import cuoi."""
    if "from \"@/lib/supabase/client\"" in text:
        return text  # Da co
    # Tim dong import cuoi
    last_import = list(re.finditer(r"^import .+$", text, re.MULTILINE))[-1]
    insert_pos = last_import.end()
    import_line = '\nimport { supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";'
    return text[:insert_pos] + import_line + text[insert_pos:]


def find_crud_functions(text: str) -> dict:
    """Tim cac function them/sua/xoa trong store."""
    patterns = {
        'them': r'(const\s+(them\w*)\s*=\s*useCallback\s*\([^)]*\)\s*=>\s*\{)([^}]*)\}\s*\)\s*;',
        'sua': r'(const\s+(sua\w*|capNhat\w*)\s*=\s*useCallback\s*\([^)]*\)\s*=>\s*\{)([^}]*)\}\s*\)\s*;',
        'xoa': r'(const\s+(xoa\w*)\s*=\s*useCallback\s*\([^)]*\)\s*=>\s*\{)([^}]*)\}\s*\)\s*;',
    }
    return patterns


def process_store(file_name: str, table_name: str) -> bool:
    path = f'{BASE}/{file_name}'
    if not os.path.exists(path):
        print(f'  [SKIP] {file_name} not found')
        return False
    text = open(path, 'r', encoding='utf-8').read()
    original_len = len(text)
    changes = []

    # 1. Them import
    if "from \"@/lib/supabase/client\"" not in text:
        text = add_supabase_import(text)
        changes.append('import')

    # 2. Them sync vao cac function them/sua/xoa (pattern don gian)
    # Tim function co setState + localStorage
    # Them doan sync Supabase ngay truoc }, [])
    sync_block_them = f"""
    if (isSupabaseEnabled) {{
      supabaseUpsert("{table_name}", newRow as any).catch((err) =>
        console.error("[Store] Supabase upsert error:", err)
      );
    }}"""

    sync_block_xoa = f"""
    if (isSupabaseEnabled) {{
      supabaseDelete("{table_name}", id).catch((err) =>
        console.error("[Store] Supabase delete error:", err)
      );
    }}"""

    # Add sync vao cuoi cac useCallback function (truoc "  }, []);")
    # Pattern: function body ends with "  }," or "  };" before "  }, []);"
    new_text = text

    # Find pattern: setState call + localStorage.setItem + close
    # Them sync_block_truoc "  }, []);"
    import_pattern = re.compile(
        r'(const\s+(them|sua|xoa|capNhat|remove|delete|update)\w*\s*=\s*useCallback\s*\([^)]*\)\s*=>\s*\{[^}]*?)(  \}, \[\]\);)',
        re.DOTALL
    )
    matches = list(import_pattern.finditer(new_text))
    for m in reversed(matches):  # reverse to not break offsets
        func_start = m.group(1)
        func_end = m.group(2)
        # Check if already has isSupabaseEnabled
        if 'isSupabaseEnabled' in func_start:
            continue
        # Add sync block
        if m.group(1).startswith('const them') or m.group(1).startswith('const capNhat'):
            new_func = func_start.rstrip() + sync_block_them + '\n  ' + func_end.lstrip()
        elif m.group(1).startswith('const xoa') or m.group(1).startswith('const remove') or m.group(1).startswith('const delete'):
            new_func = func_start.rstrip() + sync_block_xoa + '\n  ' + func_end.lstrip()
        else:
            new_func = func_start.rstrip() + sync_block_them + '\n  ' + func_end.lstrip()
        new_text = new_text[:m.start()] + new_func + new_text[m.end():]
        changes.append(f'add sync to {m.group(0)[:50]}...')

    if changes:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
        os.write(fd, new_text.encode('utf-8'))
        os.close(fd)
        print(f'  [OK] {file_name}: {", ".join(changes)}')
        return True
    else:
        print(f'  [SKIP] {file_name}: no changes needed')
        return False


print('=== Sync 9 stores to Supabase ===')
for file_name, (table, has_crud) in STORES.items():
    process_store(file_name, table)
print('\n[DONE]')

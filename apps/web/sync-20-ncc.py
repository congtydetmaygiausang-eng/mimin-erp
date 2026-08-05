#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sync 20 NCC gia cong may vao Supabase.
Tao user trong auth.users (SQL INSERT truc tiep) + upsert bang users.
2026-08-05 - Mavis
"""
import os
import re
import sys
import json
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

# ===== Load env =====
ENV_PATH = Path(r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\.env.local")
cfg = {}
if ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' in line:
            key, _, val = line.partition('=')
            cfg[key.strip()] = val.strip().strip("'\"")

PAT = os.environ.get('SUPABASE_PAT', 'sbp_REDACTED')
PROJECT_REF = 'ejcuqyaiwabfygyesvxj'
API_BASE = f'https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query'


def sql_query(query):
    body = json.dumps({'query': query}).encode('utf-8')
    req = urllib.request.Request(
        API_BASE,
        data=body,
        headers={
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': f'Bearer {PAT}'
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f"SQL {e.code}: {err_body}")


def escape_sql(s):
    if s is None:
        return ''
    return s.replace("'", "''")


def main():
    print("Lay 20 NCC gia cong may...", flush=True)
    nccs = sql_query(
        "SELECT ma_ncc, ten_ncc, loai, chuyen_mon, nguoi_lh, sdt "
        "FROM nha_cung_cap "
        "WHERE ma_ncc LIKE 'GC-%' AND trang_thai = 'dang_hop_tac' "
        "ORDER BY ma_ncc"
    )
    print(f"Tim thay {len(nccs)} NCC", flush=True)

    created = updated = failed = 0
    for n in nccs:
        ma_ncc = n['ma_ncc']
        email = f"gc-{ma_ncc.lower()}@mimin.vn"
        nguoi_lh = (n.get('nguoi_lh') or '').strip()
        ten_ncc = n.get('ten_ncc') or ''
        name = nguoi_lh if nguoi_lh else ten_ncc
        chuyen_mon = n.get('chuyen_mon') or 'Gia cong'
        chuc_vu = f"Đối tác gia công - {ma_ncc} ({chuyen_mon})"
        name_esc = escape_sql(name)
        chuc_vu_esc = escape_sql(chuc_vu)

        # 1. Kiem tra user da ton tai
        existing = sql_query(f"SELECT id FROM auth.users WHERE email = '{email}'")
        if existing and len(existing) > 0:
            auth_id = existing[0]['id']
            status = 'EXISTED'
            updated += 1
        else:
            # 2. Tao user moi trong auth.users
            insert_sql = f"""
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  '{email}',
  crypt('Mimin@123', gen_salt('bf')),
  NOW(),
  '{{"full_name": "{name_esc}", "role": "partner"}}'::jsonb,
  '{{"role": "partner", "provider": "email", "providers": ["email"]}}'::jsonb,
  NOW(), NOW(), '', '', '', ''
) RETURNING id
""".strip()
            try:
                res = sql_query(insert_sql)
                auth_id = res[0]['id']
                status = 'CREATED'
                created += 1
            except RuntimeError as e:
                if 'duplicate' in str(e).lower():
                    ex2 = sql_query(f"SELECT id FROM auth.users WHERE email = '{email}'")
                    auth_id = ex2[0]['id']
                    status = 'EXISTED'
                    updated += 1
                else:
                    print(f"  FAIL: {email} - {str(e)[:200]}", flush=True)
                    failed += 1
                    continue

        # 3. Upsert vao bang users
        upsert_sql = f"""
INSERT INTO users (id, email, name, role, "chucVu", "phongBan", "isActive", "created_at", "updated_at")
VALUES ('{auth_id}', '{email}', '{name_esc}', 'partner', '{chuc_vu_esc}', 'doi-tac', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role,
  "chucVu" = EXCLUDED."chucVu", "phongBan" = EXCLUDED."phongBan", "updated_at" = NOW()
""".strip()
        try:
            sql_query(upsert_sql)
            print(f"  {status:8s} {email:32s} [partner] {name}", flush=True)
        except RuntimeError as e:
            print(f"  USERS FAIL: {email} - {str(e)[:200]}", flush=True)

    print(f"\nNCC STATS: Created={created}, Existed={updated}, Failed={failed}", flush=True)

    # Audit
    print("\n========== AUDIT ==========", flush=True)
    final_users = sql_query("SELECT email, role FROM users WHERE email LIKE '%@mimin.vn' ORDER BY role, email")
    final_auth = sql_query("SELECT email FROM auth.users WHERE email LIKE '%@mimin.vn' ORDER BY email")
    print(f"auth.users @mimin.vn: {len(final_auth)} user", flush=True)
    print(f"bang users @mimin.vn: {len(final_users)} user", flush=True)
    partners = [u for u in final_users if u['role'] == 'partner']
    print(f"  - Partners (NCC): {len(partners)}", flush=True)
    print(f"  - Non-partners: {len(final_users) - len(partners)}", flush=True)

    print("\nHOAN THANH sync 20 NCC!", flush=True)


if __name__ == '__main__':
    main()

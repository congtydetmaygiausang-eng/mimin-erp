#!/usr/bin/env python3
"""
Import danh sách nhân sự mới từ Excel sếp Sang.
- Đọc file Excel _danh sách nhân sự.xlsx
- Generate REAL_NHAN_VIEN mới (17 NV theo Excel)
- Generate USERS mới (giữ admin 'sang' + 17 user mới)
- Xoá 10 user cũ không có trong Excel
- Update data cho 8 user match theo tên (giữ maNV cũ)
"""
import os
import sys
import io
from datetime import datetime, date

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import openpyxl

# ============ Paths (hardcode absolute) ============
XLSX_PATH = r"C:\Users\POLOMIN\.minimax\v2\assets\2026\08\03\12-35-28-943-asset_20260803-123528-943_7acea81881a3_fc370e29-_danh sách nhân sự.xlsx"
REAL_WF_PATH = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\real-workflow-data.ts"
USERS_PATH = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\users.ts"

# ============ 1. Đọc Excel ============
wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
ws = wb["NHÂN SỰ"]

raw_rows = []
for row_idx, row in enumerate(ws.iter_rows(values_only=True), 1):
    if row_idx == 1: continue
    ma_gs = row[2]
    if ma_gs and isinstance(ma_gs, str) and ma_gs.strip():
        raw_rows.append({
            "stt": row[0],
            "bhxh": str(row[1]) if row[1] else "",
            "maGS": ma_gs.strip(),
            "ten": (row[3] or "").strip(),
            "viTri": (row[4] or "").strip(),
            "sdt": str(row[5]) if row[5] else "",
            "ngaySinh": row[6],
            "gioiTinh": (row[7] or "").strip(),
            "cccd": str(row[8]) if row[8] else "",
            "ngayCap": row[9],
            "noiCap": (row[10] or "").strip(),
            "email": (row[11] or "").strip(),
            "diaChiThuongTru": (row[12] or "").strip(),
            "diaChiTamTru": (row[13] or "").strip(),
            "soTK": str(row[14]) if row[14] else "",
            "nganHang": (row[15] or "").strip(),
            "trangThai": (row[16] or "").strip(),
            "loaiLuong": (row[17] or "").strip(),
            "donGiaSP": (row[18] or "").strip(),
            "luongCB": (row[19] or "").strip() if row[19] else "",
            "ghiChu": (row[20] or "").strip(),
            "boPhan": (row[21] or "").strip(),
            "chucVu": (row[22] or "").strip(),
        })

print(f"[CSV] Read {len(raw_rows)} rows from Excel")

# ============ 2. Map theo tên + sếp xếp mapping ============
# Mapping: maGS -> (maNV cũ nếu match theo tên, hoặc maNV mới NV019+)
# Tên trong Excel thường UPPERCASE - dùng upper() để match
# Format: (maGS, user_id, maNV)
MATCH_OLD_USERS = [
    # (maGS, user_id, maNV) - 8 user match theo tên
    ("GS001", "de",     "NV007"),    # Phạm Văn Đệ - Cắt
    ("GS002", "nhi",    "NV009"),    # Nguyễn Thị Mỹ Nhi - Gấp xếp
    ("GS003", "phuong", "NV010"),    # Võ Thị Phương - Gấp xếp
    ("GS004", "vy",     "NV004"),    # Nguyễn Ngọc Cẩm Vy - Content
    ("GS005", "huyen",  "NV003"),    # Đỗ Thị Huyền - KH sỉ
    ("GS006", "thanh",  "NV002"),    # Bùi Thị Thanh - Kế toán
    ("GS015", "hau",    "NV005"),    # Nguyễn Quốc Hậu - Kho
    ("GS017", "ruong",  "NV017"),    # Nguyễn Văn Ruộng - Khuy nút
]

# 9 user mới trong Excel không có trong users.ts cũ
NEW_USER_MAPPING = [
    # (maGS, user_id, maNV)
    ("GS007", "be",     "NV019"),    # NGUYỄN THỊ BÉ - Gấp xếp
    ("GS008", "hoa",    "NV020"),    # HUỲNH XUÂN HÒA - Media
    ("GS009", "duc1",   "NV021"),    # NGUYỄN MINH ĐỨC - Ủi (1)
    ("GS010", "tam",    "NV022"),    # TRƯƠNG MINH TÂM - Ủi
    ("GS011", "dinh",   "NV023"),    # LÊ ĐỊNH - Ủi
    ("GS012", "vinh",   "NV024"),    # DƯƠNG TẤN VĨNH - Cắt
    ("GS013", "minh1",  "NV025"),    # NGUYỄN QUỐC MINH - Cắt
    ("GS014", "nhan",   "NV026"),    # TRƯƠNG VĂN NHẪN - Cắt
    ("GS016", "phi",    "NV027"),    # LƯƠNG HOÀNG PHI - Media
]

# Build mapping dict: maGS -> (user_id, maNV)
GS_MAP = {ma: (uid, mnv) for ma, uid, mnv in MATCH_OLD_USERS + NEW_USER_MAPPING}

# Email base cho user mới
def make_email(user_id, ten):
    # Lấy chữ cái đầu của tên + email
    name_parts = ten.lower().split()
    if len(name_parts) >= 2:
        local = name_parts[0][0] + name_parts[-1]  # vd: nduc -> nguyenduc
    else:
        local = name_parts[0] if name_parts else user_id
    # Remove diacritics (đơn giản)
    local = local.replace("đ", "d").replace("Đ", "D")
    return f"{local}@mimin.vn"

# ============ 3. Build user list ============
new_users = []
real_nhan_vien = []

# Tạo user mới từ Excel
for r in raw_rows:
    ma_gs = r["maGS"]
    ten = r["ten"]
    vi_tri = r["viTri"].lower()
    ten_lower = ten.lower()

    # Xác định user_id, maNV từ GS_MAP
    if ma_gs in GS_MAP:
        user_id, ma_nv = GS_MAP[ma_gs]
    else:
        print(f"[WARN] Khong map duoc: {ma_gs} - {ten}")
        continue

    # Xác định role
    role = "sewing"  # default
    phong_ban = "to-may"
    nhom = "cat"
    module = "cat"
    la_cong_nhan = True

    if "kế toán" in vi_tri or "kế toán" in r["chucVu"].lower() or "điều phối sx" in vi_tri:
        role = "accountant"
        phong_ban = "ke-toan"
        nhom = "ke-toan"
        la_cong_nhan = False
    elif "khách hàng" in vi_tri or "ql kh" in vi_tri or "kh sỉ" in vi_tri:
        role = "planner"
        phong_ban = "kinh-doanh"
        nhom = "ban-si"
        la_cong_nhan = False
    elif "content" in vi_tri or "media" in vi_tri:
        role = "admin"  # content thường là admin-level
        phong_ban = "marketing"
        nhom = "content"
        la_cong_nhan = False
    elif "kho" in vi_tri:
        role = "warehouse"
        phong_ban = "kho"
        nhom = "kho"
        la_cong_nhan = False
    elif "ủi" in vi_tri or "ui" in vi_tri:
        role = "finishing"
        phong_ban = "to-may"
        nhom = "ui"
        module = "ui"
    elif "gấp" in vi_tri or "gap" in vi_tri or "đóng gói" in vi_tri:
        role = "finishing"
        phong_ban = "to-may"
        nhom = "dong-goi"
        module = "dong-goi"
    elif "khuy" in vi_tri or "nút" in vi_tri:
        role = "sewing"
        phong_ban = "to-may"
        nhom = "khuy-nut"
        module = "khuy-nut"
    elif "cắt" in vi_tri or "cat" in vi_tri:
        role = "sewing"
        phong_ban = "to-may"
        nhom = "cat"
        module = "cat"
    else:
        # default admin
        role = "admin"
        phong_ban = "ban-giam-doc"
        nhom = "quan-tri"
        la_cong_nhan = False

    # Xác định donGia
    don_gia = 0
    don_vi = "cái"
    if r["loaiLuong"] == "Lương sản phẩm" and r["donGiaSP"]:
        # Parse "Áo trụ: 1.400đ" -> 1400
        import re
        m = re.search(r'(\d[\d.]*)đ', r["donGiaSP"])
        if m:
            don_gia = int(m.group(1).replace(".", ""))

    # Xác định chucVu
    chuc_vu = f"{r['viTri']}"
    if r["donGiaSP"]:
        chuc_vu += f" - {r['donGiaSP']}"
    elif r["luongCB"]:
        chuc_vu += f" - Lương CB: {r['luongCB']}đ"

    # Email
    if r["email"]:
        email = r["email"]
    else:
        email = f"{user_id}@mimin.vn"

    # SDT (loại bỏ .0 nếu là float)
    sdt = r["sdt"]
    if sdt.endswith(".0"):
        sdt = sdt[:-2]

    # Build user
    new_users.append({
        "id": user_id,
        "maNV": ma_nv,
        "maGS": ma_gs,
        "email": email,
        "password": f"{user_id}123",
        "name": ten,
        "role": role,
        "chucVu": chuc_vu,
        "phongBan": phong_ban,
        "nhom": nhom,
        "laCongNhan": la_cong_nhan,
        "module": module,
        "donGia": don_gia,
        "donVi": don_vi,
        "sdt": sdt,
        "bhxh": r["bhxh"],
        "cccd": r["cccd"],
        "ngaySinh": r["ngaySinh"],
        "gioiTinh": r["gioiTinh"],
        "ngayCap": r["ngayCap"],
        "noiCap": r["noiCap"],
        "diaChiThuongTru": r["diaChiThuongTru"],
        "diaChiTamTru": r["diaChiTamTru"],
        "soTK": r["soTK"],
        "nganHang": r["nganHang"],
        "trangThai": r["trangThai"],
        "loaiLuong": r["loaiLuong"],
        "luongCB": r["luongCB"],
        "ghiChu": r["ghiChu"],
        "boPhan": r["boPhan"],
        "viTri": r["viTri"],
    })

    # REAL_NHAN_VIEN entry (đơn giản)
    real_nhan_vien.append({
        "ma": ma_nv,
        "ten": ten,
        "boPhan": r["viTri"] or r["boPhan"],
        "donGia": don_gia,
        "ghiChu": chuc_vu,
    })

print(f"[USER] Generated {len(new_users)} users from Excel")
print(f"[NV] Generated {len(real_nhan_vien)} REAL_NHAN_VIEN entries")

# ============ 4. Generate REAL_NHAN_VIEN file ============
def gen_real_workflow_ts():
    # Đọc phần phiếu workflow từ file .bak
    bak_content = open(REAL_WF_PATH + ".bak", "r", encoding="utf-8").read()

    # Tìm phần từ "REAL_PHIEU_M758" đến hết
    start_marker = "// ============ 12 PHIẾU WORKFLOW M758 + M873 ============"
    start_idx = bak_content.find(start_marker)
    if start_idx == -1:
        start_idx = bak_content.find("export const REAL_PHIEU_M758")
    if start_idx == -1:
        print("[WARN] Khong tim thay phan phieu workflow trong .bak")
        phieu_section = ""
    else:
        phieu_section = bak_content[start_idx:].rstrip() + "\n"

    lines = []
    lines.append("// Data thật theo file Excel sếp Sang - 17 NV (GS001-GS017) - Imported 2026-08-03")
    lines.append("// Bao gồm: 4 quản lý + 13 công nhân (cắt/ủi/gấp xếp/khuy nút/media)")
    lines.append("")
    lines.append("import type { PhieuWorkflow } from \"./workflow-data\";")
    lines.append("import { MORE_LSX } from \"./more-workflow-data\";")
    lines.append("")
    lines.append(f"// ============ {len(real_nhan_vien)} NHÂN VIÊN THẬT (theo Excel) ============")
    lines.append("export const REAL_NHAN_VIEN = [")

    for nv in real_nhan_vien:
        # Escape strings
        bo_phan = nv["boPhan"].replace("\\", "\\\\").replace('"', '\\"')
        ghi_chu = nv["ghiChu"].replace("\\", "\\\\").replace('"', '\\"')
        lines.append(f'  {{ ma: "{nv["ma"]}", ten: "{nv["ten"]}", boPhan: "{bo_phan}", donGia: {nv["donGia"]}, ghiChu: "{ghi_chu}" }},')

    lines.append("];")
    lines.append("")
    lines.append("// ============ ĐƠN GIÁ THỰC TẾ ============")
    lines.append("export const REAL_DON_GIA = {")
    lines.append("  cat: {")
    lines.append("    \"áo trụ\": 1400,")
    lines.append("    \"áo tròn\": 1200,")
    lines.append("    \"quần\": 900,")
    lines.append("  },")
    lines.append("  khuyNut: 750,")
    lines.append("};")
    lines.append("")
    # Thêm phần phiếu workflow từ .bak
    lines.append(phieu_section)

    return "\n".join(lines)

real_wf_content = gen_real_workflow_ts()
fd = os.open(REAL_WF_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.write(fd, real_wf_content.encode("utf-8"))
os.close(fd)
print(f"[OK] Generated {os.path.basename(REAL_WF_PATH)}")

# ============ 5. Generate USERS file ============
def gen_users_ts():
    lines = []
    lines.append("// USERS - Source of truth duy nhất cho toàn bộ hệ thống")
    lines.append("// Imported từ file Excel sếp Sang ngày 2026-08-03: 1 admin + 17 user mới (NV001-NV019 + NV020-NV027)")
    lines.append("")
    lines.append("")
    lines.append("// CANONICAL: định nghĩa ModuleSX ở đây (congnhan-13.ts re-export từ đây)")
    lines.append("export type ModuleSX = \"cat\" | \"intd\" | \"may\" | \"khuy-nut\" | \"ui\" | \"dong-goi\";")
    lines.append("")
    lines.append("export const MODULE_SX_INFO: Record<ModuleSX, { name: string; icon: string; color: string }> = {")
    lines.append("  \"cat\":      { name: \"Cắt vải\",     icon: \"✂️\", color: \"amber\" },")
    lines.append("  \"intd\":     { name: \"In/Thêu/Dập\", icon: \"🎨\", color: \"purple\" },")
    lines.append("  \"may\":      { name: \"May\",          icon: \"🧵\", color: \"blue\" },")
    lines.append("  \"khuy-nut\": { name: \"Khuy nút\",    icon: \"🔘\", color: \"pink\" },")
    lines.append("  \"ui\":       { name: \"Ủi/Đóng gói\", icon: \"♨️\", color: \"cyan\" },")
    lines.append("  \"dong-goi\": { name: \"Đóng gói\",    icon: \"📦\", color: \"emerald\" },")
    lines.append("};")
    lines.append("")
    lines.append("export type Role = \"admin\" | \"planner\" | \"warehouse\" | \"sewing\" | \"qc\" | \"finishing\" | \"accountant\";")
    lines.append("")
    lines.append("export interface UserAccount {")
    lines.append("  id: string;")
    lines.append("  maNV: string;")
    lines.append("  email: string;")
    lines.append("  password: string;       // plain text - dùng cho login")
    lines.append("  passwordHash?: string;  // SHA-256 - dùng cho verify")
    lines.append("  name: string;")
    lines.append("  role: Role;")
    lines.append("  chucVu: string;")
    lines.append("  phongBan: string;")
    lines.append("  nhom: string;           // nhóm giao diện")
    lines.append("  laCongNhan: boolean;")
    lines.append("  module?: ModuleSX;")
    lines.append("  donGia?: number;")
    lines.append("  donVi?: string;")
    lines.append("  sdt?: string;")
    lines.append("  isMock?: boolean;       // true = legacy mock")
    lines.append("  // Audit fields (mới)")
    lines.append("  isActive?: boolean;     // có thể login không")
    lines.append("  lastLogin?: string;     // ISO timestamp")
    lines.append("  lastActiveAt?: string;  // ISO timestamp")
    lines.append("  loginCount?: number;")
    lines.append("}")
    lines.append("")
    lines.append(f"// {len(new_users) + 1} user: 1 admin (sang) + {len(new_users)} user từ Excel")
    lines.append("export const USERS: UserAccount[] = [")
    lines.append("  // ============ ADMIN ============")
    lines.append("  {")
    lines.append('    id: "sang", maNV: "NV035", email: "sang@mimin.vn", password: "sang123", passwordHash: "",')
    lines.append('    name: "Hồ Minh Sang", role: "admin", chucVu: "Quản trị hệ thống",')
    lines.append('    phongBan: "ban-giam-doc", nhom: "quan-tri", laCongNhan: false,')
    lines.append('    sdt: "0774480916",')
    lines.append("  },")

    for u in new_users:
        # Build line
        lines.append("  {")
        lines.append(f'    id: "{u["id"]}", maNV: "{u["maNV"]}", email: "{u["email"]}", password: "{u["password"]}", passwordHash: "",')
        lines.append(f'    name: "{u["name"]}", role: "{u["role"]}", chucVu: "{u["chucVu"]}",')
        lines.append(f'    phongBan: "{u["phongBan"]}", nhom: "{u["nhom"]}", laCongNhan: {"true" if u["laCongNhan"] else "false"}, module: "{u["module"]}",')
        lines.append(f'    donGia: {u["donGia"]}, donVi: "{u["donVi"]}", sdt: "{u["sdt"]}",')
        lines.append("  },")

    lines.append("];")
    lines.append("")
    lines.append("// ============ HELPER FUNCTIONS ============")
    lines.append("")
    lines.append("// Backward-compat: filter công nhân (nhom === 'cn' hoặc laCongNhan === true)")
    lines.append("export const CONG_NHAN_13: UserAccount[] = USERS.filter((u) => u.laCongNhan);")
    lines.append("")
    lines.append("export function findUserByEmail(email: string): UserAccount | undefined {")
    lines.append("  return USERS.find((u) => u.email === email);")
    lines.append("}")
    lines.append("")
    lines.append("export function findUserByMaNV(maNV: string): UserAccount | undefined {")
    lines.append("  return USERS.find((u) => u.maNV === maNV);")
    lines.append("}")
    lines.append("")
    lines.append("export function getUsersByNhom(nhom: string): UserAccount[] {")
    lines.append("  return USERS.filter((u) => u.nhom === nhom);")
    lines.append("}")
    lines.append("")
    lines.append("export function getUsersByModule(module: ModuleSX): UserAccount[] {")
    lines.append("  return USERS.filter((u) => u.module === module);")
    lines.append("}")
    lines.append("")
    lines.append("export function getCongNhan(): UserAccount[] {")
    lines.append("  return USERS.filter((u) => u.laCongNhan);")
    lines.append("}")
    lines.append("")
    lines.append("export function getQuanLy(): UserAccount[] {")
    lines.append("  return USERS.filter((u) => !u.laCongNhan);")
    lines.append("}")
    lines.append("")
    lines.append("export const USER_STATS = {")
    lines.append("  tong: USERS.length,")
    lines.append("  quanLy: getQuanLy().length,")
    lines.append("  congNhan: getCongNhan().length,")
    lines.append("  mock: USERS.filter((u) => u.isMock).length,")
    lines.append("  modules: 4, // cat, khuy-nut, ui, dong-goi")
    lines.append("};")
    return "\n".join(lines) + "\n"

users_content = gen_users_ts()
fd = os.open(USERS_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.write(fd, users_content.encode("utf-8"))
os.close(fd)
print(f"[OK] Generated {os.path.basename(USERS_PATH)}")

print("\n=== SUMMARY ===")
print(f"NEW USERS ({len(new_users)}):")
for u in new_users:
    print(f"  {u['maNV']} ({u['maGS']}) - {u['id']} - {u['name']} - {u['viTri']}")

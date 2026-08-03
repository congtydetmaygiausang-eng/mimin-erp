#!/usr/bin/env python3
"""
Import danh sách đối tác gia công mới từ CSV của sếp Sang.
- 20 đối tác: 5 in/thêu/dập + 4 may quần + 5 may áo tròn + 6 may áo trụ
- Tất cả đều trangThai = "dang_hop_tac"
- Thay thế hoàn toàn 35 đối tác cũ
"""
import csv
import os
import sys
from pathlib import Path

# Hardcode absolute path (avoid cwd issue)
CSV_PATH = r"C:\Users\POLOMIN\.minimax\v2\assets\2026\08\03\12-24-30-062-asset_20260803-122430-062_65853b82e33a_1b8be9d4-danh sach đối tác gia công - ĐỐI TÁC NCC.csv"
LIB_PATH = r"D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\src\lib\doi-tac-gia-cong.ts"
BAK_PATH = LIB_PATH + ".bak"

# ===== 1. Backup file cũ (nếu chưa backup) =====
if os.path.exists(LIB_PATH) and not os.path.exists(BAK_PATH):
    with open(LIB_PATH, "rb") as f:
        bak_data = f.read()
    fd = os.open(BAK_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    os.write(fd, bak_data)
    os.close(fd)
    print(f"[BAK] doi-tac-gia-cong.ts -> doi-tac-gia-cong.ts.bak ({len(bak_data)} bytes)")

# ===== 2. Parse CSV =====
with open(CSV_PATH, encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = [r for r in reader if r.get("Mã ĐT/NCC", "").strip()]

print(f"[CSV] Read {len(rows)} rows from CSV")

# Map CSV -> DoiTacGiaCong
partners = []
for r in rows:
    stt = int(r["STT"])
    ma = r["Mã ĐT/NCC"].strip()
    ten_don_vi = r["Tên Đơn Vị/Cơ Sở"].strip()
    nguoi_lh = r["Người Liên Hệ"].strip()
    sdt = r["SĐT"].strip()
    email = r["Email"].strip()
    dia_chi = r["Địa Chỉ"].strip()
    stk = r["Số Tài Khoản"].strip()
    ngan_hang = r["Ngân Hàng"].strip()
    mst = r["Mã Số Thuế"].strip()
    ghi_chu = r["Ghi Chú"].strip()

    # Normalize: --- or empty -> ""
    def norm(s):
        if s in ("---", ""):
            return ""
        return s

    partners.append({
        "stt": stt,
        "ma": ma,
        "tenDonVi": ten_don_vi,
        "nguoiLienHe": nguoi_lh,
        "sdt": sdt,
        "email": email,
        "diaChi": dia_chi,
        "soTaiKhoan": norm(stk),
        "nganHang": norm(ngan_hang),
        "maSoThue": norm(mst),
        "trangThai": "dang_hop_tac",  # Mặc định tất cả đang hợp tác theo CSV
        "ghiChu": ghi_chu,
    })

# Group by category
in_th = [p for p in partners if p["ma"].startsWith("GC-IN-")] if False else [p for p in partners if p["ma"].startswith("GC-IN-")]
may_quan = [p for p in partners if p["ma"].startswith("GC-QUAN-")]
may_tron = [p for p in partners if p["ma"].startswith("GC-TRON-")]
may_tru = [p for p in partners if p["ma"].startswith("GC-TRU-")]
print(f"[GROUP] IN: {len(in_th)} | QUAN: {len(may_quan)} | TRON: {len(may_tron)} | TRU: {len(may_tru)} | TOTAL: {len(partners)}")

# ===== 3. Generate TS code =====
def esc(s):
    """Escape string for TS single quote."""
    if not s:
        return ""
    return s.replace("\\", "\\\\").replace("'", "\\'")

lines = []
lines.append("// Đối tác gia công thật - Imported từ file CSV sếp Sang ngày 2026-08-03")
lines.append(f"// {len(partners)} đối tác: {len(in_th)} in/thêu/dập + {len(may_quan)} may quần + {len(may_tron)} may áo tròn + {len(may_tru)} may áo trụ")
lines.append("// Đầy đủ: Mã, Tên, Người LH, SĐT, Email, Địa chỉ, STK, Ngân hàng, MST, CCCD, Trạng thái")
lines.append("")
lines.append("export type LoaiDoiTac = \"GC-IN\" | \"GC-QUAN\" | \"GC-TRON\" | \"GC-TRU\";")
lines.append("")
lines.append("export type TrangThaiHopTac = \"dang_hop_tac\" | \"ngung_hop_tac\";")
lines.append("")
lines.append("export type DoiTacGiaCong = {")
lines.append("  stt: number;")
lines.append("  ma: string;                  // GC-IN-001, GC-QUAN-001, ...")
lines.append("  tenDonVi: string;            // \"Xưởng in/thêu/dập Bảo Ngân\"")
lines.append("  nguoiLienHe: string;         // Tên người đại diện")
lines.append("  sdt: string;                 // SĐT liên hệ")
lines.append("  email?: string;")
lines.append("  diaChi: string;              // Địa chỉ xưởng")
lines.append("  boPhan: string;              // \"sản xuất\"")
lines.append("  chucVu: string;              // \"gia công\"")
lines.append("  soTaiKhoan?: string;")
lines.append("  nganHang?: string;")
lines.append("  maSoThue?: string;")
lines.append("  loaiDoiTuong: \"doi_tac_gia_cong\";")
lines.append("  trangThai: TrangThaiHopTac;")
lines.append("  cccd?: string;               // parse từ ghiChú")
lines.append("  cccdNgayCap?: string;")
lines.append("  ghiChu?: string;")
lines.append("  // Field tương thích ngược với code cũ")
lines.append("  chuyenMon: \"In\" | \"Thêu\" | \"In – Dập\" | \"May quần\" | \"May áo tròn\" | \"May áo trụ\";")
lines.append("};")
lines.append("")
lines.append("// ============ HELPER: Parse CCCD từ ghiChú ============")
lines.append("function parseCCCD(ghiChu?: string): { cccd?: string; ngayCap?: string } {")
lines.append("  if (!ghiChu) return {};")
lines.append("  const cccdMatch = ghiChu.match(/CCCD:\\s*([0-9\\-]+)/i);")
lines.append("  const capMatch = ghiChu.match(/Cấp:\\s*([\\d\\/]+)/i);")
lines.append("  return {")
lines.append("    cccd: cccdMatch?.[1]?.trim(),")
lines.append("    ngayCap: capMatch?.[1]?.trim(),")
lines.append("  };")
lines.append("}")
lines.append("")
lines.append(f"// ============ {len(partners)} ĐỐI TÁC GIA CÔNG THẬT (từ CSV) ============")
lines.append("const _raw: Omit<DoiTacGiaCong, \"loaiDoiTuong\" | \"boPhan\" | \"chucVu\" | \"chuyenMon\" | \"cccd\" | \"cccdNgayCap\">[] = [")

# Sections
sections = [
    ("// ===== 5 XƯỞNG IN/THÊU/DẬP =====", in_th),
    ("// ===== 4 XƯỞNG MAY QUẦN =====", may_quan),
    ("// ===== 5 XƯỞNG MAY ÁO TRÒN =====", may_tron),
    ("// ===== 6 XƯỞNG MAY ÁO TRỤ =====", may_tru),
]

for section_title, section_data in sections:
    lines.append(f"  {section_title}")
    for p in section_data:
        line = f'  {{ stt: {p["stt"]}, ma: "{p["ma"]}", tenDonVi: "{esc(p["tenDonVi"])}", nguoiLienHe: "{esc(p["nguoiLienHe"])}", sdt: "{esc(p["sdt"])}", email: "{esc(p["email"])}", diaChi: "{esc(p["diaChi"])}",'
        if p["soTaiKhoan"]:
            line += f' soTaiKhoan: "{esc(p["soTaiKhoan"])}",'
        if p["nganHang"]:
            line += f' nganHang: "{esc(p["nganHang"])}",'
        if p["maSoThue"]:
            line += f' maSoThue: "{esc(p["maSoThue"])}",'
        else:
            line += f' maSoThue: "",'
        line += f' trangThai: "dang_hop_tac", ghiChu: "{esc(p["ghiChu"])}" }},'
        lines.append(line)
    lines.append("")

lines.append("];")
lines.append("")
lines.append("// ============ SUY RA CHUYÊN MÔN TỪ MÃ ============")
lines.append("function inferChuyenMon(ma: string): DoiTacGiaCong[\"chuyenMon\"] {")
lines.append("  if (ma.startsWith(\"GC-IN-\")) return \"In – Dập\";")
lines.append("  if (ma.startsWith(\"GC-QUAN-\")) return \"May quần\";")
lines.append("  if (ma.startsWith(\"GC-TRON-\")) return \"May áo tròn\";")
lines.append("  if (ma.startsWith(\"GC-TRU-\")) return \"May áo trụ\";")
lines.append("  return \"In – Dập\";")
lines.append("}")
lines.append("")
lines.append("// ============ EXPORT ĐỐI TÁC ĐÃ ĐƯỢC CHUẨN HÓA ============")
lines.append("export const DOI_TAC_GIA_CONG: DoiTacGiaCong[] = _raw.map((r) => {")
lines.append("  const { cccd, ngayCap } = parseCCCD(r.ghiChu);")
lines.append("  return {")
lines.append("    ...r,")
lines.append("    loaiDoiTuong: \"doi_tac_gia_cong\",")
lines.append("    boPhan: \"Sản xuất\",")
lines.append("    chucVu: \"Đối tác gia công\",")
lines.append("    chuyenMon: inferChuyenMon(r.ma),")
lines.append("    cccd,")
lines.append("    cccdNgayCap: ngayCap,")
lines.append("  };")
lines.append("});")
lines.append("")
lines.append("// ============ HELPER FUNCTIONS ============")
lines.append("export function getDoiTacByMa(ma: string): DoiTacGiaCong | undefined {")
lines.append("  return DOI_TAC_GIA_CONG.find((d) => d.ma === ma);")
lines.append("}")
lines.append("")
lines.append("export function getDoiTacByLoai(loai: LoaiDoiTac): DoiTacGiaCong[] {")
lines.append("  return DOI_TAC_GIA_CONG.filter((d) => d.ma.startsWith(loai + \"-\"));")
lines.append("}")
lines.append("")
lines.append("export function getDoiTacDangHopTac(): DoiTacGiaCong[] {")
lines.append("  return DOI_TAC_GIA_CONG.filter((d) => d.trangThai === \"dang_hop_tac\");")
lines.append("}")
lines.append("")
lines.append("export function getDoiTacNgungHopTac(): DoiTacGiaCong[] {")
lines.append("  return DOI_TAC_GIA_CONG.filter((d) => d.trangThai === \"ngung_hop_tac\");")
lines.append("}")
lines.append("")
lines.append("// ============ THỐNG KÊ ============")
lines.append("export function thongKeDoiTac() {")
lines.append("  return {")
lines.append("    tong: DOI_TAC_GIA_CONG.length,")
lines.append("    inTheuDap: getDoiTacByLoai(\"GC-IN\").length,")
lines.append("    mayQuan: getDoiTacByLoai(\"GC-QUAN\").length,")
lines.append("    mayTron: getDoiTacByLoai(\"GC-TRON\").length,")
lines.append("    mayTru: getDoiTacByLoai(\"GC-TRU\").length,")
lines.append("    dangHopTac: getDoiTacDangHopTac().length,")
lines.append("    ngungHopTac: getDoiTacNgungHopTac().length,")
lines.append("  };")
lines.append("}")
lines.append("")
lines.append("// ============ TƯƠNG THÍCH NGƯỢC VỚI workflow-data.ts ============")
lines.append("// Map mã cũ DT-MAY-XXX sang mã mới GC-XXX")
lines.append("export const NGUOI_IN_THEU_DAP_NEW = getDoiTacByLoai(\"GC-IN\").map((d) => ({")
lines.append("  ma: d.ma,")
lines.append("  ten: d.nguoiLienHe,")
lines.append("  sdt: d.sdt,")
lines.append("  chuyenMon: d.chuyenMon,")
lines.append("  ghiChu: d.tenDonVi,")
lines.append("  diaChi: d.diaChi,")
lines.append("  trangThai: d.trangThai,")
lines.append("}));")
lines.append("")
lines.append("export const NGUOI_MAY_QUAN = getDoiTacByLoai(\"GC-QUAN\").map((d) => ({")
lines.append("  ma: d.ma,")
lines.append("  ten: d.nguoiLienHe,")
lines.append("  sdt: d.sdt,")
lines.append("  ghiChu: d.tenDonVi,")
lines.append("  diaChi: d.diaChi,")
lines.append("  trangThai: d.trangThai,")
lines.append("}));")
lines.append("")
lines.append("export const NGUOI_MAY_TRON = getDoiTacByLoai(\"GC-TRON\").map((d) => ({")
lines.append("  ma: d.ma,")
lines.append("  ten: d.nguoiLienHe,")
lines.append("  sdt: d.sdt,")
lines.append("  ghiChu: d.tenDonVi,")
lines.append("  diaChi: d.diaChi,")
lines.append("  trangThai: d.trangThai,")
lines.append("}));")
lines.append("")
lines.append("export const NGUOI_MAY_TRU = getDoiTacByLoai(\"GC-TRU\").map((d) => ({")
lines.append("  ma: d.ma,")
lines.append("  ten: d.nguoiLienHe,")
lines.append("  sdt: d.sdt,")
lines.append("  ghiChu: d.tenDonVi,")
lines.append("  diaChi: d.diaChi,")
lines.append("  trangThai: d.trangThai,")
lines.append("}));")
lines.append("")
lines.append("export const NGUOI_MAY_NEW = {")
lines.append("  \"May quần\": NGUOI_MAY_QUAN,")
lines.append("  \"May áo tròn\": NGUOI_MAY_TRON,")
lines.append("  \"May áo trụ\": NGUOI_MAY_TRU,")
lines.append("};")
lines.append("")

# Write (use os.open to avoid Windows encoding issue)
new_content = "\n".join(lines)
fd = os.open(LIB_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
os.write(fd, new_content.encode("utf-8"))
os.close(fd)
print(f"[OK] {os.path.basename(LIB_PATH)} - {len(partners)} partners written")
print(f"[OK] Backup at: {os.path.basename(BAK_PATH)}")

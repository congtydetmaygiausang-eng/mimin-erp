import openpyxl
import json

files = {
    "khoVai": "/workspace/attachments/d744601e__7c591e8a-4fa2-414c-9fe6-3cc80fd17ba2.xlsx",
    "khoVatTu": "/workspace/attachments/8ed59032__71f6fc2c-f42e-44be-aafa-de60a3f1323a.xlsx",
}

def s(v):
    if v is None: return ""
    return str(v).strip()

def n(v):
    if v is None: return 0
    if isinstance(v, (int, float)): return float(v)
    return 0

result = {}
for key, fpath in files.items():
    wb = openpyxl.load_workbook(fpath, data_only=True)
    ws = wb.active
    rows = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[0]: continue
        rec = {
            "maVT": s(row[0]),
            "tenVT": s(row[1]),
            "loai": s(row[2]),
            "dvt": s(row[3]),
            "donGia": n(row[4]),
            "tonKho": n(row[5]),
            "tonToiThieu": n(row[6]),
            "kho": s(row[7]),
            "mauSac": s(row[8]),
            "ghiChu": s(row[9]),
            "soCayNhap": n(row[10]),
            "tonCay": n(row[11]),
        }
        rows.append(rec)
    result[key] = rows
    print(f"✅ {key}: {len(rows)} mặt hàng")
    # Stats
    if rows:
        total_value = sum(r["donGia"] * r["tonKho"] for r in rows)
        co_gia = sum(1 for r in rows if r["donGia"] > 0)
        print(f"   - Có đơn giá: {co_gia}/{len(rows)}")
        print(f"   - Tổng giá trị tồn: {total_value:,.0f} đ")
        # Group by loai
        loai_set = set(r["loai"] for r in rows if r["loai"])
        for loai in sorted(loai_set):
            count = sum(1 for r in rows if r["loai"] == loai)
            print(f"   - {loai}: {count}")

with open("/workspace/mimin-erp/data-kho.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(f"\n📄 Đã lưu: /workspace/mimin-erp/data-kho.json")

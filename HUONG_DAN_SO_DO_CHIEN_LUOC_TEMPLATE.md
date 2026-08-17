# 📋 Hướng Dẫn Tạo Sơ Đồ Chiến Lược - Template & Best Practices

> **Ngày cập nhật**: 2026-08-16  
> **Module**: Sơ đồ chiến lược (Mind Map) - `/so-do-chien-luoc/`

---

## 🎯 Tổng Quan

Hiện tại có **3 sơ đồ mẫu** sẵn có:
1. ✅ **Luồng Bán Hàng** (Sales Flow) - `LUONG-BANHANG-001`
2. ✅ **Luồng Sản Xuất** (Production Flow) - `LUONG-SANXUAT-001`
3. 📝 **Template chung** - `SD-002` (dùng để bắt đầu)

Tất cả được lưu trong: `apps/web/src/lib/data/so-do-chien-luoc-data.ts`

---

## 📐 Cấu Trúc Một Sơ Đồ

Mỗi sơ đồ chiến lược gồm:

```typescript
{
  id: "LUONG-BANHANG-001",              // ID duy nhất, dùng trong URL
  name: "Luồng Bán Hàng",               // Tên hiển thị
  updatedAt: "2026-08-16T11:00:00Z",    // Ngày cập nhật
  nodes: [/* Danh sách khối */],        // Các khối văn bản / ảnh
  edges: [/* Danh sách kết nối */]      // Các đường nối giữa khối
}
```

### Nodes (Khối)

**Loại 1: Khối Text**
```typescript
{
  id: "bh-title",                        // ID duy nhất trong sơ đồ
  position: { x: 500, y: 50 },          // Vị trí trên canvas (pixel)
  data: {
    label: "Luồng Bán Hàng",             // Nội dung
    type: "title" | "normal" | "sub",   // title=tiêu đề, normal=bình thường, sub=phụ
    color: "xanh" | "tim" | "hong"      // Màu sắc (tùy chọn)
  },
  type: "miminNode"                      // Loại component
}
```

**Loại 2: Khối Ảnh**
```typescript
{
  id: "img-001",
  position: { x: 700, y: 400 },
  data: {
    label: "Mẫu áo",                     // Tiêu đề ảnh
    imageSrc: "https://url-to-image.png" // URL hoặc base64
  },
  type: "miminImageNode"
}
```

### Edges (Kết nối)

```typescript
{
  id: "bh-e1",               // ID duy nhất
  source: "bh-title",        // ID khối nguồn
  target: "bh-1-1",          // ID khối đích
  animated: true,            // Đường nối có chuyển động (tùy chọn)
  style: {                   // Style tùy chọn
    strokeDasharray: "5 5"   // Nét đứt (dùng cho kết nối phụ)
  }
}
```

---

## 🎨 Bảng Màu Khối

Dùng các màu này để phân biệt các giai đoạn:

| Màu | Giá trị | Sử dụng | Hex |
|-----|--------|--------|-----|
| 🔵 Xanh dương | `"xanh"` | Xử lý chính, bán hàng | #3b82f6 |
| 🟦 Xanh ngọc | `"teal"` | Hoàn tất, thành công | #14b8a6 |
| 🟪 Tím | `"tim"` | Lên kế hoạch, chuẩn bị | #a855f7 |
| 🟥 Đỏ | `"do"` | Giai đoạn cuối, giao hàng | #f43f5e |
| 🟨 Cam | `"cam"` | Kiểm tra, xác nhận | #f97316 |
| 🟧 Vàng | `"vang"` | Xử lý, gia công | #fbbf24 |
| 🟩 Hồng | `"hong"` | Cắt, chia nhỏ | #ec4899 |
| ⬜ Xám | `"xam"` | Template mẫu | #e2e8f0 |

---

## 🚀 Cách Thêm Sơ Đồ Mới

### Bước 1: Chuẩn bị dữ liệu
```typescript
// apps/web/src/lib/data/so-do-chien-luoc-data.ts

const MOCK_PROJECTS: MindMapProject[] = [
  // ... các sơ đồ cũ
  {
    id: "LUONG-GHIACONG-001",           // ← ID duy nhất
    name: "Luồng Gia Công Ngoài",       // ← Tên sơ đồ
    updatedAt: "2026-08-16T12:00:00Z",
    nodes: [
      // Tiêu đề
      {
        id: "gc-title",
        position: { x: 500, y: 50 },
        data: { label: "Luồng Gia Công Ngoài", type: "title", color: "do" },
        type: "miminNode"
      },
      // ... thêm khối khác
    ],
    edges: [
      // Kết nối khối với nhau
      { id: "gc-e1", source: "gc-title", target: "gc-1", animated: true },
      // ... thêm edge khác
    ]
  }
];
```

### Bước 2: Thiết kế layout

Quy tắc vị trí Y (hàng ngang):
- `y: 50` → Tiêu đề (hàng 1)
- `y: 180` → Giai đoạn 1 (hàng 2)
- `y: 320` → Giai đoạn 2 (hàng 3)
- `y: 460` → Giai đoạn 3 (hàng 4)
- `y: 600` → Giai đoạn 4 (hàng 5)

Quy tắc vị trí X (cột dọc):
- `x: 100-200` → Cột 1 (trái)
- `x: 300-400` → Cột 2 (trung trái)
- `x: 500-600` → Cột 3 (trung phải)
- `x: 700-800` → Cột 4 (phải)

### Bước 3: Build & Test

```bash
cd d:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp
npm run build
npm run dev  # Chạy local để test
```

Truy cập: `http://localhost:3000/so-do-chien-luoc`

---

## 📋 Template Copy-Paste Sẵn

### Template: Luồng Đơn Giản (3 Giai Đoạn)

```typescript
{
  id: "LUONG-TEN-001",
  name: "Luồng [Tên Của Anh]",
  updatedAt: new Date().toISOString(),
  nodes: [
    // Tiêu đề
    { id: "x-title", position: { x: 500, y: 50 }, data: { label: "Tiêu đề", type: "title", color: "xanh" }, type: "miminNode" },
    
    // Giai đoạn 1
    { id: "x-1-1", position: { x: 150, y: 180 }, data: { label: "Bước 1", type: "normal", color: "xanh" }, type: "miminNode" },
    { id: "x-1-2", position: { x: 350, y: 180 }, data: { label: "Bước 1b", type: "normal", color: "xanh" }, type: "miminNode" },
    
    // Giai đoạn 2
    { id: "x-2-1", position: { x: 150, y: 320 }, data: { label: "Bước 2", type: "normal", color: "cam" }, type: "miminNode" },
    { id: "x-2-2", position: { x: 350, y: 320 }, data: { label: "Bước 2b", type: "normal", color: "cam" }, type: "miminNode" },
    
    // Giai đoạn 3
    { id: "x-3-1", position: { x: 150, y: 460 }, data: { label: "Bước 3", type: "normal", color: "do" }, type: "miminNode" },
    { id: "x-3-2", position: { x: 350, y: 460 }, data: { label: "Hoàn tất", type: "normal", color: "teal" }, type: "miminNode" },
  ],
  edges: [
    { id: "x-e1", source: "x-title", target: "x-1-1", animated: true },
    { id: "x-e2", source: "x-1-1", target: "x-1-2" },
    { id: "x-e3", source: "x-1-2", target: "x-2-1" },
    { id: "x-e4", source: "x-2-1", target: "x-2-2" },
    { id: "x-e5", source: "x-2-2", target: "x-3-1" },
    { id: "x-e6", source: "x-3-1", target: "x-3-2" },
  ],
}
```

### Template: Với Ảnh

```typescript
{
  id: "LUONG-VUA-ANH-001",
  name: "Luồng Với Ảnh",
  updatedAt: new Date().toISOString(),
  nodes: [
    { id: "va-title", position: { x: 500, y: 50 }, data: { label: "Dự án", type: "title" }, type: "miminNode" },
    { id: "va-main", position: { x: 300, y: 200 }, data: { label: "Khối chính", type: "normal" }, type: "miminNode" },
    { id: "va-img", position: { x: 700, y: 200 }, data: { label: "Ảnh minh họa", imageSrc: "https://..." }, type: "miminImageNode" },
  ],
  edges: [
    { id: "va-e1", source: "va-title", target: "va-main", animated: true },
    { id: "va-e2", source: "va-title", target: "va-img", style: { strokeDasharray: "5 5" } },
  ],
}
```

---

## ✨ Tính Năng Hiện Có

Người dùng có thể:

| Chức năng | Cách sử dụng |
|-----------|-------------|
| **Thêm Text** | Bấm nút "Thêm Text" hoặc Paste text |
| **Thêm Ảnh** | Upload từ máy hoặc Paste ảnh từ clipboard |
| **Đổi Màu Khối** | Chọn khối → bấm màu |
| **Sửa Nội Dung** | Bấm đúp vào khối → nhập text |
| **Xoá Khối** | Chọn khối → bấm Delete |
| **Nhân Bản Khối** | Chọn khối → Ctrl+D |
| **Hoàn Tác** | Ctrl+Z |
| **Lưu Lại** | Ctrl+S (lưu vào localStorage) |
| **Xuất Ảnh** | Bấm "Xuất Ảnh" → lưu PNG |

---

## 🐛 Troubleshooting

**Q: Sơ đồ mới không hiện trên trang?**  
A: Đảm bảo:
1. ID không trùng với sơ đồ cũ
2. `id` trong nút bắt đầu bằng chữ cái (không dùng số ở đầu)
3. Build lại: `npm run build`

**Q: Khối không nối được?**  
A: Kiểm tra `source` và `target` trong edge có match với `id` của node không

**Q: Ảnh không hiển thị?**  
A: URL ảnh phải:
- Bắt đầu bằng `https://`
- Định dạng hỗ trợ: JPG, PNG, WebP, GIF
- File size không quá 5MB

**Q: localStorage bị đầy?**  
A: Sơ đồ được nén ảnh tự động. Nếu lỗi, hãy bớt ảnh đi.

---

## 📞 Liên Hệ

Nếu cần thêm sơ đồ mới hoặc chỉnh sửa, anh chỉ cần:
1. Copy template từ section trên
2. Sửa ID, tên, nodes, edges
3. Build & test
4. Push lên GitHub

**File chính**: `apps/web/src/lib/data/so-do-chien-luoc-data.ts`

---

**Phiên bản**: v1.0  
**Người viết**: Mavis (MIMIN ERP AI Agent)  
**Ngôn ngữ**: TypeScript + React Flow

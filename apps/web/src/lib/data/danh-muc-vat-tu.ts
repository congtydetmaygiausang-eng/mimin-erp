export type DanhMucChiTiet = {
  id: string;
  ten: string;
};

export type NhomDanhMuc = {
  id: string;
  tenNhom: string;
  danhMuc: DanhMucChiTiet[];
};

export const DANH_MUC_VAT_TU_CHI_TIET: NhomDanhMuc[] = [
  {
    id: "nhom_chi_soi",
    tenNhom: "Nhóm chỉ & sợi",
    danhMuc: [
      { id: "chi_may_poly", ten: "Chỉ may (100% Polyester)" },
      { id: "chi_may_cotton", ten: "Chỉ may (100% Cotton)" },
      { id: "chi_may_pe", ten: "Chỉ may (PE)" },
      { id: "chi_theu", ten: "Chỉ thêu" },
      { id: "chi_vat_so", ten: "Chỉ vắt sổ" },
      { id: "chi_chun", ten: "Chỉ chun (co giãn)" },
      { id: "soi_det", ten: "Sợi dệt" },
    ],
  },
  {
    id: "nhom_phu_kien",
    tenNhom: "Nhóm phụ kiện kim loại & nhựa",
    danhMuc: [
      { id: "khoa_keo_nhua", ten: "Khóa kéo nhựa" },
      { id: "khoa_keo_kim_loai", ten: "Khóa kéo kim loại" },
      { id: "khoa_keo_an", ten: "Khóa kéo ẩn" },
      { id: "cuc_ao_nhua", ten: "Cúc áo nhựa" },
      { id: "cuc_ao_kim_loai", ten: "Cúc áo kim loại" },
      { id: "cuc_ao_go", ten: "Cúc áo gỗ" },
      { id: "cuc_ao_oc_cho", ten: "Cúc áo óc chó" },
      { id: "khuy_bam", ten: "Khuy bấm (press fastener)" },
      { id: "moc_cai", ten: "Móc cài / Móc quần (hook & eye)" },
      { id: "dinh_tan", ten: "Đinh tán (rivet)" },
      { id: "hat_cuom_da", ten: "Hạt cườm, hạt đá, sequin" },
      { id: "vong_khuy", ten: "Vòng khuy (mắt treo)" },
    ],
  },
  {
    id: "nhom_keo_lot",
    tenNhom: "Nhóm keo & vật liệu lót (mếch)",
    danhMuc: [
      { id: "keo_dung_nhiet", ten: "Keo dựng (mếch nhiệt)" },
      { id: "keo_dung_det", ten: "Keo dựng (mếch dệt)" },
      { id: "keo_non", ten: "Keo non (keo định hình)" },
      { id: "keo_nhiet", ten: "Keo nhiệt (hot melt)" },
      { id: "vai_lot_than", ten: "Vải lót thân" },
      { id: "vai_lot_tay", ten: "Vải lót tay" },
      { id: "vai_lot_vai", ten: "Vải lót vai" },
      { id: "bong_lot_vai", ten: "Bông lót, tấm lót vai (mút xốp)" },
    ],
  },
  {
    id: "nhom_trang_tri_nhan",
    tenNhom: "Nhóm phụ liệu trang trí & nhãn mác",
    danhMuc: [
      { id: "ren", ten: "Ren (đăng ten)" },
      { id: "bang_do_thun", ten: "Băng đô / thun bản (elastic band)" },
      { id: "nhan_chinh", ten: "Nhãn chính (main label)" },
      { id: "nhan_size", ten: "Nhãn size (size label)" },
      { id: "nhan_care", ten: "Nhãn hướng dẫn giặt (care label)" },
      { id: "nhan_treo", ten: "Nhãn treo (hang tag)" },
      { id: "tem_chong_gia", ten: "Tem chống hàng giả" },
      { id: "bang_dinh_2_mat", ten: "Băng dính 2 mặt" },
    ],
  },
  {
    id: "nhom_bao_bi",
    tenNhom: "Nhóm bao bì & đóng gói",
    danhMuc: [
      { id: "tui_pe_pp", ten: "Túi PE / túi PP" },
      { id: "tui_zip", ten: "Túi zip (ziplock)" },
      { id: "thung_carton", ten: "Thùng carton" },
      { id: "bia_lung_giay", ten: "Bìa lưng giấy (backing card)" },
      { id: "kep_nhua_treo", ten: "Kẹp nhựa treo móc (plastic clip)" },
      { id: "moc_treo_quan_ao", ten: "Móc treo quần áo (hanger)" },
      { id: "giay_nhan_lua", ten: "Giấy nhăn / giấy lụa gói hàng" },
    ],
  },
];

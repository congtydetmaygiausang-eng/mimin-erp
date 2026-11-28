// ==========================================
// BẢNG MÀU & ẢNH SWATCH VẢI THÀNH PHẨM CHUẨN POLOMIN / MIMIN ERP
// Tự động nhận diện màu sắc và ánh xạ chính xác ảnh mẫu vải thực tế từ xưởng
// Đã được chuẩn hóa in tên màu trực tiếp lên ảnh swatch (Ví dụ: XANH ĐÁ 08)
// ==========================================

export const SWATCH_STORAGE_BASE = "https://ejcuqyaiwabfygyesvxj.supabase.co/storage/v1/object/public/san-pham-media/kho-vai-moi";

/**
 * 38+ Ảnh Swatch chuẩn hóa từng màu vải với chữ in trực tiếp chính xác tên màu trên ảnh
 */
export const SWATCH_IMAGES = {
  VAI_01_TRANG: `${SWATCH_STORAGE_BASE}/swatch_VAI-01.jpg`,
  VAI_02_XAM_TRANG: `${SWATCH_STORAGE_BASE}/swatch_VAI-02.jpg`,
  VAI_03_KEM: `${SWATCH_STORAGE_BASE}/swatch_VAI-03.jpg`,
  VAI_04_GUNG_040: `${SWATCH_STORAGE_BASE}/swatch_VAI-04.jpg`,
  VAI_05_DAU_BEIGE_7036: `${SWATCH_STORAGE_BASE}/swatch_VAI-05.jpg`,
  VAI_06_XAM_005: `${SWATCH_STORAGE_BASE}/swatch_VAI-06.jpg`,
  VAI_07_BO_027: `${SWATCH_STORAGE_BASE}/swatch_VAI-07.jpg`,
  VAI_08_REU: `${SWATCH_STORAGE_BASE}/swatch_VAI-08.jpg`,
  VAI_09_REU_036: `${SWATCH_STORAGE_BASE}/swatch_VAI-09.jpg`,
  VAI_10_XAM_CHI_035: `${SWATCH_STORAGE_BASE}/swatch_VAI-10.jpg`,
  VAI_11_CO_VIT_012: `${SWATCH_STORAGE_BASE}/swatch_VAI-11.jpg`,
  VAI_12_XANH_DEN_CM: `${SWATCH_STORAGE_BASE}/swatch_VAI-12.jpg`,
  VAI_13_DEN_CM_030: `${SWATCH_STORAGE_BASE}/swatch_VAI-13.jpg`,
  VAI_14_DEN_THUONG: `${SWATCH_STORAGE_BASE}/swatch_VAI-14.jpg`,
  VAI_15_XANH_DEN_THUONG: `${SWATCH_STORAGE_BASE}/swatch_VAI-15.jpg`,
  VAI_16_XANH_DA_08: `${SWATCH_STORAGE_BASE}/swatch_VAI-16.jpg`,
  VAI_17_CA_PHE: `${SWATCH_STORAGE_BASE}/swatch_VAI-17.jpg`,
  VAI_18_CO_UA_044: `${SWATCH_STORAGE_BASE}/swatch_VAI-18.jpg`,
  VAI_19_XAM_LOT_06: `${SWATCH_STORAGE_BASE}/swatch_VAI-19.jpg`,
  VAI_20_XAM_CHI_066: `${SWATCH_STORAGE_BASE}/swatch_VAI-20.jpg`,
  VAI_21_CA_CAO_063: `${SWATCH_STORAGE_BASE}/swatch_VAI-21.jpg`,
  VAI_22_BO_068: `${SWATCH_STORAGE_BASE}/swatch_VAI-22.jpg`,
  VAI_23_XANH_NHOT_069: `${SWATCH_STORAGE_BASE}/swatch_VAI-23.jpg`,
  VAI_24_KEM_VANG: `${SWATCH_STORAGE_BASE}/swatch_VAI-24.jpg`,
  VAI_25_XAM_NHAT_81: `${SWATCH_STORAGE_BASE}/swatch_VAI-25.jpg`,
  VAI_26_NAU_11: `${SWATCH_STORAGE_BASE}/swatch_VAI-26.jpg`,
  VAI_27_TRANG_BOT_100: `${SWATCH_STORAGE_BASE}/swatch_VAI-27.jpg`,
  VAI_28_TRANG_IN: `${SWATCH_STORAGE_BASE}/swatch_VAI-28.jpg`,
  VAI_31_XAM_XANH_111: `${SWATCH_STORAGE_BASE}/swatch_VAI-31.jpg`,
  VAI_32_XAM_MON_109: `${SWATCH_STORAGE_BASE}/swatch_VAI-32.jpg`,
  VAI_33_DAU_XANH_114: `${SWATCH_STORAGE_BASE}/swatch_VAI-33.jpg`,
  VAI_34_DO_112: `${SWATCH_STORAGE_BASE}/swatch_VAI-34.jpg`,
  VAI_38_2DA_DEN: `${SWATCH_STORAGE_BASE}/swatch_VAI-38.jpg`,
  VAI_39_XANH_BICH: `${SWATCH_STORAGE_BASE}/swatch_VAI-39.jpg`,
  VAI_40_XANH_NGOC: `${SWATCH_STORAGE_BASE}/swatch_VAI-40.jpg`,
  VAI_41_2DA_REU: `${SWATCH_STORAGE_BASE}/swatch_VAI-41.jpg`,
  VAI_42_2DA_NAU_DAT: `${SWATCH_STORAGE_BASE}/swatch_VAI-42.jpg`,
  VAI_43_2DA_XAM_CHI: `${SWATCH_STORAGE_BASE}/swatch_VAI-43.jpg`,
} as const;

/**
 * Mapping chính xác 28 mã vải chuẩn (và các mã mở rộng) sang ảnh Swatch có tên màu in sẵn
 */
export const VAI_28_SWATCH_MAP: Record<string, string> = {
  "VAI-01": SWATCH_IMAGES.VAI_01_TRANG,             // Trắng
  "VAI-02": SWATCH_IMAGES.VAI_02_XAM_TRANG,        // XÁM TRẮNG
  "VAI-03": SWATCH_IMAGES.VAI_03_KEM,              // KEM
  "VAI-04": SWATCH_IMAGES.VAI_04_GUNG_040,         // GỪNG 040
  "VAI-05": SWATCH_IMAGES.VAI_05_DAU_BEIGE_7036,   // ĐẬU (BEIGE SW7036)
  "VAI-06": SWATCH_IMAGES.VAI_06_XAM_005,          // XÁM 005
  "VAI-07": SWATCH_IMAGES.VAI_07_BO_027,           // BÒ 027
  "VAI-08": SWATCH_IMAGES.VAI_08_REU,              // RÊU
  "VAI-09": SWATCH_IMAGES.VAI_09_REU_036,          // RÊU 036
  "VAI-10": SWATCH_IMAGES.VAI_10_XAM_CHI_035,      // XÁM CHÌ 035
  "VAI-11": SWATCH_IMAGES.VAI_11_CO_VIT_012,       // CỔ VỊT 012
  "VAI-12": SWATCH_IMAGES.VAI_12_XANH_DEN_CM,      // XANH ĐEN CM
  "VAI-13": SWATCH_IMAGES.VAI_13_DEN_CM_030,       // ĐEN CM 030
  "VAI-14": SWATCH_IMAGES.VAI_14_DEN_THUONG,       // ĐEN THƯỜNG
  "VAI-15": SWATCH_IMAGES.VAI_15_XANH_DEN_THUONG,  // XANH ĐEN THƯỜNG
  "VAI-16": SWATCH_IMAGES.VAI_16_XANH_DA_08,       // XANH ĐÁ 08 (Chính xác chữ XANH ĐÁ 08 trên ảnh)
  "VAI-17": SWATCH_IMAGES.VAI_17_CA_PHE,           // CÀ PHÊ
  "VAI-18": SWATCH_IMAGES.VAI_18_CO_UA_044,        // CỎ ÚA 044
  "VAI-19": SWATCH_IMAGES.VAI_19_XAM_LOT_06,       // XÁM LỢT 06
  "VAI-20": SWATCH_IMAGES.VAI_20_XAM_CHI_066,      // XÁM CHÌ 066
  "VAI-21": SWATCH_IMAGES.VAI_21_CA_CAO_063,       // Ca Cao 063
  "VAI-22": SWATCH_IMAGES.VAI_22_BO_068,           // BÒ 068
  "VAI-23": SWATCH_IMAGES.VAI_23_XANH_NHOT_069,    // XANH NHỚT 069
  "VAI-24": SWATCH_IMAGES.VAI_24_KEM_VANG,         // KEM VÀNG
  "VAI-25": SWATCH_IMAGES.VAI_25_XAM_NHAT_81,      // XÁM NHẠT 81
  "VAI-26": SWATCH_IMAGES.VAI_26_NAU_11,           // NÂU 11
  "VAI-27": SWATCH_IMAGES.VAI_27_TRANG_BOT_100,    // Trắng · Bột 100
  "VAI-28": SWATCH_IMAGES.VAI_28_TRANG_IN,         // Trắng In
  "VAI-31": SWATCH_IMAGES.VAI_31_XAM_XANH_111,     // XÁM XANH 111
  "VAI-32": SWATCH_IMAGES.VAI_32_XAM_MON_109,      // XÁM MÔN 109
  "VAI-33": SWATCH_IMAGES.VAI_33_DAU_XANH_114,     // ĐẬU XANH 114
  "VAI-34": SWATCH_IMAGES.VAI_34_DO_112,           // ĐỎ 112
  "VAI-38": SWATCH_IMAGES.VAI_38_2DA_DEN,          // 2DA ĐEN
  "VAI-39": SWATCH_IMAGES.VAI_39_XANH_BICH,        // XANH BÍCH
  "VAI-40": SWATCH_IMAGES.VAI_40_XANH_NGOC,        // XANH NGỌC
  "VAI-41": SWATCH_IMAGES.VAI_41_2DA_REU,          // 2DA RÊU
  "VAI-42": SWATCH_IMAGES.VAI_42_2DA_NAU_DAT,      // 2DA NÂU ĐẤT
  "VAI-43": SWATCH_IMAGES.VAI_43_2DA_XAM_CHI,      // 2DA XÁM CHÌ
};

/**
 * Tự động dò và nhận diện ảnh swatch phù hợp từ tên màu hoặc mã vật tư
 */
export function getFabricSwatchImage(colorNameOrText?: string, sku?: string): string {
  // 1. Kiểm tra theo mã SKU chính xác nếu có (VAI-xx, BO-xx, NUT-xx)
  if (sku) {
    const cleanSku = sku.toUpperCase().trim();
    if (VAI_28_SWATCH_MAP[cleanSku]) {
      return VAI_28_SWATCH_MAP[cleanSku];
    }
    const numMatch = cleanSku.match(/(?:VAI|BO|NUT|BT|N)-?0*(\d+)/i);
    if (numMatch) {
      const vaiKey = `VAI-${String(numMatch[1]).padStart(2, "0")}`;
      if (VAI_28_SWATCH_MAP[vaiKey]) {
        return VAI_28_SWATCH_MAP[vaiKey];
      }
    }
  }

  // 2. Dò theo tên màu / từ khóa đặc trưng của vải (ưu tiên từ khóa dài và cụ thể trước)
  const c = (colorNameOrText || "").toLowerCase().trim();

  // Nhóm Xanh đá (Yêu cầu đặc biệt: XANH ĐÁ 08 phải ra đúng ảnh XANH ĐÁ 08)
  if (c.includes("xanh đá") || c.includes("xanh da") || c.includes("đá 08") || c.includes("da 08") || c.includes("đá xanh") || c.includes("da xanh")) {
    return SWATCH_IMAGES.VAI_16_XANH_DA_08;
  }

  // Nhóm Xám trắng
  if (c.includes("xám trắng") || c.includes("xam trang")) {
    return SWATCH_IMAGES.VAI_02_XAM_TRANG;
  }

  // Nhóm Trắng In / Trắng Bột
  if (c.includes("trắng in") || c.includes("trang in")) {
    return SWATCH_IMAGES.VAI_28_TRANG_IN;
  }
  if (c.includes("bột 100") || c.includes("bot 100") || c.includes("trắng bột") || c.includes("trang bot")) {
    return SWATCH_IMAGES.VAI_27_TRANG_BOT_100;
  }

  // Nhóm Đậu / Beige (Kiểm tra TRƯỚC nhóm 036 để tránh "7036" bị nhận nhầm thành 036)
  if (c.includes("7036") || c.includes("đậu") || c.includes("dau (beige") || c.includes("beige")) {
    return SWATCH_IMAGES.VAI_05_DAU_BEIGE_7036;
  }

  // Nhóm Xanh đen (Kiểm tra TRƯỚC nhóm Đen thông thường để tránh "xanh đen" ăn nhầm vào "đen")
  if (c.includes("xanh đen") || c.includes("xanh den")) {
    if (c.includes("thường") || c.includes("thuong")) return SWATCH_IMAGES.VAI_15_XANH_DEN_THUONG;
    return SWATCH_IMAGES.VAI_12_XANH_DEN_CM;
  }

  // Nhóm Đen CM / Đen thường / Đen 2 da
  if (c.includes("đen cm") || c.includes("den cm") || c.includes("030")) {
    return SWATCH_IMAGES.VAI_13_DEN_CM_030;
  }
  if (c.includes("2da đen") || c.includes("2 da den")) {
    return SWATCH_IMAGES.VAI_38_2DA_DEN;
  }
  if (c.includes("đen thường") || c.includes("den thuong")) {
    return SWATCH_IMAGES.VAI_14_DEN_THUONG;
  }

  // Nhóm Cổ vịt
  if (c.includes("cổ vịt") || c.includes("co vit") || c.includes("012")) {
    return SWATCH_IMAGES.VAI_11_CO_VIT_012;
  }

  // Nhóm Xanh nhớt
  if (c.includes("nhớt") || c.includes("nhot") || c.includes("069")) {
    return SWATCH_IMAGES.VAI_23_XANH_NHOT_069;
  }

  // Nhóm Rêu
  if (c.includes("2da rêu") || c.includes("2 da reu")) {
    return SWATCH_IMAGES.VAI_41_2DA_REU;
  }
  if (c.includes("rêu 036") || c.includes("reu 036") || (c.includes("036") && !c.includes("7036"))) {
    return SWATCH_IMAGES.VAI_09_REU_036;
  }
  if (c.includes("rêu") || c.includes("reu")) {
    return SWATCH_IMAGES.VAI_08_REU;
  }

  // Nhóm Cỏ úa
  if (c.includes("cỏ úa") || c.includes("co ua") || c.includes("044")) {
    return SWATCH_IMAGES.VAI_18_CO_UA_044;
  }

  // Nhóm Bò
  if (c.includes("027") || c.includes("bò 027") || c.includes("bo 027")) {
    return SWATCH_IMAGES.VAI_07_BO_027;
  }
  if (c.includes("068") || c.includes("bò 068") || c.includes("bo 068")) {
    return SWATCH_IMAGES.VAI_22_BO_068;
  }
  if (c.includes("bò") || c.includes("bo")) {
    return SWATCH_IMAGES.VAI_07_BO_027;
  }

  // Nhóm Gừng
  if (c.includes("gừng") || c.includes("gung") || c.includes("040")) {
    return SWATCH_IMAGES.VAI_04_GUNG_040;
  }

  // Nhóm Kem vàng / Kem
  if (c.includes("kem vàng") || c.includes("kem vang")) {
    return SWATCH_IMAGES.VAI_24_KEM_VANG;
  }
  if (c.includes("kem") || c.includes("cream") || c.includes("029") || c.includes("108")) {
    return SWATCH_IMAGES.VAI_03_KEM;
  }

  // Nhóm Xám chì 035
  if (c.includes("035") || c.includes("xám chì 035") || c.includes("xam chi 035")) {
    return SWATCH_IMAGES.VAI_10_XAM_CHI_035;
  }

  // Nhóm Xám chì 066
  if (c.includes("066") || c.includes("xám chì 066") || c.includes("xam chi 066")) {
    return SWATCH_IMAGES.VAI_20_XAM_CHI_066;
  }

  // Nhóm Xám 005
  if (c.includes("005") || c.includes("xám 005") || c.includes("xám 6")) {
    return SWATCH_IMAGES.VAI_06_XAM_005;
  }

  // Nhóm Xám lợt 06
  if (c.includes("xám lợt 06") || c.includes("xam lot 06") || c.includes("061")) {
    return SWATCH_IMAGES.VAI_19_XAM_LOT_06;
  }
  if (c.includes("xám lợt") || c.includes("xam lot")) {
    return SWATCH_IMAGES.VAI_19_XAM_LOT_06;
  }

  // Nhóm Xám nhạt 81
  if (c.includes("81") || c.includes("xám nhạt") || c.includes("xam nhat")) {
    return SWATCH_IMAGES.VAI_25_XAM_NHAT_81;
  }

  // Nhóm Xanh bích / Xanh ngọc
  if (c.includes("xanh ngọc") || c.includes("xanh ngoc")) {
    return SWATCH_IMAGES.VAI_40_XANH_NGOC;
  }
  if (c.includes("bích") || c.includes("bich")) {
    return SWATCH_IMAGES.VAI_39_XANH_BICH;
  }

  // Nhóm Cà phê / Ca cao / Nâu
  if (c.includes("cà phê") || c.includes("ca phe") || c.includes("cafe")) {
    return SWATCH_IMAGES.VAI_17_CA_PHE;
  }
  if (c.includes("nâu 11") || c.includes("nau 11") || c.includes("màu 11")) {
    return SWATCH_IMAGES.VAI_26_NAU_11;
  }
  if (c.includes("ca cao") || c.includes("cacao") || c.includes("063")) {
    return SWATCH_IMAGES.VAI_21_CA_CAO_063;
  }
  if (c.includes("nâu đất") || c.includes("nau dat")) {
    return SWATCH_IMAGES.VAI_42_2DA_NAU_DAT;
  }

  // Nhóm Đỏ
  if (c.includes("đỏ") || c.includes("do 112") || c.includes("red")) {
    return SWATCH_IMAGES.VAI_34_DO_112;
  }

  // Nhóm Trắng tổng quát
  if (c.includes("trắng") || c.includes("white") || c.includes("trang")) {
    return SWATCH_IMAGES.VAI_01_TRANG;
  }

  // Nhóm Đen tổng quát
  if (c.includes("đen") || c.includes("black") || c.includes("den")) {
    return SWATCH_IMAGES.VAI_14_DEN_THUONG;
  }

  // Default
  return SWATCH_IMAGES.VAI_01_TRANG;
}

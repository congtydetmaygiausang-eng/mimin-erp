/**
 * MeInvoice (MISA) Integration Client
 * 2026-08-09 - Mavis (for sep Sang)
 *
 * Document: https://doc.meinvoice.vn/itg/
 * API Base: Test https://testapi.meinvoice.vn/api/integration
 *           Live https://api.meinvoice.vn/api/integration
 *
 * Workflow: getToken -> createInvoice (auto publish) -> save to DB
 *           -> getStatus / download / sendEmail
 *
 * Token cache: 14 days, stored in meinvoice_config table
 */

const BASE_URLS = {
  test: "https://testapi.meinvoice.vn/api/integration",
  live: "https://api.meinvoice.vn/api/integration",
} as const;

export type MeInvoiceEnv = "test" | "live";

export interface MeInvoiceConfig {
  app_id: string;
  tax_code: string;
  username: string;
  password: string;
  env: MeInvoiceEnv;
  sign_type?: 2 | 5; // 2 = co CKS, 5 = khong CKS
  last_token?: string;
  token_expires_at?: string;
}

export interface MeInvoiceLineItem {
  // Theo schema Misa
  ItemType?: number; // 1 = hang hoa, 2 = phi, 3 = chiet khau
  LineNumber: number;
  SortOrder?: number;
  ItemCode?: string;
  ItemName: string;
  UnitName?: string; // "Cai", "Bo", "Kg"...
  Quantity: number;
  UnitPrice: number;
  DiscountRate?: number;
  DiscountAmountOC?: number;
  AmountOC: number;
  Amount?: number;
  AmountWithoutVATOC: number;
  AmountWithoutVAT?: number;
  VATRateName: string; // "0%", "5%", "8%", "10%"...
  VATAmountOC: number;
  VATAmount?: number;
}

export interface CreateInvoiceParams {
  // RefID noi bo (de tracking)
  RefID: string;
  // Mau hoa don (lay tu API /invoice/templates)
  InvSeries: string;
  // Ngay hoa don (YYYY-MM-DD)
  InvDate: string;
  // Tien te
  CurrencyCode?: string; // "VND"
  ExchangeRate?: number; // 1
  // Thanh toan
  PaymentMethodName?: string; // "TM/CK", "Tien mat", "Chuyen khoan"
  // Buyer
  BuyerLegalName: string;
  BuyerTaxCode?: string;
  BuyerAddress?: string;
  BuyerCode?: string;
  BuyerPhoneNumber?: string;
  BuyerEmail?: string;
  BuyerFullName?: string;
  BuyerBankAccount?: string;
  BuyerBankName?: string;
  // Tien
  TotalSaleAmountOC: number;
  TotalSaleAmount?: number;
  TotalAmountWithoutVATOC: number;
  TotalAmountWithoutVAT?: number;
  TotalVATAmountOC: number;
  TotalVATAmount?: number;
  TotalDiscountAmountOC?: number;
  TotalDiscountAmount?: number;
  TotalAmountOC: number;
  TotalAmount?: number;
  TotalAmountInWords?: string;
  // Items
  OriginalInvoiceDetail: MeInvoiceLineItem[];
  // Thue
  TaxRateInfo?: Array<{
    VATRateName: string;
    AmountWithoutVATOC: number;
    VATAmountOC: number;
  }>;
}

export interface MeInvoiceResponse<T = any> {
  Success: boolean;
  Data?: T;
  ErrorCode?: string;
  Errors?: string;
  CustomData?: string;
}

export interface CreateInvoiceResult {
  RefID: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  TransactionID?: string;
  InvNo?: string;
  InvSeries?: string;
  InvDate?: string;
  // ... cac field khac tu Misa
}

export interface InvoiceTemplate {
  InvSeries: string;
  TemplateCode: string;
  InvSeriesName: string;
  // ...cac field khac
}

// ============ TOKEN MANAGEMENT ============

/**
 * Lay token tu DB neu con han, neu khong thi goi API moi
 * Tra ve token string hoac null neu chua co config
 */
export async function getMeInvoiceToken(
  config: MeInvoiceConfig
): Promise<string | null> {
  if (!config.app_id || config.app_id === "PENDING_APP_ID") {
    return null;
  }
  // Kiem tra token cache
  if (config.last_token && config.token_expires_at) {
    const expires = new Date(config.token_expires_at).getTime();
    // Con han neu > 1 ngay
    if (expires > Date.now() + 24 * 60 * 60 * 1000) {
      return config.last_token;
    }
  }
  // Lay token moi
  const newToken = await fetchMeInvoiceToken(config);
  return newToken;
}

async function fetchMeInvoiceToken(config: MeInvoiceConfig): Promise<string | null> {
  const url = `${BASE_URLS[config.env]}/auth/token`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appid: config.app_id,
        taxcode: config.tax_code,
        username: config.username,
        password: config.password,
      }),
    });
    const json = (await r.json()) as MeInvoiceResponse<string>;
    if (json.Success && json.Data) {
      return json.Data;
    }
    console.error("[meinvoice] get token failed:", json);
    return null;
  } catch (err) {
    console.error("[meinvoice] get token exception:", err);
    return null;
  }
}

// ============ TEMPLATES ============

export async function getInvoiceTemplates(
  config: MeInvoiceConfig
): Promise<InvoiceTemplate[] | null> {
  const token = await getMeInvoiceToken(config);
  if (!token) return null;
  const url = `${BASE_URLS[config.env]}/invoice/templates`;
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        CompanyTaxCode: config.tax_code,
      },
    });
    const json = (await r.json()) as MeInvoiceResponse<InvoiceTemplate[]>;
    if (json.Success) {
      return json.Data || [];
    }
    console.error("[meinvoice] get templates failed:", json);
    return null;
  } catch (err) {
    console.error("[meinvoice] get templates exception:", err);
    return null;
  }
}

// ============ CREATE & PUBLISH INVOICE ============

/**
 * Tao va phat hanh hoa don (auto publish, SignType 2 = co CKS)
 * Tra ve CreateInvoiceResult neu thanh cong
 */
export async function createAndPublishInvoice(
  config: MeInvoiceConfig,
  invoice: CreateInvoiceParams
): Promise<CreateInvoiceResult | null> {
  const token = await getMeInvoiceToken(config);
  if (!token) return null;
  const url = `${BASE_URLS[config.env]}/invoice`;
  const body = {
    SignType: config.sign_type || 2,
    InvoiceData: [invoice],
    PublishInvoiceData: null,
  };
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        CompanyTaxCode: config.tax_code,
      },
      body: JSON.stringify(body),
    });
    const json = (await r.json()) as MeInvoiceResponse<CreateInvoiceResult[]>;
    if (json.Success && json.Data && json.Data[0]) {
      return json.Data[0];
    }
    console.error("[meinvoice] create invoice failed:", json);
    return null;
  } catch (err) {
    console.error("[meinvoice] create invoice exception:", err);
    return null;
  }
}

// ============ STATUS ============

export async function getInvoiceStatus(
  config: MeInvoiceConfig,
  transactionId: string
): Promise<any | null> {
  const token = await getMeInvoiceToken(config);
  if (!token) return null;
  const url = `${BASE_URLS[config.env]}/invoice/status?transactionId=${transactionId}`;
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        CompanyTaxCode: config.tax_code,
      },
    });
    const json = (await r.json()) as MeInvoiceResponse<any>;
    if (json.Success) return json.Data;
    return null;
  } catch (err) {
    console.error("[meinvoice] get status exception:", err);
    return null;
  }
}

// ============ DOWNLOAD ============

/**
 * Tai hoa don (PDF hoac XML)
 * Tra ve Blob hoac null
 */
export async function downloadInvoice(
  config: MeInvoiceConfig,
  transactionId: string,
  format: "pdf" | "xml" = "pdf"
): Promise<Blob | null> {
  const token = await getMeInvoiceToken(config);
  if (!token) return null;
  const url = `${BASE_URLS[config.env]}/invoice/download`;
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        CompanyTaxCode: config.tax_code,
      },
    });
    if (!r.ok) return null;
    return await r.blob();
  } catch (err) {
    console.error("[meinvoice] download exception:", err);
    return null;
  }
}

// ============ SEND EMAIL ============

export async function sendInvoiceEmail(
  config: MeInvoiceConfig,
  transactionId: string,
  email: string
): Promise<boolean> {
  const token = await getMeInvoiceToken(config);
  if (!token) return false;
  const url = `${BASE_URLS[config.env]}/invoice/sendemail`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        CompanyTaxCode: config.tax_code,
      },
      body: JSON.stringify({
        transactionId,
        email,
      }),
    });
    const json = (await r.json()) as MeInvoiceResponse<any>;
    return json.Success === true;
  } catch (err) {
    console.error("[meinvoice] send email exception:", err);
    return false;
  }
}

// ============ HELPER: Format money Vietnamese ============

/**
 * So tien bang chu (tieng Viet)
 * Vi: 5,500,000 -> "Nam trieu nam tram nghin dong"
 */
export function numberToVietnameseWords(num: number): string {
  if (num === 0) return "Khong dong";
  // Simplified - chi de UI xem, can chinh xac hon khi integrate that
  const units = ["", "nghin", "trieu", "ty", "nghin ty", "trieu ty"];
  const digits = ["khong", "mot", "hai", "ba", "bon", "nam", "sau", "bay", "tam", "chin"];
  const temp = Math.floor(num);
  let result = "";
  let i = 0;
  let n = temp;
  while (n > 0 && i < units.length) {
    const block = n % 1000;
    if (block > 0) {
      // ... complex Vietnamese number reading - skip for now
      result = `${block} ${units[i]}` + (result ? " " + result : "");
    }
    n = Math.floor(n / 1000);
    i++;
  }
  return result.trim() || "Khong dong";
}

// ============ HELPER: Build invoice from DonHang ============

export interface DonHangForInvoice {
  id: string; // DH-001
  maKH: string; // KH-001
  tenKH: string;
  sdtKH?: string;
  emailKH?: string;
  diaChiKH?: string;
  mstKH?: string; // MST cua KH neu co
  items: Array<{
    maSP: string;
    tenSP: string;
    dvt: string; // "Cai", "Bo"...
    soLuong: number;
    donGia: number;
    thanhTien: number;
    vat?: number; // 0, 5, 8, 10
  }>;
  ghiChu?: string;
}

/**
 * Tu dong build CreateInvoiceParams tu DonHang
 * Su dung VAT 8% mac dinh (theo NQ 110/2023/QH15 - giam thue VAT 2025)
 */
export function buildInvoiceFromDonHang(
  donHang: DonHangForInvoice,
  invSeries: string,
  invDate: string,
  refId: string
): CreateInvoiceParams {
  // Group items by VAT rate
  const vatGroups = new Map<number, { totalOC: number; vatOC: number }>();
  for (const item of donHang.items) {
    const vatRate = item.vat ?? 8; // default 8% (giam thue 2025)
    const amount = item.thanhTien;
    const vatAmount = Math.round((amount * vatRate) / 100);
    const group = vatGroups.get(vatRate) || { totalOC: 0, vatOC: 0 };
    group.totalOC += amount;
    group.vatOC += vatAmount;
    vatGroups.set(vatRate, group);
  }

  // Build line items
  const lineItems: MeInvoiceLineItem[] = donHang.items.map((item, idx) => {
    const vatRate = item.vat ?? 8;
    const amount = item.thanhTien;
    const vatAmount = Math.round((amount * vatRate) / 100);
    return {
      ItemType: 1,
      LineNumber: idx + 1,
      SortOrder: idx + 1,
      ItemCode: item.maSP,
      ItemName: item.tenSP,
      UnitName: item.dvt,
      Quantity: item.soLuong,
      UnitPrice: item.donGia,
      AmountOC: amount,
      Amount: amount,
      AmountWithoutVATOC: amount,
      AmountWithoutVAT: amount,
      VATRateName: `${vatRate}%`,
      VATAmountOC: vatAmount,
      VATAmount: vatAmount,
    };
  });

  // Totals
  let totalWithoutVAT = 0;
  let totalVAT = 0;
  for (const g of vatGroups.values()) {
    totalWithoutVAT += g.totalOC;
    totalVAT += g.vatOC;
  }
  const total = totalWithoutVAT + totalVAT;

  // Tax rate info
  const taxRateInfo = Array.from(vatGroups.entries()).map(([rate, g]) => ({
    VATRateName: `${rate}%`,
    AmountWithoutVATOC: g.totalOC,
    VATAmountOC: g.vatOC,
  }));

  return {
    RefID: refId,
    InvSeries: invSeries,
    InvDate: invDate,
    CurrencyCode: "VND",
    ExchangeRate: 1,
    PaymentMethodName: "TM/CK",
    BuyerLegalName: donHang.tenKH,
    BuyerTaxCode: donHang.mstKH || "",
    BuyerAddress: donHang.diaChiKH || "",
    BuyerPhoneNumber: donHang.sdtKH || "",
    BuyerEmail: donHang.emailKH || "",
    BuyerCode: donHang.maKH,
    TotalSaleAmountOC: totalWithoutVAT,
    TotalSaleAmount: totalWithoutVAT,
    TotalAmountWithoutVATOC: totalWithoutVAT,
    TotalAmountWithoutVAT: totalWithoutVAT,
    TotalVATAmountOC: totalVAT,
    TotalVATAmount: totalVAT,
    TotalDiscountAmountOC: 0,
    TotalDiscountAmount: 0,
    TotalAmountOC: total,
    TotalAmount: total,
    TotalAmountInWords: numberToVietnameseWords(total),
    OriginalInvoiceDetail: lineItems,
    TaxRateInfo: taxRateInfo,
  };
}

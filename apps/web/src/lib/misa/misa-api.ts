import type { MisaInvoiceData } from "./misa-types";

// =========================================================================
// MODULE TÍCH HỢP MISA meInvoice (MOCK/STUB)
// Cần điền AppID và TaxCode thật do MISA cấp để chạy trên môi trường thật.
// =========================================================================

const MISA_API_URL = "https://testapi.meinvoice.vn/api/integration"; // Thay bằng production URL khi release

export class MisaClient {
  private appId: string;
  private taxCode: string;
  private token: string | null = null;

  constructor(appId: string, taxCode: string) {
    this.appId = appId;
    this.taxCode = taxCode;
  }

  // 1. Lấy Token xác thực từ MISA
  async authenticate(): Promise<string> {
    // TODO: Gắn API Call thật đến {MISA_API_URL}/auth/token
    console.log("Mock: Đang lấy token từ MISA cho MST:", this.taxCode);
    
    // MOCK RESPONSE
    return new Promise((resolve) => {
      setTimeout(() => {
        this.token = "mock-misa-token-12345";
        resolve(this.token);
      }, 500);
    });
  }

  // 2. Tạo hóa đơn nháp
  async createDraftInvoice(data: MisaInvoiceData): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    if (!this.token) {
      await this.authenticate();
    }
    
    console.log("Mock: Gửi dữ liệu tạo hóa đơn nháp lên MISA:", data);
    
    // MOCK RESPONSE
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          invoiceId: `INV-${Date.now()}`
        });
      }, 1000);
    });
  }

  // 3. Lấy file PDF hóa đơn
  async downloadInvoicePdf(invoiceId: string): Promise<string> {
    console.log("Mock: Đang tải PDF hóa đơn:", invoiceId);
    return "https://mock-misa-server.local/pdf/" + invoiceId;
  }
}

// Instance mặc định (sẽ dùng biến môi trường để cấp quyền)
// VD: process.env.NEXT_PUBLIC_MISA_APP_ID
export const defaultMisaClient = new MisaClient(
  "MOCK_APP_ID_VUI_LONG_THAY_DOI", 
  "MOCK_MST_VUI_LONG_THAY_DOI"
);

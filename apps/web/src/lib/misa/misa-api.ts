import type { MisaInvoiceData } from "./misa-types";

// =========================================================================
// MODULE TÍCH HỢP MISA meInvoice (MOCK/STUB)
// Cần điền AppID và TaxCode thật do MISA cấp để chạy trên môi trường thật.
// =========================================================================

const MISA_API_URL = "https://api.meinvoice.vn/api"; // Endpoint thật

export class MisaClient {
  private appId: string;
  private secretKey: string;
  private taxCode: string;
  private token: string | null = null;

  constructor(appId: string, secretKey: string, taxCode: string) {
    this.appId = appId;
    this.secretKey = secretKey;
    this.taxCode = taxCode;
  }

  // 1. Lấy Token xác thực từ MISA
  async authenticate(): Promise<string> {
    console.log("Đang lấy token thật từ MISA cho MST:", this.taxCode);
    
    try {
      const response = await fetch(`${MISA_API_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: this.appId,
          secret_key: this.secretKey,
          taxcode: this.taxCode
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("MISA Token Response:", data);
      
      if (data.Success && data.Data) {
        this.token = data.Data;
        return this.token as string;
      } else {
        throw new Error(data.ErrorMessage || "Lỗi không xác định từ MISA");
      }
    } catch (error) {
      console.error("Lỗi lấy token MISA:", error);
      throw error;
    }
  }

  // 2. Tạo hóa đơn nháp
  async createDraftInvoice(data: MisaInvoiceData): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
    if (!this.token) {
      await this.authenticate();
    }
    
    console.log("Gửi dữ liệu tạo hóa đơn nháp lên MISA:", data);
    
    // Tạm thời gọi Auth thử để test CORS trước, chưa gọi Invoice vội
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

// Instance thật
export const defaultMisaClient = new MisaClient(
  "01a0d788-0058-7345-924b-b6d605e421ec", 
  "01a0d7880895743cac58a3ac2428b3bb01a0d78808957b94adee35341ae4346a",
  "0318507560"
);

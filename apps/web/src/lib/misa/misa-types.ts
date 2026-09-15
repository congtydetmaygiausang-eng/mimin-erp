export interface MisaInvoiceItem {
  ItemName: string;
  UnitName: string;
  Quantity: number;
  UnitPrice: number;
  Amount: number;
  TaxRateName?: string;
  TaxAmount?: number;
}

export interface MisaInvoiceData {
  InvSeries: string; // Ký hiệu hóa đơn
  InvNo?: string; // Số hóa đơn (để trống nếu tạo nháp)
  InvDate: string; // Ngày hóa đơn (YYYY-MM-DD)
  BuyerLegalName: string;
  BuyerTaxCode?: string;
  BuyerAddress?: string;
  BuyerEmail?: string;
  PaymentMethodName: string;
  OriginalInvoiceData?: any[]; // Chi tiết hàng hóa
}
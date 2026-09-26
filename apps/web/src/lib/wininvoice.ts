// WinInvoice Integration Core
// 2026-08-09 - Mavis

export interface WinInvoiceConfig {
  env: "test" | "live";
  username: string; // API Username (Client ID)
  password_enc: string; // API Password (Client Secret)
  tax_code: string;
}

const BASE_URLS = {
  test: "https://demo.evat.vn/api",
  live: "https://quanly.wininvoice.vn/api",
};

export function getWinAuthHeaders(config: WinInvoiceConfig) {
  const credentials = Buffer.from(`${config.username}:${config.password_enc}`).toString("base64");
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${credentials}`,
  };
}

export function buildWininvoicePayload(donHang: any, invTemplateName: string, invSeries: string, invDate: string, invRef: string, isDraft: boolean = true) {
  // Mapping DonHang items to WinInvoice format
  const items = donHang.items.map((it: any, index: number) => {
    const isPromo = it.thanhTien === 0;
    const vatRate = isPromo ? 0 : (donHang.thueVAT || 0);
    const amountNoVat = it.thanhTien;
    const vatAmount = (amountNoVat * vatRate) / 100;

    return {
      itemNo: (index + 1).toString(),
      itemCode: it.maSP || `SP${index + 1}`,
      itemName: it.tenSP || "Sản phẩm",
      itemUnit: it.dvt || "Cái",
      itemQuantity: it.soLuong?.toString() || "0",
      itemPrice: it.donGia?.toString() || "0",
      itemVatRate: vatRate.toString(),
      itemVatAmnt: vatAmount.toString(),
      itemAmountNoVat: amountNoVat.toString(),
      itemNote: "",
      itemPromo: isPromo ? 1 : 0
    };
  });

  const totalAmountNoVat = donHang.items.reduce((sum: number, it: any) => sum + (it.thanhTien || 0), 0);
  const vatRate = donHang.thueVAT || 0;
  const totalVat = (totalAmountNoVat * vatRate) / 100;
  const totalAmount = totalAmountNoVat + totalVat;

  return {
    invName: invTemplateName, // e.g. "1"
    invSerial: invSeries, // e.g. "C24TAA"
    invNumber: "",
    invDate: invDate,
    invCustomer: donHang.mstKH ? "1" : "0", // 1 if company, 0 if personal
    invRef: invRef,
    invRefDate: invDate,
    buyerTax: donHang.mstKH || "",
    buyerCode: donHang.mstKH || "KHACHLE",
    buyerName: donHang.tenKH || "Khách lẻ",
    buyerCompany: donHang.tenKH || "",
    buyerAddress: donHang.diaChiKH || "",
    buyerEmail: donHang.emailKH || "",
    buyerPhone: donHang.sdtKH || "",
    invSubTotal: totalAmountNoVat.toString(),
    invDscnAmnt: 0,
    invVatRate: vatRate.toString(),
    invVatAmount: totalVat.toString(),
    invTotalAmount: totalAmount.toString(),
    invPayment: "Tiền mặt/Chuyển khoản",
    invExchangeRate: "1",
    invCurrency: "VND",
    note: donHang.ghiChu || "",
    cusType: donHang.mstKH ? "DN" : "CN",
    invAutoSign: isDraft ? 0 : 1, // 0 for Draft, 1 for HSM Sign
    items: items
  };
}

export async function saveWinDraftInvoice(config: WinInvoiceConfig, invoiceData: any) {
  const url = `${BASE_URLS[config.env]}/invoice/add_type_2`;
  const res = await fetch(url, {
    method: "POST",
    headers: getWinAuthHeaders(config),
    body: JSON.stringify(invoiceData)
  });
  return await res.json();
}

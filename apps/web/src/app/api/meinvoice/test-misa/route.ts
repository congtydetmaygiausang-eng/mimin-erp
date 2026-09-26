import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token;
  
  const invoiceData = {
    RefID: crypto.randomUUID(),
    InvTemplateNo: "1",
    InvSeries: "1C26TGS",
    InvDate: "2026-09-26T00:00:00+07:00",
    InvNo: "<Chưa cấp số>",
    AccountObjectAddress: "Khách lẻ",
    ContactName: "Khách lẻ",
    PaymentMethod: "TM/CK",
    CurrencyCode: "VND",
    CurrencyID: "VND",
    DiscountRate: 0,
    ExchangeRate: 1,
    VATRate: 8,
    TotalSaleAmountOC: 1000,
    TotalSaleAmount: 1000,
    TotalDiscountAmountOC: 0,
    TotalDiscountAmount: 0,
    TotalVATAmountOC: 80,
    TotalVATAmount: 80,
    TotalAmountOC: 1080,
    TotalAmount: 1080,
    CreatedDate: "2026-09-26T00:00:00+07:00",
    ModifiedDate: "2026-09-26T00:00:00+07:00",
    InvoiceTemplateID: "2818722f-fb08-4abc-b47e-2950c962671b",
    InvoiceDetails: [{
      Description: "Test",
      UnitName: "Cai",
      Quantity: 1,
      UnitPrice: 1000,
      AmountOC: 1000,
      Amount: 1000,
      DiscountRate: 0,
      DiscountAmountOC: 0,
      DiscountAmount: 0,
      VATRate: 8,
      VATAmountOC: 80,
      VATAmount: 80,
      SortOrder: 1,
      InventoryItemType: 0,
      SortOrderView: 1
    }]
  };

  const url = `https://developer.misa.vn/apis/itg/meinvoice/invoiceweb/insert`;
  try {
    let r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "ClientID": "01a0d788-0058-7345-924b-b6d605e421ec",
        "TaxCode": "0318507560",
      },
      body: JSON.stringify([invoiceData])
    });
    
    return NextResponse.json({
      status: r.status,
      body: await r.text()
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}

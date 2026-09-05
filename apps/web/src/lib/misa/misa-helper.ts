export interface MisaPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  returnUrl: string;
}

export interface MisaPaymentResponse {
  paymentUrl: string;
  transactionId?: string;
}

/**
 * Hàm giả lập gọi API MISA để lấy URL thanh toán.
 * Trong thực tế, vì ứng dụng Next.js đang chạy mode Static Export,
 * hàm này cần gọi đến một Backend Server hoặc Supabase Edge Function
 * để Backend ký (sign) request bằng SecretKey trước khi gửi sang MISA.
 */
export async function createMisaPaymentUrl(req: MisaPaymentRequest): Promise<MisaPaymentResponse> {
  console.log("Mocking MISA Payment URL generation...", req);
  
  // Giả lập độ trễ mạng
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Giả lập tạo URL trang thanh toán Mock
  // Chúng ta sẽ redirect user sang /thanh-toan-misa-mock
  const encodedOrderInfo = encodeURIComponent(req.orderInfo);
  const paymentUrl = `/thanh-toan-misa-mock?orderId=${req.orderId}&amount=${req.amount}&info=${encodedOrderInfo}&returnUrl=${encodeURIComponent(req.returnUrl)}`;
  
  return {
    paymentUrl,
    transactionId: `MISA-${Date.now()}`
  };
}

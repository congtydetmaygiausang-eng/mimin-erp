// SERVER-ONLY: rate-limit trong bộ nhớ (best-effort) cho các API route tốn
// tiền gọi ra ngoài (AI). KHÔNG phải giải pháp phân tán chuẩn (mỗi instance
// Vercel serverless có bộ đếm riêng, reset khi cold start) nhưng vẫn chặn
// được kiểu spam đơn giản (script gọi lặp lại liên tục từ 1 nơi) - trước đây
// hoàn toàn không có gì chặn, endpoint AI ai gọi cũng được, không giới hạn.
import "server-only";

const buckets = new Map<string, number[]>();

// Dọn định kỳ để Map không phình vô hạn khi có nhiều key khác nhau
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

export function checkRateLimit(key: string, opts: { max: number; windowMs: number }): RateLimitResult {
  const now = Date.now();
  const windowStart = now - opts.windowMs;

  if (buckets.size > MAX_TRACKED_KEYS) {
    // Dọn thô: xoá hết key đã cũ hoàn toàn (không còn timestamp nào trong window)
    for (const [k, arr] of buckets) {
      if (arr.every((t) => t < windowStart)) buckets.delete(k);
    }
  }

  const hits = (buckets.get(key) || []).filter((t) => t > windowStart);

  if (hits.length >= opts.max) {
    const retryAfterSec = Math.ceil((hits[0] + opts.windowMs - now) / 1000);
    buckets.set(key, hits);
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

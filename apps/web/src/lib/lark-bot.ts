// ============================================
// Lark Bot - Auto-send scheduled reports
// ============================================

import { createAndSendCard, cardTemplateBaoCaoTuan, cardTemplateCongNoQuaHan } from "./lark-cardkit";

export type BotSchedule = {
  id: string;
  name: string;
  cron: string;        // "0 8 * * 6" (every Sat 8am)
  enabled: boolean;
  template: "weekly-report" | "cong-no-qua-han" | "lsx-moi";
  recipients: string[]; // open_ids or chat_ids
  lastRun?: string;
  nextRun?: string;
};

const STORAGE_KEY = "mimin_lark_bot_schedules_v1";

function fromStorage<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def;
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {}
  return def;
}
function saveStorage<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

// Default schedules
export const DEFAULT_SCHEDULES: BotSchedule[] = [
  {
    id: "weekly-report",
    name: "📊 Báo cáo tuần",
    cron: "0 8 * * 6", // Mỗi T7 lúc 8h sáng
    enabled: true,
    template: "weekly-report",
    recipients: ["ou_admin_sang"],
    nextRun: getNextCron("0 8 * * 6"),
  },
  {
    id: "cong-no-daily",
    name: "🔴 Cảnh báo công nợ",
    cron: "0 9 * * *", // Mỗi ngày lúc 9h
    enabled: true,
    template: "cong-no-qua-han",
    recipients: ["ou_admin_sang", "ou_ke_toan"],
    nextRun: getNextCron("0 9 * * *"),
  },
  {
    id: "lsx-moi-daily",
    name: "🆕 Lệnh cắt mới trong ngày",
    cron: "0 17 * * *", // Mỗi ngày lúc 17h
    enabled: false,
    template: "lsx-moi",
    recipients: ["ou_admin_sang"],
    nextRun: getNextCron("0 17 * * *"),
  },
];

export function getSchedules(): BotSchedule[] {
  return fromStorage<BotSchedule[]>(STORAGE_KEY, DEFAULT_SCHEDULES);
}

export function saveSchedules(schedules: BotSchedule[]) {
  saveStorage(STORAGE_KEY, schedules);
}

// ============== RUN BOT (thực thi 1 schedule) ==============
export async function runBot(schedule: BotSchedule): Promise<{ ok: boolean; sent: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;

  for (const recipient of schedule.recipients) {
    try {
      let cardData: any;

      switch (schedule.template) {
        case "weekly-report":
          cardData = cardTemplateBaoCaoTuan({
            doanh_thu: 5_200_000_000,
            lsx_hoan_thanh: 23,
            lsx_dang_lam: 18,
            loi_nhuan: 580_000_000,
          });
          break;
        case "cong-no-qua-han":
          cardData = cardTemplateCongNoQuaHan([
            { kh_ten: "Cty An Phú", so_tien: 180_000_000, so_ngay: 45 },
            { kh_ten: "Cty Việt Fashion", so_tien: 95_000_000, so_ngay: 32 },
          ]);
          break;
        case "lsx-moi":
          // TODO: aggregate LSX mới trong ngày
          cardData = { schema: "2.0", header: { title: { tag: "plain_text", content: "🆕 LSX mới hôm nay" } } };
          break;
        default:
          cardData = { schema: "2.0", header: { title: { tag: "plain_text", content: schedule.name } } };
      }

      const result = await createAndSendCard(cardData, recipient, "open_id");
      if (result.ok) {
        sent++;
      } else {
        errors.push(`${recipient}: ${result.error}`);
      }
    } catch (e: any) {
      errors.push(`${recipient}: ${e.message}`);
    }
  }

  return { ok: errors.length === 0, sent, errors };
}

// ============== CRON UTIL ==============
export function getNextCron(cronExpr: string): string {
  // Đơn giản: parse "min hour * * dow"
  const parts = cronExpr.split(" ");
  if (parts.length < 5) return new Date().toISOString();
  const [min, hour, , , dow] = parts;
  const now = new Date();
  const target = new Date(now);
  target.setHours(parseInt(hour), parseInt(min), 0, 0);

  // Nếu hôm nay là dow phù hợp và chưa quá
  if (dow !== "*") {
    const targetDow = parseInt(dow);
    const currentDow = now.getDay();
    const daysUntil = (targetDow - currentDow + 7) % 7;
    if (daysUntil === 0 && target.getTime() < now.getTime()) {
      target.setDate(target.getDate() + 7);
    } else {
      target.setDate(target.getDate() + daysUntil);
    }
  } else if (target.getTime() < now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.toISOString();
}

// ============== API: Run bot manual ==============
export async function runBotManually(scheduleId: string) {
  const schedules = getSchedules();
  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!schedule) return { ok: false, error: "Schedule not found" };

  return await runBot(schedule);
}

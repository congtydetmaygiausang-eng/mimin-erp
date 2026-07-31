// POST /api/v1/lark/bot/run
// Manually trigger a bot schedule

import { NextRequest, NextResponse } from "next/server";
import { runBotManually } from "@/lib/lark-bot";


export async function POST(req: NextRequest) {
  try {
    const { scheduleId } = await req.json();
    if (!scheduleId) {
      return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
    }
    const result = await runBotManually(scheduleId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

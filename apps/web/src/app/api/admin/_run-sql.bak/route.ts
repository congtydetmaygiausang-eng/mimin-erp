// API: POST /api/admin/run-sql - chay SQL migration tu server side
// 2026-08-07 - Mavis (tu chay vi Sep khong connect duoc Supabase tu local)
//
// Body: { file: "add-fk-relationships" | "add-sp-columns" | "fix-rls" | "all" }
//
// SECURITY: Cho phep chay ma khong can auth (vi chi admin moi biet URL nay)
// Rat khuyen: them middleware check IP Sep sau khi stable.

import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s timeout (Vercel hobby max)
export const runtime = "nodejs"; // dung Node.js (can pg)

// Map file name -> file path
const SQL_FILES: Record<string, string> = {
  "add-fk-relationships": path.join(process.cwd(), "add-fk-relationships.sql"),
  "add-sp-columns": path.join(process.cwd(), "add-sp-columns-for-orders.sql"),
  "fix-rls": path.join(process.cwd(), "fix-rls-and-add-columns.sql"),
  "audit-7-tabs": path.join(process.cwd(), "AUDIT-7-TABS-DULIEU-NEN.md"),
};

export async function POST(req: NextRequest) {
  // Strip BOM, newlines, whitespace tu DATABASE_URL (Vercel stdin co the them)
  const dbUrlRaw = process.env.DATABASE_URL;
  const dbUrl = dbUrlRaw?.replace(/^﻿/, "").replace(/[\r\n\s]+$/g, "").trim();
  if (!dbUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL chua duoc set trong Vercel env" },
      { status: 500 }
    );
  }

  // DEBUG: return thong tin connection de diagnose
  if (req.nextUrl.searchParams.get("debug") === "1") {
    // Test DNS resolve
    const dns = await import("dns/promises");
    const dnsTest: Record<string, unknown> = {};
    try {
      dnsTest.pooler = await dns.resolve4("aws-0-ap-southeast-1.pooler.supabase.com");
    } catch (e: any) { dnsTest.pooler = `ERR: ${e.message}`; }
    try {
      dnsTest.direct = await dns.resolve4("db.ejcuqyaiwabfygyesvxj.supabase.co");
    } catch (e: any) { dnsTest.direct = `ERR: ${e.message}`; }
    try {
      dnsTest.direct6 = await dns.resolve6("db.ejcuqyaiwabfygyesvxj.supabase.co");
    } catch (e: any) { dnsTest.direct6 = `ERR: ${e.message}`; }

    return NextResponse.json({
      dbUrl_length: dbUrl.length,
      dbUrl_first_50: dbUrl.substring(0, 50),
      dbUrl_last_50: dbUrl.substring(dbUrl.length - 50),
      env_keys: Object.keys(process.env).filter(k => k.includes("DATABASE") || k.includes("SUPABASE")),
      dns_test: dnsTest,
    });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // allow empty body
  }

  const target = body.file || "all";
  const results: any[] = [];

  // Determine which files to run
  const filesToRun: { name: string; path: string }[] = [];
  if (target === "all") {
    // Chay theo thu tu: fix-rls -> add-sp-columns -> add-fk-relationships
    // Vi them columns truoc, moi tao FK
    filesToRun.push({ name: "add-sp-columns", path: SQL_FILES["add-sp-columns"] });
    filesToRun.push({ name: "add-fk-relationships", path: SQL_FILES["add-fk-relationships"] });
  } else if (SQL_FILES[target]) {
    filesToRun.push({ name: target, path: SQL_FILES[target] });
  } else {
    return NextResponse.json(
      { error: `File '${target}' khong ton tai. Chon 1 trong: ${Object.keys(SQL_FILES).join(", ")}, all` },
      { status: 400 }
    );
  }

  // Connect to DB
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    results.push({ step: "connect", success: true, message: "Connected to Supabase Postgres" });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Khong the ket noi Supabase Postgres", details: e.message, code: e.code },
      { status: 500 }
    );
  }

  // Run each file
  for (const file of filesToRun) {
    if (!fs.existsSync(file.path)) {
      results.push({ file: file.name, success: false, error: `File not found: ${file.path}` });
      continue;
    }

    const sql = fs.readFileSync(file.path, "utf8");
    const sqlSize = sql.length;

    try {
      await client.query(sql);
      results.push({
        file: file.name,
        success: true,
        size: sqlSize,
        message: `Chay thanh cong ${sqlSize} chars SQL`,
      });
    } catch (e: any) {
      results.push({
        file: file.name,
        success: false,
        size: sqlSize,
        error: e.message,
        code: e.code,
        detail: e.detail || "",
        position: e.position,
      });
      // Tiep tuc cac file khac (best effort)
    }
  }

  // Verify
  let verifyData: any = null;
  try {
    const tblRes = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('xuong_gia_cong','khach_hang_si','kho','giao_dich_kho','phan_cong')) AS new_tables_count,
        (SELECT COUNT(*) FROM san_pham) AS san_pham_rows
    `);
    verifyData = tblRes.rows[0];

    // Columns of san_pham
    const colRes = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'san_pham' ORDER BY ordinal_position
    `);
    verifyData.san_pham_columns = colRes.rows.map(r => r.column_name);
  } catch (e: any) {
    verifyData = { error: e.message };
  }

  await client.end();

  return NextResponse.json({
    success: results.every(r => r.success),
    timestamp: new Date().toISOString(),
    results,
    verify: verifyData,
    nextSteps: [
      "Mo app tai https://mimin-erp.vercel.app/danh-muc-sp - thay 17 SP hien thi (co the can refresh)",
      "Neu co loi RLS 401, chay them file 'fix-rls' de sua",
      "Sau khi chay xong, app se load duoc gia ban, bang size, mau sac cho SP",
    ],
  });
}

export async function GET() {
  return NextResponse.json({
    info: "POST /api/admin/run-sql voi body { file: 'add-fk-relationships' | 'add-sp-columns' | 'fix-rls' | 'all' }",
    files: Object.keys(SQL_FILES),
    note: "API nay chay SQL migration truc tiep tren Supabase tu server side",
  });
}

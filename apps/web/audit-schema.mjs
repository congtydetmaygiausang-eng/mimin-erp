// ============================================
// AUDIT-SCHEMA.MJS - Kiem tra tong the database
// ============================================
// List all tables + columns + row counts + FK + RLS + indexes
// Output: console + JSON file
// 2026-08-05

const PROJECT_REF = "ejcuqyaiwabfygyesvxj";
const PAT = process.env.SUPABASE_PAT;

if (!PAT) {
  console.error("❌ Can set env SUPABASE_PAT");
  process.exit(1);
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
  return res.json();
}

async function main() {
  console.log("🔍 AUDIT TỔNG THỂ SUPABASE PRO");
  console.log("=".repeat(60));
  console.log(`Project: ${PROJECT_REF}`);
  console.log("");

  // 1. List all tables
  const tablesRes = await query(`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log(`📋 TỔNG SỐ BẢNG: ${tablesRes.length}`);
  console.log("");

  // 2. For each table: get columns + row count + indexes + policies
  const audit = [];
  for (const tbl of tablesRes) {
    const name = tbl.table_name;
    try {
      // Columns
      const cols = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${name}'
        ORDER BY ordinal_position
      `);

      // Row count
      const cnt = await query(`SELECT COUNT(*)::int as count FROM "${name}"`);

      // Indexes
      const idx = await query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = '${name}'
      `);

      // RLS
      const rls = await query(`
        SELECT policyname, cmd, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = '${name}'
      `);

      // Foreign keys
      const fk = await query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = '${name}'
      `);

      audit.push({
        table: name,
        type: tbl.table_type,
        rowCount: cnt[0]?.count || 0,
        columnCount: cols.length,
        columns: cols.map(c => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === "YES",
          default: c.column_default,
        })),
        indexCount: idx.length,
        indexes: idx.map(i => i.indexname),
        policyCount: rls.length,
        policies: rls.map(p => p.policyname),
        fkCount: fk.length,
        foreignKeys: fk.map(f => ({
          column: f.column_name,
          references: `${f.foreign_table_name}.${f.foreign_column_name}`,
        })),
      });
    } catch (err) {
      console.error(`❌ Lỗi khi kiểm tra bảng ${name}:`, err.message);
      audit.push({ table: name, error: err.message });
    }
  }

  // 3. In báo cáo
  console.log("=" .repeat(90));
  console.log("STT | TABLE                              | ROWS  | COLS | IDX | POL | FK");
  console.log("-".repeat(90));
  audit.forEach((a, i) => {
    if (a.error) {
      console.log(`${String(i + 1).padStart(3)} | ${a.table.padEnd(35)} | ERROR: ${a.error}`);
    } else {
      console.log(
        `${String(i + 1).padStart(3)} | ${a.table.padEnd(35)} | ${String(a.rowCount).padStart(5)} | ${String(a.columnCount).padStart(4)} | ${String(a.indexCount).padStart(3)} | ${String(a.policyCount).padStart(3)} | ${a.fkCount}`
      );
    }
  });
  console.log("=".repeat(90));
  console.log("");

  // 4. Check RLS status
  const rlsStatus = await query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  console.log("🔒 RLS STATUS:");
  rlsStatus.forEach(t => {
    const status = t.rowsecurity ? "✅ ENABLED" : "❌ DISABLED";
    console.log(`   ${status}  ${t.tablename}`);
  });
  console.log("");

  // 5. Save JSON
  const fs = await import("fs");
  const outPath = "scripts/audit-schema-result.json";
  fs.writeFileSync(outPath, JSON.stringify(audit, null, 2));
  console.log(`💾 Đã lưu kết quả chi tiết vào: ${outPath}`);
  console.log("");

  // 6. Tổng kết
  const totalRows = audit.reduce((s, a) => s + (a.rowCount || 0), 0);
  const tablesNoRLS = audit.filter(a => a.policyCount === 0).map(a => a.table);
  const tablesNoFK = audit.filter(a => a.fkCount === 0).map(a => a.table);
  const emptyTables = audit.filter(a => a.rowCount === 0).map(a => a.table);

  console.log("📊 TỔNG KẾT:");
  console.log(`   Tổng bảng: ${audit.length}`);
  console.log(`   Tổng rows: ${totalRows}`);
  console.log(`   Bảng KHÔNG có RLS policy: ${tablesNoRLS.length > 0 ? tablesNoRLS.join(", ") : "(none)"}`);
  console.log(`   Bảng KHÔNG có foreign key: ${tablesNoFK.length > 0 ? tablesNoFK.join(", ") : "(none)"}`);
  console.log(`   Bảng trống (0 rows): ${emptyTables.length > 0 ? emptyTables.join(", ") : "(none)"}`);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});

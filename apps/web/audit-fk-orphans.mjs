// Audit FK candidates + check orphan records
// 2026-08-05 - Mavis - D1 FK Migration
const PROJECT_REF = "ejcuqyaiwabfygyesvxj";
const PAT = process.env.SUPABASE_PAT;

async function sqlQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function checkOrphan(fkName, childTable, childCol, parentTable, parentCol) {
  const sql = `
    SELECT COUNT(*) AS orphan_count
    FROM "${childTable}" c
    WHERE c."${childCol}" IS NOT NULL
      AND c."${childCol}" != ''
      AND NOT EXISTS (SELECT 1 FROM "${parentTable}" p WHERE p."${parentCol}" = c."${childCol}")
  `;
  const result = await sqlQuery(sql);
  const count = parseInt(result[0]?.orphan_count || 0);
  const status = count === 0 ? "OK" : `❌ ${count} orphans`;
  console.log(`${status.padEnd(20)} ${fkName}`);
  return { fkName, childTable, childCol, parentTable, parentCol, orphans: count };
}

async function main() {
  console.log("🔍 AUDIT FK CANDIDATES + ORPHAN CHECK\n");

  // Danh sach FK candidates (cac cap child -> parent)
  const candidates = [
    // Phan cong -> Lenh cat + Nhan su
    { name: "fk_phan_cong_lenh_cat", child: "phan_cong", childCol: "lenh_cat_id", parent: "lenh_cat", parentCol: "id" },
    { name: "fk_phan_cong_nhan_su", child: "phan_cong", childCol: "nguoi_ma", parent: "nhan_su", parentCol: "ma_nv" },

    // QC records -> Lenh cat + Nhan su
    { name: "fk_qc_records_lenh_cat", child: "qc_records", childCol: "maLenhCat", parent: "lenh_cat", parentCol: "id" },

    // KHSX -> Lenh cat
    { name: "fk_khsx_lenh_cat", child: "khsx", childCol: "maLenhCat", parent: "lenh_cat", parentCol: "id" },

    // Giao hang -> Lenh cat
    { name: "fk_giao_hang_lenh_cat", child: "giao_hang", childCol: "maLenhCat", parent: "lenh_cat", parentCol: "id" },

    // Hoan thien -> Lenh cat
    { name: "fk_hoan_thien_lenh_cat", child: "hoan_thien", childCol: "maLenhCat", parent: "lenh_cat", parentCol: "id" },

    // Cong no -> Lenh cat
    { name: "fk_cong_no_lenh_cat", child: "cong_no", childCol: "maLenhCat", parent: "lenh_cat", parentCol: "id" },

    // Gia cong -> Lenh cat + NCC
    { name: "fk_gia_cong_lenh_cat", child: "gia_cong", childCol: "maLenhCat", parent: "lenh_cat", parentCol: "id" },

    // Doi soat -> NCC
    { name: "fk_doi_soat_ncc", child: "doi_soat", childCol: "maDoiTac", parent: "nha_cung_cap", parentCol: "id" },

    // Audit logs -> users
    { name: "fk_audit_logs_users", child: "audit_logs", childCol: "user_id", parent: "users", parentCol: "id" },

    // Push subs -> users
    { name: "fk_push_subs_users", child: "push_subscriptions", childCol: "user_id", parent: "users", parentCol: "id" },

    // Notifications -> users
    { name: "fk_notifications_users", child: "notifications", childCol: "user_id", parent: "users", parentCol: "id" },
  ];

  const results = [];
  for (const c of candidates) {
    try {
      const r = await checkOrphan(c.name, c.child, c.childCol, c.parent, c.parentCol);
      results.push(r);
    } catch (e) {
      console.log(`ERROR               ${c.name} (${e.message.slice(0, 80)})`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  const ok = results.filter(r => r.orphans === 0);
  const bad = results.filter(r => r.orphans > 0);
  console.log(`✅ Safe to add FK:  ${ok.length}`);
  console.log(`❌ Need cleanup:     ${bad.length}`);
  if (bad.length > 0) {
    console.log("\nOrphan FKs (can NOT add FK without cleanup):");
    for (const b of bad) {
      console.log(`  - ${b.fkName}: ${b.orphans} orphan records`);
    }
  }
}
main().catch((e) => { console.error("💥", e); process.exit(1); });

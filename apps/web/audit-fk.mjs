// Audit schema de tom tat FK candidates
const PROJECT_REF = "ejcuqyaiwabfygyesvxj";
const PAT = process.env.SUPABASE_PAT;

async function main() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
    body: JSON.stringify({
      query: `
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `,
    }),
  });
  const data = await res.json();
  const groups = {};
  for (const r of data) {
    if (!groups[r.table_name]) groups[r.table_name] = [];
    groups[r.table_name].push(r.column_name + ":" + r.data_type);
  }
  for (const [t, cols] of Object.entries(groups)) {
    console.log("\n=== " + t + " (" + cols.length + " cols) ===");
    console.log(cols.join(" | "));
  }
}
main();

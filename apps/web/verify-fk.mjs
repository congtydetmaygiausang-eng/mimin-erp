// Verify final FK count
const PROJECT_REF = "ejcuqyaiwabfygyesvxj";
const PAT = process.env.SUPABASE_PAT;

const sql = `
  SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
  WHERE contype = 'f'
    AND connamespace = 'public'::regnamespace
  ORDER BY conname
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
  body: JSON.stringify({ query: sql }),
});
const data = await res.json();
console.log("📊 TONG FK CONSTRAINTS:", data.length);
console.log("");
for (const r of data) {
  console.log(`✓ ${r.constraint_name}`);
  console.log(`   ${r.table_name} -> ${r.definition}`);
  console.log("");
}

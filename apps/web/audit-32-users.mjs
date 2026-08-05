// Audit tong 32 user (10 moi @mimin.vn + 21 cu @gmail.com/@mimin-erp.local)
const PROJECT_REF = "ejcuqyaiwabfygyesvxj";
const PAT = process.env.SUPABASE_PAT;

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
  body: JSON.stringify({
    query: `SELECT email, name, role FROM users ORDER BY role, email`,
  }),
});
const users = await res.json();

console.log(`📊 TONG USER: ${users.length}\n`);
const byRole = {};
for (const u of users) {
  if (!byRole[u.role]) byRole[u.role] = [];
  byRole[u.role].push(u);
}
for (const [role, list] of Object.entries(byRole)) {
  console.log(`\n[${role}] (${list.length}):`);
  for (const u of list) {
    const isNew = u.email.endsWith("@mimin.vn") ? "🆕" : "📦";
    console.log(`  ${isNew} ${u.email.padEnd(35)} ${u.name}`);
  }
}

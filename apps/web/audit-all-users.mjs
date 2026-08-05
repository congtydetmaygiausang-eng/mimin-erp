// Audit all users: users table + auth.users
const PROJECT_REF = "ejcuqyaiwabfygyesvxj";
const PAT = process.env.SUPABASE_PAT;

async function main() {
  // Bang users (custom)
  const users = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
    body: JSON.stringify({
      query: `SELECT id, email, name, role, "chucVu", "isActive" FROM users ORDER BY role, email`,
    }),
  }).then(r => r.json());

  // auth.users
  const auth = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PAT}` },
    body: JSON.stringify({
      query: `SELECT id, email, raw_app_meta_data->>'role' AS role, created_at FROM auth.users ORDER BY created_at`,
    }),
  }).then(r => r.json());

  console.log(`📊 BANG USERS (${users.length}):`);
  for (const u of users) {
    const inAuth = auth.find((a) => a.id === u.id);
    const status = inAuth ? "✅" : "❌";
    console.log(`  ${status} [${u.role.padEnd(8)}] ${u.email.padEnd(35)} id=${u.id?.slice(0, 8)}...`);
  }

  console.log(`\n📊 AUTH.USERS (${auth.length}):`);
  for (const a of auth) {
    const inUsers = users.find((u) => u.id === a.id);
    const status = inUsers ? "✅" : "❌";
    console.log(`  ${status} [${(a.role || "null").padEnd(8)}] ${a.email.padEnd(35)} id=${a.id.slice(0, 8)}...`);
  }

  // Stats
  const userEmails = new Set(users.map((u) => u.email));
  const authEmails = new Set(auth.map((a) => a.email));
  const onlyInUsers = users.filter((u) => !authEmails.has(u.email));
  const onlyInAuth = auth.filter((a) => !userEmails.has(a.email));
  console.log(`\n📈 STATS:`);
  console.log(`  - In users but not auth: ${onlyInUsers.length}`);
  for (const u of onlyInUsers) console.log(`    ❌ ${u.email}`);
  console.log(`  - In auth but not users: ${onlyInAuth.length}`);
  for (const a of onlyInAuth) console.log(`    ❌ ${a.email}`);
}
main();

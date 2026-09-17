// Read only: copy the existing permission matrix for the isolated development server.
const fs = require('node:fs');
const path = require('node:path');
for (const file of ['.env.local', 'apps/web/.env.local']) {
  const absolute = path.resolve(__dirname, '..', file);
  if (fs.existsSync(absolute)) process.loadEnvFile(absolute);
}
(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing server credentials for read-only permission copy');
  const response = await fetch(`${url}/rest/v1/permission_settings?id=eq.global&select=matrix`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!response.ok) throw new Error(`Permission read failed: ${response.status}`);
  const rows = await response.json();
  if (!rows[0]?.matrix) throw new Error('No shared permission matrix found');
  fs.writeFileSync(path.resolve(__dirname, '../scratch/local-test-permissions.json'), JSON.stringify(rows[0].matrix));
  console.log('Copied shared permission matrix (read only). Roles:', Object.keys(rows[0].matrix).length);
})().catch(error => { console.error(error.message); process.exitCode = 1; });

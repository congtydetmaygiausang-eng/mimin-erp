// Try Supavisor with pgbouncer=true
const path = require('path');
const { Client } = require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'pg'));
const projectRef = 'ejcuqyaiwabfygyesvxj';
const password = 'HtUkba9rRPdDmigJ';

async function tryUrl(label, url) {
  console.log(`\n=== ${label} ===`);
  console.log('URL:', url.replace(/:[^:@]+@/, ':***@'));
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await c.connect();
    console.log('✅ Connected');
    const r = await c.query('SELECT current_user, current_database()');
    console.log('User:', r.rows[0].current_user, '| DB:', r.rows[0].current_database);
    await c.end();
  } catch (e) {
    console.log('❌', e.message, '|', e.code);
  }
}

async function main() {
  // With pgbouncer=true param
  await tryUrl('pgbouncer=true session 5432',
    `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true`);
  await tryUrl('pgbouncer=true transaction 6543',
    `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`);

  // Different user format - some Supavisor configs use no suffix
  await tryUrl('user=postgres 5432',
    `postgresql://postgres:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true`);

  // With external_id
  await tryUrl('options=project ref 5432',
    `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?options=project%3D${projectRef}`);

  // IPv4 forced with pgbouncer
  await tryUrl('IPv4 forced + pgbouncer',
    `postgresql://postgres.${projectRef}:${password}@52.77.146.31:5432/postgres?pgbouncer=true&sslmode=require`);
}
main();

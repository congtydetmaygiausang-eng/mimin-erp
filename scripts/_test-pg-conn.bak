// Debug pg connection
const path = require('path');
const dns = require('dns');
const { Client } = require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'pg'));

const projectRef = 'ejcuqyaiwabfygyesvxj';
const password = 'HtUkba9rRPdDmigJ';

async function tryConfig(label, config) {
  console.log(`\n=== ${label} ===`);
  console.log('Config:', JSON.stringify({ ...config, password: '***' }));
  const client = new Client(config);
  try {
    await client.connect();
    console.log('✅ Connected');
    const r = await client.query('SELECT current_user, current_database()');
    console.log('User:', r.rows[0].current_user, '| DB:', r.rows[0].current_database);
    await client.end();
    return true;
  } catch (e) {
    console.error('❌', e.message);
    if (e.code) console.error('Code:', e.code);
    return false;
  }
}

async function main() {
  // Use DoH to get IPv4
  console.log('=== DoH lookup for pooler ===');
  const resp = await fetch('https://1.1.1.1/dns-query?name=aws-0-ap-southeast-1.pooler.supabase.com&type=A', {
    headers: { 'Accept': 'application/dns-json' }
  });
  const d = await resp.json();
  const ipv4s = (d.Answer || []).filter(x => x.type === 1).map(x => x.data);
  console.log('IPv4s:', ipv4s);

  if (ipv4s.length === 0) {
    console.log('No IPv4 found');
    return;
  }

  // Try with explicit hostaddr (force IPv4) and pooler port 5432 (session mode)
  for (const ip of ipv4s) {
    const ok = await tryConfig('Pooler IPv4 forced', {
      host: 'aws-0-ap-southeast-1.pooler.supabase.com',
      hostaddr: ip,
      port: 5432,
      user: `postgres.${projectRef}`,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      family: 4,
    });
    if (ok) break;
  }

  // Try transaction mode 6543
  for (const ip of ipv4s) {
    const ok = await tryConfig('Pooler IPv4 6543', {
      host: 'aws-0-ap-southeast-1.pooler.supabase.com',
      hostaddr: ip,
      port: 6543,
      user: `postgres.${projectRef}`,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      family: 4,
    });
    if (ok) break;
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });

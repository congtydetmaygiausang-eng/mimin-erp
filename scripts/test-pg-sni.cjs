// Try with SNI hostname
const path = require('path');
const { Client } = require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'pg'));
const projectRef = 'ejcuqyaiwabfygyesvxj';
const password = 'HtUkba9rRPdDmigJ';

async function tryConfig(label, config) {
  console.log(`\n=== ${label} ===`);
  const c = new Client(config);
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
  // SSL with servername
  await tryConfig('SNI servername', {
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    user: `postgres.${projectRef}`,
    password,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
      servername: `aws-0-ap-southeast-1.pooler.supabase.com`,
    },
  });

  // With application_name
  await tryConfig('application_name', {
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    user: `postgres.${projectRef}`,
    password,
    database: 'postgres',
    application_name: `mimin-app-${projectRef}`,
    ssl: { rejectUnauthorized: false },
  });

  // Try direct to db.* with IPv6 since that's all it has
  await tryConfig('Direct IPv6', {
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  // Try with options
  await tryConfig('options project', {
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    user: `postgres.${projectRef}`,
    password,
    database: 'postgres',
    options: `-c project=${projectRef}`,
    ssl: { rejectUnauthorized: false },
  });
}
main();

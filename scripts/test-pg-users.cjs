// Try old user format
const path = require('path');
const { Client } = require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'pg'));
const projectRef = 'ejcuqyaiwabfygyesvxj';
const password = 'HtUkba9rRPdDmigJ';

async function tryUser(user, port) {
  const config = {
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port,
    user,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    family: 4,
  };
  console.log(`\n--- user="${user}" port=${port} ---`);
  const c = new Client(config);
  try {
    await c.connect();
    console.log('✅ Connected');
    const r = await c.query('SELECT current_user');
    console.log('User:', r.rows[0].current_user);
    await c.end();
  } catch (e) {
    console.log('❌', e.message, '|', e.code);
  }
}

async function main() {
  await tryUser('postgres', 5432);
  await tryUser('postgres', 6543);
  await tryUser(`postgres.${projectRef}`, 5432);
  await tryUser(`postgres.${projectRef}`, 6543);
}
main();

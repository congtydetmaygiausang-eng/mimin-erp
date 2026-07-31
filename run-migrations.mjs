// run-migrations.mjs  
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONFIGS = [
  {
    label: 'Session Pooler (port 5432)',
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.nftlwdcsmlpeiazhuoho',
    password: 'Mrkeysang@369',
    ssl: { rejectUnauthorized: false },
  },
  {
    label: 'Direct Connection (port 5432)',
    host: 'db.nftlwdcsmlpeiazhuoho.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Mrkeysang@369',
    ssl: { rejectUnauthorized: false },
  },
  {
    label: 'Transaction Pooler (port 6543)',
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.nftlwdcsmlpeiazhuoho',
    password: 'Mrkeysang@369',
    ssl: { rejectUnauthorized: false },
  },
];

const MIGRATION_FILES = [
  join(__dirname, 'supabase-migrations', '001_init_schema.sql'),
  join(__dirname, 'supabase-migrations', '002_seed_data.sql'),
  join(__dirname, 'supabase-migrations', '003_enable_rls.sql'),
];

async function tryConnect(pg, config) {
  const Client = pg.Client;
  const client = new Client(config);
  try {
    await client.connect();
    return client;
  } catch (e) {
    await client.end().catch(() => {});
    throw e;
  }
}

async function runMigrations() {
  let pg;
  try {
    const mod = await import('pg');
    pg = mod.default || mod;
  } catch (e) {
    console.error('❌ pg not installed. Run: npm install pg');
    process.exit(1);
  }

  let client = null;
  let usedConfig = null;

  for (const config of CONFIGS) {
    console.log(`🔌 Trying: ${config.label}...`);
    try {
      client = await tryConnect(pg, config);
      usedConfig = config;
      console.log(`✅ Connected via: ${config.label}\n`);
      break;
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}`);
    }
  }

  if (!client) {
    console.error('\n❌ All connection attempts failed!');
    console.error('Please check your Supabase project and password.');
    process.exit(1);
  }

  // Run migrations
  const names = ['001_init_schema.sql', '002_seed_data.sql', '003_enable_rls.sql'];
  for (let i = 0; i < MIGRATION_FILES.length; i++) {
    const name = names[i];
    const filePath = MIGRATION_FILES[i];
    console.log(`📄 Running ${name}...`);
    try {
      const sql = readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`✅ ${name} - SUCCESS!\n`);
    } catch (e) {
      console.error(`⚠️  ${name} - Error: ${e.message}\n`);
    }
  }

  // Verify
  console.log('🔍 Verifying...');
  try {
    const tables = ['users', 'tasks', 'kho', 'cong_no', 'nha_cung_cap', 'khach_hang_si', 'xuong_gia_cong', 'notifications', 'lenh_sx_tong', 'audit_log'];
    console.log('\n📊 Row counts:');
    for (const t of tables) {
      try {
        const r = await client.query(`SELECT COUNT(*) as cnt FROM ${t}`);
        console.log(`   ${t.padEnd(20)}: ${r.rows[0].cnt} rows`);
      } catch {
        console.log(`   ${t.padEnd(20)}: (chưa có)`);
      }
    }
  } catch (e) {
    console.error('Verify error:', e.message);
  }

  await client.end();
  console.log('\n🎉 XONg! Database đã sẵn sàng!');
}

runMigrations().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});

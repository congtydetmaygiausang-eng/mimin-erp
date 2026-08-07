// Apply seed SQL to Supabase via pg client (using DATABASE_URL from .env.local)
// Usage: node scripts/apply-seed-sql.cjs
const fs = require('fs');
const path = require('path');
// pg is installed in apps/web/node_modules
const { Client } = require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'pg'));

// Parse .env.local manually (no dotenv installed)
const envPath = path.join(__dirname, '..', 'apps', 'web', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};
for (const line of envLines) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const dbUrl = env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

// Try direct connection first (more reliable than pooler for DDL)
const projectRef = 'ejcuqyaiwabfygyesvxj';
const password = (dbUrl.match(/:\/\/[^:]+:([^@]+)@/) || [])[1];
const directUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
// Pooler session mode (port 5432) supports DDL; transaction mode (6543) doesn't
const poolerSessionUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;
console.log('DB URL (original):', dbUrl.replace(/:[^:@]+@/, ':***@'));
console.log('Trying direct:', directUrl.replace(/:[^:@]+@/, ':***@'));
console.log('Pooler session (5432):', poolerSessionUrl.replace(/:[^:@]+@/, ':***@'));

const sqlPath = path.join(__dirname, '..', 'seed-danh-muc-sp-real-data.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('=== Apply SQL to Supabase ===');
console.log('SQL file:', sqlPath);
console.log('SQL length:', sql.length, 'chars');
console.log('DB URL:', dbUrl.replace(/:[^:@]+@/, ':***@'));

async function main() {
  let client;
  try {
    client = new Client({ connectionString: poolerSessionUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('\n✅ Connected to Postgres (pooler session mode)');
  } catch (e1) {
    console.log('⚠️  Pooler session failed, trying direct IPv4...');
    client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('\n✅ Connected to Postgres (direct)');
  }

  try {
    console.log('\n--- Running SQL ---');
    const res = await client.query(sql);
    console.log('✅ SQL applied successfully');
    if (res.command) console.log('Last command:', res.command);
  } catch (e) {
    console.error('❌ SQL failed:', e.message);
    console.error('Detail:', e.detail || e.hint || '');
    process.exit(1);
  }

  // Verify columns moi
  console.log('\n--- Verify new columns ---');
  const colRes = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'san_pham'
    ORDER BY ordinal_position
  `);
  console.log('Columns:');
  for (const row of colRes.rows) {
    console.log(' -', row.column_name, ':', row.data_type);
  }

  // Verify row count
  console.log('\n--- Verify row count ---');
  const cnt = await client.query('SELECT COUNT(*) FROM san_pham');
  console.log('Total san_pham:', cnt.rows[0].count);

  // Sample 3 records
  const sample = await client.query(`
    SELECT ma_sp, ten_sp, trang_thai, da_ban, rating
    FROM san_pham
    ORDER BY ma_sp
    LIMIT 5
  `);
  console.log('\n--- Sample 5 records ---');
  for (const r of sample.rows) {
    console.log(' -', r.ma_sp, '|', r.ten_sp.substring(0, 40), '|', r.trang_thai, '|', r.da_ban, '|', r.rating);
  }

  await client.end();
  console.log('\n✅ Done');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });

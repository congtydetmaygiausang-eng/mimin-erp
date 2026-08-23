const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config({ path: 'apps/web/.env.local' });
const client = new Client({ connectionString: process.env.DATABASE_URL });
async function run() {
  await client.connect();
  const sql = fs.readFileSync('FIX-DB-PRODUCTION-READY.sql', 'utf8');
  await client.query(sql);
  console.log('✅ Executed SQL successfully!');
  await client.end();
}
run().catch(console.error);

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.ejcuqyaiwabfygyesvxj:HtUkba9rRPdDmigJ@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function run() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    const sqlPath = path.join(__dirname, 'supabase-create-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('SQL executed successfully!');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();

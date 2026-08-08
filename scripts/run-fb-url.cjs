// Chay 1 file SQL qua Supabase Management API voi PAT
// 2026-08-08 - Mavis

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_REF = 'ejcuqyaiwabfygyesvxj';
const SQL_FILE = process.argv[2] || 'add-facebook-url-cngc.sql';

function postJSON(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runSQL(pat, sql) {
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${PROJECT_REF}/database/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify({ query: sql })),
    },
  };
  return postJSON(options, JSON.stringify({ query: sql }));
}

async function main() {
  const pat = process.env.SUPABASE_PAT;
  if (!pat) {
    console.error('❌ Set env var SUPABASE_PAT truoc');
    process.exit(1);
  }

  const filePath = path.join(__dirname, '..', SQL_FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`\n--- ${SQL_FILE} (${sql.length} chars) ---`);

  try {
    const r = await runSQL(pat, sql);
    console.log(`Status: ${r.status}`);
    if (r.status >= 200 && r.status < 300) {
      console.log('✅ SUCCESS');
      if (Array.isArray(r.body) && r.body.length > 0) {
        console.log('Result rows:', r.body.length);
        for (const row of r.body) {
          console.log('  -', JSON.stringify(row));
        }
      } else if (typeof r.body === 'string' && r.body.length > 0) {
        console.log('Response:', r.body.substring(0, 500));
      }
    } else {
      console.log('❌ FAILED:', JSON.stringify(r.body).substring(0, 500));
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

main();

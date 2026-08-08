// Dump all tables in Supabase: name, count, sample data
// 2026-08-08 - Mavis
// Dung Supabase Management API voi PAT

const https = require('https');

const PROJECT_REF = 'ejcuqyaiwabfygyesvxj';

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

  console.log('=== LIST TABLES + COUNT ===\n');
  const listSQL = `
    SELECT table_name,
           (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema='public' AND columns.table_name=t.table_name) as col_count
    FROM information_schema.tables t
    WHERE table_schema='public' AND table_type='BASE TABLE'
    ORDER BY table_name;
  `;
  const r1 = await runSQL(pat, listSQL);
  if (r1.status >= 200 && r1.status < 300 && Array.isArray(r1.body)) {
    for (const row of r1.body) {
      console.log(`  ${row.table_name.padEnd(30)} ${String(row.col_count).padStart(3)} cols`);
    }
  } else {
    console.log('❌ List failed:', JSON.stringify(r1.body).substring(0, 300));
    return;
  }

  console.log('\n=== ROW COUNT PER TABLE ===\n');
  const tables = r1.body.map((r) => r.table_name);
  for (const tbl of tables) {
    const cSQL = `SELECT COUNT(*) as n FROM public.${tbl};`;
    const cr = await runSQL(pat, cSQL);
    if (cr.status >= 200 && cr.status < 300 && Array.isArray(cr.body)) {
      const n = cr.body[0]?.n ?? '?';
      console.log(`  ${tbl.padEnd(30)} ${String(n).padStart(5)} rows`);
    } else {
      console.log(`  ${tbl.padEnd(30)} ERROR: ${JSON.stringify(cr.body).substring(0, 100)}`);
    }
  }

  console.log('\n=== SAMPLE 3 ROWS PER TABLE ===\n');
  for (const tbl of tables) {
    console.log(`\n--- ${tbl} ---`);
    const sSQL = `SELECT * FROM public.${tbl} LIMIT 3;`;
    const sr = await runSQL(pat, sSQL);
    if (sr.status >= 200 && sr.status < 300 && Array.isArray(sr.body)) {
      if (sr.body.length === 0) {
        console.log('  (empty)');
      } else {
        for (const row of sr.body) {
          // Truncate long values
          const truncated = {};
          for (const [k, v] of Object.entries(row)) {
            const s = v === null ? 'null' : typeof v === 'object' ? JSON.stringify(v).substring(0, 60) : String(v).substring(0, 80);
            truncated[k] = s;
          }
          console.log('  ' + JSON.stringify(truncated));
        }
      }
    } else {
      console.log('  ERROR:', JSON.stringify(sr.body).substring(0, 200));
    }
  }
}

main().catch(console.error);

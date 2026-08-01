// Check current tables schema
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, 'm'));
  return m ? m[1].trim() : null;
};

const url = get('NEXT_PUBLIC_SUPABASE_URL') + '/rest/v1/';
const headers = {
  'apikey': get('SUPABASE_SERVICE_ROLE_KEY'),
  'Authorization': 'Bearer ' + get('SUPABASE_SERVICE_ROLE_KEY'),
};

// Get all tables exposed
const r1 = await fetch(url, { headers });
const paths = Object.keys((await r1.json()).paths || {}).filter(p => p.startsWith('/') && p !== '/').sort();
console.log('=== ALL TABLES EXPOSED ON SUPABASE ===');
paths.forEach(p => console.log('  ', p));

// Sample some rows to see structure
console.log('\n=== Sample users (limit 1) ===');
const u = await (await fetch(url + 'users?limit=1', { headers })).json();
console.log(JSON.stringify(u, null, 2));

console.log('\n=== Sample customers (limit 1) ===');
const c = await (await fetch(url + 'customers?limit=1', { headers })).json();
console.log(JSON.stringify(c, null, 2));

console.log('\n=== Sample nha_cung_cap (limit 1) ===');
const n = await (await fetch(url + 'nha_cung_cap?limit=1', { headers })).json();
console.log(JSON.stringify(n, null, 2));

console.log('\n=== Count rows in each table ===');
for (const t of paths) {
  const r = await (await fetch(url + t.slice(1) + '?select=*&limit=0', { headers: { ...headers, 'Prefer': 'count=exact' } }));
  const cr = r.headers.get('content-range');
  console.log(`  ${t.padEnd(20)} ${cr || '?'}`);
}

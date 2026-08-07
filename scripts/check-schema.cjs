// Check current schema of san_pham
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const key = 'sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd';

async function main() {
  console.log('=== Schema info (via PostgREST introspection) ===');
  // Get one record to see all columns
  const r = await fetch(url + '/rest/v1/san_pham?select=*&limit=1', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const d = await r.json();
  if (d.length > 0) {
    console.log('Columns:', Object.keys(d[0]).join(', '));
    console.log('Sample:', JSON.stringify(d[0], null, 2));
  }

  // Try OpenAPI
  console.log('\n=== OpenAPI schema ===');
  const r2 = await fetch(url + '/rest/v1/?apikey=' + key, {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const d2 = await r2.json();
  if (d2.definitions && d2.definitions.san_pham) {
    const props = d2.definitions.san_pham.properties || {};
    console.log('Defined properties:');
    for (const [k, v] of Object.entries(props)) {
      console.log(' -', k, ':', v.type || v.format || JSON.stringify(v).substring(0, 60));
    }
  } else {
    console.log('OpenAPI response:', JSON.stringify(d2).substring(0, 500));
  }
}
main();

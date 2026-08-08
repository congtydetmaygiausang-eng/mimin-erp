// DNS-over-HTTPS to bypass local DNS block
async function main() {
  console.log('=== DoH lookup ===');
  try {
    const a = await fetch('https://1.1.1.1/dns-query?name=db.ejcuqyaiwabfygyesvxj.supabase.co&type=A', {
      headers: { 'Accept': 'application/dns-json' }
    });
    const ad = await a.json();
    console.log('IPv4:', JSON.stringify(ad.Answer));

    const aaaa = await fetch('https://1.1.1.1/dns-query?name=db.ejcuqyaiwabfygyesvxj.supabase.co&type=AAAA', {
      headers: { 'Accept': 'application/dns-json' }
    });
    const aaaad = await aaaa.json();
    console.log('IPv6:', JSON.stringify(aaaad.Answer));

    const pool = await fetch('https://1.1.1.1/dns-query?name=aws-0-ap-southeast-1.pooler.supabase.com&type=A', {
      headers: { 'Accept': 'application/dns-json' }
    });
    const poold = await pool.json();
    console.log('Pooler IPv4:', JSON.stringify(poold.Answer));
  } catch (e) {
    console.error('DoH error:', e.message);
  }
}
main();

// Test DNS + Mavis API
const dns = require('dns');

(async () => {
  // Test DNS
  console.log('Test DNS: api.Mavis.dev');
  await new Promise((resolve) => {
    dns.lookup('api.Mavis.dev', (err, address) => {
      if (err) console.log('DNS ERR:', err.code, err.message);
      else console.log('Resolved:', address);
      resolve();
    });
  });

  // Test fetch with detailed error
  console.log('\nTest fetch: https://api.Mavis.dev/v1/');
  try {
    const r = await fetch('https://api.Mavis.dev/v1/', {
      signal: AbortSignal.timeout(10000),
    });
    console.log('Status:', r.status, r.statusText);
    console.log('Body:', (await r.text()).substring(0, 300));
  } catch (e) {
    console.log('ERR name:', e.name);
    console.log('ERR message:', e.message);
    console.log('ERR cause:', JSON.stringify(e.cause, null, 2));
  }
})();

// Test Mavis API xem co 6 agent moi chua
(async () => {
  const URL = 'https://api.Mavis.dev/v1';
  const KEY = 'sk-api-kIgtCFD0AG43z3Jdd7mN7HSQoFACq6wx7xGQS1AwX4Weax17XjrZqyY9EOFmgOrY26zX91hbbcsle7d5LYFJEdiIasvprZpP4AA9R85eBygPBl330iCNEnI';

  console.log('Test 1: GET /health');
  try {
    const r1 = await fetch(`${URL}/health`);
    console.log('Status:', r1.status, r1.statusText);
    console.log('Body:', (await r1.text()).substring(0, 200));
  } catch (e) {
    console.error('ERR:', e.message);
  }

  console.log('\nTest 2: GET /agents');
  try {
    const r2 = await fetch(`${URL}/agents`, { headers: { Authorization: `Bearer ${KEY}` } });
    console.log('Status:', r2.status, r2.statusText);
    console.log('Body:', (await r2.text()).substring(0, 500));
  } catch (e) {
    console.error('ERR:', e.message);
  }

  console.log('\nTest 3: GET /agents/mavis');
  try {
    const r3 = await fetch(`${URL}/agents/mavis`, { headers: { Authorization: `Bearer ${KEY}` } });
    console.log('Status:', r3.status, r3.statusText);
    console.log('Body:', (await r3.text()).substring(0, 300));
  } catch (e) {
    console.error('ERR:', e.message);
  }
})();

const API_URL = 'http://localhost:8787/api/v1';

async function testSecurity() {
  console.log('--- Testing Security Enhancements ---');

  // 1. Test registration without key
  console.log('\n[1] Testing registration without ADMIN_API_KEY...');
  try {
    const res = await fetch(`${API_URL}/student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Security Test' })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
    if (res.status === 403) console.log('✅ Correctly rejected without key.');
    else console.log('❌ Failed to reject without key.');
  } catch (e) { console.log('Error:', e.message); }

  // 2. Test registration with wrong key
  console.log('\n[2] Testing registration with wrong ADMIN_API_KEY...');
  try {
    const res = await fetch(`${API_URL}/student`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-key': 'wrong-key'
      },
      body: JSON.stringify({ name: 'Security Test' })
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
    if (res.status === 403) console.log('✅ Correctly rejected with wrong key.');
    else console.log('❌ Failed to reject with wrong key.');
  } catch (e) { console.log('Error:', e.message); }
}

testSecurity();

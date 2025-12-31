const fetch = require('node-fetch');

async function testDashboardAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/dashboard');
        const data = await response.json();

        console.log('=== DASHBOARD API RESPONSE ===');
        console.log(JSON.stringify(data, null, 2));

        console.log('\n=== FRT TREND DATA ===');
        console.log('frtTrend:', data.frtTrend);
        console.log('frtChange:', data.frtChange);

        if (!data.frtTrend || data.frtTrend.length === 0) {
            console.log('\n⚠️ NO FRT DATA FOUND');
            console.log('Possible reasons:');
            console.log('1. No customer service tickets in last 6 months');
            console.log('2. No tickets with response_at filled');
            console.log('3. No tickets with frt value');
        } else {
            console.log('\n✅ FRT DATA EXISTS');
            console.log(`Found ${data.frtTrend.length} months of data`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testDashboardAPI();

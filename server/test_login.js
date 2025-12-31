const fetch = require('node-fetch'); // Assuming node-fetch is available, or use native fetch if Node 18+

// Using native fetch if available (Node 18+), otherwise minimal request
async function testLogin() {
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'tedi', password: 'password123' })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testLogin();

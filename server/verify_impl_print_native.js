const http = require('http');

function request(path, method, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function verify() {
    console.log('1. Fetching campuses...');
    const campRes = await request('/api/campuses', 'GET');
    const campuses = JSON.parse(campRes.body);

    if (!campuses.length) {
        console.log('No campuses found, skipping create test.');
        return;
    }
    const campusId = campuses[0].id;
    console.log('Using Campus ID:', campusId);

    console.log('2. Creating Implementation Print...');
    const payload = {
        campus_id: campusId,
        items: [{ name: 'TEST - Portal', link: 'http://test.com', status: 'Backlog' }]
    };
    const createRes = await request('/api/implementation-prints', 'POST', payload);
    console.log('Create Status:', createRes.status);
    console.log('Create Body:', createRes.body);

    console.log('3. Fetching Implementation Prints...');
    const listRes = await request('/api/implementation-prints', 'GET');
    const list = JSON.parse(listRes.body);
    console.log('List Length:', list.length);
    console.log('Last Item:', list[0]); // Check the newest one
}

verify().catch(console.error);

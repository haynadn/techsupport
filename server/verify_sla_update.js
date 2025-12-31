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

async function test() {
    console.log('1. Fetching SLAs...');
    const res = await request('/api/slas', 'GET');
    const slas = JSON.parse(res.body);
    console.log('Count:', slas.length);
    if (slas.length > 0) {
        console.log('First SLA:', slas[0]);
    }

    // 2. Try to update the first SLA
    if (slas.length > 0) {
        const first = slas[0];
        console.log(`2. Updating SLA ID ${first.id} category to 'Migrasi'...`);
        const updatePayload = {
            type: first.type,
            duration: first.duration,
            unit: first.unit,
            category: 'Migrasi'
        };
        const updateRes = await request(`/api/slas/${first.id}`, 'PUT', updatePayload);
        console.log('Update Status:', updateRes.status);

        // 3. Fetch again to verify
        const res2 = await request('/api/slas', 'GET');
        const slas2 = JSON.parse(res2.body);
        const updated = slas2.find(s => s.id === first.id);
        console.log('Updated SLA:', updated);
    }
}

test().catch(console.error);

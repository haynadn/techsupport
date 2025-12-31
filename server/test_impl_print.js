const fetch = require('node-fetch');

async function test() {
    // 1. Fetch campuses to get a valid ID
    console.log('Fetching campuses...');
    const campRes = await fetch('http://localhost:3000/api/campuses');
    const campuses = await campRes.json();

    if (campuses.length === 0) {
        console.error('No campuses found. Create a campus first.');
        return;
    }

    const validCampusId = campuses[0].id;
    console.log('Using Campus ID:', validCampusId);

    // 2. Create Implementation Print
    const payload = {
        campus_id: validCampusId,
        items: [
            { name: "Test Type - Portal", link: "http://example.com", status: "Backlog" }
        ]
    };

    console.log('Sending payload:', JSON.stringify(payload));

    const res = await fetch('http://localhost:3000/api/implementation-prints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        const data = await res.json();
        console.log('Success:', data);
    } else {
        console.error('Error:', res.status, res.statusText);
        const text = await res.text();
        console.error('Body:', text);
    }

    // 3. Verify Fetch
    const listRes = await fetch('http://localhost:3000/api/implementation-prints');
    const list = await listRes.json();
    console.log('Fetched List Length:', list.length);
    console.log('Last Item:', JSON.stringify(list[list.length - 1], null, 2));
}

test();

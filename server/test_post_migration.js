// Node 18+ has global fetch

async function testPost() {
    const payload = {
        campus_id: 1, // Assumes campus ID 1 exists
        items: [{
            sla_id: 6, // Assumes SLA ID 6 exists
            specialist_id: 1, // Assumes agent ID 1 exists
            verifier_id: 1,
            status: 'todo',
            link_task: 'http://test.com',
            deadline: '2025-01-01',
            migration_condition: 'Ke-1'
        }]
    };

    try {
        const res = await fetch('http://localhost:3000/api/migrations/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('Response:', res.status, data);
    } catch (e) {
        console.error('Error:', e);
    }
}

testPost();

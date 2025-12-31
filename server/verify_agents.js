fetch('http://localhost:3000/api/agents')
    .then(res => res.json())
    .then(data => {
        console.log('Agents Status: OK');
        console.log('Agents count:', data.length);
    })
    .catch(err => console.error('Error:', err));

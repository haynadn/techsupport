fetch('http://localhost:3000/api/training-tickets')
    .then(res => res.json())
    .then(data => {
        console.log('Status: OK');
        console.log('Data length:', data.length);
        console.log('Sample:', data[0]);
    })
    .catch(err => console.error('Error:', err));

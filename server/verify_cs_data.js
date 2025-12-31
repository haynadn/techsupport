const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'tsapp_db'
});

db.connect(async err => {
    if (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
    console.log('Connected');

    // Select all tickets
    const query = `SELECT * FROM customer_service_tickets`;

    db.query(query, (err, res) => {
        if (err) {
            console.error('Error fetching tickets:', err);
        } else {
            console.log(`Found ${res.length} tickets`);
            console.log(res);
        }
        process.exit();
    });
});

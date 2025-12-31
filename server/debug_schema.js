const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_NAME || 'tsapp_db'
});

db.connect(err => {
    if (err) {
        console.error('Connect error:', err);
        process.exit(1);
    }
    console.log('Connected.');

    db.query('DESCRIBE training_tickets', (err, results) => {
        if (err) {
            console.error('Error describing table:', err);
        } else {
            console.log('Schema:', results);
        }
        db.end();
    });
});

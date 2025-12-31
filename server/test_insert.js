const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_NAME || 'tsapp_db'
});

db.connect();

const query = 'INSERT INTO training_tickets (date, campus_id, trainer_id, material_id, status, minutes_link, method) VALUES (?, ?, ?, ?, ?, ?, ?)';
const params = ['2025-01-01', 1, 1, 1, 'todo', 'http://test', 'Online'];

db.query(query, params, (err, res) => {
    if (err) {
        console.error('INSERT FAILED:', err.code, err.sqlMessage);
    } else {
        console.log('INSERT SUCCESS');
    }
    db.end();
});

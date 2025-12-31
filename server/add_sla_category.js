const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'tsapp_db'
});

db.connect(err => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    console.log('Connected.');

    const alterQuery = "ALTER TABLE sla ADD COLUMN category VARCHAR(50) DEFAULT 'Customer Service' AFTER id";

    db.query(alterQuery, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column category already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column category added successfully.');
        }
        db.end();
    });
});

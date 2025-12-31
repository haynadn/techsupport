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
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database.');

    const alterTableQuery = "ALTER TABLE sla ADD COLUMN unit VARCHAR(20) DEFAULT 'Menit' AFTER duration";

    db.query(alterTableQuery, (err, result) => {
        if (err) {
            // Ignore if column already exists
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column unit already exists.');
            } else {
                console.error('Error altering table:', err);
            }
        } else {
            console.log('SLA table altered successfully. Added unit column.');
        }
        db.end();
    });
});

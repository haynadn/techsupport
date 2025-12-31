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

    // Add solved_at column
    const query = `
        ALTER TABLE customer_service_tickets 
        ADD COLUMN solved_at DATETIME NULL AFTER response_at
    `;

    try {
        await new Promise((resolve, reject) => {
            db.query(query, (err, res) => {
                if (err) {
                    // Ignore if column exists (error 1060)
                    if (err.errno === 1060) resolve();
                    else reject(err);
                }
                else resolve(res);
            });
        });
        console.log('SUCCESS: Added solved_at column');
    } catch (e) {
        console.log('FAILURE: Alter table failed:', e.code, e.sqlMessage);
    }

    process.exit();
});

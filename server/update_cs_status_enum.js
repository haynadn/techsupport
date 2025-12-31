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

    // Alter the ENUM column to include new statuses
    const query = `
        ALTER TABLE customer_service_tickets 
        MODIFY COLUMN status ENUM('todo', 'in_progress', 'bug', 'flip', 'finnet', 'completed') DEFAULT 'todo'
    `;

    try {
        await new Promise((resolve, reject) => {
            db.query(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
        console.log('SUCCESS: Table altered to include Flip and Finnet statuses');
    } catch (e) {
        console.log('FAILURE: Alter table failed:', e.code, e.sqlMessage);
    }

    process.exit();
});

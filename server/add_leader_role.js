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

    // Check if role column exists and is ENUM
    const checkQuery = "SHOW COLUMNS FROM agents LIKE 'role'";
    db.query(checkQuery, (err, results) => {
        if (err) {
            console.error('Error checking column:', err);
            db.end();
            return;
        }

        if (results.length > 0) {
            const type = results[0].Type;
            if (type.includes('enum')) {
                // It is an ENUM, we need to alter it
                // Extract current values
                // Current values likely: 'Customer Service','Migration Specialist','Trainer'
                // We want to add 'Leader'
                const newQuery = "ALTER TABLE agents MODIFY COLUMN role ENUM('Customer Service', 'Migration Specialist', 'Trainer', 'Leader') DEFAULT 'Customer Service'";
                db.query(newQuery, (err, result) => {
                    if (err) {
                        console.error('Error altering table:', err);
                    } else {
                        console.log('Successfully added Leader to role enum.');
                    }
                    db.end();
                });
            } else {
                console.log('Role column is not ENUM, assuming VARCHAR. No DB change needed.');
                db.end();
            }
        } else {
            console.error('Role column not found!');
            db.end();
        }
    });
});

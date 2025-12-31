const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'tsapp_db'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected.');

    const query = `
        ALTER TABLE migrations
        ADD COLUMN migration_condition VARCHAR(20) DEFAULT NULL;
    `;

    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column migration_condition already exists.');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column migration_condition added successfully.');
        }
        db.end();
    });
});

const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected!');

    const sql = `
    ALTER TABLE agents 
    ADD COLUMN username VARCHAR(50) AFTER email,
    ADD COLUMN password VARCHAR(255) AFTER username;
  `;

    db.query(sql, (err, result) => {
        if (err) {
            console.log('Columns might already exist or error:', err.message);
        } else {
            console.log('Schema updated successfully');
        }
        process.exit();
    });
});

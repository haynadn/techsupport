const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_NAME || 'tsapp_db'
});

db.connect(async err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database.');

    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = 'tedi';

    db.query('UPDATE agents SET password = ? WHERE username = ?', [hashedPassword, username], (err, result) => {
        if (err) {
            console.error('Error updating password:', err);
        } else {
            console.log(`Password for user '${username}' updated successfully to '${password}'.`);
        }
        db.end();
    });
});

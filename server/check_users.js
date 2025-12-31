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

    db.query('SELECT id, name, username, status, password FROM agents', (err, results) => {
        if (err) {
            console.error('Error fetching agents:', err);
        } else {
            console.log('Agents List:');
            results.forEach(agent => {
                console.log(`ID: ${agent.id}, Name: ${agent.name}, Username: ${agent.username}, Status: ${agent.status}, Password (first 10 chars): ${agent.password ? agent.password.substring(0, 10) + '...' : 'NULL'}`);
            });
        }
        db.end();
    });
});

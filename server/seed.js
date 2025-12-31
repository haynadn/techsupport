const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
});

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

db.connect((err) => {
    if (err) throw err;
    console.log('Connected!');

    db.query(schema, (err, result) => {
        if (err) throw err;
        console.log('Database seeded successfully!');
        process.exit();
    });
});

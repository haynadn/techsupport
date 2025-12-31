const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect();

const queries = [
    "DESCRIBE migrations",
    "SELECT DISTINCT status FROM migrations",
    "SELECT DISTINCT name FROM migrations WHERE name LIKE '%Deploy%'",
    "DESCRIBE training_tickets",
    "SELECT DISTINCT title FROM training_tickets",
    "SELECT * FROM training_tickets LIMIT 5"
];

async function run() {
    for (const q of queries) {
        console.log(`\n--- QUERY: ${q} ---`);
        try {
            const [results] = await db.promise().query(q);
            console.log(results);
        } catch (err) {
            console.error(err.message);
        }
    }
    db.end();
}

run();

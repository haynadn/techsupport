const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql', // Default Ampps password often 'mysql' or 'root'
    database: 'tsapp_db'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');

    const checkTableQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ? 
        AND table_name = 'implementation_prints';
    `;

    db.query(checkTableQuery, ['tsapp_db'], (err, results) => {
        if (err) {
            console.error('Error checking table:', err);
        } else {
            if (results.length > 0) {
                console.log('Table implementation_prints EXISTS.');
            } else {
                console.log('Table implementation_prints DOES NOT EXIST.');
                createTable();
            }
        }
    });

    function createTable() {
        const createQuery = `
            CREATE TABLE IF NOT EXISTS implementation_prints (
                id INT AUTO_INCREMENT PRIMARY KEY,
                campus_id INT NOT NULL,
                items TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
            )
        `;
        db.query(createQuery, (err, result) => {
            if (err) {
                console.error('Error creating implementation_prints table:', err);
            } else {
                console.log('Table implementation_prints created successfully.');
            }
            db.end();
        });
    }
});

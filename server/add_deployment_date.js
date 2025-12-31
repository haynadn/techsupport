const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_NAME || 'tsapp_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');

    const query = "ALTER TABLE campuses ADD COLUMN deployment_date DATE NULL AFTER status";

    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column deployment_date already exists');
            } else {
                console.error('Error adding column:', err);
            }
        } else {
            console.log('Column deployment_date added successfully');
        }
        db.end();
    });
});

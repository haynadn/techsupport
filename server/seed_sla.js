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

    const dummyData = [
        ['Respon Awal', '15', 'Menit'],
        ['Penyelesaian Ringan', '2', 'Jam'],
        ['Penyelesaian Berat', '3', 'Hari'],
        ['Eskalasi', '30', 'Menit']
    ];

    const query = 'INSERT INTO sla (type, duration, unit) VALUES ?';

    db.query(query, [dummyData], (err, result) => {
        if (err) {
            console.error('Error seeding data:', err);
        } else {
            console.log(`Seeded ${result.affectedRows} dummy SLA records.`);
        }
        db.end();
    });
});

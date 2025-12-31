const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_NAME || 'tsapp_db'
});

db.connect();

const query = `
CREATE TABLE IF NOT EXISTS print_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  portal ENUM('Operator', 'Mahasiswa') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.query(query, (err, res) => {
    if (err) {
        console.error('CREATE TABLE FAILED:', err);
    } else {
        console.log('CREATE TABLE SUCCESS');
    }
    db.end();
});

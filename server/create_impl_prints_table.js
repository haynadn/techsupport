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
CREATE TABLE IF NOT EXISTS implementation_prints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT NOT NULL,
  items JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
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

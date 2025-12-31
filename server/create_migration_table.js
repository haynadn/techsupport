const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'tsapp_db'
});

db.connect(err => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    console.log('Connected.');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            campus_id INT NOT NULL,
            sla_id INT NOT NULL,
            specialist_id INT,
            verifier_id INT,
            link_task VARCHAR(255),
            deadline DATE,
            status VARCHAR(50) DEFAULT 'backlog',
            completed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE,
            FOREIGN KEY (sla_id) REFERENCES sla(id),
            FOREIGN KEY (specialist_id) REFERENCES agents(id),
            FOREIGN KEY (verifier_id) REFERENCES agents(id)
        );
    `;

    db.query(createTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table migrations created successfully.');
        }
        db.end();
    });
});

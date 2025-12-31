const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'tsapp_db'
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS customer_service_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campus_id INT NOT NULL,
    campus_pic VARCHAR(255),
    source_id INT,
    question TEXT,
    scope VARCHAR(255),
    answer_agent_id INT,
    solved_agent_id INT,
    created_at DATETIME,
    response_at DATETIME,
    status ENUM('todo', 'in_progress', 'bug', 'completed') DEFAULT 'todo',
    bug_link VARCHAR(255),
    working_hours VARCHAR(50),
    frt INT,
    FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL,
    FOREIGN KEY (answer_agent_id) REFERENCES agents(id) ON DELETE SET NULL,
    FOREIGN KEY (solved_agent_id) REFERENCES agents(id) ON DELETE SET NULL
);
`;

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database');

    db.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log('customer_service_tickets table created or already exists');
        process.exit();
    });
});

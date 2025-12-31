const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'tsapp_db'
});

db.connect(async err => {
    if (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
    console.log('Connected');

    const query = `
        INSERT INTO customer_service_tickets 
        (campus_id, campus_pic, source_id, question, scope, answer_agent_id, solved_agent_id, created_at, response_at, status, bug_link, working_hours, frt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Test case 1: response_at as empty string ''
    const valuesWithEmptyString = [
        1, 'Test PIC', 1, 'Test Question', 'Scope',
        1, null, '2024-01-01 10:00:00', '', // response_at is ''
        'todo', '', '', 0
    ];

    try {
        await new Promise((resolve, reject) => {
            db.query(query, valuesWithEmptyString, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
        console.log('SUCCESS: Inserted with empty string response_at');
    } catch (e) {
        console.log('FAILURE: Insert with empty string response_at failed:', e.code, e.sqlMessage);
    }

    // Test case 2: response_at as NULL
    const valuesWithNull = [
        1, 'Test PIC', 1, 'Test Question 2', 'Scope',
        1, null, '2024-01-01 10:00:00', null, // response_at is NULL
        'todo', '', '', 0
    ];

    try {
        await new Promise((resolve, reject) => {
            db.query(query, valuesWithNull, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
        console.log('SUCCESS: Inserted with NULL response_at');
    } catch (e) {
        console.log('FAILURE: Insert with NULL response_at failed:', e.code, e.sqlMessage);
    }

    process.exit();
});

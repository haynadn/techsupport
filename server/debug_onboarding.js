const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_NAME || 'tsapp_db'
});

const query = `
    SELECT 
        c.id, c.name,
        -- Deployment Date
        (SELECT MIN(m.completed_at) 
         FROM migrations m 
         JOIN sla s ON m.sla_id = s.id
         WHERE m.campus_id = c.id AND s.type LIKE '%Deployment%' AND m.status = 'completed') as deployment_date,
        
        -- Impl Progress
        (SELECT COUNT(*) FROM migrations m WHERE m.campus_id = c.id AND m.status = 'completed') as impl_completed,
        (SELECT COUNT(*) FROM migrations m WHERE m.campus_id = c.id) as impl_total,
        
        -- Train Progress
        (SELECT COUNT(*) FROM training_tickets t WHERE t.campus_id = c.id AND t.status = 'done') as train_completed,
        (SELECT COUNT(*) FROM training_tickets t WHERE t.campus_id = c.id) as train_total,
        
        -- Train Finish Date
        (SELECT MAX(t.date_closed) 
         FROM training_tickets t 
         JOIN materials m ON t.material_id = m.id
         WHERE t.campus_id = c.id AND t.status = 'done' AND m.name LIKE '%Operator%') as train_finish_date
    FROM campuses c
    WHERE c.status = 'active'
`;

db.query(query, (err, results) => {
    if (err) {
        console.error('Query Error Code:', err.code);
        console.error('Query Error Message:', err.sqlMessage);

    } else {
        console.log('Query Success. Rows:', results.length);
        if (results.length > 0) console.log('First row:', results[0]);
    }
    db.end();
});

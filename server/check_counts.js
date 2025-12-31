const mysql = require('mysql2');
// require('dotenv').config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'tsapp_db'
});

db.connect(async err => {
    if (err) {
        console.error('Connection error:', err);
        return;
    }
    console.log('Connected to DB.');

    const query = (sql) => new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

    try {
        const campuses = await query('SELECT count(*) as count FROM campuses');
        console.log('Campuses:', campuses[0].count);

        const agents = await query('SELECT count(*) as count FROM agents');
        console.log('Agents:', agents[0].count);

        const sla = await query('SELECT count(*) as count FROM sla');
        console.log('SLA:', sla[0].count);

        const migrations = await query('SELECT count(*) as count FROM migrations');
        console.log('Migrations Count:', migrations[0].count);

        const content = await query('SELECT id, migration_condition FROM migrations ORDER BY id DESC LIMIT 5');
        console.log('Recent Migrations:', content);

    } catch (e) {
        console.error('Error querying:', e);
    }
    db.end();
});

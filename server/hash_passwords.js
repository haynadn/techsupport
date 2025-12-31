const mysql = require('mysql2');
const bcrypt = require('bcrypt');
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

    db.query('SELECT * FROM agents', async (err, agents) => {
        if (err) {
            console.error('Error fetching agents:', err);
            db.end();
            return;
        }

        console.log(`Found ${agents.length} agents. Processing...`);

        for (const agent of agents) {
            // Check if password is already hashed (bcrypt hashes start with $2b$, $2a$, or $2y$ and are 60 chars long)
            if (agent.password && agent.password.length === 60 && agent.password.startsWith('$2')) {
                console.log(`Skipping agent ${agent.username} (already hashed)`);
                continue;
            }

            // If empty password, maybe set a default one? Or skip?
            // User said "sesuaikan value dbnya", implying they should be able to login.
            // If password is empty or null, we'll set it to '123456' as a default for migration.
            let plainPassword = agent.password;
            if (!plainPassword) {
                plainPassword = 'password123';
                console.log(`Agent ${agent.username} has no password. Setting to default 'password123'.`);
            }

            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            await new Promise((resolve, reject) => {
                db.query('UPDATE agents SET password = ? WHERE id = ?', [hashedPassword, agent.id], (err) => {
                    if (err) {
                        console.error(`Failed to update agent ${agent.username}:`, err);
                        reject(err);
                    } else {
                        console.log(`Updated password for agent ${agent.username}`);
                        resolve();
                    }
                });
            });
        }

        console.log('Password migration completed.');
        db.end();
    });
});

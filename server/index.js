const express = require('express');
const path = require('path');

const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const envPath = path.join(__dirname, '.env');
console.log('--- Environment Initialization ---');
console.log('Looking for .env at:', envPath);
if (fs.existsSync(envPath)) {
    console.log('.env file found.');
    const stats = fs.statSync(envPath);
    console.log('.env size:', stats.size, 'bytes');
} else {
    console.error('.env file NOT FOUND at this path!');
}

const app = express();
const port = process.env.PORT || 3001;
console.log('PORT loaded from env:', process.env.PORT);
console.log('DB_USER loaded from env:', process.env.DB_USER);
console.log('DB_PASSWORD loaded from env:', process.env.DB_PASSWORD ? '****' : 'UNDEFINED');

// List all DB keys found for diagnostics
const dbKeys = Object.keys(process.env).filter(k => k.startsWith('DB_'));
console.log('Detected DB env keys:', dbKeys.join(', '));

// CORS Configuration - Restrict to specific origin
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));


// Rate Limiting Configuration
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: { message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply general API rate limiting to all routes
app.use('/api/', apiLimiter);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    console.log(`Auth Middleware: ${req.method} ${req.url}`);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Database Connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_NAME || 'tsapp_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Successfully connected to MySQL database');
        connection.release();
    }
});

// API Routes
app.get('/', (req, res) => {
    res.send('Technical Support App API');
});

// --- AUTHENTICATION ---

// Login Endpoint with Rate Limiting and Validation
app.post('/api/login',
    loginLimiter,
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    (req, res) => {
        console.log(`[LOGIN] Attempt starting for user: ${req.body.username}`);
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        db.query('SELECT * FROM agents WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error('[LOGIN] Database query error:', err);
                return res.status(500).json({ error: 'Database error', details: err.message });
            }

            console.log(`[LOGIN] Database check completed. User found: ${results.length > 0}`);

            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            const agent = results[0];

            if (agent.status !== 'active') {
                return res.status(403).json({ message: 'Account is inactive' });
            }

            // Verify password (only bcrypt hashed passwords supported)
            if (!agent.password || (!agent.password.startsWith('$2a$') && !agent.password.startsWith('$2b$'))) {
                return res.status(500).json({ message: 'Password not properly configured. Please contact administrator.' });
            }

            const isMatch = await bcrypt.compare(password, agent.password);

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            const token = jwt.sign(
                { id: agent.id, username: agent.username, role: agent.role, name: agent.name },
                SECRET_KEY,
                { expiresIn: '24h' }
            );

            res.json({ token, user: { id: agent.id, username: agent.username, role: agent.role, name: agent.name } });
        });
    });

// Agents Route - Protected
app.get('/api/agents', authenticateToken, (req, res) => {
    db.query('SELECT id, name, email, username, phone, role, status FROM agents', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/agents',
    authenticateToken,
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['admin', 'agent', 'leader']).withMessage('Invalid role')
    ],
    async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, username, password, phone, role, status } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query('INSERT INTO agents (name, email, username, password, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, email, username, hashedPassword, phone, role, status],
                (err, result) => {
                    if (err) return res.status(500).json(err);
                    res.json({ id: result.insertId, name, email, role, status });
                });
        } catch (err) {
            res.status(500).json({ error: 'Error hashing password' });
        }
    });

app.put('/api/agents/:id', authenticateToken, async (req, res) => {
    const { name, email, username, password, phone, role, status } = req.body;

    if (password && password.trim() !== '') {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query('UPDATE agents SET name = ?, email = ?, username = ?, password = ?, phone = ?, role = ?, status = ? WHERE id = ?',
                [name, email, username, hashedPassword, phone, role, status, req.params.id],
                (err, result) => {
                    if (err) return res.status(500).json(err);
                    res.json({ message: 'Agent updated successfully' });
                });
        } catch (err) {
            res.status(500).json({ error: 'Error hashing password' });
        }
    } else {
        db.query('UPDATE agents SET name = ?, email = ?, username = ?, phone = ?, role = ?, status = ? WHERE id = ?',
            [name, email, username, phone, role, status, req.params.id],
            (err, result) => {
                if (err) return res.status(500).json(err);
                res.json({ message: 'Agent updated successfully' });
            });
    }
});

app.delete('/api/agents/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM agents WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Agent deleted successfully' });
    });
});

// Campuses Route - Protected
app.get('/api/campuses', authenticateToken, (req, res) => {
    db.query('SELECT * FROM campuses', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/campuses', authenticateToken, (req, res) => {
    const { code, name, address, applications, status, deployment_date } = req.body;
    db.query('INSERT INTO campuses (code, name, address, applications, status, deployment_date) VALUES (?, ?, ?, ?, ?, ?)',
        [code, name, address, JSON.stringify(applications), status, deployment_date],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId, ...req.body });
        });
});

app.put('/api/campuses/:id', authenticateToken, (req, res) => {
    const { code, name, address, applications, status, deployment_date } = req.body;
    db.query('UPDATE campuses SET code = ?, name = ?, address = ?, applications = ?, status = ?, deployment_date = ? WHERE id = ?',
        [code, name, address, JSON.stringify(applications), status, deployment_date, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: 'Campus updated successfully' });
        });
});

app.delete('/api/campuses/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM campuses WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Campus deleted successfully' });
    });
});

// Bulk Insert Campuses
app.post('/api/campuses/bulk', authenticateToken, (req, res) => {
    const campuses = req.body; // Expecting an array of objects
    if (!Array.isArray(campuses) || campuses.length === 0) {
        return res.status(400).json({ message: 'Invalid data format. Expected an array of campuses.' });
    }

    const values = campuses.map(c => [
        c.code,
        c.name,
        c.address,
        typeof c.applications === 'object' ? JSON.stringify(c.applications) : c.applications,
        c.status || 'active'
    ]);

    const query = 'INSERT INTO campuses (code, name, address, applications, status) VALUES ?';

    db.query(query, [values], (err, result) => {
        if (err) {
            console.error('Bulk insert error:', err);
            return res.status(500).json(err);
        }
        res.json({ message: `${result.affectedRows} campuses imported successfully`, count: result.affectedRows });
    });
});

// Sources Route
app.get('/api/sources', authenticateToken, (req, res) => {
    db.query('SELECT * FROM sources', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/sources', authenticateToken, (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO sources (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, name });
    });
});

app.put('/api/sources/:id', authenticateToken, (req, res) => {
    const { name } = req.body;
    db.query('UPDATE sources SET name = ? WHERE id = ?', [name, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Source updated successfully' });
    });
});

app.delete('/api/sources/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM sources WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Source deleted successfully' });
    });
});

// Scopes Route
app.get('/api/scopes', authenticateToken, (req, res) => {
    db.query('SELECT * FROM scopes', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/scopes', authenticateToken, (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO scopes (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, name });
    });
});

app.put('/api/scopes/:id', authenticateToken, (req, res) => {
    const { name } = req.body;
    db.query('UPDATE scopes SET name = ? WHERE id = ?', [name, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Scope updated successfully' });
    });
});

app.delete('/api/scopes/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM scopes WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Scope deleted successfully' });
    });
});

// Materials Route
app.get('/api/materials', authenticateToken, (req, res) => {
    db.query('SELECT * FROM materials', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/materials', authenticateToken, (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO materials (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, name });
    });
});

app.put('/api/materials/:id', authenticateToken, (req, res) => {
    const { name } = req.body;
    db.query('UPDATE materials SET name = ? WHERE id = ?', [name, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Material updated successfully' });
    });
});

app.delete('/api/materials/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM materials WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Material deleted successfully' });
    });
});

// Holidays Route
app.get('/api/holidays', authenticateToken, (req, res) => {
    db.query('SELECT * FROM holidays ORDER BY date ASC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/holidays', authenticateToken, (req, res) => {
    const { date, name } = req.body;
    db.query('INSERT INTO holidays (date, name) VALUES (?, ?)', [date, name], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, date, name });
    });
});

app.put('/api/holidays/:id', authenticateToken, (req, res) => {
    const { date, name } = req.body;
    db.query('UPDATE holidays SET date = ?, name = ? WHERE id = ?', [date, name, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Holiday updated successfully' });
    });
});

app.delete('/api/holidays/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM holidays WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Holiday deleted successfully' });
    });
});

app.post('/api/holidays/bulk', authenticateToken, (req, res) => {
    const holidays = req.body;
    if (!Array.isArray(holidays) || holidays.length === 0) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    const values = holidays.map(h => [h.date, h.name]);
    const query = 'INSERT INTO holidays (date, name) VALUES ?';

    db.query(query, [values], (err, result) => {
        if (err) {
            console.error('Bulk insert error:', err);
            return res.status(500).json(err);
        }
        res.json({ message: `${result.affectedRows} holidays imported`, count: result.affectedRows });
    });
});

// SLA Routes
app.get('/api/slas', authenticateToken, (req, res) => {
    db.query('SELECT * FROM sla', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/slas', authenticateToken, (req, res) => {
    const { type, duration, unit, category } = req.body;
    db.query('INSERT INTO sla (type, duration, unit, category) VALUES (?, ?, ?, ?)', [type, duration, unit, category], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, type, duration, unit, category });
    });
});

app.put('/api/slas/:id', authenticateToken, (req, res) => {
    const { type, duration, unit, category } = req.body;
    db.query('UPDATE sla SET type = ?, duration = ?, unit = ?, category = ? WHERE id = ?', [type, duration, unit, category, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'SLA updated successfully' });
    });
});

app.delete('/api/slas/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM sla WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'SLA deleted successfully' });
    });
});

app.post('/api/slas/bulk', authenticateToken, (req, res) => {
    const slas = req.body;
    if (!Array.isArray(slas) || slas.length === 0) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    const values = slas.map(s => [s.type, s.duration, s.unit || 'Menit', s.category || 'Customer Service']);
    const query = 'INSERT INTO sla (type, duration, unit, category) VALUES ?';

    db.query(query, [values], (err, result) => {
        if (err) {
            console.error('Bulk insert error:', err);
            return res.status(500).json(err);
        }
        res.json({ message: `${result.affectedRows} SLAs imported`, count: result.affectedRows });
    });
});

// Training Tickets Routes
app.get('/api/training-tickets', authenticateToken, (req, res) => {
    const query = `
        SELECT t.*,
               c.name as campus_name,
               a.name as agent_name,
               m.name as material_name,
               t.trainer_id as agent_id
        FROM training_tickets t
        LEFT JOIN campuses c ON t.campus_id = c.id
        LEFT JOIN agents a ON t.trainer_id = a.id
        LEFT JOIN materials m ON t.material_id = m.id
        ORDER BY t.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching training tickets:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/api/training-tickets', authenticateToken, (req, res) => {
    const { date, campus_id, agent_id, material_id, status, minutes_link, method } = req.body;

    // Validate required fields
    if (!campus_id || !agent_id || !material_id || !date || !status) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const query = 'INSERT INTO training_tickets (date, campus_id, trainer_id, material_id, status, minutes_link, method) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [date, campus_id, agent_id, material_id, status, minutes_link, method || 'Online'], (err, result) => {
        if (err) {
            console.error('Error creating training ticket:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: result.insertId, message: 'Ticket created successfully' });
    });
});

app.post('/api/training-tickets/bulk', authenticateToken, (req, res) => {
    const tickets = req.body;
    if (!Array.isArray(tickets) || tickets.length === 0) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    const values = tickets.map(t => [
        t.campus_id,
        t.agent_id, // Maps to trainer_id in DB
        t.material_id,
        t.method,
        t.status || 'todo',
        t.date,
        t.minutes_link
    ]);

    const query = 'INSERT INTO training_tickets (campus_id, trainer_id, material_id, method, status, date, minutes_link) VALUES ?';

    db.query(query, [values], (err, result) => {
        if (err) {
            console.error('Bulk insert error:', err);
            return res.status(500).json(err);
        }
        res.json({ message: `${result.affectedRows} tickets imported`, count: result.affectedRows });
    });
});

app.put('/api/training-tickets/:id', authenticateToken, (req, res) => {
    const { campus_id, agent_id, material_id, method, status, date, minutes_link } = req.body;

    let date_closed = null;
    if (status === 'cancel' || status === 'done') {
        date_closed = new Date(); // Use current date/time for closure
    }

    const query = 'UPDATE training_tickets SET campus_id = ?, trainer_id = ?, material_id = ?, method = ?, status = ?, date = ?, date_closed = ?, minutes_link = ? WHERE id = ?';
    db.query(query, [campus_id, agent_id, material_id, method, status, date, date_closed, minutes_link, req.params.id], (err, result) => {
        if (err) {
            console.error('Error updating ticket:', err);
            return res.status(500).json(err);
        }
        res.json({ message: 'Ticket updated successfully' });
    });
});

app.delete('/api/training-tickets/:id', authenticateToken, (req, res) => {
    const query = 'DELETE FROM training_tickets WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Ticket deleted successfully' });
    });
});

// === PRINT RESULTS ENDPOINTS ===

app.get('/api/print-results', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM print_results ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching print results:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/api/print-results', authenticateToken, (req, res) => {
    const { name, portal } = req.body;
    if (!name || !portal) return res.status(400).json({ error: 'Required fields missing' });

    const query = 'INSERT INTO print_results (name, portal) VALUES (?, ?)';
    db.query(query, [name, portal], (err, result) => {
        if (err) {
            console.error('Error creating print result:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: result.insertId, message: 'Print result created successfully' });
    });
});

app.put('/api/print-results/:id', authenticateToken, (req, res) => {
    const { name, portal } = req.body;
    const query = 'UPDATE print_results SET name = ?, portal = ? WHERE id = ?';
    db.query(query, [name, portal, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Print result updated successfully' });
    });
});

app.delete('/api/print-results/:id', authenticateToken, (req, res) => {
    const query = 'DELETE FROM print_results WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Print result deleted successfully' });
    });
});

// === IMPLEMENTATION PRINTS ENDPOINTS ===

app.get('/api/implementation-prints', authenticateToken, (req, res) => {
    const query = `
        SELECT ip.*, c.name as campus_name
        FROM implementation_prints ip
        JOIN campuses c ON ip.campus_id = c.id
        ORDER BY ip.updated_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching implementation prints:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/api/implementation-prints', authenticateToken, (req, res) => {
    const { campus_id, items } = req.body;
    if (!campus_id) return res.status(400).json({ error: 'Campus ID is required' });

    const query = 'INSERT INTO implementation_prints (campus_id, items) VALUES (?, ?)';
    db.query(query, [campus_id, JSON.stringify(items || [])], (err, result) => {
        if (err) {
            console.error('Error creating implementation print:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: result.insertId, message: 'Record created successfully' });
    });
});

app.put('/api/implementation-prints/:id', authenticateToken, (req, res) => {
    const { campus_id, items } = req.body;
    const query = 'UPDATE implementation_prints SET campus_id = ?, items = ? WHERE id = ?';
    db.query(query, [campus_id, JSON.stringify(items || []), req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Record updated successfully' });
    });
});

app.delete('/api/implementation-prints/:id', authenticateToken, (req, res) => {
    const query = 'DELETE FROM implementation_prints WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Record deleted successfully' });
    });
});

// === MIGRATION ENDPOINTS ===

app.get('/api/migrations', authenticateToken, (req, res) => {
    const query = `
        SELECT m.*, 
               c.name as campus_name, 
               s.type as job_name, s.duration as sla_duration, s.unit as sla_unit,
               sp.name as specialist_name, 
               v.name as verifier_name
        FROM migrations m
        JOIN campuses c ON m.campus_id = c.id
        LEFT JOIN sla s ON m.sla_id = s.id
        LEFT JOIN agents sp ON m.specialist_id = sp.id
        LEFT JOIN agents v ON m.verifier_id = v.id
        ORDER BY m.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching migrations:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

app.post('/api/migrations', authenticateToken, (req, res) => {
    const { campus_id, sla_id, specialist_id, verifier_id, link_task, deadline, status } = req.body;

    let completed_at = null;
    if (status === 'completed') {
        completed_at = new Date();
    }

    const query = 'INSERT INTO migrations (campus_id, sla_id, specialist_id, verifier_id, link_task, deadline, status, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [campus_id, sla_id, specialist_id, verifier_id, link_task, deadline, status || 'backlog', completed_at], (err, result) => {
        if (err) {
            console.error('Error creating migration:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: result.insertId, message: 'Migration created successfully' });
    });
});

app.post('/api/migrations/batch', authenticateToken, (req, res) => {
    const { campus_id, items } = req.body;

    if (!campus_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const values = items.map(item => {
        let completed_at = null;
        if (item.status === 'completed') {
            completed_at = new Date();
        }
        return [
            campus_id,
            item.sla_id,
            item.specialist_id,
            item.verifier_id,
            item.link_task,
            item.deadline,
            item.status || 'backlog',
            completed_at,
            item.migration_condition
        ];
    });

    const query = 'INSERT INTO migrations (campus_id, sla_id, specialist_id, verifier_id, link_task, deadline, status, completed_at, migration_condition) VALUES ?';
    db.query(query, [values], (err, result) => {
        if (err) {
            console.error('Error batch creating migrations:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: `${result.affectedRows} migrations created successfully` });
    });
});

app.delete('/api/migrations/campus/:campusId', authenticateToken, (req, res) => {
    const query = 'DELETE FROM migrations WHERE campus_id = ?';
    db.query(query, [req.params.campusId], (err, result) => {
        if (err) {
            console.error('Error deleting campus migrations:', err);
            return res.status(500).json(err);
        }
        res.json({ message: 'All migrations for campus deleted successfully' });
    });
});

app.put('/api/migrations/:id', authenticateToken, (req, res) => {
    // First retrieve current data to check completion status
    const { campus_id, sla_id, specialist_id, verifier_id, link_task, deadline, status, migration_condition } = req.body;

    // Logic to set completed_at if status changes to completed, or reset if changed away from completed
    // For simplicity, if status is 'completed' and we are updating, we update completed_at to NOW() if not already set, 
    // OR we relies on the frontend/update logic.
    // Let's check status.

    // Logic to set completed_at if status changes to completed or cancel
    const completed_at = (status === 'completed' || status === 'cancel') ? new Date() : null;

    const simpleQuery = 'UPDATE migrations SET campus_id = ?, sla_id = ?, specialist_id = ?, verifier_id = ?, link_task = ?, deadline = ?, status = ?, completed_at = ?, migration_condition = ? WHERE id = ?';
    db.query(simpleQuery, [campus_id, sla_id, specialist_id, verifier_id, link_task, deadline, status, completed_at, migration_condition, req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Migration updated successfully' });
    });
});

app.delete('/api/migrations/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM migrations WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Migration deleted successfully' });
    });
});


// === CUSTOMER SERVICE ENDPOINTS ===

// Duplicate sources route removed


// Get Tickets
// Get Tickets
app.get('/api/customer-service', authenticateToken, (req, res) => {
    const query = `
        SELECT t.*, 
               c.name as campus_name,
               s.name as source_name,
               ag_ans.name as answer_agent_name,
               ag_sol.name as solved_agent_name,
               IF(t.solved_at = '0000-00-00 00:00:00', NULL, t.solved_at) as solved_at
        FROM customer_service_tickets t
        LEFT JOIN campuses c ON t.campus_id = c.id
        LEFT JOIN sources s ON t.source_id = s.id
        LEFT JOIN agents ag_ans ON t.answer_agent_id = ag_ans.id
        LEFT JOIN agents ag_sol ON t.solved_agent_id = ag_sol.id
        ORDER BY t.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching CS tickets:', err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        res.json(results);
    });
});

// Create Ticket
app.post('/api/customer-service', authenticateToken, (req, res) => {
    const {
        campus_id, campus_pic, source_id, question, scope,
        answer_agent_id, solved_agent_id, created_at, response_at, solved_at,
        status, bug_link, working_hours, frt
    } = req.body;

    const query = `
        INSERT INTO customer_service_tickets 
        (campus_id, campus_pic, source_id, question, scope, answer_agent_id, solved_agent_id, created_at, response_at, solved_at, status, bug_link, working_hours, frt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        campus_id, campus_pic, source_id, question, scope,
        answer_agent_id, solved_agent_id, created_at, response_at, solved_at,
        status || 'todo', bug_link, working_hours, frt
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ id: result.insertId, message: 'Ticket created successfully' });
    });
});

// Update Ticket
app.put('/api/customer-service/:id', authenticateToken, (req, res) => {
    const {
        campus_id, campus_pic, source_id, question, scope,
        answer_agent_id, solved_agent_id, created_at, response_at, solved_at,
        status, bug_link, working_hours, frt
    } = req.body;

    const query = `
        UPDATE customer_service_tickets SET 
        campus_id=?, campus_pic=?, source_id=?, question=?, scope=?, 
        answer_agent_id=?, solved_agent_id=?, created_at=?, response_at=?, solved_at=?,
        status=?, bug_link=?, working_hours=?, frt=?
        WHERE id=?
    `;

    const values = [
        campus_id, campus_pic, source_id, question, scope,
        answer_agent_id, solved_agent_id, created_at, response_at, solved_at,
        status, bug_link, working_hours, frt,
        req.params.id
    ];

    db.query(query, values, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Ticket updated successfully' });
    });
});

// Delete Ticket
app.delete('/api/customer-service/:id', authenticateToken, (req, res) => {
    db.query('DELETE FROM customer_service_tickets WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Ticket deleted successfully' });
    });
});

// === ONBOARDING ENDPOINTS ===


app.get('/api/onboarding', authenticateToken, (req, res) => {
    console.log('HIT /api/onboarding');
    const query = `
        SELECT 
            c.id, c.name,
            -- Deployment Date: Date when 'Deployment' task was completed (check via SLA type)
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
            
            -- Train Finish Date: Latest 'Operator' completion (check via Material Name)
            (SELECT MAX(t.date_closed) 
             FROM training_tickets t 
             JOIN materials m ON t.material_id = m.id
             WHERE t.campus_id = c.id AND t.status = 'done' AND m.name LIKE '%Operator%') as train_finish_date
        FROM campuses c
        WHERE c.status = 'active'
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching onboarding data:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const data = results.map(row => {
            const implProgress = row.impl_total > 0 ? Math.round((row.impl_completed / row.impl_total) * 100) : 0;
            const trainProgress = row.train_total > 0 ? Math.round((row.train_completed / row.train_total) * 100) : 0;

            let onboardingStatus = '-';

            if (row.deployment_date && row.train_finish_date) {
                const deploy = new Date(row.deployment_date);
                const finish = new Date(row.train_finish_date);

                // Reset time part to ensure day-level calculation
                deploy.setHours(0, 0, 0, 0);
                finish.setHours(0, 0, 0, 0);

                // Deadline is exactly 1 month (30 days for simplicity, or use setMonth)
                // User said "1 bulan". I will use setMonth(+1) for accuracy.
                const deadline = new Date(deploy);
                deadline.setMonth(deadline.getMonth() + 1);

                // Calculate difference in milliseconds
                const diffTime = finish.getTime() - deadline.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    onboardingStatus = `Cepat ${Math.abs(diffDays)} hari`;
                } else if (diffDays === 0) {
                    onboardingStatus = 'Tepat Waktu';
                } else {
                    onboardingStatus = `Telat ${diffDays} hari`;
                }
            }

            return {
                ...row,
                implProgress,
                trainProgress,
                onboardingStatus
            };
        });
        res.json(data);
    });
});

// === DASHBOARD ENDPOINT ===
app.get('/api/dashboard', async (req, res) => {
    try {
        const dbPromise = db.promise();

        // 1. Ticket Stats
        const [ticketStats] = await dbPromise.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status != 'completed' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN created_at >= CURDATE() THEN 1 ELSE 0 END) as new_today
            FROM customer_service_tickets
        `);

        // 2. Weekly Trend (Last 7 Days)
        const [trendRes] = await dbPromise.query(`
            SELECT DATE_FORMAT(created_at, '%a') as name, COUNT(*) as tiket, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as selesai
            FROM customer_service_tickets
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(created_at)
            ORDER BY created_at ASC
        `);

        // 3. Status Composition (CS)
        const [csStatus] = await dbPromise.query(`SELECT status as name, COUNT(*) as value FROM customer_service_tickets GROUP BY status`);

        // 4. Migration Status
        const [migStatus] = await dbPromise.query(`SELECT status as name, COUNT(*) as value FROM migrations GROUP BY status`);

        // 5. FRT Monthly Trend (Last 6 months)
        const [frtMonthly] = await dbPromise.query(`
            SELECT 
                DATE_FORMAT(created_at, '%b %Y') as month,
                DATE_FORMAT(created_at, '%Y-%m') as month_key,
                ROUND(AVG(frt), 1) as avg_frt,
                COUNT(*) as ticket_count
            FROM customer_service_tickets
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                AND response_at IS NOT NULL
                AND frt IS NOT NULL
            GROUP BY month_key, month
            ORDER BY month_key ASC
        `);

        console.log('FRT Monthly Query Result:', frtMonthly);

        // Calculate FRT percentage change (current vs previous month)
        let frtChange = null;
        if (frtMonthly.length >= 2) {
            const current = frtMonthly[frtMonthly.length - 1].avg_frt;
            const previous = frtMonthly[frtMonthly.length - 2].avg_frt;
            const change = ((current - previous) / previous) * 100;
            frtChange = {
                percentage: Math.abs(change).toFixed(1),
                direction: change < 0 ? 'down' : 'up',  // down = improvement (lower FRT is better)
                current: current,
                previous: previous
            };
        }

        console.log('FRT Change:', frtChange);

        res.json({
            stats: ticketStats[0],
            trend: trendRes,
            composition: {
                cs: csStatus,
                migration: migStatus
            },
            frtTrend: frtMonthly,
            frtChange: frtChange
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

// React Router - Handle all other requests by serving index.html
// Using regex to avoid path-to-regexp version compatibility issues in Express 5
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port} [UPDATED]`);
    console.log('Environment Debug:');
    console.log('- PORT from env:', process.env.PORT);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Database Host:', process.env.DB_HOST);
    console.log('- Current Directory:', process.cwd());
    console.log('- __dirname:', __dirname);
});


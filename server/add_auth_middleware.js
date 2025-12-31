/**
 * Security Fix Script
 * 
 * This script adds authenticateToken middleware to all protected endpoints
 * 
 * Protected endpoints (require authentication):
 * - All POST, PUT, DELETE operations
 * - All GET operations except: /api/login, /api/dashboard
 * 
 * Public endpoints (no authentication required):
 * - POST /api/login
 * - GET /api/dashboard
 */

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(serverPath, 'utf8');

// List of endpoints that should remain public
const publicEndpoints = [
    "app.post('/api/login'",
    "app.get('/api/dashboard'"
];

// Find all endpoint definitions
const endpointPattern = /^(app\.(get|post|put|delete)\('\/api\/[^']+',\s*)(?!authenticateToken)/gm;

let matches = [];
let match;
while ((match = endpointPattern.exec(content)) !== null) {
    const line = content.substring(match.index, content.indexOf('\n', match.index));

    // Check if this is a public endpoint
    const isPublic = publicEndpoints.some(pub => line.includes(pub));

    if (!isPublic && !line.includes('authenticateToken')) {
        matches.push({
            index: match.index,
            original: match[1],
            replacement: match[1] + 'authenticateToken, '
        });
    }
}

// Apply replacements in reverse order to maintain correct indices
matches.reverse().forEach(m => {
    content = content.substring(0, m.index) +
        m.replacement +
        content.substring(m.index + m.original.length);
});

fs.writeFileSync(serverPath, content, 'utf8');

console.log(`✅ Added authentication to ${matches.length} endpoints`);
console.log('Protected endpoints now require JWT token in Authorization header');

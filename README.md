# Technical Support Application (TSApp)

Aplikasi manajemen operasional untuk tim Technical Support yang mencakup pengelolaan tiket customer service, training, migrasi, dan berbagai data master.

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Arsitektur](#-arsitektur)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [API Documentation](#-api-documentation)
- [Keamanan](#-keamanan)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)

---

## 🚀 Fitur Utama

### 1. Dashboard Interaktif
- **Statistik Real-time**: Total tiket, tiket selesai, tiket aktif
- **Grafik Tren**: Visualisasi tiket mingguan dengan Recharts
- **FRT Monitoring**: Grafik rata-rata First Response Time bulanan dengan indikator persentase perubahan
- **Status Composition**: Pie chart untuk distribusi status tiket

### 2. Customer Service Management
- **CRUD Tiket**: Buat, edit, hapus tiket customer service
- **Auto-calculation FRT**: Otomatis menghitung First Response Time
- **Filter Advanced**: Filter berdasarkan kampus, status, tanggal, scope, agen
- **SLA Tracking**: Monitor waktu respon dan penyelesaian
- **Custom DateTime Input**: Format 24 jam dengan auto-formatting (dd-mm-yyyy HH:mm)

### 3. Training & Meeting Management
- **Bulk Creation**: Buat multiple training tickets sekaligus
- **Minutes Link**: Link ke berita acara training
- **Material Tracking**: Kelola materi training
- **Participant Management**: Track peserta dan trainer

### 4. Migration Management
- **Batch Operations**: Edit/delete multiple migrations per kampus
- **Grouped View**: Tampilan berdasarkan kampus
- **Deadline Auto-calculation**: Otomatis hitung deadline berdasarkan SLA
- **Condition Tracking**: Monitor kondisi migrasi (baik/rusak)

### 5. Client Onboarding
- **Deployment Tracking**: Monitor tanggal deployment per kampus
- **Training Status**: Track status training operator
- **Onboarding Timeline**: Hitung waktu onboarding (1 bulan dari deployment)

### 6. Master Data Management
- **Agents**: Kelola user dan role (admin, agent, leader)
- **Campuses**: Data kampus dengan aplikasi yang digunakan
- **SLA**: Service Level Agreement untuk berbagai kategori
- **Holidays**: Kalender libur nasional
- **Sources, Scopes, Materials**: Data master untuk operasional

---

## 🛠 Teknologi

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **TailwindCSS** - Utility-first CSS framework
- **XLSX** - Excel export functionality

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL2** - Database driver
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Express Validator** - Input validation

### Database
- **MySQL** - Relational database

---

## 🏗 Arsitektur

```
tsapp/
├── src/                          # Frontend source
│   ├── components/              # Reusable components
│   │   ├── ui/                 # UI components (Card, Table, etc.)
│   │   ├── Layout.jsx          # Main layout with sidebar
│   │   ├── ProtectedRoute.jsx  # Route protection
│   │   └── StatsCard.jsx       # Dashboard stat cards
│   ├── pages/                   # Page components
│   │   ├── Dashboard.jsx       # Main dashboard
│   │   ├── CustomerService.jsx # CS ticket management
│   │   ├── Training.jsx        # Training management
│   │   ├── Migration.jsx       # Migration management
│   │   ├── ClientOnboarding.jsx# Onboarding tracking
│   │   └── master/             # Master data pages
│   ├── utils/                   # Utility functions
│   │   └── dateFormatter.js    # Date/time formatting
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # Entry point
├── server/                      # Backend source
│   └── index.js                # Express server & API routes
├── public/                      # Static assets
└── package.json                # Dependencies

API Structure:
/api/login                       # Authentication
/api/dashboard                   # Dashboard data
/api/agents                      # User management
/api/campuses                    # Campus data
/api/customer-service            # CS tickets
/api/training-tickets            # Training tickets
/api/migrations                  # Migration data
/api/onboarding                  # Onboarding data
/api/slas                        # SLA configuration
/api/holidays                    # Holiday calendar
/api/sources                     # Ticket sources
/api/scopes                      # Ticket scopes
/api/materials                   # Training materials
```

---

## 📦 Instalasi

### Prerequisites
- Node.js >= 16.x
- MySQL >= 5.7
- npm atau yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd tsapp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```sql
CREATE DATABASE tsapp_db;
USE tsapp_db;

-- Run migration scripts in server/ folder
-- Tables will be created automatically on first run
```

### 4. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tsapp_db

# Generate strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_generated_secret_key

FRONTEND_URL=http://localhost:5173
PORT=3000
```

---

## ⚙️ Konfigurasi

### Database Configuration
File: `server/index.js`
```javascript
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'tsapp_db',
    connectionLimit: 10
});
```

### CORS Configuration
```javascript
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
};
```

### Rate Limiting
- **Login**: 5 attempts per 15 minutes
- **API**: 100 requests per 15 minutes

---

## 🚀 Menjalankan Aplikasi

### Development Mode

**Terminal 1 - Backend:**
```bash
node server/index.js
```
Server akan berjalan di `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend akan berjalan di `http://localhost:5173`

### Production Build

**Build Frontend:**
```bash
npm run build
```

**Serve Production:**
```bash
npm run preview
```

---

## 📚 API Documentation

### Authentication

#### POST /api/login
Login dan dapatkan JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

### Protected Endpoints

Semua endpoint di bawah ini memerlukan JWT token di header:
```
Authorization: Bearer <token>
```

#### Agents

**GET /api/agents**
Dapatkan semua agents (password hash tidak dikembalikan).

**POST /api/agents**
Buat agent baru.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "phone": "08123456789",
  "role": "agent",
  "status": "active"
}
```

**Validation:**
- `name`: Required
- `email`: Valid email format
- `username`: Min 3 characters
- `password`: Min 6 characters
- `role`: Must be 'admin', 'agent', or 'leader'

**PUT /api/agents/:id**
Update agent.

**DELETE /api/agents/:id**
Hapus agent.

---

#### Customer Service

**GET /api/customer-service**
Dapatkan semua tiket CS.

**POST /api/customer-service**
Buat tiket CS baru.
```json
{
  "campus_id": 1,
  "pic_campus": "John Doe",
  "source_id": 1,
  "scope_id": 1,
  "question": "Pertanyaan customer",
  "answer_agent_id": 1,
  "solved_agent_id": 1,
  "created_at": "2024-12-31T14:30:00",
  "response_at": "2024-12-31T14:35:00",
  "status": "todo",
  "bug_link": "https://..."
}
```

**Auto-calculated Fields:**
- `frt`: First Response Time (menit)
- `solved_at`: Otomatis terisi jika status = completed/flip/finnet/bug

**PUT /api/customer-service/:id**
Update tiket CS.

**DELETE /api/customer-service/:id**
Hapus tiket CS.

---

#### Dashboard

**GET /api/dashboard** (Public - No Auth Required)
Dapatkan data dashboard.

**Response:**
```json
{
  "stats": {
    "total": 150,
    "completed": 100,
    "active": 50,
    "new_today": 5
  },
  "trend": [
    { "name": "Mon", "tiket": 20, "selesai": 15 },
    { "name": "Tue", "tiket": 25, "selesai": 20 }
  ],
  "composition": {
    "cs": [
      { "name": "todo", "value": 30 },
      { "name": "in_progress", "value": 20 }
    ],
    "migration": [...]
  },
  "frtTrend": [
    { "month": "Nov 2024", "avg_frt": 45.2, "ticket_count": 120 },
    { "month": "Dec 2024", "avg_frt": 38.3, "ticket_count": 135 }
  ],
  "frtChange": {
    "percentage": "15.2",
    "direction": "down",
    "current": 38.3,
    "previous": 45.2
  }
}
```

---

### Bulk Operations

**POST /api/training-tickets/bulk**
Buat multiple training tickets.

**POST /api/migrations/batch**
Buat multiple migrations untuk satu kampus.

**POST /api/holidays/bulk**
Import holidays dari Excel.

---

## 🔒 Keamanan

### Implemented Security Features

1. **JWT Authentication**
   - Token expires in 24 hours
   - Required for 48+ protected endpoints
   - Stored in localStorage on frontend

2. **Password Security**
   - Bcrypt hashing (10 rounds)
   - No plain text passwords accepted
   - Min 6 characters requirement

3. **CORS Protection**
   - Restricted to configured frontend URL
   - Credentials enabled

4. **Rate Limiting**
   - Login: 5 attempts / 15 min
   - API: 100 requests / 15 min
   - Prevents brute force attacks

5. **Security Headers (Helmet)**
   - XSS Protection
   - Clickjacking prevention
   - Content Security Policy
   - HSTS

6. **Input Validation**
   - Email format validation
   - Required field checks
   - Type validation
   - SQL injection prevention (parameterized queries)

7. **Response Sanitization**
   - Password hashes excluded from API responses
   - Sensitive data filtered

### Security Best Practices

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Password Requirements:**
- Minimum 6 characters
- Bcrypt hashed
- Never stored in plain text

**API Request Example:**
```javascript
const token = localStorage.getItem('token');

fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

---

## 🗄 Database Schema

### Main Tables

**agents**
- User accounts dengan role-based access
- Password bcrypt hashed
- Status: active/inactive

**campuses**
- Data kampus klien
- Applications (JSON array)
- Deployment date tracking

**customer_service_tickets**
- Tiket CS dengan FRT tracking
- Auto-calculated solved_at
- Link to agents, campuses, sources, scopes

**training_tickets**
- Training & meeting records
- Bulk creation support
- Minutes link

**migrations**
- Migration tracking per kampus
- Batch operations
- Condition monitoring

**sla**
- Service Level Agreement
- Categories: training, migration, cs
- Duration & unit (hours/days)

**holidays**
- National holiday calendar
- Used for SLA calculations

**sources, scopes, materials**
- Master data untuk operasional

---

## 🚢 Deployment

### Production Checklist

- [ ] Generate strong JWT secret
- [ ] Configure production database
- [ ] Set FRONTEND_URL to production domain
- [ ] Build frontend: `npm run build`
- [ ] Configure reverse proxy (nginx/apache)
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging
- [ ] Monitor rate limiting
- [ ] Review CORS settings

### Environment Variables (Production)

```env
DB_HOST=production-db-host
DB_USER=production-user
DB_PASSWORD=strong-password
DB_NAME=tsapp_production

JWT_SECRET=<generated-64-byte-hex>
FRONTEND_URL=https://your-domain.com
PORT=3000
NODE_ENV=production
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/tsapp/dist;
        try_files $uri /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📝 Utility Functions

### Date Formatting (`src/utils/dateFormatter.js`)

```javascript
// Display formats
formatDateDisplay(dateStr)        // dd-mm-yyyy
formatDateTimeDisplay(dateStr)    // dd-mm-yyyy HH:mm

// Input formats
formatDateForInput(dateStr)       // yyyy-mm-dd
formatDateTimeForInput(dateStr)   // yyyy-mm-ddTHH:mm

// Parsing
parseDateInput(ddmmyyyy)          // dd-mm-yyyy → ISO
```

### Auto-formatting Inputs

**Date Input:**
- Type: `31122024` → Auto-formats to: `31-12-2024`

**Time Input:**
- Type: `0730` → Auto-formats to: `07:30`
- Always 24-hour format

---

## 🐛 Troubleshooting

### Common Issues

**1. CORS Error**
```
Access to fetch at 'http://localhost:3000/api/...' has been blocked by CORS policy
```
**Solution:** Check `FRONTEND_URL` in `.env` matches your frontend URL.

**2. 401 Unauthorized**
```
Access token required
```
**Solution:** Ensure JWT token is included in Authorization header.

**3. Rate Limit Exceeded**
```
Too many login attempts
```
**Solution:** Wait 15 minutes or adjust rate limit in `server/index.js`.

**4. Database Connection Error**
```
Error connecting to database
```
**Solution:** Verify MySQL is running and credentials in `.env` are correct.

---

## 📄 License

Proprietary - Internal Use Only

---

## 👥 Contributors

Technical Support Team

---

## 📞 Support

For technical support, contact the development team.

---

**Last Updated:** December 31, 2024
**Version:** 1.0.0

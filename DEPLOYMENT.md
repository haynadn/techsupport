# Panduan Deployment ke CyberPanel

Panduan lengkap untuk deploy Technical Support Application ke CyberPanel dengan OpenLiteSpeed.

## 📋 Daftar Isi

1. [Persiapan](#persiapan)
2. [Setup CyberPanel](#setup-cyberpanel)
3. [Upload Aplikasi](#upload-aplikasi)
4. [Konfigurasi Database](#konfigurasi-database)
5. [Konfigurasi Node.js](#konfigurasi-nodejs)
6. [Build Frontend](#build-frontend)
7. [Setup PM2](#setup-pm2)
8. [Konfigurasi Web Server](#konfigurasi-web-server)
9. [SSL Certificate](#ssl-certificate)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## 1. Persiapan

### Yang Harus Disiapkan:

#### A. Server Requirements
- **OS**: Ubuntu 20.04/22.04 atau CentOS 7/8
- **RAM**: Minimal 2GB (Recommended 4GB)
- **Storage**: Minimal 20GB
- **CyberPanel**: Versi terbaru
- **Node.js**: Version 16.x atau lebih tinggi
- **MySQL**: 5.7 atau MariaDB 10.x

#### B. Domain & DNS
- Domain sudah pointing ke IP server
- A Record: `your-domain.com` → `IP Server`
- Tunggu DNS propagation (15-30 menit)

#### C. File Aplikasi
```bash
# Di local, buat archive aplikasi
cd tsapp
npm run build  # Build frontend dulu

# Exclude node_modules dan file tidak perlu
tar -czf tsapp.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  .
```

---

## 2. Setup CyberPanel

### A. Install CyberPanel (Jika Belum)

```bash
# SSH ke server
ssh root@your-server-ip

# Install CyberPanel
sh <(curl https://cyberpanel.net/install.sh || wget -O - https://cyberpanel.net/install.sh)

# Pilih:
# - OpenLiteSpeed
# - Full installation
# - Remote MySQL: No (kecuali ada MySQL terpisah)
```

### B. Akses CyberPanel

```
URL: https://your-server-ip:8090
Username: admin
Password: (yang dibuat saat install)
```

### C. Create Website di CyberPanel

1. Login ke CyberPanel
2. **Websites** → **Create Website**
3. Isi form:
   - **Domain Name**: `your-domain.com`
   - **Email**: `admin@your-domain.com`
   - **Package**: Default
   - **PHP**: PHP 8.1 (tidak akan dipakai, tapi harus pilih)
   - **SSL**: Centang "SSL" (akan setup nanti)
4. Klik **Create Website**

---

## 3. Upload Aplikasi

### A. Via SFTP/SCP

```bash
# Dari local machine
scp tsapp.tar.gz root@your-server-ip:/home/your-domain.com/public_html/

# Atau gunakan FileZilla/WinSCP
# Host: your-server-ip
# Username: root
# Password: your-root-password
# Path: /home/your-domain.com/public_html/
```

### B. Extract di Server

```bash
# SSH ke server
ssh root@your-server-ip

# Masuk ke directory website
cd /home/your-domain.com/public_html/

# Extract
tar -xzf tsapp.tar.gz

# Hapus archive
rm tsapp.tar.gz

# Set permissions
chown -R cyberpanel:cyberpanel /home/your-domain.com/public_html/
chmod -R 755 /home/your-domain.com/public_html/
```

---

## 4. Konfigurasi Database

### A. Create Database via CyberPanel

1. **Databases** → **Create Database**
2. Isi:
   - **Database Name**: `tsapp_production`
   - **Database Username**: `tsapp_user`
   - **Password**: (generate strong password)
3. Klik **Create Database**

### B. Import Database Schema

```bash
# SSH ke server
cd /home/your-domain.com/public_html/

# Login ke MySQL
mysql -u tsapp_user -p tsapp_production

# Atau import dari file SQL (jika ada)
mysql -u tsapp_user -p tsapp_production < database.sql
```

### C. Create Tables (Manual)

Jika belum ada file SQL, jalankan migration scripts:

```bash
cd /home/your-domain.com/public_html/server/

# Jalankan semua create table scripts
node create_cs_table.js
node create_migration_table.js
# dst...
```

---

## 5. Konfigurasi Node.js

### A. Install Node.js (Jika Belum)

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verify
node --version  # Should be v18.x
npm --version
```

### B. Install Dependencies

```bash
cd /home/your-domain.com/public_html/

# Install production dependencies
npm install --production

# Install PM2 globally
npm install -g pm2
```

### C. Configure Environment Variables

```bash
cd /home/your-domain.com/public_html/

# Copy .env.example
cp .env.example .env

# Edit .env
nano .env
```

**Isi .env untuk Production:**

```env
# Database Configuration
DB_HOST=localhost
DB_USER=tsapp_user
DB_PASSWORD=your_database_password
DB_NAME=tsapp_production

# JWT Secret - GENERATE STRONG SECRET!
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_generated_64_byte_hex_secret

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Server Port
PORT=3000

# Environment
NODE_ENV=production
```

**Generate JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output ke JWT_SECRET
```

---

## 6. Build Frontend

```bash
cd /home/your-domain.com/public_html/

# Build frontend untuk production
npm run build

# Hasil build ada di folder 'dist/'
ls -la dist/
```

---

## 7. Setup PM2

PM2 akan menjalankan Node.js backend sebagai service.

### A. Create PM2 Ecosystem File

```bash
cd /home/your-domain.com/public_html/

# Create ecosystem.config.js
nano ecosystem.config.js
```

**Isi ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'tsapp-backend',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### B. Create Logs Directory

```bash
mkdir -p /home/your-domain.com/public_html/logs
```

### C. Start Application with PM2

```bash
cd /home/your-domain.com/public_html/

# Start app
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs tsapp-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy dan jalankan command yang muncul
```

### D. PM2 Commands

```bash
# Restart app
pm2 restart tsapp-backend

# Stop app
pm2 stop tsapp-backend

# Delete app from PM2
pm2 delete tsapp-backend

# Monitor
pm2 monit

# Logs
pm2 logs tsapp-backend --lines 100
```

---

## 8. Konfigurasi Web Server

### A. OpenLiteSpeed Rewrite Rules

1. Login ke CyberPanel
2. **Websites** → **List Websites**
3. Klik **Manage** pada domain Anda
4. **Rewrite Rules**

**Tambahkan rewrite rules:**

```apache
# Rewrite rules untuk React SPA + Node.js API

# API Proxy ke Node.js backend
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# Static files dari dist/assets
RewriteCond %{REQUEST_URI} ^/assets/
RewriteCond %{DOCUMENT_ROOT}/dist%{REQUEST_URI} -f
RewriteRule ^(.*)$ /dist/$1 [L]

# React Router - semua request ke index.html
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{DOCUMENT_ROOT}/dist/index.html -f
RewriteRule ^(.*)$ /dist/index.html [L]
```

5. Klik **Save Rewrite Rules**
6. **Restart OpenLiteSpeed**:
   ```bash
   systemctl restart lsws
   ```

### B. Alternative: Manual vHost Configuration

Jika rewrite rules di CyberPanel tidak work:

```bash
# Edit vHost config
nano /usr/local/lsws/conf/vhosts/your-domain.com/vhconf.conf
```

Tambahkan di dalam `<VirtualHost>`:

```apache
context /api/ {
  type                    proxy
  handler                 http://127.0.0.1:3000
  addDefaultCharset       off
}

context / {
  location                $DOC_ROOT/dist/
  allowBrowse             1
  
  rewrite  {
    enable                1
    rules                 <<<END_rules
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /index.html [L]
    END_rules
  }
}
```

Restart:
```bash
systemctl restart lsws
```

---

## 9. SSL Certificate

### A. Via CyberPanel (Recommended)

1. **SSL** → **Issue SSL**
2. Pilih domain: `your-domain.com`
3. Centang **www.your-domain.com** jika perlu
4. Klik **Issue SSL**
5. Tunggu proses selesai (1-2 menit)

### B. Force HTTPS

1. **Websites** → **List Websites**
2. Klik **Manage** pada domain
3. **SSL** → Centang **Force HTTPS**
4. Save

---

## 10. Testing

### A. Test Backend API

```bash
# Test dari server
curl http://localhost:3000/api/dashboard

# Test dari luar
curl https://your-domain.com/api/dashboard
```

### B. Test Frontend

```
Browser: https://your-domain.com
```

Harus muncul halaman login.

### C. Test Login

1. Buka `https://your-domain.com`
2. Login dengan credentials
3. Check browser console (F12) untuk errors
4. Verify API calls di Network tab

### D. Check PM2 Status

```bash
pm2 status
pm2 logs tsapp-backend --lines 50
```

---

## 11. Troubleshooting

### A. 502 Bad Gateway

**Penyebab:**
- Backend tidak running
- Port salah
- Firewall blocking

**Solusi:**
```bash
# Check PM2
pm2 status
pm2 logs tsapp-backend

# Restart backend
pm2 restart tsapp-backend

# Check port
netstat -tulpn | grep 3000

# Check firewall
ufw status
ufw allow 3000  # Jika perlu
```

### B. CORS Error

**Penyebab:** FRONTEND_URL tidak sesuai

**Solusi:**
```bash
nano .env
# Set: FRONTEND_URL=https://your-domain.com

pm2 restart tsapp-backend
```

### C. Database Connection Error

**Solusi:**
```bash
# Test MySQL connection
mysql -u tsapp_user -p tsapp_production

# Check .env
nano .env
# Verify DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

pm2 restart tsapp-backend
```

### D. 404 Not Found (React Routes)

**Penyebab:** Rewrite rules tidak bekerja

**Solusi:**
- Cek rewrite rules di CyberPanel
- Atau gunakan manual vHost config
- Restart OpenLiteSpeed: `systemctl restart lsws`

### E. Static Files Not Loading

**Solusi:**
```bash
# Check dist folder
ls -la /home/your-domain.com/public_html/dist/

# Rebuild frontend
cd /home/your-domain.com/public_html/
npm run build

# Check permissions
chown -R cyberpanel:cyberpanel dist/
chmod -R 755 dist/
```

### F. Check Logs

```bash
# PM2 logs
pm2 logs tsapp-backend

# OpenLiteSpeed error log
tail -f /usr/local/lsws/logs/error.log

# Access log
tail -f /home/your-domain.com/logs/your-domain.com.access_log
```

---

## 📝 Checklist Deployment

Gunakan checklist ini untuk memastikan semua sudah benar:

### Pre-Deployment
- [ ] Domain sudah pointing ke server
- [ ] CyberPanel sudah terinstall
- [ ] Node.js versi 16+ terinstall
- [ ] PM2 terinstall global
- [ ] File aplikasi sudah di-build (`npm run build`)

### Database
- [ ] Database created di CyberPanel
- [ ] Database user created
- [ ] Tables created (migration scripts)
- [ ] Test connection berhasil

### Application
- [ ] File uploaded ke `/home/domain/public_html/`
- [ ] `npm install --production` selesai
- [ ] `.env` configured dengan benar
- [ ] JWT_SECRET generated (64 bytes)
- [ ] Frontend built (`npm run build`)
- [ ] `dist/` folder exists

### PM2
- [ ] `ecosystem.config.js` created
- [ ] PM2 started: `pm2 start ecosystem.config.js`
- [ ] PM2 saved: `pm2 save`
- [ ] PM2 startup configured
- [ ] Backend running di port 3000

### Web Server
- [ ] Website created di CyberPanel
- [ ] Rewrite rules configured
- [ ] OpenLiteSpeed restarted
- [ ] SSL certificate issued
- [ ] Force HTTPS enabled

### Testing
- [ ] Backend API accessible: `/api/dashboard`
- [ ] Frontend loads: `https://domain.com`
- [ ] Login works
- [ ] No CORS errors
- [ ] No console errors

### Security
- [ ] Strong JWT secret generated
- [ ] Database password strong
- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] Firewall configured (only 80, 443, 8090, SSH)
- [ ] Regular backups configured

---

## 🔄 Update Aplikasi

Untuk update aplikasi di production:

```bash
# 1. Backup dulu
cd /home/your-domain.com/
tar -czf backup-$(date +%Y%m%d).tar.gz public_html/

# 2. Upload file baru
# (via SFTP/SCP)

# 3. Extract
cd /home/your-domain.com/public_html/
tar -xzf tsapp-update.tar.gz

# 4. Install dependencies (jika ada perubahan)
npm install --production

# 5. Rebuild frontend
npm run build

# 6. Restart backend
pm2 restart tsapp-backend

# 7. Check logs
pm2 logs tsapp-backend
```

---

## 📊 Monitoring

### A. PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Memory usage
pm2 list

# Logs
pm2 logs tsapp-backend --lines 100
```

### B. Server Resources

```bash
# CPU & Memory
htop

# Disk usage
df -h

# Network
netstat -tulpn
```

---

## 🔐 Security Hardening

### A. Firewall (UFW)

```bash
# Enable UFW
ufw enable

# Allow necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8090/tcp  # CyberPanel (bisa di-disable setelah setup)

# Check status
ufw status
```

### B. Fail2Ban

```bash
# Install
apt-get install fail2ban

# Configure
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
nano /etc/fail2ban/jail.local

# Restart
systemctl restart fail2ban
```

### C. Regular Updates

```bash
# Update system
apt-get update && apt-get upgrade -y

# Update Node.js packages
cd /home/your-domain.com/public_html/
npm update

# Restart after updates
pm2 restart tsapp-backend
```

---

## 📞 Support

Jika ada masalah saat deployment, check:
1. PM2 logs: `pm2 logs tsapp-backend`
2. OpenLiteSpeed logs: `/usr/local/lsws/logs/error.log`
3. CyberPanel logs: `/usr/local/CyberCP/logs/`

---

**Good luck with deployment! 🚀**

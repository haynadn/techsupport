# Deployment via GitHub ke CyberPanel

Panduan deployment otomatis menggunakan GitHub repository dengan auto-deploy ke CyberPanel.

## 📋 Daftar Isi

1. [Setup GitHub Repository](#1-setup-github-repository)
2. [Configure .gitignore](#2-configure-gitignore)
3. [Setup SSH Key di Server](#3-setup-ssh-key-di-server)
4. [Deploy Script](#4-deploy-script)
5. [GitHub Actions (CI/CD)](#5-github-actions-cicd)
6. [Manual Deployment](#6-manual-deployment)
7. [Auto Deployment](#7-auto-deployment)
8. [Rollback](#8-rollback)

---

## 1. Setup GitHub Repository

### A. Create Repository

1. Buat repository baru di GitHub:
   - Repository name: `tsapp`
   - Visibility: Private (recommended)
   - **JANGAN** centang "Initialize with README"

2. Di local project:

```bash
cd tsapp

# Initialize git (jika belum)
git init

# Add remote
git remote add origin https://github.com/username/tsapp.git

# Atau jika sudah ada:
git remote set-url origin https://github.com/username/tsapp.git
```

### B. Create Branches

```bash
# Main branch untuk production
git branch -M main

# Development branch
git checkout -b development

# Kembali ke main
git checkout main
```

---

## 2. Configure .gitignore

Pastikan file sensitif tidak ter-commit ke GitHub.

**File: `.gitignore`**

```gitignore
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.production

# Build output
dist/
build/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pm2-*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Test coverage
coverage/

# Temporary files
*.tmp
*.temp
.cache/

# Database
*.sql
*.sqlite
*.db

# Backup files
*.tar.gz
*.zip
backup-*/

# PM2
.pm2/
```

**PENTING:** Pastikan `.env` ada di `.gitignore`!

---

## 3. Setup SSH Key di Server

Untuk auto-deploy, server perlu akses ke GitHub repository.

### A. Generate SSH Key di Server

```bash
# SSH ke server
ssh root@your-server-ip

# Generate SSH key
ssh-keygen -t ed25519 -C "server@your-domain.com"
# Tekan Enter untuk semua prompt (no passphrase)

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

### B. Add Deploy Key ke GitHub

1. Copy output dari command di atas
2. Buka GitHub repository → **Settings** → **Deploy keys**
3. Klik **Add deploy key**
4. Title: `CyberPanel Server`
5. Key: Paste public key
6. **Centang** "Allow write access" (jika perlu push dari server)
7. Klik **Add key**

### C. Test Connection

```bash
# Di server
ssh -T git@github.com
# Should see: "Hi username! You've successfully authenticated"
```

---

## 4. Deploy Script

Buat script untuk otomasi deployment di server.

### A. Create Deploy Script

**File: `deploy.sh`** (di project root)

```bash
#!/bin/bash

# TSApp Deployment Script for CyberPanel
# Usage: ./deploy.sh [branch]

set -e  # Exit on error

# Configuration
APP_DIR="/home/your-domain.com/public_html"
REPO_URL="git@github.com:username/tsapp.git"
BRANCH="${1:-main}"
BACKUP_DIR="/home/your-domain.com/backups"
APP_NAME="tsapp-backend"

echo "🚀 Starting deployment for branch: $BRANCH"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Backup current version
echo "📦 Creating backup..."
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
cd $APP_DIR
tar -czf $BACKUP_FILE \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='dist' \
    . 2>/dev/null || true
echo "✅ Backup created: $BACKUP_FILE"

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
cd $APP_DIR

if [ -d ".git" ]; then
    # Repository exists, pull updates
    git fetch origin
    git reset --hard origin/$BRANCH
    git clean -fd
else
    # Clone repository
    cd /home/your-domain.com/
    rm -rf public_html
    git clone -b $BRANCH $REPO_URL public_html
    cd public_html
fi

echo "✅ Code updated"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production
echo "✅ Dependencies installed"

# Build frontend
echo "🔨 Building frontend..."
npm run build
echo "✅ Frontend built"

# Set permissions
echo "🔐 Setting permissions..."
chown -R cyberpanel:cyberpanel $APP_DIR
chmod -R 755 $APP_DIR
chmod 600 $APP_DIR/.env 2>/dev/null || true
echo "✅ Permissions set"

# Restart backend with PM2
echo "🔄 Restarting backend..."
pm2 restart $APP_NAME || pm2 start ecosystem.config.js
echo "✅ Backend restarted"

# Check status
echo "📊 Checking application status..."
pm2 status $APP_NAME

# Show logs
echo "📝 Recent logs:"
pm2 logs $APP_NAME --lines 20 --nostream

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Visit: https://your-domain.com"
echo ""
```

### B. Make Script Executable

```bash
# Di server
cd /home/your-domain.com/public_html/
chmod +x deploy.sh
```

### C. Create .env Template di Server

```bash
# Di server, create .env (jangan commit ke GitHub!)
cd /home/your-domain.com/public_html/
nano .env
```

Isi dengan konfigurasi production (lihat `.env.example`).

---

## 5. GitHub Actions (CI/CD)

Otomasi deployment setiap kali push ke GitHub.

### A. Create Workflow Directory

```bash
# Di local project
mkdir -p .github/workflows
```

### B. Create Deployment Workflow

**File: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to CyberPanel

on:
  push:
    branches:
      - main  # Deploy otomatis saat push ke main
  workflow_dispatch:  # Allow manual trigger

jobs:
  deploy:
    name: Deploy Application
    runs-on: ubuntu-latest
    
    steps:
      - name: 🚀 Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_PORT }}
          script: |
            cd /home/your-domain.com/public_html
            ./deploy.sh main
```

### C. Setup GitHub Secrets

1. Buka GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Klik **New repository secret**
3. Tambahkan secrets berikut:

| Name | Value | Keterangan |
|------|-------|------------|
| `SERVER_HOST` | `your-server-ip` | IP server CyberPanel |
| `SERVER_USER` | `root` | Username SSH |
| `SERVER_SSH_KEY` | `<private key>` | Private key untuk SSH |
| `SERVER_PORT` | `22` | SSH port (default 22) |

**Cara dapat SERVER_SSH_KEY:**

```bash
# Di local machine, generate SSH key khusus untuk GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key
# No passphrase!

# Copy private key (untuk GitHub Secret)
cat ~/.ssh/github_actions_key

# Copy public key (untuk server)
cat ~/.ssh/github_actions_key.pub
```

**Add public key ke server:**

```bash
# SSH ke server
ssh root@your-server-ip

# Add public key
nano ~/.ssh/authorized_keys
# Paste public key di baris baru
```

---

## 6. Manual Deployment

### A. First Time Deployment

```bash
# 1. Commit code ke GitHub
git add .
git commit -m "Initial commit"
git push -u origin main

# 2. SSH ke server
ssh root@your-server-ip

# 3. Clone repository
cd /home/your-domain.com/
rm -rf public_html  # Hapus jika sudah ada
git clone -b main git@github.com:username/tsapp.git public_html

# 4. Setup .env
cd public_html
cp .env.example .env
nano .env
# Isi dengan konfigurasi production

# 5. Install & Build
npm install --production
npm run build

# 6. Setup PM2
pm2 start ecosystem.config.js
pm2 save

# 7. Set permissions
chown -R cyberpanel:cyberpanel /home/your-domain.com/public_html/
chmod -R 755 /home/your-domain.com/public_html/
chmod 600 .env
```

### B. Update Deployment

```bash
# Di local
git add .
git commit -m "Update feature X"
git push origin main

# Di server
ssh root@your-server-ip
cd /home/your-domain.com/public_html/
./deploy.sh main
```

---

## 7. Auto Deployment

Dengan GitHub Actions sudah setup, deployment otomatis:

### A. Development Workflow

```bash
# 1. Buat branch untuk fitur baru
git checkout -b feature/new-feature

# 2. Develop & test
# ... coding ...

# 3. Commit & push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 4. Create Pull Request di GitHub
# Review code

# 5. Merge ke main
# GitHub Actions akan otomatis deploy!
```

### B. Monitoring Deployment

1. Buka GitHub repository
2. **Actions** tab
3. Lihat workflow yang sedang running
4. Check logs jika ada error

### C. Manual Trigger

Jika perlu deploy manual via GitHub Actions:

1. **Actions** tab
2. Pilih workflow "Deploy to CyberPanel"
3. Klik **Run workflow**
4. Pilih branch
5. Klik **Run workflow**

---

## 8. Rollback

Jika deployment bermasalah, rollback ke versi sebelumnya.

### A. Rollback via Backup

```bash
# SSH ke server
ssh root@your-server-ip

# List backups
ls -lh /home/your-domain.com/backups/

# Restore backup
cd /home/your-domain.com/
tar -xzf backups/backup-20241231-143000.tar.gz -C public_html/

# Restart
cd public_html
pm2 restart tsapp-backend
```

### B. Rollback via Git

```bash
# SSH ke server
cd /home/your-domain.com/public_html/

# Check commit history
git log --oneline -10

# Rollback to specific commit
git reset --hard <commit-hash>

# Rebuild & restart
npm install --production
npm run build
pm2 restart tsapp-backend
```

### C. Rollback Script

**File: `rollback.sh`**

```bash
#!/bin/bash

# Rollback to previous version
BACKUP_DIR="/home/your-domain.com/backups"
APP_DIR="/home/your-domain.com/public_html"

echo "📋 Available backups:"
ls -lht $BACKUP_DIR/*.tar.gz | head -5

echo ""
read -p "Enter backup filename to restore: " BACKUP_FILE

if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "🔄 Restoring backup: $BACKUP_FILE"
    
    # Stop app
    pm2 stop tsapp-backend
    
    # Restore
    cd $APP_DIR
    rm -rf * .[^.]*
    tar -xzf $BACKUP_DIR/$BACKUP_FILE -C .
    
    # Restart
    pm2 restart tsapp-backend
    
    echo "✅ Rollback completed!"
else
    echo "❌ Backup file not found!"
fi
```

---

## 📝 Workflow Summary

### Development Flow

```
Local Development
    ↓
git commit & push
    ↓
GitHub Repository
    ↓
GitHub Actions (CI/CD)
    ↓
Auto Deploy to Server
    ↓
PM2 Restart
    ↓
Live on Production
```

### Branch Strategy

- **main**: Production (auto-deploy)
- **development**: Staging/testing
- **feature/***: Feature development

### Deployment Process

1. **Develop** di local
2. **Commit** ke feature branch
3. **Push** ke GitHub
4. **Pull Request** ke main
5. **Review** & merge
6. **Auto-deploy** via GitHub Actions
7. **Monitor** di PM2

---

## 🔧 Advanced Configuration

### A. Multi-Environment Deployment

**File: `.github/workflows/deploy-staging.yml`**

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - development

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /home/staging.domain.com/public_html
            ./deploy.sh development
```

### B. Slack Notification

Tambahkan di workflow untuk notifikasi deployment:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to production ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### C. Database Migration

Jika ada perubahan database:

```bash
# Tambahkan di deploy.sh sebelum restart PM2
echo "🗄️ Running database migrations..."
node server/migrations/migrate.js
```

---

## ✅ Checklist GitHub Deployment

### Initial Setup
- [ ] Repository created di GitHub
- [ ] `.gitignore` configured
- [ ] SSH key added ke GitHub (Deploy key)
- [ ] `.env` di server (NOT in GitHub!)
- [ ] `deploy.sh` script created & executable
- [ ] GitHub Actions workflow created
- [ ] GitHub Secrets configured

### First Deployment
- [ ] Code pushed ke GitHub
- [ ] Repository cloned di server
- [ ] Dependencies installed
- [ ] Frontend built
- [ ] PM2 configured & running
- [ ] Permissions set correctly

### Ongoing
- [ ] Feature branches untuk development
- [ ] Pull requests untuk code review
- [ ] Auto-deployment working
- [ ] Backups created automatically
- [ ] Monitoring via PM2

---

## 🚨 Security Notes

### ⚠️ NEVER Commit:
- `.env` files
- Database credentials
- JWT secrets
- SSH private keys
- API keys
- Passwords

### ✅ Always:
- Use GitHub Secrets for sensitive data
- Review `.gitignore` before first commit
- Use private repository untuk production code
- Enable 2FA di GitHub account
- Rotate SSH keys periodically

---

## 📞 Troubleshooting

### GitHub Actions Failed

```bash
# Check workflow logs di GitHub Actions tab
# SSH ke server dan check manual
ssh root@your-server-ip
cd /home/your-domain.com/public_html
./deploy.sh main
```

### Permission Denied (SSH)

```bash
# Check SSH key di server
cat ~/.ssh/authorized_keys

# Test connection
ssh -T git@github.com
```

### Deploy Script Failed

```bash
# Run manually untuk debug
cd /home/your-domain.com/public_html
bash -x deploy.sh main  # Debug mode
```

---

**Happy Deploying! 🚀**

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

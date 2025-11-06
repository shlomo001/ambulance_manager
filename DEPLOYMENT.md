# Ambulance Manager - Deployment Guide

This guide provides comprehensive instructions for deploying the Ambulance Manager application in a production environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Manual Deployment](#manual-deployment)
- [SSL Configuration](#ssl-configuration)
- [Backup and Recovery](#backup-and-recovery)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB free space
- **CPU**: Minimum 2 cores, Recommended 4+ cores

### Software Requirements

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For cloning the repository
- **curl**: For health checks
- **openssl**: For SSL certificate management

### Install Prerequisites

#### Ubuntu/Debian
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt install -y git curl openssl
```

#### CentOS/RHEL
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo yum install -y git curl openssl
```

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ambulance_manager
```

### 2. Configure Environment
```bash
# Copy environment template
cp env.production.example .env.production

# Edit environment variables
nano .env.production
```

### 3. Deploy with Script
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh
```

### 4. Verify Deployment
```bash
# Check health
./scripts/health-check.sh

# View logs
./scripts/deploy.sh logs
```

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database Configuration
POSTGRES_DB=ambulance_manager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_database_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_minimum_32_characters

# Google Sheets Integration
GOOGLE_SHEETS_SPREADSHEET_ID=your_google_sheets_spreadsheet_id_here
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}

# Redis Configuration
REDIS_PASSWORD=your_secure_redis_password_here
```

### Google Sheets Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google Sheets API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API" and enable it

3. **Create Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Download the JSON key file

4. **Configure Spreadsheet**
   - Create a new Google Spreadsheet
   - Share it with the service account email
   - Copy the Spreadsheet ID from the URL

5. **Update Environment**
   ```bash
   GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
   GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account",...}'
   ```

## Manual Deployment

### 1. Build and Start Services
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Run Database Migrations
```bash
# Wait for database to be ready
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 3. Seed Database (Optional)
```bash
# Seed with initial data
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

### 4. Verify Services
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## SSL Configuration

### Using Let's Encrypt (Recommended)

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**
   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   ```

3. **Copy Certificates**
   ```bash
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
   sudo chown $USER:$USER ./ssl/*
   ```

4. **Update Nginx Configuration**
   - Uncomment HTTPS server block in `nginx/nginx.conf`
   - Update domain name in configuration

5. **Restart Services**
   ```bash
   docker-compose -f docker-compose.prod.yml restart nginx
   ```

### Using Custom Certificates

1. **Place Certificates**
   ```bash
   mkdir -p ssl
   cp your-cert.pem ssl/cert.pem
   cp your-key.pem ssl/key.pem
   ```

2. **Update Nginx Configuration**
   - Uncomment HTTPS server block
   - Update certificate paths if needed

## Backup and Recovery

### Automated Backups

The system includes automated daily backups:

```bash
# Check backup status
./scripts/backup.sh list

# Create manual backup
./scripts/backup.sh create

# Test backup integrity
./scripts/backup.sh test /backup/ambulance_manager_20240115_120000.sql.gz
```

### Manual Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres ambulance_manager > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_*.sql
```

### Restore from Backup

```bash
# Restore database
./scripts/backup.sh restore /backup/ambulance_manager_20240115_120000.sql.gz

# Or manually
gunzip -c backup_file.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d postgres
```

## Monitoring and Health Checks

### Health Check Script

```bash
# Full health check
./scripts/health-check.sh

# Check specific components
./scripts/health-check.sh containers
./scripts/health-check.sh database
./scripts/health-check.sh performance
```

### Log Monitoring

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Performance Monitoring

```bash
# Check resource usage
docker stats

# Check disk usage
df -h

# Check memory usage
free -h
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

#### 2. Backend API Not Responding
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Check backend health
curl -f http://localhost:3001/api/health

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

#### 3. Frontend Not Loading
```bash
# Check frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs nginx

# Restart frontend
docker-compose -f docker-compose.prod.yml restart frontend
```

#### 4. Google Sheets Integration Issues
```bash
# Check backend logs for Google Sheets errors
docker-compose -f docker-compose.prod.yml logs backend | grep -i "google\|sheets"

# Test connection
docker-compose -f docker-compose.prod.yml exec backend node -e "
const { GoogleSheetsService } = require('./dist/services/googleSheetsService');
const service = new GoogleSheetsService();
service.testConnection().then(console.log).catch(console.error);
"
```

### Log Analysis

```bash
# Search for errors
docker-compose -f docker-compose.prod.yml logs | grep -i error

# Search for specific patterns
docker-compose -f docker-compose.prod.yml logs | grep -i "authentication\|permission"

# Monitor logs in real-time
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## Security Considerations

### 1. Environment Variables
- Use strong, unique passwords
- Rotate secrets regularly
- Never commit `.env.production` to version control

### 2. Network Security
- Use firewall to restrict access
- Consider VPN for remote access
- Enable SSL/TLS encryption

### 3. Database Security
- Use strong database passwords
- Limit database access to application containers
- Regular security updates

### 4. Application Security
- Keep Docker images updated
- Monitor for security vulnerabilities
- Implement proper backup encryption

### 5. Access Control
- Use strong JWT secrets
- Implement proper user permissions
- Regular security audits

## Maintenance

### Regular Tasks

1. **Daily**
   - Check health status
   - Monitor logs for errors
   - Verify backups

2. **Weekly**
   - Review performance metrics
   - Check disk space
   - Update dependencies

3. **Monthly**
   - Security updates
   - Backup restoration tests
   - Performance optimization

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./scripts/deploy.sh

# Verify deployment
./scripts/health-check.sh
```

## Support

For additional support:

1. Check the troubleshooting section
2. Review application logs
3. Run health checks
4. Contact system administrator

## License

This deployment guide is part of the Ambulance Manager project. Please refer to the main project license for usage terms.

# FloWorx Deployment Guide

This guide will help you deploy FloWorx using Docker Compose with Traefik as a reverse proxy.

## 🏗️ Architecture Overview

```
Internet → Traefik (Reverse Proxy) → FloWorx Frontend (React)
                                → FloWorx Backend (Node.js)
                                → n8n (Workflow Automation)
                                → Redis (Caching)
                                → PostgreSQL (Optional)
```

## 📋 Prerequisites

1. **Docker & Docker Compose** installed
2. **Domain name** pointing to your server
3. **SSL certificate** (automatically managed by Traefik + Let's Encrypt)
4. **Supabase project** for database and authentication
5. **OAuth credentials** for Gmail and Outlook

## 🚀 Quick Deployment

### 1. Clone and Setup

```bash
git clone <your-repo>
cd FloworxV2
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
# Linux/Mac
cp env.example .env

# Windows
copy env.example .env
```

Edit `.env` with your actual values:

```env
# Domain Configuration
DOMAIN_NAME=yourdomain.com
SUBDOMAIN=automation
SSL_EMAIL=your-email@example.com

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OAuth Credentials
VITE_GMAIL_CLIENT_ID=your-gmail-client-id
VITE_GMAIL_CLIENT_SECRET=your-gmail-client-secret
VITE_OUTLOOK_CLIENT_ID=your-outlook-client-id
VITE_OUTLOOK_CLIENT_SECRET=your-outlook-client-secret

# n8n Configuration
N8N_API_KEY=your-n8n-api-key
```

### 3. Deploy

```bash
# Linux/Mac
./deploy.sh

# Windows
deploy.bat
```

### 4. Manual Deployment

If you prefer manual deployment:

```bash
# Create volumes
docker volume create traefik_data
docker volume create n8n_data

# Create network
docker network create traefik_proxy

# Start services
docker-compose up -d
```

## 🔧 Configuration Details

### Domain Setup

1. **Point your domain** to your server's IP address
2. **Create subdomain** for n8n (e.g., `automation.yourdomain.com`)
3. **SSL certificates** are automatically managed by Traefik

### Supabase Configuration

1. Create a new Supabase project
2. Get your project URL and API keys
3. Update your `.env` file with the credentials
4. Run the database setup SQL scripts in Supabase

### OAuth Setup

#### Gmail OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://yourdomain.com/oauth-callback-n8n`

#### Outlook OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add redirect URIs:
   - `https://yourdomain.com/oauth-callback-n8n`
4. Get client ID and secret

## 📊 Service URLs

After deployment, your services will be available at:

- **FloWorx Frontend**: `https://yourdomain.com`
- **n8n Dashboard**: `https://automation.yourdomain.com`
- **Traefik Dashboard**: `http://your-server-ip:8080` (if exposed)

## 🛠️ Management Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f floworx-frontend
docker-compose logs -f n8n-production
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart floworx-frontend
```

### Update Services
```bash
# Pull latest images and restart
docker-compose pull
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Backup Data
```bash
# Backup n8n data
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz -C /data .

# Backup Traefik certificates
docker run --rm -v traefik_data:/data -v $(pwd):/backup alpine tar czf /backup/traefik-backup.tar.gz -C /data .
```

## 🔍 Troubleshooting

### Common Issues

#### 1. SSL Certificate Issues
- Ensure your domain points to the server
- Check that ports 80 and 443 are open
- Verify SSL_EMAIL is correct in `.env`

#### 2. n8n Connection Issues
- Check n8n logs: `docker-compose logs n8n-production`
- Verify Supabase database credentials
- Ensure database schema exists

#### 3. Frontend Not Loading
- Check Traefik logs: `docker-compose logs traefik`
- Verify domain configuration
- Check if frontend container is running

#### 4. OAuth Issues
- Verify redirect URIs match your domain
- Check OAuth credentials in `.env`
- Ensure HTTPS is working

### Health Checks

```bash
# Check all containers
docker-compose ps

# Check specific service health
docker exec floworx-frontend curl -f http://localhost:80 || echo "Frontend unhealthy"
docker exec n8n-production curl -f http://localhost:5678 || echo "n8n unhealthy"
```

## 🔒 Security Considerations

1. **Keep secrets secure** - Never commit `.env` file
2. **Regular updates** - Keep Docker images updated
3. **Firewall rules** - Only expose necessary ports
4. **Backup strategy** - Regular backups of volumes
5. **Monitor logs** - Watch for suspicious activity

## 📈 Scaling

### Horizontal Scaling
```yaml
# In docker-compose.yml
floworx-backend:
  deploy:
    replicas: 3
```

### Load Balancing
Traefik automatically load balances multiple replicas.

### Database Scaling
Consider using Supabase's built-in scaling or external PostgreSQL cluster.

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify your `.env` configuration
3. Ensure all prerequisites are met
4. Check network connectivity
5. Review the troubleshooting section

## 📚 Additional Resources

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [n8n Documentation](https://docs.n8n.io/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Supabase Documentation](https://supabase.com/docs)

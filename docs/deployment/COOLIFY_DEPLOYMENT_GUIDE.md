# 🚀 Coolify Deployment Guide for FloWorx

## 📋 **Pre-Deployment Checklist**

### ✅ **Required Environment Variables**

Set these in your Coolify project settings:

```bash
# Application Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Supabase Configuration
SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# N8N Integration
N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
N8N_API_KEY=your_n8n_api_key_here
VITE_N8N_API_KEY=your_n8n_api_key_here

# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Email/SMTP Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Logging
LOG_LEVEL=info

# Redis
REDIS_URL=redis://redis:6379
```

## 🐳 **Docker Configuration**

### **Frontend Service**
- **Dockerfile**: `./Dockerfile`
- **Port**: 80
- **Health Check**: `/health` endpoint

### **Backend Service**
- **Dockerfile**: `./backend/Dockerfile`
- **Port**: 3001
- **Health Check**: `/health` endpoint
- **Dependencies**: Redis

### **Redis Service**
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Persistent Storage**: Yes

## 🚀 **Deployment Steps**

### **Step 1: Create Coolify Project**

1. **Login to Coolify**
2. **Create New Project**: "FloWorx Production"
3. **Select Repository**: Your FloWorx repository
4. **Branch**: `main` or `production`

### **Step 2: Configure Services**

#### **Frontend Service**
```yaml
Service Name: floworx-frontend
Build Context: ./
Dockerfile: Dockerfile
Port: 80
Environment: NODE_ENV=production
```

#### **Backend Service**
```yaml
Service Name: floworx-backend
Build Context: ./backend
Dockerfile: Dockerfile
Port: 3001
Environment: 
  - NODE_ENV=production
  - PORT=3001
Dependencies: redis
```

#### **Redis Service**
```yaml
Service Name: redis
Image: redis:7-alpine
Port: 6379
Persistent Volume: redis-data
```

### **Step 3: Set Environment Variables**

In Coolify project settings, add all the environment variables from the checklist above.

### **Step 4: Configure Domains**

- **Frontend**: `https://app.floworx-iq.com`
- **Backend**: `https://api.floworx-iq.com` (optional, for direct API access)

### **Step 5: Deploy**

1. **Click "Deploy"** in Coolify
2. **Monitor logs** for any errors
3. **Verify health checks** are passing
4. **Test endpoints** are responding

## 🔍 **Post-Deployment Verification**

### **Health Checks**
```bash
# Frontend
curl https://app.floworx-iq.com/health

# Backend
curl https://api.floworx-iq.com/health
```

### **Database Connection**
```bash
# Check Supabase connection
curl https://api.floworx-iq.com/api/health/database
```

### **N8N Integration**
```bash
# Check N8N connectivity
curl https://api.floworx-iq.com/api/health/n8n
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Build Failures**
- Check Dockerfile syntax
- Verify all dependencies are in package.json
- Check build logs in Coolify

#### **Environment Variables**
- Verify all required variables are set
- Check variable names match exactly
- Ensure no extra spaces or quotes

#### **Database Connection**
- Verify Supabase URL and keys
- Check network connectivity
- Verify database permissions

#### **N8N Integration**
- Check N8N API key is valid
- Verify N8N base URL is accessible
- Check CORS configuration

### **Logs and Monitoring**

#### **View Logs**
```bash
# In Coolify dashboard
1. Go to your project
2. Click on service
3. View "Logs" tab
```

#### **Health Monitoring**
- Set up alerts for health check failures
- Monitor resource usage
- Track error rates

## 🔒 **Security Considerations**

### **SSL/TLS**
- Coolify handles SSL automatically
- Ensure all traffic is HTTPS
- Check certificate validity

### **Environment Variables**
- Never commit secrets to repository
- Use Coolify's secure environment variable storage
- Rotate secrets regularly

### **Network Security**
- Configure firewall rules
- Use private networks where possible
- Monitor for suspicious activity

## 📊 **Performance Optimization**

### **Frontend**
- Enable gzip compression
- Configure CDN for static assets
- Optimize bundle size

### **Backend**
- Enable Redis caching
- Configure connection pooling
- Monitor memory usage

### **Database**
- Optimize queries
- Set up proper indexes
- Monitor query performance

## 🔄 **Updates and Maintenance**

### **Deploying Updates**
1. **Push changes** to repository
2. **Trigger deployment** in Coolify
3. **Monitor deployment** progress
4. **Verify functionality** after deployment

### **Rollback Procedure**
1. **Stop current deployment**
2. **Revert to previous version**
3. **Redeploy previous version**
4. **Verify rollback** success

## 📞 **Support**

### **Coolify Support**
- Documentation: https://coolify.io/docs
- Community: https://discord.gg/coolify
- GitHub: https://github.com/coollabsio/coolify

### **FloWorx Support**
- Technical Issues: dev-team@floworx.com
- Deployment Issues: devops@floworx.com
- General Support: support@floworx.com

---

## 🎉 **Success Criteria**

After deployment, you should have:

✅ **Frontend accessible** at your domain  
✅ **Backend API responding** to health checks  
✅ **Database connected** and functional  
✅ **N8N integration** working  
✅ **OAuth flows** functional  
✅ **All services healthy** and monitored  

**Your FloWorx application is now live in production!** 🚀
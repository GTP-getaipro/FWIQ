# ============================================================================
# FloWorx AutoProfile System - Domain Routing Configuration
# ============================================================================
# DNS and reverse proxy configuration for Coolify deployment

## 🌐 DNS Configuration

### Required DNS Records

Configure the following DNS records in your domain registrar (e.g., Cloudflare, Namecheap, etc.):

```
# A Records - Point to your VPS IP
api.floworx-iq.com    A    YOUR_VPS_IP
app.floworx-iq.com    A    YOUR_VPS_IP
n8n.floworx-iq.com    A    YOUR_VPS_IP

# CNAME Records (if using CDN)
api.floworx-iq.com    CNAME    cdn.your-provider.com
app.floworx-iq.com    CNAME    cdn.your-provider.com
n8n.floworx-iq.com    CNAME    cdn.your-provider.com

# Optional: Wildcard for future subdomains
*.floworx-iq.com      A    YOUR_VPS_IP
```

### DNS Propagation Check

Use these tools to verify DNS propagation:
- https://dnschecker.org/
- https://www.whatsmydns.net/
- `dig api.floworx-iq.com` (command line)

## 🔄 Reverse Proxy Configuration

### Coolify Reverse Proxy Setup

Coolify automatically handles reverse proxy configuration, but here's the manual setup for reference:

#### 1. API Service (api.floworx-iq.com)
```yaml
# Coolify will automatically create these labels
labels:
  - traefik.enable=true
  - traefik.http.routers.api.rule=Host(`api.floworx-iq.com`)
  - traefik.http.routers.api.tls=true
  - traefik.http.routers.api.tls.certresolver=letsencrypt
  - traefik.http.services.api.loadbalancer.server.port=3000
```

#### 2. UI Service (app.floworx-iq.com)
```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.ui.rule=Host(`app.floworx-iq.com`)
  - traefik.http.routers.ui.tls=true
  - traefik.http.routers.ui.tls.certresolver=letsencrypt
  - traefik.http.services.ui.loadbalancer.server.port=80
```

#### 3. n8n Service (n8n.floworx-iq.com)
```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.n8n.rule=Host(`n8n.floworx-iq.com`)
  - traefik.http.routers.n8n.tls=true
  - traefik.http.routers.n8n.tls.certresolver=letsencrypt
  - traefik.http.services.n8n.loadbalancer.server.port=5678
```

## 🔒 SSL/TLS Configuration

### Automatic SSL with Let's Encrypt

Coolify automatically handles SSL certificate generation and renewal using Let's Encrypt:

1. **Certificate Resolver**: `letsencrypt`
2. **Email**: `admin@floworx-iq.com`
3. **Challenge Type**: `tls-alpn-01`
4. **Auto-renewal**: Enabled by default

### Manual SSL Configuration (if needed)

If you need to configure SSL manually:

```bash
# Install certbot
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone \
  -d api.floworx-iq.com \
  -d app.floworx-iq.com \
  -d n8n.floworx-iq.com \
  --email admin@floworx-iq.com \
  --agree-tos \
  --non-interactive
```

## 🌍 CDN Configuration (Optional)

### Cloudflare Setup

If using Cloudflare as CDN:

1. **Add domain to Cloudflare**
2. **Configure DNS records** (A records pointing to VPS)
3. **Enable SSL/TLS**: Full (strict)
4. **Enable Always Use HTTPS**
5. **Configure Page Rules**:
   ```
   api.floworx-iq.com/*
   - Cache Level: Bypass
   - Security Level: High
   
   app.floworx-iq.com/*
   - Cache Level: Standard
   - Browser Cache TTL: 1 month
   - Security Level: Medium
   ```

### Other CDN Providers

- **AWS CloudFront**: Configure origin as your VPS IP
- **KeyCDN**: Set up pull zones for each subdomain
- **BunnyCDN**: Configure pull zones with SSL

## 🔧 Load Balancing (Optional)

### Multiple VPS Setup

If you have multiple VPS instances:

```yaml
# Load balancer configuration
services:
  loadbalancer:
    image: traefik:v2.10
    command:
      - --api.dashboard=true
      - --providers.docker=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.tlschallenge=true
      - --certificatesresolvers.letsencrypt.acme.email=admin@floworx-iq.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
    labels:
      - traefik.http.routers.api.rule=Host(`api.floworx-iq.com`)
      - traefik.http.routers.api.service=api
      - traefik.http.services.api.loadbalancer.server.url=http://vps1:3000
      - traefik.http.services.api.loadbalancer.server.url=http://vps2:3000
```

## 📊 Monitoring and Health Checks

### Health Check Endpoints

Configure health checks for each service:

```bash
# API Health Check
curl -f https://api.floworx-iq.com/health

# UI Health Check
curl -f https://app.floworx-iq.com/health

# n8n Health Check
curl -f https://n8n.floworx-iq.com/healthz
```

### Uptime Monitoring

Set up uptime monitoring with:

- **Uptime Kuma**: Self-hosted monitoring
- **Pingdom**: External monitoring service
- **StatusCake**: Free tier available
- **UptimeRobot**: Free tier available

## 🚨 Troubleshooting

### Common Issues

#### 1. DNS Not Propagating
```bash
# Check DNS resolution
nslookup api.floworx-iq.com
dig api.floworx-iq.com

# Check from different locations
curl -I https://api.floworx-iq.com
```

#### 2. SSL Certificate Issues
```bash
# Check certificate status
openssl s_client -connect api.floworx-iq.com:443 -servername api.floworx-iq.com

# Check certificate expiration
echo | openssl s_client -connect api.floworx-iq.com:443 2>/dev/null | openssl x509 -noout -dates
```

#### 3. Reverse Proxy Issues
```bash
# Check Traefik logs
docker logs traefik

# Check service status
docker ps | grep floworx

# Check port accessibility
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

#### 4. Service Connectivity
```bash
# Test internal connectivity
docker exec -it floworx-api curl http://localhost:3000/health
docker exec -it floworx-ui curl http://localhost:80/health

# Test external connectivity
curl -f https://api.floworx-iq.com/health
curl -f https://app.floworx-iq.com/health
```

### Performance Optimization

#### 1. Caching Headers
```nginx
# Static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# API responses
location /api/ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

#### 2. Compression
```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;
```

#### 3. Rate Limiting
```nginx
# Rate limiting for API
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] DNS records configured
- [ ] VPS IP address confirmed
- [ ] SSL email configured
- [ ] Environment variables prepared
- [ ] Security hardening completed

### Deployment
- [ ] API service deployed and accessible
- [ ] UI service deployed and accessible
- [ ] n8n service deployed and accessible
- [ ] SSL certificates generated
- [ ] Health checks passing

### Post-Deployment
- [ ] DNS propagation verified
- [ ] SSL certificates valid
- [ ] All services accessible via HTTPS
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security scanning completed

## 🔄 Maintenance

### Regular Tasks
- **Weekly**: Check SSL certificate expiration
- **Monthly**: Review security logs
- **Quarterly**: Update system packages
- **Annually**: Review and update security policies

### Emergency Procedures
- **Service Down**: Check Coolify logs and restart services
- **SSL Issues**: Regenerate certificates via Coolify
- **DNS Issues**: Verify DNS configuration and propagation
- **Security Breach**: Follow incident response procedures

---

## 📞 Support

For domain and routing issues:
1. Check DNS propagation status
2. Verify SSL certificate validity
3. Review Coolify service logs
4. Test connectivity from multiple locations
5. Check firewall and security group settings

Your FloWorx AutoProfile system routing is now properly configured for production deployment!

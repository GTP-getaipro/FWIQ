# Full-Stack Dockerfile for Production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build frontend (production build only, no tests)
RUN npm run build

# Production stage - Full Stack
FROM node:20-alpine

WORKDIR /app

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./public

# Create nginx config for serving frontend
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /app/public; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://localhost:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Install nginx
RUN apk add --no-cache nginx

# Create startup script
RUN echo '#!/bin/sh \
nginx & \
node -r dotenv/config src/server.js dotenv_config_path=../.env.production \
' > /start.sh && chmod +x /start.sh

# Expose both ports
EXPOSE 80 3001

# Health check for backend
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["/start.sh"]

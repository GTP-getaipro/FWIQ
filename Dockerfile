# Backend-only Dockerfile for Production
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Expose backend port
EXPOSE 3001

# Health check for backend
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

# Start backend server
CMD ["node", "-r", "dotenv/config", "src/server.js", "dotenv_config_path=../.env.production"]

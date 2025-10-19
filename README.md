# FloWorx Production Deployment

This is a production-ready copy of FloWorx, optimized for deployment.

## 📋 Pre-Deployment Checklist

- [ ] Copy \.env.production\ to \.env.production.local\ and fill in values
- [ ] Copy \ackend/.env.production\ to \ackend/.env.production.local\ and fill in values
- [ ] Review and update \docker-compose.yml\ if needed
- [ ] Ensure all secrets are properly configured
- [ ] Test build locally before deploying

## 🚀 Deployment Options

### Option 1: Vercel (Frontend Only)

\\\ash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
\\\

### Option 2: Docker Compose (Full Stack)

\\\ash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
\\\

### Option 3: Coolify (Recommended)

1. Push this directory to a Git repository
2. In Coolify, create a new resource from Git
3. Configure environment variables
4. Deploy

## 📁 Directory Structure

\\\
FloWorx-Production/
├── backend/              # Backend API (Node.js + Express)
├── src/                  # Frontend source (React + Vite)
├── public/               # Static assets
├── supabase/             # Supabase functions and migrations
├── scripts/              # Utility scripts
├── docs/                 # Documentation
├── .env.production       # Frontend environment template
├── Dockerfile            # Frontend Docker image
├── docker-compose.yml    # Full stack orchestration
└── README.md             # This file
\\\

## 🔒 Security Notes

- Never commit \.env.production.local\ files
- Rotate API keys regularly
- Use HTTPS in production
- Enable CORS only for your domain
- Review and apply security headers

## 📚 Documentation

See the \docs/\ directory for detailed documentation:
- \PRODUCTION_DEPLOYMENT_GUIDE.md\ - Complete deployment guide
- \QUICK_DEPLOY_COMMANDS.md\ - Quick reference commands
- \ARCHITECTURE.md\ - System architecture

## 🆘 Support

For issues or questions, refer to the main documentation or contact support.

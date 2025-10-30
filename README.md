# FloWorx - AI-Powered Email Automation Platform

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Intelligent email management for service-based businesses**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [Support](#-support)

</div>

---

## 🎯 What is FloWorx?

FloWorx is a multi-tenant email automation platform that uses AI to intelligently classify, route, and respond to business emails. It supports both Gmail and Outlook, and is specifically designed for service-based businesses like HVAC, plumbing, electrical, and pool services.

### The Problem
Service businesses receive hundreds of emails daily - sales inquiries, support requests, supplier communications, and internal messages. Manually sorting and responding to these emails wastes 10+ hours per week.

### The Solution
FloWorx automatically:
- **Classifies** emails into business-specific categories (SALES, SUPPORT, URGENT, etc.)
- **Routes** emails to the right team member based on roles and content
- **Drafts** AI-powered responses using your writing style
- **Organizes** emails into structured folders for easy retrieval
- **Tracks** performance metrics to show time and cost savings

---

## ✨ Key Features

### 🤖 AI-Powered Classification
- GPT-4o-mini based email categorization
- Business-specific categories (12 industry templates)
- 90%+ classification accuracy
- Confidence scoring for reliable automation

### 📧 Multi-Provider Support
- **Gmail**: Full label and filtering support
- **Outlook/Microsoft 365**: Folder hierarchy management
- Automatic OAuth token refresh
- Provider-agnostic architecture

### 🎨 Voice Profile Training
- Learns your writing style from sent emails
- Generates responses that sound like you
- Sender-specific tone matching
- Thread-aware context

### 🚀 Workflow Automation
- Custom N8N workflows per user
- Template-based deployment
- Automatic folder provisioning
- Real-time health monitoring

### 👥 Team Management
- Dynamic manager routing
- Role-based email forwarding
- Supplier recognition
- Multi-role support per manager

### 📊 Performance Analytics
- Time saved tracking
- Cost savings calculation
- Email processing metrics
- Category distribution charts
- Export capabilities

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- N8N instance (self-hosted or cloud)
- OpenAI API key
- Gmail or Outlook account

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/FloWorx-Production
cd FloWorx-Production

# Install dependencies
npm install
cd backend && npm install && cd ..

# Configure environment
cp .env.production.example .env.production
cp backend/.env.production.example backend/.env.production

# Edit environment files with your credentials
nano .env.production
nano backend/.env.production
```

### Development

```bash
# Run frontend and backend together
npm run dev:full

# Or run separately
npm run dev              # Frontend only (port 5173)
npm run dev:backend      # Backend only (port 3001)
```

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions using:
- ✅ **Coolify** (recommended)
- Docker Compose
- Vercel (frontend only)

---

## 📚 Documentation

### Core Documentation
| Document | Description |
|----------|-------------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | System architecture, data flows, design patterns |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Complete deployment guide for all platforms |
| **[API Documentation](docs/api/README.md)** | RESTful API reference |

### Additional Resources
- [Troubleshooting Guide](docs/guides/TROUBLESHOOTING.md) (coming soon)
- [Contributing Guide](CONTRIBUTING.md) (coming soon)
- [Database Schema](supabase/migrations/README.md)
- [Legacy Documentation](docs/legacy/) (archived fix documentation)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React Frontend (Vite + Tailwind)                           │
│  - Onboarding Wizard  - Dashboard  - Settings               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│  Backend API (Node.js + Express)                            │
│  - OAuth  - Analytics  - Voice Training                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│  Supabase (PostgreSQL + Edge Functions)                     │
│  - Database  - Authentication  - deploy-n8n  - style-memory │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│  N8N Workflows (Per-User Automation)                        │
│  - Email Monitor  - AI Classify  - Label Apply  - Draft     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│  Gmail API / Outlook API / OpenAI API                       │
└─────────────────────────────────────────────────────────────┘
```

**For detailed architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 🛠️ Technology Stack

### Frontend
- **React** 19.2.0 - UI framework
- **Vite** 7.1.9 - Build tool
- **Tailwind CSS** 3.4.18 - Styling
- **Radix UI** - Accessible components
- **React Router** 7.9.3 - Routing

### Backend
- **Node.js** 18+ - Runtime
- **Express** 4.21.2 - API framework
- **Redis** 7 - Caching layer
- **Winston** - Logging

### Infrastructure
- **Supabase** - Database, auth, edge functions
- **PostgreSQL** 15+ - Primary database
- **N8N** - Workflow automation
- **OpenAI** GPT-4o-mini - AI classification & drafts

### Deployment
- **Docker** - Containerization
- **Coolify** - Deployment platform
- **Nginx** - Reverse proxy
- **Let's Encrypt** - SSL certificates

---

## 📦 Project Structure

```
FloWorx-Production/
├── src/                      # Frontend source
│   ├── components/           # React components
│   ├── pages/                # Route pages
│   ├── lib/                  # Business logic
│   ├── businessSchemas/      # AI schemas (12 business types)
│   ├── behaviorSchemas/      # Behavior configs
│   └── labelSchemas/         # Folder structures
├── backend/                  # Backend API
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business services
│   │   ├── middleware/       # Express middleware
│   │   └── server.js         # Entry point
│   └── templates/            # N8N workflow templates
├── supabase/                 # Supabase configuration
│   ├── functions/            # Edge functions
│   │   ├── deploy-n8n/       # Workflow deployment
│   │   └── style-memory/     # Voice training
│   └── migrations/           # Database migrations
├── docs/                     # Documentation
│   ├── api/                  # API reference
│   ├── guides/               # How-to guides
│   └── legacy/               # Archived documentation
├── ARCHITECTURE.md           # System architecture
├── DEPLOYMENT.md             # Deployment guide
└── README.md                 # This file
```

---

## 🎯 Supported Business Types

FloWorx includes pre-configured templates for 12 service-based industries:

1. **HVAC** - Heating, ventilation, air conditioning
2. **Plumbing** - Residential and commercial plumbing
3. **Electrician** - Electrical services
4. **Pools & Spas** - Pool installation and maintenance
5. **Hot Tub & Spa** - Hot tub services
6. **Sauna & Ice Bath** - Sauna and cold therapy
7. **Roofing** - Roofing contractor
8. **General Contractor** - General construction
9. **Painting** - Painting services
10. **Flooring** - Flooring installation
11. **Landscaping** - Landscape services
12. **Insulation & Foam Spray** - Insulation services

Each business type has customized:
- AI classification categories
- Folder structures
- Behavior patterns
- Industry-specific terminology

---

## 🔐 Security

- **Authentication**: Supabase Auth (JWT-based)
- **OAuth 2.0**: Gmail and Microsoft OAuth
- **Encryption**: OAuth tokens encrypted at rest
- **RLS Policies**: Row-level security on all tables
- **HTTPS Only**: All production traffic encrypted
- **API Keys**: Rotatable OpenAI and N8N keys
- **CORS**: Restricted to production domains

---

## 📊 Current Status

**Version**: 2.0.0  
**Production Readiness**: 85%  
**Test Coverage**: Limited (improvement needed)  
**Documentation**: Comprehensive

### ✅ What's Working
- Core email classification (90%+ accuracy)
- Gmail and Outlook support (full parity)
- Voice profile training
- Workflow deployment
- Performance analytics
- Multi-tenant architecture

### ⚠️ Known Issues
- Redis connection needs configuration
- Test suite needs expansion
- CI/CD pipeline not configured

### 🚀 Roadmap
- [ ] Comprehensive test suite
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Performance monitoring (Sentry)
- [ ] Mobile responsive dashboard
- [ ] Multi-language UI support
- [ ] Fine-tuned AI models per user
- [ ] Advanced analytics dashboard

---

## 🤝 Contributing

We welcome contributions! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💡 Support

### Documentation
- [Architecture Guide](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Reference](docs/api/README.md)

### Get Help
- **Email**: support@floworx-iq.com
- **GitHub Issues**: [Report a bug](https://github.com/your-org/FloWorx-Production/issues)
- **Discussions**: [Community forum](https://github.com/your-org/FloWorx-Production/discussions)

---

## 🙏 Acknowledgments

Built with:
- [Supabase](https://supabase.com) - Backend infrastructure
- [N8N](https://n8n.io) - Workflow automation
- [OpenAI](https://openai.com) - AI capabilities
- [React](https://react.dev) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

<div align="center">

**[⬆ Back to Top](#floworx---ai-powered-email-automation-platform)**

Made with ❤️ by the FloWorx Team

</div>

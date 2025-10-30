# FloWorx Documentation Index

**Last Updated:** October 29, 2025

Welcome to the FloWorx documentation! This index will help you find the information you need quickly.

---

## 📚 Core Documentation (Start Here)

These are the essential documents you should read:

### 1. [README.md](README.md)
**What it covers**: Project overview, features, quick start, technology stack

**Read this if you want to**:
- Understand what FloWorx does
- Get started quickly
- See supported business types
- Learn about the technology stack

---

### 2. [ARCHITECTURE.md](ARCHITECTURE.md)
**What it covers**: System design, components, data flows, design patterns, security

**Read this if you want to**:
- Understand how the system works
- Learn about the tech stack in detail
- See data flow diagrams
- Understand design decisions
- Review security architecture
- Understand scalability considerations

**Key Sections:**
- High-level architecture diagram
- Component details (Frontend, Backend, Edge Functions, Database)
- Data flow (Onboarding, Email Processing, Voice Training)
- Security architecture
- Design patterns (Template, Strategy, Factory, Semantic Layer)
- Performance considerations
- Deployment architecture
- Key technologies reference

---

### 3. [DEPLOYMENT.md](DEPLOYMENT.md)
**What it covers**: Complete deployment guide for all platforms

**Read this if you want to**:
- Deploy FloWorx to production
- Set up Coolify deployment
- Configure Docker Compose
- Deploy to Vercel
- Set up database migrations
- Deploy Supabase Edge Functions
- Configure N8N
- Set up OAuth applications
- Verify deployment
- Perform updates and rollbacks

**Key Sections:**
- Pre-deployment checklist
- Coolify deployment (recommended)
- Docker Compose deployment
- Vercel deployment (frontend only)
- Database setup
- Edge function deployment
- N8N configuration
- OAuth setup (Gmail + Outlook)
- Post-deployment verification
- Monitoring & logging
- Security best practices

---

### 4. [API Documentation](docs/api/README.md)
**What it covers**: RESTful API reference, endpoints, authentication, examples

**Read this if you want to**:
- Integrate with FloWorx API
- Understand available endpoints
- See request/response formats
- Learn about authentication
- Test API endpoints
- Build custom integrations

**Key Sections:**
- Authentication (JWT tokens)
- OAuth endpoints (Gmail, Outlook)
- Workflow endpoints (deploy, status, manage)
- Analytics endpoints (metrics, folder health, stats)
- Voice profile endpoints (training, context)
- Business profile endpoints
- Label/folder endpoints
- Email endpoints
- System endpoints
- Error responses & codes
- Rate limiting
- Webhooks
- Best practices & testing

---

## 🗂️ Additional Documentation

### Project Structure
- `docs/api/` - API reference documentation
- `docs/guides/` - How-to guides (coming soon)
- `docs/legacy/` - Archived fix/issue documentation (99 files)

### Code Documentation
- `supabase/migrations/README.md` - Database schema documentation
- `backend/README.md` - Backend-specific documentation
- `src/businessSchemas/` - AI schema definitions for 12 business types
- `src/behaviorSchemas/` - Behavior configurations per business type
- `src/labelSchemas/` - Folder/label structures per business type

---

## 🎯 Quick Navigation by Task

### Getting Started
1. Read [README.md](README.md) - Project overview
2. Follow [DEPLOYMENT.md](DEPLOYMENT.md) - Setup instructions
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) - Understand the system

### Development
1. [ARCHITECTURE.md](ARCHITECTURE.md) - System design
2. [docs/api/README.md](docs/api/README.md) - API reference
3. `src/` directory - Frontend code
4. `backend/src/` directory - Backend code
5. `supabase/functions/` directory - Edge functions

### Deployment
1. [DEPLOYMENT.md](DEPLOYMENT.md) - Main deployment guide
2. `docker-compose.yml` - Docker configuration
3. `coolify.yml` - Coolify configuration
4. `supabase/migrations/` - Database migrations

### Troubleshooting
1. [DEPLOYMENT.md](DEPLOYMENT.md) - Common deployment issues
2. `backend/logs/` - Application logs
3. `docs/legacy/` - Historical issue documentation

### API Integration
1. [docs/api/README.md](docs/api/README.md) - Complete API reference
2. [ARCHITECTURE.md](ARCHITECTURE.md) - System integration points

---

## 📖 Documentation by Audience

### For Product Managers
- **Start**: [README.md](README.md) - Features & capabilities
- **Then**: [ARCHITECTURE.md](ARCHITECTURE.md) - System overview section
- **Use**: Performance metrics, business types, supported features

### For Developers
- **Start**: [README.md](README.md) - Quick start
- **Then**: [ARCHITECTURE.md](ARCHITECTURE.md) - Full technical details
- **Reference**: [docs/api/README.md](docs/api/README.md) - API documentation
- **Code**: `src/`, `backend/src/`, `supabase/functions/`

### For DevOps/SRE
- **Start**: [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment options
- **Then**: [ARCHITECTURE.md](ARCHITECTURE.md) - Infrastructure details
- **Monitor**: Health checks, logging, error handling
- **Scale**: Scalability considerations section

### For Business Owners
- **Start**: [README.md](README.md) - What FloWorx does
- **Benefits**: Time savings, cost reduction, automation benefits
- **Support**: Supported business types, feature roadmap

---

## 🔍 Find Documentation by Topic

### Authentication & OAuth
- [DEPLOYMENT.md](DEPLOYMENT.md) - OAuth setup section
- [docs/api/README.md](docs/api/README.md) - OAuth endpoints
- [ARCHITECTURE.md](ARCHITECTURE.md) - Security architecture

### Email Classification & AI
- [ARCHITECTURE.md](ARCHITECTURE.md) - AI classifier section
- [docs/api/README.md](docs/api/README.md) - Voice profile endpoints
- `src/businessSchemas/` - AI schema definitions

### Workflows & N8N
- [DEPLOYMENT.md](DEPLOYMENT.md) - N8N setup section
- [ARCHITECTURE.md](ARCHITECTURE.md) - Workflow orchestration
- `backend/templates/` - N8N workflow templates
- `supabase/functions/deploy-n8n/` - Deployment logic

### Database & Schema
- [DEPLOYMENT.md](DEPLOYMENT.md) - Database setup section
- [ARCHITECTURE.md](ARCHITECTURE.md) - Database schema overview
- `supabase/migrations/` - Migration files
- `supabase/migrations/README.md` - Schema documentation

### Analytics & Metrics
- [docs/api/README.md](docs/api/README.md) - Analytics endpoints
- [ARCHITECTURE.md](ARCHITECTURE.md) - Performance considerations
- Performance metrics tracking

### Deployment & Infrastructure
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Deployment architecture
- `docker-compose.yml` - Docker configuration
- `coolify.yml` - Coolify configuration

---

## 📦 Legacy Documentation

We've archived 99 fix/issue tracking documents to `docs/legacy/`. These contain:
- Historical bug fixes
- Issue investigations
- Feature implementation notes
- System integration reports
- Troubleshooting steps

**Note**: This documentation is kept for reference but is not actively maintained. For current information, refer to the core documentation above.

**Legacy docs include**:
- Fix summaries (label fixes, OAuth fixes, folder provisioning fixes)
- Integration analyses (classifier integration, folder integration)
- Deployment troubleshooting (Coolify issues, Docker issues)
- Feature completion reports
- System verification reports

**When to use legacy docs**:
- Researching historical issues
- Understanding past architectural decisions
- Reviewing fix implementations
- Learning from previous bugs

---

## 🚀 Recommended Reading Paths

### Path 1: Quick Start (30 minutes)
1. [README.md](README.md) - Overview (10 min)
2. [DEPLOYMENT.md](DEPLOYMENT.md) - Quick deployment section (20 min)

### Path 2: Full Understanding (2-3 hours)
1. [README.md](README.md) - Complete overview (20 min)
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Full system design (60 min)
3. [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment (45 min)
4. [docs/api/README.md](docs/api/README.md) - API reference (30 min)

### Path 3: Developer Onboarding (4-6 hours)
1. [README.md](README.md) - Project overview
2. [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
3. Set up local development environment
4. Explore codebase (`src/`, `backend/src/`)
5. Review business schemas
6. Test API endpoints
7. Deploy to local environment

### Path 4: API Integration (1-2 hours)
1. [README.md](README.md) - Overview (15 min)
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Integration layer section (20 min)
3. [docs/api/README.md](docs/api/README.md) - Complete API reference (60 min)
4. Test endpoints with cURL/Postman

---

## 🔗 External Resources

### Technologies Used
- [Supabase Documentation](https://supabase.com/docs)
- [N8N Documentation](https://docs.n8n.io)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Gmail API](https://developers.google.com/gmail/api)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/)

### Deployment Platforms
- [Coolify Documentation](https://coolify.io/docs)
- [Docker Documentation](https://docs.docker.com)
- [Vercel Documentation](https://vercel.com/docs)

---

## 📞 Getting Help

### Documentation Issues
If you find errors or gaps in the documentation:
1. Open an issue on GitHub
2. Submit a pull request with fixes
3. Email: docs@floworx-iq.com

### Technical Support
- **GitHub Issues**: Bug reports and feature requests
- **Email**: support@floworx-iq.com
- **Community**: GitHub Discussions

---

## 📝 Documentation Standards

When contributing to documentation:

1. **Be Clear**: Use simple language, avoid jargon
2. **Be Specific**: Include examples, code snippets
3. **Be Complete**: Cover all scenarios, edge cases
4. **Be Current**: Update docs when code changes
5. **Be Organized**: Use consistent structure, headings

### Markdown Style Guide
- Use `#` for main title (one per document)
- Use `##` for major sections
- Use `###` for subsections
- Use code blocks with language tags
- Include links to related documentation
- Add "Last Updated" date at top

---

## 🎯 Documentation Roadmap

### Planned Documentation
- [ ] Troubleshooting Guide
- [ ] Contributing Guide
- [ ] Testing Guide
- [ ] Performance Optimization Guide
- [ ] Security Best Practices
- [ ] Mobile Development Guide
- [ ] Advanced Analytics Guide

### Documentation Improvements
- [ ] Add more diagrams (Mermaid.js)
- [ ] Create video tutorials
- [ ] Add interactive API playground
- [ ] Create quick reference cards
- [ ] Add FAQ section
- [ ] Create changelog

---

## ✅ Documentation Checklist

When writing new documentation:

- [ ] Clear title and purpose
- [ ] Table of contents (if > 5 sections)
- [ ] Code examples with syntax highlighting
- [ ] Links to related documentation
- [ ] Last updated date
- [ ] Prerequisites listed
- [ ] Step-by-step instructions
- [ ] Common errors & solutions
- [ ] Screenshots/diagrams (where helpful)
- [ ] Reviewed by another team member

---

**This documentation index is maintained by the FloWorx team.**  
**For updates or suggestions, open an issue on GitHub.**

**Happy coding! 🚀**


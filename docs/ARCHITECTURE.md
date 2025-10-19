# FloWorx System Architecture

## 🏗️ **High-Level Architecture Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Traefik (Reverse Proxy)                     │
│  • SSL Termination (Let's Encrypt)                             │
│  • Load Balancing                                              │
│  • Security Headers                                            │
│  • Rate Limiting                                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  FloWorx    │ │     n8n     │ │   Traefik   │
│  Frontend   │ │ Workflows   │ │  Dashboard  │
│ (React)     │ │ (Automation)│ │ (Monitoring)│
└─────────────┘ └─────────────┘ └─────────────┘
        │             │
        └─────────────┼─────────────┐
                      │             │
                      ▼             ▼
            ┌─────────────┐ ┌─────────────┐
            │  Supabase   │ │   External  │
            │  Database   │ │    APIs     │
            │ (PostgreSQL)│ │(Gmail/Outlook│
            └─────────────┘ └─────────────┘
```

## 🔄 **Data Flow Architecture**

### **1. User Registration & Onboarding Flow**
```
User → Frontend → Supabase Auth → Database
  │                    │
  │                    ▼
  │              Profile Creation
  │                    │
  │                    ▼
  │              Email Integration
  │                    │
  │                    ▼
  │              OAuth Flow (Gmail/Outlook)
  │                    │
  │                    ▼
  │              Workflow Deployment
  │                    │
  │                    ▼
  └──────────────→ n8n Workflows
```

### **2. Email Processing Flow**
```
Customer Email → Email Provider (Gmail/Outlook)
                      │
                      ▼
                 n8n Webhook Trigger
                      │
                      ▼
                 Email Processing Node
                      │
                      ▼
                 AI Analysis & Categorization
                      │
                      ▼
                 Response Generation
                      │
                      ▼
                 Automated Reply
                      │
                      ▼
                 Email Provider → Customer
                      │
                      ▼
                 Metrics Update (Supabase)
                      │
                      ▼
                 Dashboard Refresh (Frontend)
```

## 🏛️ **Service Architecture**

### **Frontend Service (React)**
```yaml
floworx-frontend:
  image: custom-react-app
  ports: 80
  environment:
    - NODE_ENV=production
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY
    - VITE_GMAIL_CLIENT_ID
    - VITE_OUTLOOK_CLIENT_ID
  volumes:
    - static_assets:/usr/share/nginx/html
```

**Responsibilities:**
- User interface and experience
- Authentication and authorization
- Business configuration management
- Real-time metrics display
- OAuth flow initiation

### **n8n Workflow Engine**
```yaml
n8n:
  image: docker.n8n.io/n8nio/n8n
  ports: 5678
  environment:
    - N8N_HOST=automation.yourdomain.com
    - N8N_PROTOCOL=https
    - DB_TYPE=postgresdb
    - DB_POSTGRESDB_HOST=supabase_host
  volumes:
    - n8n_data:/home/node/.n8n
```

**Responsibilities:**
- Email monitoring and processing
- Workflow execution and orchestration
- AI integration and response generation
- External API integrations
- Business logic enforcement

### **Traefik Reverse Proxy**
```yaml
traefik:
  image: traefik:v2.11
  ports: 80, 443, 8080
  volumes:
    - traefik_data:/letsencrypt
    - /var/run/docker.sock:/var/run/docker.sock:ro
```

**Responsibilities:**
- SSL certificate management
- Request routing and load balancing
- Security header injection
- Rate limiting and DDoS protection
- Service discovery and health checks

## 🗄️ **Database Architecture**

### **Supabase PostgreSQL Schema**

```sql
-- Core Tables
profiles              -- User and business profiles
integrations          -- OAuth token storage
oauth_credentials     -- Service credentials
workflows            -- n8n workflow metadata
email_logs           -- Email processing history
performance_metrics  -- System performance data

-- Security Tables
ai_human_comparison  -- AI vs human response comparison
credentials          -- Encrypted credential storage
```

### **Data Relationships**
```
users (auth.users)
  │
  ├── profiles (business info, settings)
  │
  ├── integrations (email provider connections)
  │
  ├── workflows (n8n workflow metadata)
  │
  ├── email_logs (processing history)
  │
  └── performance_metrics (analytics)
```

## 🔐 **Security Architecture**

### **Authentication Flow**
```
1. User Registration → Supabase Auth
2. Email Verification → Supabase Auth
3. Login → JWT Token Generation
4. API Requests → Token Validation
5. OAuth Integration → Provider Authorization
```

### **Authorization Layers**
```
┌─────────────────────────────────────────┐
│            Frontend (React)             │
│  • Route Protection                     │
│  • Component-level Auth                 │
│  • API Request Headers                  │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│            Supabase RLS                 │
│  • Row Level Security                   │
│  • User-based Data Access               │
│  • API Key Validation                   │
└─────────────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────┐
│            n8n Workflows                │
│  • User Context Validation              │
│  • Workflow Access Control              │
│  • API Credential Management            │
└─────────────────────────────────────────┘
```

### **Data Protection**
- **Encryption at Rest**: Supabase database encryption
- **Encryption in Transit**: TLS 1.3 for all communications
- **OAuth Tokens**: Encrypted storage in database
- **API Keys**: Secure credential management
- **Personal Data**: GDPR-compliant handling

## 🌐 **Network Architecture**

### **Container Network Topology**
```
traefik_proxy (Docker Network)
├── traefik (Reverse Proxy)
├── floworx-frontend (React App)
├── n8n-production (Workflow Engine)
├── redis (Cache - Optional)
└── watchtower (Auto-updates)
```

### **External Connections**
```
Internet Traffic
├── HTTPS (443) → Traefik → Services
├── HTTP (80) → Traefik → Redirect to HTTPS
└── Management (8080) → Traefik Dashboard

External APIs
├── Supabase Database (PostgreSQL)
├── Gmail API (OAuth)
├── Outlook API (OAuth)
├── OpenAI API (AI Processing)
└── Let's Encrypt (SSL Certificates)
```

## 📊 **Monitoring & Observability**

### **Application Metrics**
```yaml
traefik:
  metrics:
    prometheus: true
    endpoint: /metrics

n8n:
  metrics: true
  log_level: info

floworx-frontend:
  logging: structured
  health_checks: enabled
```

### **Infrastructure Monitoring**
```yaml
watchtower:
  cleanup: true
  poll_interval: 86400
  notifications: email

docker:
  stats: enabled
  logs: centralized
  health_checks: enabled
```

### **Business Metrics**
- Email processing volume
- Response time analytics
- Customer satisfaction scores
- Workflow execution success rates
- Business growth metrics

## 🔄 **Deployment Architecture**

### **Container Orchestration**
```yaml
# Production Deployment
services:
  traefik:
    restart: unless-stopped
    deploy:
      resources:
        limits: { memory: 256M, cpus: '0.25' }
  
  floworx-frontend:
    restart: unless-stopped
    deploy:
      resources:
        limits: { memory: 512M, cpus: '0.5' }
  
  n8n:
    restart: unless-stopped
    deploy:
      resources:
        limits: { memory: 1G, cpus: '1.0' }
```

### **Scaling Strategy**
```
Horizontal Scaling:
├── Frontend: Multiple replicas behind Traefik
├── n8n: Worker node scaling for high volume
└── Database: Supabase automatic scaling

Vertical Scaling:
├── CPU: Based on workflow complexity
├── Memory: Based on concurrent users
└── Storage: Based on email volume
```

## 🚀 **Performance Architecture**

### **Caching Strategy**
```yaml
# Multi-layer Caching
Browser Cache:
  - Static assets (CSS, JS, images)
  - API responses (short-term)

Redis Cache:
  - Session data
  - Frequently accessed data
  - API response caching

CDN (Future):
  - Global static asset delivery
  - Geographic distribution
```

### **Optimization Techniques**
- **Code Splitting**: Lazy loading of React components
- **Image Optimization**: WebP format with fallbacks
- **API Optimization**: GraphQL for efficient data fetching
- **Database Optimization**: Indexed queries and connection pooling
- **Workflow Optimization**: Parallel processing where possible

## 🔧 **Development Architecture**

### **Local Development Setup**
```
Development Environment:
├── Frontend: Vite dev server (localhost:5173)
├── Backend: n8n local instance
├── Database: Supabase development project
└── Reverse Proxy: Traefik (optional)
```

### **CI/CD Pipeline**
```
GitHub Actions:
├── Code Quality: ESLint, Prettier, Tests
├── Security: Dependency scanning
├── Build: Docker image creation
├── Deploy: Automated deployment to VPS
└── Monitoring: Health checks and alerts
```

## 📈 **Scalability Architecture**

### **Current Capacity**
- **Concurrent Users**: 100+ (limited by VPS resources)
- **Email Processing**: 1000+ emails/hour
- **Workflow Execution**: 100+ concurrent workflows
- **Database**: 10GB+ storage capacity

### **Future Scaling**
- **Microservices**: Break down monolithic services
- **Kubernetes**: Container orchestration at scale
- **Multi-region**: Geographic distribution
- **Event-driven**: Message queues for async processing

---

*This architecture is designed for scalability, security, and maintainability while providing a robust foundation for AI-powered email automation.*

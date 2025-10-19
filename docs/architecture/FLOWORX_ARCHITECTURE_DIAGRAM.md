# Floworx Application Architecture Diagram

## 🏗️ **System Overview**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                FLOWORX APPLICATION                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│  │   FRONTEND      │    │    BACKEND      │    │   DATABASE      │           │
│  │   (React/Vite)  │    │   (Express.js)  │    │   (Supabase)    │           │
│  │   Port: 5173    │    │   Port: 3000    │    │   Cloud Hosted  │           │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 **Detailed Architecture**

### **1. FRONTEND LAYER (Port 5173)**
```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite Dev Server)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   React App     │  │   Components    │  │   Services      │ │
│  │   - Dashboard   │  │   - UI Library  │  │   - Supabase    │ │
│  │   - Onboarding  │  │   - Forms       │  │   - Auth        │ │
│  │   - Workflows   │  │   - Charts      │  │   - Email       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    VITE PROXY CONFIGURATION                │ │
│  │  /api/* → http://localhost:3000 (Main API Server)         │ │
│  │  /backend/* → http://localhost:3001 (Backend Server)      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **2. MAIN API SERVER (Port 3000)**
```
┌─────────────────────────────────────────────────────────────────┐
│                    MAIN API SERVER (server.js)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Express App    │  │   Middleware    │  │   API Routes    │ │
│  │   - CORS         │  │   - JSON Parse  │  │   - /api/ai/*   │ │
│  │   - Body Parse   │  │   - Rate Limit  │  │   - /api/email- │ │
│  │   - Security     │  │   - Logging     │  │     logs        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    EXTERNAL INTEGRATIONS                   │ │
│  │  • OpenAI API (GPT-4)                                      │ │
│  │  • Supabase Client (Database)                             │ │
│  │  • Email Monitoring Service                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **3. BACKEND SERVER (Port 3001)**
```
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND SERVER (backend/src/server.js)         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Express App   │  │   Services      │  │   N8N Integration│ │
│  │   - Helmet      │  │   - EmailService│  │   - Workflow     │ │
│  │   - Rate Limit  │  │   - AIService   │  │     Deployment  │ │
│  │   - Compression │  │   - Credential  │  │   - Credential   │ │
│  │   - CORS        │  │     Service     │  │     Management   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    VPS & N8N DEPLOYMENT                    │ │
│  │  • VPS N8N Deployment Service                              │ │
│  │  • Workflow Template Management                             │ │
│  │  • Credential Injection                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **4. DATABASE LAYER (Supabase)**
```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Core Tables   │  │   Auth Tables   │  │   Integration   │ │
│  │   • profiles    │  │   • auth.users  │  │   • integrations│ │
│  │   • email_logs  │  │   • auth.sessions│  │   • credentials │ │
│  │   • workflows   │  │   • auth.tokens │  │   • client_     │ │
│  │   • business_   │  │                 │  │     credentials_│ │
│  │     profiles    │  │                 │  │     map         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SUPABASE FUNCTIONS                      │ │
│  │  • deploy-n8n (Edge Function)                              │ │
│  │  • openai-keys-admin (Edge Function)                      │ │
│  │  • style-memory (Edge Function)                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 **Data Flow Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW DIAGRAM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Action → Frontend → API Server → Backend → Database       │
│      ↓              ↓           ↓         ↓         ↓         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Browser │  │ React   │  │ Express │ │Express  │ │Supabase │ │
│  │ Port    │  │ App     │  │ Server  │ │Server   │ │Database │ │
│  │ 5173    │  │ (Vite)  │  │ Port    │ │Port     │ │(Cloud)  │ │
│  │         │  │         │  │ 3000    │ │3001     │ │         │ │
│  └─────────┘  └─────────┘  └─────────┘ └─────────┘ └─────────┘ │
│                                                                 │
│  Email Monitoring → API Server → Database                       │
│      ↓                    ↓           ↓                        │
│  ┌─────────┐        ┌─────────┐  ┌─────────┐                  │
│  │ Gmail   │        │ /api/   │  │email_   │                  │
│  │ API     │        │email-   │  │logs     │                  │
│  │         │        │logs     │  │table    │                  │
│  └─────────┘        └─────────┘  └─────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🌐 **External Integrations**

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   OpenAI API    │  │   Gmail API     │  │   N8N Platform  │ │
│  │   • GPT-4       │  │   • OAuth2      │  │   • Workflows   │ │
│  │   • Text        │  │   • Email       │  │   • Automation  │ │
│  │     Analysis    │  │     Processing  │  │   • Triggers    │ │
│  │   • AI          │  │   • Labels      │  │   • Actions     │ │
│  │     Classification│  │   • Folders    │  │   • Credentials│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Microsoft     │  │   VPS Server    │  │   Supabase      │ │
│  │   Graph API     │  │   • N8N         │  │   Edge          │ │
│  │   • Outlook     │  │     Instance    │  │   Functions     │ │
│  │   • OAuth2      │  │   • Docker      │  │   • Real-time   │ │
│  │   • Email       │  │   • Workflows   │  │   • Auth        │ │
│  │     Access      │  │   • Monitoring  │  │   • Storage     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 **Security & Authentication**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Frontend      │  │   API Servers   │  │   Database      │ │
│  │   • JWT Tokens  │  │   • CORS        │  │   • RLS         │ │
│  │   • Supabase    │  │   • Helmet      │  │   • Policies    │ │
│  │     Auth        │  │   • Rate        │  │   • Encryption  │ │
│  │   • Protected   │  │     Limiting    │  │   • Service     │ │
│  │     Routes      │  │   • Input       │  │     Keys        │ │
│  │   • Session     │  │     Validation  │  │   • Audit       │ │
│  │     Management  │  │   • Error       │  │     Logs        │ │
│  │                 │  │     Handling    │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 **Email Performance Dashboard Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                EMAIL PERFORMANCE DASHBOARD FLOW                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Dashboard Component → Supabase Query → Real-time Updates      │
│      ↓                    ↓              ↓                     │
│  ┌─────────┐        ┌─────────┐    ┌─────────┐               │
│  │Efficiency│       │email_   │    │Auto-    │               │
│  │Stats     │       │logs     │    │refresh  │               │
│  │Component │       │table    │    │60s      │               │
│  └─────────┘        └─────────┘    └─────────┘               │
│                                                                 │
│  Features:                                                      │
│  • Time Range Filtering (7d, 30d, 90d, 365d)                   │
│  • Trend Analysis (Previous vs Current Period)                  │
│  • Category Breakdown (Gmail, Outlook, etc.)                   │
│  • Export Functionality (CSV Reports)                          │
│  • Real-time Volume Charts                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Development Environment:                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Local Dev     │  │   Local API     │  │   Supabase      │ │
│  │   Server        │  │   Servers       │  │   Cloud         │ │
│  │   Port: 5173    │  │   Port: 3000    │  │   Database      │ │
│  │   (Vite)        │  │   Port: 3001    │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  Production Environment:                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   VPS Server    │  │   Docker        │  │   Supabase      │ │
│  │   • Nginx       │  │   Containers    │  │   Production    │ │
│  │   • SSL         │  │   • Frontend    │  │   Database      │ │
│  │   • Domain      │  │   • Backend     │  │   • Edge        │ │
│  │   • Monitoring  │  │   • N8N         │  │     Functions   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📝 **Key Configuration Files**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION FILES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend Configuration:                                        │
│  • vite.config.js - Vite dev server & proxy config             │
│  • src/lib/customSupabaseClient.js - Database connection       │
│  • src/lib/emailMonitoring.js - Email processing service       │
│                                                                 │
│  Backend Configuration:                                         │
│  • server.js - Main API server (Port 3000)                     │
│  • backend/src/server.js - Backend server (Port 3001)         │
│  • .env - Environment variables                                 │
│                                                                 │
│  Database Configuration:                                       │
│  • supabase/ - Database migrations & functions                │
│  • Supabase Cloud - Production database                        │
│                                                                 │
│  Deployment Configuration:                                      │
│  • Dockerfile.* - Container configurations                     │
│  • docker-compose.yml - Multi-container setup                  │
│  • nginx.conf - Web server configuration                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 **Current Server Status**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT SERVER STATUS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Frontend Server (Vite):     http://localhost:5173          │
│  ✅ Main API Server:            http://localhost:3000          │
│  ✅ Backend Server:             http://localhost:3001         │
│  ✅ Supabase Database:          https://oinxzvqszingwstrbdro.   │
│                                  supabase.co                    │
│                                                                 │
│  🔄 Email Monitoring:           Active & Logging                │
│  📊 Performance Dashboard:     Real-time Analytics             │
│  🚀 N8N Integration:           Workflow Deployment Ready       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 **Quick Start Guide**

### **Starting All Servers**

1. **Start Frontend (Terminal 1):**
   ```bash
   cd C:\FloworxV2
   npm run dev
   # Runs on http://localhost:5173
   ```

2. **Start Main API Server (Terminal 2):**
   ```bash
   cd C:\FloworxV2
   node server.js
   # Runs on http://localhost:3000
   ```

3. **Start Backend Server (Terminal 3):**
   ```bash
   cd C:\FloworxV2\backend
   node src/server.js
   # Runs on http://localhost:3001
   ```

### **Server Verification**

```bash
# Check all servers are running
netstat -ano | findstr "3000\|3001\|5173"

# Expected output:
# TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    [PID]
# TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    [PID]  
# TCP    0.0.0.0:5173    0.0.0.0:0    LISTENING    [PID]
```

### **Health Checks**

- **Frontend**: http://localhost:5173
- **Main API**: http://localhost:3000/health
- **Backend**: http://localhost:3001/health
- **Dashboard**: http://localhost:5173/dashboard

---

## 📋 **Summary**

The Floworx application uses a **multi-server architecture** with:

1. **Frontend**: React/Vite development server (Port 5173)
2. **Main API**: Express server for AI and email processing (Port 3000)  
3. **Backend**: Express server for N8N integration and VPS deployment (Port 3001)
4. **Database**: Supabase cloud database with real-time capabilities
5. **External APIs**: OpenAI, Gmail, Microsoft Graph, N8N platform

The architecture supports **real-time email monitoring**, **AI-powered classification**, **automated workflow deployment**, and **comprehensive analytics** through the new Email Performance Dashboard.

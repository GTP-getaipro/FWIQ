# FloWorx Technical Architecture Documentation

## System Architecture Overview

FloWorx is built on a modern, scalable architecture that separates concerns across multiple layers and services. The system follows microservices principles while maintaining a cohesive user experience.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React/Vite)  │◄──►│   (Supabase)    │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Security      │    │   Workflow      │    │   AI Services   │
│   Monitoring    │    │   Engine (n8n)  │    │   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Technology Stack
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **React Router**: Client-side routing

### Component Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (buttons, inputs, etc.)
│   ├── forms/           # Form components
│   ├── charts/          # Data visualization components
│   └── layout/          # Layout components
├── pages/               # Page-level components
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and services
└── tests/               # Test files
```

### State Management
- **React Context**: Global state management for user authentication, theme, etc.
- **Local State**: Component-level state using useState and useReducer
- **Server State**: Supabase client for server state management

### Key Frontend Services

#### Authentication Context (`SupabaseAuthContext.jsx`)
```javascript
// Manages user authentication state
- User login/logout
- Session management
- OAuth integration (Gmail, Outlook)
- Role-based access control
```

#### Analytics Service (`analytics.js`)
```javascript
// Handles analytics data collection
- Page view tracking
- User interaction tracking
- Performance metrics
- Error tracking
```

#### Security Monitoring (`securityMonitoring.js`)
```javascript
// Real-time security monitoring
- Threat detection
- Security event logging
- Anomaly detection
- Incident response
```

## Backend Architecture

### Supabase Services
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Built-in auth with OAuth providers
- **Real-time**: WebSocket connections for live updates
- **Storage**: File storage for attachments and exports
- **Edge Functions**: Serverless functions for complex operations

### Database Schema

#### Core Tables
```sql
-- Users and Authentication
users (id, email, role, created_at, updated_at)

-- Business Rules
rules (id, name, description, condition_type, escalation_action, 
       priority, user_id, metadata, created_at, updated_at)

-- AI Personalization
ai_personalization_profiles (id, user_id, preferences, 
                            behavior_patterns, role, created_at)

-- Analytics
analytics_visualization_configs (id, user_id, config_name, 
                                chart_type, data_source, created_at)
analytics_exports (id, user_id, format, status, file_path, created_at)
analytics_performance_logs (id, user_id, operation, duration, timestamp)

-- Security
security_events (id, event_type, severity, user_id, session_id, 
                timestamp, data, ip_address)
```

#### Row Level Security (RLS)
- **User Isolation**: Users can only access their own data
- **Role-Based Access**: Different permissions for Standard/Premium users
- **Admin Override**: Administrators can access all data

### API Architecture

#### RESTful Endpoints
```
/api/analytics/events          # Analytics event tracking
/api/analytics/sessions        # Session management
/api/analytics/dashboard/:id   # Dashboard data
/api/rules                     # Business rule management
/api/ai/personalize            # AI personalization
/api/security/events           # Security event logging
```

#### Real-time Subscriptions
```javascript
// Supabase real-time subscriptions
supabase
  .channel('security-events')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'security_events' 
  }, handleSecurityEvent)
  .subscribe()
```

## Workflow Engine (n8n Integration)

### n8n Configuration
- **Workflow Designer**: Visual workflow creation
- **Node Types**: Email processing, AI analysis, data transformation
- **Triggers**: Email received, scheduled, webhook-based
- **Actions**: Send email, update database, call external APIs

### Workflow Patterns

#### Email Processing Workflow
```
Email Received → AI Analysis → Rule Evaluation → Action Execution → Response Generation
```

#### Security Monitoring Workflow
```
Security Event → Threat Analysis → Risk Assessment → Alert/Response → Logging
```

## AI Integration Architecture

### OpenAI Integration
- **Content Analysis**: Email content understanding and categorization
- **Response Generation**: Context-aware response creation
- **Personalization**: Role-based response customization
- **Sentiment Analysis**: Email sentiment detection

### AI Service Architecture
```javascript
// AI Personalization Engine
class AIPersonalization {
  - calculatePersonalizationLevel()
  - applyRoleBasedPersonalization()
  - generatePersonalizedResponse()
  - updateBehaviorPatterns()
}

// Advanced AI Engine
class AdvancedAIEngine {
  - initialize()
  - generateResponse()
  - updateResponse()
  - deleteResponse()
}
```

## Security Architecture

### Multi-Layer Security

#### 1. Authentication Layer
- **Supabase Auth**: Secure authentication with JWT tokens
- **OAuth Integration**: Gmail and Outlook OAuth
- **Session Management**: Secure session handling
- **Role-Based Access**: User role validation

#### 2. Authorization Layer
- **Row Level Security**: Database-level access control
- **API Permissions**: Endpoint-level authorization
- **Component Guards**: Frontend route protection
- **Resource Access**: Fine-grained resource permissions

#### 3. Data Protection Layer
- **Input Sanitization**: XSS prevention and data validation
- **Encryption**: End-to-end data encryption
- **Secure Storage**: Encrypted data storage
- **Data Masking**: Sensitive data protection

#### 4. Monitoring Layer
- **Real-time Monitoring**: Continuous security monitoring
- **Threat Detection**: AI-powered threat detection
- **Audit Logging**: Comprehensive audit trails
- **Incident Response**: Automated security responses

### Security Services

#### Security Audit Logger
```javascript
class SecurityAuditLogger {
  - logSecurityEvent()
  - logDataAccessEvent()
  - logSuspiciousActivity()
  - getSessionId()
}
```

#### Threat Detection System
```javascript
class ThreatDetectionSystem {
  - detectAnomalies()
  - analyzeThreats()
  - generateAlerts()
  - respondToIncidents()
}
```

## Performance Architecture

### Caching Strategy
- **Redis Cache**: In-memory caching for frequently accessed data
- **Browser Cache**: Static asset caching
- **CDN**: Content delivery network for global distribution
- **Database Cache**: Query result caching

### Performance Monitoring
```javascript
// Performance tracking
- Page load times
- API response times
- Database query performance
- User interaction metrics
- System resource usage
```

### Optimization Techniques
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: Compressed and responsive images
- **Database Indexing**: Optimized database queries

## Deployment Architecture

### Development Environment
- **Vite Dev Server**: Hot reload and fast development
- **Mock APIs**: Development API mocking
- **Local Database**: Supabase local development
- **Testing**: Jest and Cypress testing

### Production Environment
- **Docker Containers**: Containerized deployment
- **Load Balancing**: Traefik reverse proxy
- **SSL Termination**: HTTPS encryption
- **Monitoring**: Application and infrastructure monitoring

### Environment Configuration
```javascript
// Environment variables
VITE_SUPABASE_URL=          # Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Supabase anonymous key
VITE_OPENAI_API_KEY=         # OpenAI API key
VITE_GMAIL_CLIENT_ID=        # Gmail OAuth client ID
VITE_OUTLOOK_CLIENT_ID=     # Outlook OAuth client ID
```

## Data Flow Architecture

### Email Processing Flow
```
1. Email Ingestion (OAuth) → 2. AI Analysis (OpenAI) → 3. Rule Evaluation → 
4. Workflow Execution (n8n) → 5. Response Generation → 6. Analytics Tracking
```

### Security Monitoring Flow
```
1. Event Detection → 2. Threat Analysis → 3. Risk Assessment → 
4. Alert Generation → 5. Incident Response → 6. Audit Logging
```

### Analytics Flow
```
1. Data Collection → 2. Processing → 3. Aggregation → 
4. Visualization → 5. Export → 6. Reporting
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Services**: Services can be scaled independently
- **Load Balancing**: Traffic distribution across multiple instances
- **Database Scaling**: Supabase auto-scaling capabilities
- **CDN Distribution**: Global content delivery

### Vertical Scaling
- **Resource Optimization**: Efficient resource utilization
- **Performance Tuning**: Database and application optimization
- **Caching**: Multi-layer caching strategy
- **Monitoring**: Performance monitoring and alerting

## Integration Architecture

### External Service Integration
- **OpenAI API**: AI-powered content analysis
- **Gmail API**: Email integration and processing
- **Outlook API**: Microsoft Graph integration
- **n8n API**: Workflow automation

### Internal Service Communication
- **REST APIs**: HTTP-based service communication
- **Real-time**: WebSocket connections for live updates
- **Event-driven**: Event-based architecture for loose coupling
- **Message Queues**: Asynchronous processing

## Monitoring & Observability

### Application Monitoring
- **Performance Metrics**: Response times, throughput, error rates
- **User Analytics**: User behavior and engagement metrics
- **Security Monitoring**: Threat detection and incident response
- **Business Metrics**: Email processing and workflow metrics

### Infrastructure Monitoring
- **System Resources**: CPU, memory, disk usage
- **Database Performance**: Query performance and connection pools
- **Network Monitoring**: Traffic patterns and latency
- **Error Tracking**: Application errors and exceptions

---

*This technical architecture provides a comprehensive overview of how FloWorx is structured internally, ensuring scalability, security, and maintainability while delivering a powerful email workflow automation platform.*

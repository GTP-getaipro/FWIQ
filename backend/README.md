# FloWorx Backend API

A robust Express.js backend server for the FloWorx email automation platform.

## Features

- **Authentication & Authorization**: JWT-based auth with Supabase integration
- **Email Processing**: AI-powered email classification and response generation
- **Workflow Management**: n8n workflow deployment and monitoring
- **AI Integration**: OpenAI-powered communication style analysis
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston-based structured logging
- **Error Handling**: Comprehensive error handling with custom error classes

## Quick Start

### Prerequisites

- Node.js 16+ and npm 8+
- Supabase account and project
- OpenAI API key (optional, for AI features)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Configure your environment variables
nano .env
```

### Environment Configuration

Required environment variables:

```bash
# Server
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
JWT_SECRET=your_jwt_secret_minimum_32_chars

# AI (Optional)
OPENAI_API_KEY=your_openai_api_key
```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Run tests
npm test
```

The server will start on `http://localhost:3001` by default.

## API Endpoints

### Health & Status

- `GET /health` - Basic health check
- `GET /api/health/detailed` - Detailed health check with dependencies
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe
- `GET /api/health/metrics` - Performance metrics

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/password-reset` - Request password reset
- `PUT /api/auth/password` - Update password

### Email Processing

- `POST /api/emails/process` - Process incoming email through AI pipeline
- `GET /api/emails/history` - Get email processing history
- `GET /api/emails/ai-responses` - Get AI response history
- `GET /api/emails/stats` - Get email processing statistics
- `POST /api/emails/respond` - Send response to email
- `GET /api/emails/:emailId` - Get email by ID
- `DELETE /api/emails/:emailId` - Delete email from history

### Workflow Management

- `GET /api/workflows` - Get user workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/:id` - Get workflow by ID
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/deploy` - Deploy workflow
- `GET /api/workflows/:id/deployment` - Get deployment status
- `GET /api/workflows/:id/stats` - Get workflow statistics
- `POST /api/workflows/:id/duplicate` - Duplicate workflow

### AI Services

- `POST /api/ai/classify` - Classify email using AI
- `POST /api/ai/generate-response` - Generate AI response
- `POST /api/ai/analyze-style` - Analyze communication style
- `GET /api/ai/style-profile` - Get user's style profile
- `POST /api/ai/process-pipeline` - Process email through complete AI pipeline
- `GET /api/ai/stats` - Get AI processing statistics
- `POST /api/ai/templates` - Create response template
- `GET /api/ai/templates` - Get response templates
- `PUT /api/ai/templates/:id` - Update template
- `DELETE /api/ai/templates/:id` - Delete template
- `POST /api/ai/templates/:id/render` - Render template with variables
- `GET /api/ai/validate-config` - Validate AI pipeline configuration

## Architecture

### Middleware Stack

1. **Security**: Helmet for security headers
2. **CORS**: Cross-origin resource sharing
3. **Compression**: Response compression
4. **Logging**: Request/response logging
5. **Rate Limiting**: IP and user-based rate limiting
6. **Body Parsing**: JSON and URL-encoded parsing
7. **Authentication**: JWT token verification
8. **Validation**: Joi schema validation
9. **Error Handling**: Centralized error handling

### Error Handling

The API uses structured error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

### Authentication

The API supports multiple authentication methods:

- **JWT Tokens**: Primary authentication method
- **Supabase Auth**: Integration with Supabase authentication
- **API Keys**: For service-to-service communication

### Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 10 requests per 15 minutes per IP
- **Email Processing**: 50 requests per 15 minutes per user
- **AI Services**: 30 requests per 15 minutes per user

### Logging

Structured logging with Winston:

- **Console**: Development logging with colors
- **Files**: Production logging to files
- **Levels**: error, warn, info, http, debug

## Development

### Project Structure

```
backend/
├── src/
│   ├── middleware/          # Express middleware
│   │   ├── auth.js         # Authentication middleware
│   │   └── errorHandler.js # Error handling middleware
│   ├── routes/             # API route handlers
│   │   ├── auth.js         # Authentication routes
│   │   ├── emails.js       # Email processing routes
│   │   ├── workflows.js    # Workflow management routes
│   │   ├── ai.js          # AI service routes
│   │   └── health.js       # Health check routes
│   ├── utils/              # Utility modules
│   │   └── logger.js       # Logging configuration
│   └── server.js           # Main server file
├── package.json            # Dependencies and scripts
├── env.example            # Environment template
└── README.md              # This file
```

### Adding New Routes

1. Create route file in `src/routes/`
2. Add validation schemas using Joi
3. Implement route handlers with `asyncHandler`
4. Add authentication middleware if needed
5. Import and mount in `server.js`

### Error Handling

Use the provided error classes:

```javascript
const { ValidationError, NotFoundError, AuthenticationError } = require('../middleware/errorHandler');

// Throw structured errors
throw new ValidationError('Invalid input data');
throw new NotFoundError('Resource not found');
throw new AuthenticationError('Invalid credentials');
```

### Validation

Use Joi schemas for input validation:

```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

router.post('/endpoint', validate(schema), asyncHandler(async (req, res) => {
  // Validated data available in req.body
}));
```

## Security

### Security Headers

- **Helmet**: Security headers (CSP, HSTS, etc.)
- **CORS**: Controlled cross-origin access
- **Rate Limiting**: Prevents abuse and DoS attacks

### Input Validation

- **Joi Schemas**: Comprehensive input validation
- **Sanitization**: HTML and SQL injection prevention
- **File Upload**: Size and type restrictions

### Authentication Security

- **JWT Secrets**: Strong secret keys
- **Password Hashing**: bcrypt with configurable rounds
- **Session Management**: Secure session handling

## Monitoring

### Health Checks

- **Basic**: Server status and uptime
- **Detailed**: Database and service connectivity
- **Kubernetes**: Ready and live probes

### Metrics

- **Performance**: Response times and throughput
- **Errors**: Error rates and types
- **Usage**: API endpoint usage statistics

### Logging

- **Structured**: JSON-formatted logs
- **Levels**: Configurable log levels
- **Rotation**: Automatic log file rotation

## Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure all required environment variables
3. Set up proper logging directory permissions
4. Configure reverse proxy (nginx/Apache)

### Process Management

Use PM2 or similar for production:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name floworx-backend

# Monitor
pm2 status
pm2 logs floworx-backend
```

### Docker Deployment

The backend is designed to work with the provided Docker configuration in the root directory.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Use conventional commit messages

## License

MIT License - see LICENSE file for details.

# 🚀 Floworx n8n Workflow Implementation Guide

## 📋 Prerequisites

Before importing and deploying the Floworx n8n workflow, ensure you have:

### 1. n8n Instance Setup
- **n8n Version**: 1.0+ (supports LangChain nodes)
- **Node Types Required**:
  - `@n8n/n8n-nodes-langchain.agent` (for AI classification and response generation)
  - `n8n-nodes-base.webhook` (for onboarding data intake)
  - `n8n-nodes-base.httpRequest` (for API calls)
  - `n8n-nodes-base.gmail` (for email processing)
  - `n8n-nodes-base.code` (for JavaScript logic)
  - `n8n-nodes-base.set` (for data formatting)
  - `n8n-nodes-base.respondToWebhook` (for webhook responses)

### 2. API Keys & Credentials
```bash
# OpenAI API (for LangChain nodes)
OPENAI_API_KEY=sk-your-openai-api-key

# Gmail API (for email processing)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token

# Floworx API Endpoints
FLOWORX_API_BASE_URL=https://api.floworx.ai
FLOWORX_CDN_BASE_URL=https://cdn.floworx.ai
```

### 3. Backend API Endpoints
You'll need to implement these endpoints:

#### A. Business Config Storage
```
POST https://api.floworx.ai/business-configs
Content-Type: application/json

{
  "domain": "thehottubman.ca",
  "config": { ... unified config JSON ... }
}

Response:
{
  "configId": "floworx_789a5f",
  "status": "stored",
  "domain": "thehottubman.ca"
}
```

#### B. Business Config Retrieval
```
GET https://api.floworx.ai/business-configs?domain=thehottubman.ca

Response:
{
  "businessType": "Pools & Spas",
  "profile": { ... },
  "labels": { ... },
  "classifierBehavior": { ... },
  "responderBehavior": { ... }
}
```

#### C. Analytics Logging
```
POST https://api.floworx.ai/analytics/log
Content-Type: application/json

{
  "threadId": "1764b1234567890",
  "businessDomain": "thehottubman.ca",
  "classification": "Support.TechnicalSupport",
  "confidence": 0.92,
  "ai_can_reply": true,
  "response_length": 184,
  "processing_time_ms": 4221,
  "timestamp": "2025-01-05T10:35:00Z"
}
```

---

## 🔧 Installation Steps

### Step 1: Import the Workflow

1. **Open n8n** in your browser
2. **Go to Workflows** → **Import from File**
3. **Select** `floworx-multi-business-n8n-workflow.json`
4. **Click Import**

### Step 2: Configure Environment Variables

1. **Go to Settings** → **Environment Variables**
2. **Add the following variables**:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
FLOWORX_API_BASE_URL=https://api.floworx.ai
FLOWORX_CDN_BASE_URL=https://cdn.floworx.ai
```

### Step 3: Configure Gmail Integration

1. **Open the Gmail Trigger node**
2. **Click "Connect Gmail Account"**
3. **Authenticate with your Gmail credentials**
4. **Test the connection**

### Step 4: Update API Endpoints

1. **Open each HTTP Request node**
2. **Update the URLs** to match your actual API endpoints
3. **Test the connections**

### Step 5: Configure LangChain Nodes

1. **Open "AI Master Classifier" node**
2. **Verify OpenAI API key is configured**
3. **Test with sample data**
4. **Repeat for "AI Draft Generator" node**

---

## 🧪 Testing the Workflow

### Test 1: Onboarding Flow

1. **Start the workflow**
2. **Send a POST request** to the webhook endpoint:

```bash
curl -X POST https://your-n8n-instance.com/webhook/onboarding-intake \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "Pools & Spas",
    "businessProfile": {
      "businessName": "The Hot Tub Man Ltd",
      "category": "Pools & Spas",
      "timezone": "Canada/Mountain",
      "currency": "CAD",
      "emailDomain": "thehottubman.ca",
      "crmProvider": "ServiceTitan"
    },
    "team": {
      "managers": [
        {"name": "John Smith", "email": "john@thehottubman.ca", "role": "Owner"}
      ],
      "suppliers": [
        {"name": "Strong Spas", "email": "orders@strongspas.com"}
      ]
    },
    "services": [
      {"name": "Pool Opening", "category": "Maintenance", "pricing": "Fixed"}
    ]
  }'
```

3. **Verify the response**:
```json
{
  "status": "success",
  "message": "Business configuration stored successfully",
  "configId": "floworx_789a5f",
  "domain": "thehottubman.ca"
}
```

### Test 2: Email Processing Flow

1. **Send a test email** to your configured Gmail account
2. **Check the workflow execution** in n8n
3. **Verify the classification** and response generation
4. **Check the analytics logging**

---

## 🔍 Workflow Node Details

### Phase 1: Onboarding Integration Flow

#### 1. Webhook → Onboarding Intake
- **Purpose**: Receives onboarding data from Floworx UI
- **Method**: POST
- **Path**: `/webhook/onboarding-intake`
- **Response**: Success confirmation with config ID

#### 2. HTTP Request Nodes (3x)
- **Fetch Label Schema**: Loads industry-specific label definitions
- **Fetch Classifier Behavior**: Loads AI classification rules
- **Fetch Responder Behavior**: Loads AI response generation rules

#### 3. Format Profile
- **Purpose**: Cleans and structures incoming profile data
- **Output**: Standardized profile, team, and services objects

#### 4. Build Unified Config JSON
- **Purpose**: Merges all JSONs into a single configuration
- **Logic**: Combines profile data with industry templates
- **Output**: Complete business configuration

#### 5. Validate Config Schema
- **Purpose**: Ensures all required fields are present
- **Validation**: Checks profile, classifier, responder, and labels
- **Error Handling**: Throws descriptive errors for missing fields

#### 6. Store Business Config
- **Purpose**: Persists configuration to backend API
- **Method**: POST to `/business-configs`
- **Response**: Configuration ID for future reference

#### 7. Return Success Response
- **Purpose**: Confirms successful configuration storage
- **Response**: Status, message, and configuration ID

### Phase 2: Runtime Email Processing Flow

#### 1. Gmail Trigger: New Email
- **Purpose**: Monitors Gmail for new emails
- **Trigger**: New message in INBOX
- **Output**: Full email metadata and body

#### 2. Fetch Business Config
- **Purpose**: Retrieves business configuration by domain
- **Method**: GET from `/business-configs?domain=...`
- **Output**: Complete business configuration

#### 3. AI Master Classifier
- **Purpose**: Classifies incoming emails using AI
- **Model**: GPT-4o-mini
- **Output**: Category, confidence, and extracted entities

#### 4. AI Draft Generator
- **Purpose**: Generates professional email responses
- **Model**: GPT-4o-mini
- **Output**: Draft reply text with tone and confidence

#### 5. Gmail Action Decision
- **Purpose**: Determines whether to send, draft, or route to human
- **Logic**: Based on confidence and AI reply permissions
- **Output**: Action type and reply content

#### 6. Gmail Actions (2x)
- **Gmail Send Reply**: Sends high-confidence replies automatically
- **Gmail Create Draft**: Creates drafts for human review

#### 7. Analytics Logging
- **Purpose**: Logs classification and response statistics
- **Method**: POST to `/analytics/log`
- **Data**: Thread ID, classification, confidence, processing time

---

## 🚨 Troubleshooting

### Common Issues

#### 1. LangChain Nodes Not Working
**Problem**: AI classification/response generation fails
**Solution**: 
- Verify OpenAI API key is valid
- Check model availability (gpt-4o-mini)
- Ensure sufficient API credits

#### 2. Gmail Integration Issues
**Problem**: Gmail trigger not firing
**Solution**:
- Re-authenticate Gmail account
- Check Gmail API permissions
- Verify webhook configuration

#### 3. HTTP Request Failures
**Problem**: API calls to backend failing
**Solution**:
- Verify API endpoints are accessible
- Check authentication headers
- Test endpoints independently

#### 4. Data Format Issues
**Problem**: JSON parsing errors
**Solution**:
- Validate input data structure
- Check JavaScript code syntax
- Use n8n's built-in data validation

### Debug Mode

Enable debug mode in n8n to see detailed execution logs:

1. **Go to Settings** → **Workflow Settings**
2. **Enable "Save execution progress"**
3. **Set log level to "debug"**
4. **Run workflow and check execution details**

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Classification Accuracy**
   - Primary category accuracy
   - Confidence score distribution
   - False positive/negative rates

2. **Response Quality**
   - AI reply success rate
   - Human override frequency
   - Customer satisfaction scores

3. **Performance Metrics**
   - Processing time per email
   - API response times
   - Error rates by node

4. **Business Metrics**
   - Emails processed per day
   - Categories distribution
   - Response time improvements

### Dashboard Integration

Connect n8n analytics to your Floworx dashboard:

```javascript
// Example analytics payload
{
  "threadId": "1764b1234567890",
  "businessDomain": "thehottubman.ca",
  "classification": "Support.TechnicalSupport",
  "confidence": 0.92,
  "ai_can_reply": true,
  "response_length": 184,
  "processing_time_ms": 4221,
  "timestamp": "2025-01-05T10:35:00Z"
}
```

---

## 🔄 Maintenance & Updates

### Regular Maintenance Tasks

1. **Monitor API Usage**
   - Track OpenAI API consumption
   - Monitor Gmail API quotas
   - Check backend API performance

2. **Update Industry Templates**
   - Refresh classifier behaviors
   - Update responder templates
   - Add new industry types

3. **Performance Optimization**
   - Optimize JavaScript code
   - Reduce API call frequency
   - Implement caching strategies

4. **Security Updates**
   - Rotate API keys regularly
   - Update authentication tokens
   - Monitor access logs

### Scaling Considerations

1. **Horizontal Scaling**
   - Deploy multiple n8n instances
   - Use load balancers
   - Implement queue systems

2. **Database Optimization**
   - Index business configurations
   - Archive old analytics data
   - Optimize query performance

3. **CDN Integration**
   - Cache industry templates
   - Optimize static asset delivery
   - Implement edge caching

---

## 🎯 Success Criteria

### Technical Success Metrics

- **99.9% Uptime**: Workflow availability
- **<5s Processing Time**: Email classification and response
- **95% Classification Accuracy**: AI category assignment
- **90% AI Reply Success**: Automated response generation

### Business Success Metrics

- **50% Reduction**: Manual email handling time
- **24/7 Availability**: Automated customer support
- **Consistent Quality**: Professional response tone
- **Scalable Growth**: Support unlimited business types

This implementation guide provides everything needed to deploy and maintain the Floworx multi-business AI email automation system! 🚀

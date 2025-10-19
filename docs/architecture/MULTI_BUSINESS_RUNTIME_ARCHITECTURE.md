# 🧱 Floworx Multi-Business Runtime Architecture

## 🎯 What This Export Represents

The `floworx-multi-business-n8n-workflow.json` is the **production-ready runtime flow** that:

* **Monitors Gmail/Outlook** - Triggers on new emails
* **Runs the Classifier** - AI-powered email categorization
* **Adds Labels Dynamically** - Gmail/Outlook folder management
* **Drafts Context-Aware AI Responses** - Industry-specific tone and content
* **Logs Performance & Metrics** - Analytics and monitoring
* **Stores Drafts + Analytics** - MySQL persistence

In short — it's the **"brains"** that executes everything the onboarding JSONs built.

---

## 🧩 Multi-Business Architecture Layers

Here's how the export connects to the multi-business architecture:

| Layer | Example JSON | Role in the System |
|-------|-------------|-------------------|
| **1. Onboarding JSON** | `businessProfile.json` | Defines business metadata, managers, suppliers, tone, and CRM |
| **2. Label Schema JSON** | `labels.json` | Defines Gmail labels/folders and mapping keys |
| **3. Classifier Behavior JSON** | `classifier.json` | AI instruction set for routing and categorization |
| **4. Response Behavior JSON** | `responder.json` | Defines tone, rules, pricing, and style |
| **5. Runtime Workflow (this export)** | `n8n_workflow.json` | Consumes all above JSONs dynamically |

---

## ⚙️ Dynamic Configuration Loading

### At Runtime:

1. **The workflow dynamically loads the correct config** (based on `businessDomain` or `category`)
2. **It injects that configuration into**:
   - **LangChain Classifier Node** (for prompt context)
   - **Responder Node** (for tone, prices, upsell rules)
   - **Label Map Node** (for correct Gmail label IDs)

### Example Dynamic Loading:

```javascript
// In the "Fetch Business Config" node
const domain = $json.to.split('@')[1]; // Extract domain from email
const config = await $http.get(`https://api.floworx.ai/business-configs?domain=${domain}`);

return {
  json: {
    ...$json, // Original email data
    config: config.data // Injected business configuration
  }
};
```

---

## 🧠 Dynamic Substitution Per Business

When this same workflow runs for different businesses:

### The Hot Tub Man Ltd (Pools & Spas)
```json
{
  "config": {
    "businessType": "Pools & Spas",
    "profile": {
      "businessName": "The Hot Tub Man Ltd",
      "emailDomain": "thehottubman.ca"
    },
    "classifierBehavior": {
      "categories": {
        "Support": ["Technical Support", "Appointment Scheduling"],
        "Sales": ["New Installations", "Service Agreements"]
      },
      "urgent_keywords": ["pump not working", "chemical imbalance", "green water"]
    },
    "responderBehavior": {
      "toneProfile": {
        "default": "Professional and friendly",
        "urgent": "Concise, direct, and reassuring"
      }
    },
    "labels": {
      "labels": [
        {
          "name": "SUPPORT",
          "intent": "ai.support_ticket",
          "color": {"backgroundColor": "#4285f4", "textColor": "#ffffff"}
        }
      ]
    }
  }
}
```

### GreenLeaf Roofing (Roofing Contractor)
```json
{
  "config": {
    "businessType": "Roofing Contractor",
    "profile": {
      "businessName": "GreenLeaf Roofing",
      "emailDomain": "greenleafroofing.com"
    },
    "classifierBehavior": {
      "categories": {
        "Support": ["Leak Repairs", "Inspections"],
        "Sales": ["New Installations", "Insurance Claims"]
      },
      "urgent_keywords": ["storm damage", "hail damage", "water damage", "roof collapse"]
    },
    "responderBehavior": {
      "toneProfile": {
        "default": "Reassuring and professional",
        "urgent": "Direct and weather-related"
      }
    },
    "labels": {
      "labels": [
        {
          "name": "INSURANCE",
          "intent": "ai.claim_management",
          "color": {"backgroundColor": "#a479e2", "textColor": "#ffffff"}
        }
      ]
    }
  }
}
```

---

## 🧮 Why This Is the "Final Export"

This is the **compiled runtime layer**, containing:

* **All routing logic** - Email flow and decision trees
* **Label mapping** - Gmail/Outlook folder management
* **Draft + analytics tracking** - Performance monitoring
* **AI inference wiring** - LangChain integration
* **Gmail automation** - Send/draft/reply logic

Each new business onboarding just injects:
* `labels.json`
* `classifier.json`
* `responder.json`
* `profile.json`

into this same workflow's environment (via Data Store or API call).

---

## 🔧 Dynamic Configuration Implementation

### 1. Enhanced "Fetch Business Config" Node

```javascript
// Extract business domain from email
const emailTo = $json.to || $json['Gmail Trigger: New Email'].to;
const domain = emailTo.split('@')[1];

// Fetch business configuration
const configResponse = await $http.get(`https://api.floworx.ai/business-configs?domain=${domain}`);

if (!configResponse.data) {
  throw new Error(`No configuration found for domain: ${domain}`);
}

return {
  json: {
    ...$json, // Original email data
    businessDomain: domain,
    config: configResponse.data // Complete business configuration
  }
};
```

### 2. Dynamic AI Classifier Node

```javascript
// System message with dynamic business context
const systemMessage = `You are an expert email classification agent for ${$json.config.profile.businessName}, a ${$json.config.businessType} company.

Analyze the incoming email and classify it according to these categories:
${JSON.stringify($json.config.classifierBehavior.categories)}

Urgent keywords for this business:
${$json.config.classifierBehavior.urgent_keywords.join(', ')}

Output a JSON with:
- summary: One-line summary of email purpose
- primary_category: Main category
- secondary_category: Subcategory or null
- confidence: Float 0.0-1.0
- ai_can_reply: Boolean
- entities: Extracted contact info, service details, etc.`;

return {
  json: {
    ...$json,
    systemMessage,
    userMessage: `Email Subject: ${$json.subject}\nEmail Body: ${$json.body}\nFrom: ${$json.from}\nTo: ${$json.to}`
  }
};
```

### 3. Dynamic AI Response Generator Node

```javascript
// System message with dynamic business context
const systemMessage = `You are ${$json.config.profile.businessName}'s AI assistant. Generate a professional email response based on:

Business Context:
- Company: ${$json.config.profile.businessName}
- Industry: ${$json.config.businessType}
- Timezone: ${$json.config.profile.timezone}
- Currency: ${$json.config.profile.currency}

Tone Profile:
${JSON.stringify($json.config.responderBehavior.toneProfile)}

Classification:
- Category: ${$json.primary_category}
- Subcategory: ${$json.secondary_category}
- Confidence: ${$json.confidence}

Generate a response that:
1. Acknowledges the customer's concern
2. Provides helpful information
3. Offers next steps
4. Maintains professional tone
5. Includes appropriate signature`;

return {
  json: {
    ...$json,
    systemMessage,
    userMessage: `Original Email: ${$json.body}\nClassification: ${$json.primary_category} - ${$json.secondary_category}\nConfidence: ${$json.confidence}`
  }
};
```

### 4. Dynamic Label Mapping Node

```javascript
// Map classification to Gmail labels
const classification = `${$json.primary_category}.${$json.secondary_category}`;
const labelMap = $json.config.labels.labels;

// Find matching label
const matchingLabel = labelMap.find(label => 
  label.intent === $json.primary_category || 
  label.name === $json.primary_category
);

if (matchingLabel) {
  return {
    json: {
      ...$json,
      labelId: matchingLabel.id,
      labelName: matchingLabel.name,
      labelColor: matchingLabel.color
    }
  };
} else {
  // Default to MISC label
  const miscLabel = labelMap.find(label => label.name === 'MISC');
  return {
    json: {
      ...$json,
      labelId: miscLabel?.id || 'MISC',
      labelName: miscLabel?.name || 'MISC',
      labelColor: miscLabel?.color || { backgroundColor: '#808080', textColor: '#ffffff' }
    }
  };
}
```

---

## 🚀 Multi-Business Deployment Strategy

### 1. Single Workflow, Multiple Configs

```bash
# One n8n workflow file
floworx-multi-business-n8n-workflow.json

# Multiple business configurations
api.floworx.ai/business-configs?domain=thehottubman.ca
api.floworx.ai/business-configs?domain=greenleafroofing.com
api.floworx.ai/business-configs?domain=premiumhvac.com
api.floworx.ai/business-configs?domain=elitelandscaping.com
```

### 2. Dynamic Template Loading

```bash
# Industry-specific templates loaded dynamically
cdn.floworx.ai/schemas/Pools & Spas/labelSchema.json
cdn.floworx.ai/schemas/Roofing Contractor/labelSchema.json
cdn.floworx.ai/schemas/HVAC/labelSchema.json
cdn.floworx.ai/schemas/Landscaping/labelSchema.json
```

### 3. Runtime Configuration Injection

```javascript
// Each email triggers the same workflow
// But with different business configuration
const businessConfig = await loadBusinessConfig(emailDomain);
const classification = await classifyEmail(email, businessConfig);
const response = await generateResponse(classification, businessConfig);
```

---

## 📊 Performance & Scalability Benefits

### 1. **Single Workflow Maintenance**
- One n8n workflow to maintain
- Updates apply to all businesses
- Consistent behavior across industries

### 2. **Dynamic Configuration**
- No hardcoded business logic
- Easy to add new industries
- Flexible configuration updates

### 3. **Scalable Architecture**
- Horizontal scaling across n8n instances
- CDN-hosted industry templates
- Database-backed configuration storage

### 4. **Cost Efficiency**
- Shared AI processing logic
- Reusable workflow components
- Optimized resource utilization

---

## 🎯 Final Implementation Summary

### ✅ What We Have:
- **Production-ready n8n workflow** (`floworx-multi-business-n8n-workflow.json`)
- **10 industry behavior JSONs** with tailored intelligence
- **Dynamic configuration loading** system
- **Multi-business architecture** blueprint

### ✅ What This Enables:
- **One workflow powers all industries**
- **Dynamic business configuration** injection
- **Industry-specific AI behavior** adaptation
- **Scalable multi-tenant deployment**

### ✅ Next Steps:
1. **Deploy the workflow** to n8n
2. **Implement backend API** for config storage
3. **Test with multiple business types**
4. **Scale to production** across industries

This architecture makes Floworx truly **multi-business adaptable** - one workflow, unlimited industries, dynamic intelligence! 🚀🧠

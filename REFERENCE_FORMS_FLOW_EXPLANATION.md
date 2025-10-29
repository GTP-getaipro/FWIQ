# 📋 Reference Forms - Complete Usage Flow

## 🎯 How Your Form Links Get Used

When you enter reference forms like:
```
- swim-spas → https://www.thehottubman.ca/swim-spas
- Repair Request → https://www.thehottubman.ca/repairs  
- Product Information → https://www.thehottubman.ca/hot-tub-spas
- Hot Tub Covers → https://www.thehottubman.ca/grand-opening-1
```

Here's the complete journey:

---

## 📊 Data Flow (Step by Step)

### Step 1: **User Input** (Onboarding UI)
**Page:** Business Information Setup

**What you enter:**
```javascript
[
  { label: "swim-spas", url: "https://www.thehottubman.ca/swim-spas" },
  { label: "Repair Request", url: "https://www.thehottubman.ca/repairs" },
  { label: "Product Information", url: "https://www.thehottubman.ca/hot-tub-spas" }
]
```

---

### Step 2: **Storage** (Database)
**Table:** `profiles.client_config`

**Stored as:**
```json
{
  "contact": {
    "formLinks": [
      { "label": "swim-spas", "url": "https://www.thehottubman.ca/swim-spas" },
      { "label": "Repair Request", "url": "https://www.thehottubman.ca/repairs" },
      { "label": "Product Information", "url": "https://www.thehottubman.ca/hot-tub-spas" }
    ]
  }
}
```

**File:** `src/pages/onboarding/StepBusinessInformation.jsx:628`
```javascript
contact: {
  formLinks: formLinks.filter(link => 
    link.label.trim() !== '' && link.url.trim() !== ''
  )
}
```

---

### Step 3: **Template Injection** (N8N Deployment)
**Function:** `injectOnboardingData()`

**What happens:**
1. Forms are extracted from `client_config`
2. Converted to AI-readable format
3. Injected into "AI Draft Reply Agent" system message

**Example Injection:**
```javascript
// From your forms:
const repairLink = "https://www.thehottubman.ca/repairs";
const productLink = "https://www.thehottubman.ca/hot-tub-spas";
const coverLink = "https://www.thehottubman.ca/grand-opening-1";

// Injected into AI prompt as:
3. **Clear next step / call to action:**
   - Schedule a service call → ${repairLink}
   - Browse new equipment → ${productLink}
   - Order covers → ${coverLink}
```

---

### Step 4: **AI Decision Making** (Runtime)
**Node:** "AI Draft Reply Agent"

**When a customer email arrives, the AI:**

1. **Analyzes the inquiry type:**
   ```
   Email: "My hot tub heater isn't working, can you help?"
   AI Classifies as: Support > TechnicalSupport
   ```

2. **Checks the system message for relevant forms:**
   ```
   "For service/repair inquiries, use: https://www.thehottubman.ca/repairs"
   ```

3. **Includes the form link in reply:**
   ```
   "Hi Sarah,
   
   I can definitely help with your heater issue. The best next step 
   is to book a service call so our technician can diagnose the problem.
   
   Please fill out our quick service form here:
   https://www.thehottubman.ca/repairs
   
   Thanks!
   The Hot Tub Man Team"
   ```

---

## 🧠 AI Form Link Selection Logic

The AI matches **inquiry types** to **form links** based on:

### Service/Repair Requests:
**Trigger Words:** broken, not working, repair, troubleshoot, fix, service, appointment  
**AI Uses:** "Repair Request" or "Service Request" form

**Example:**
```
Customer: "Jets aren't working"
AI Reply includes: https://www.thehottubman.ca/repairs
```

---

### Product/Sales Inquiries:
**Trigger Words:** buy, purchase, price, quote, new hot tub, shopping, models  
**AI Uses:** "Product Information" or custom product forms

**Example:**
```
Customer: "Looking to buy a new hot tub"
AI Reply includes: https://www.thehottubman.ca/hot-tub-spas
```

---

### Parts/Accessories:
**Trigger Words:** parts, covers, supplies, accessories, chemicals, filters  
**AI Uses:** "Supplies and accessories" or related forms

**Example:**
```
Customer: "Do you have hot tub covers?"
AI Reply includes: https://www.thehottubman.ca/grand-opening-1
```

---

### Contact/General:
**Trigger Words:** contact, question, inquiry, general, information  
**AI Uses:** "Contact Form"

**Example:**
```
Customer: "I have a general question"
AI Reply includes: https://www.thehottubman.ca/contact-us
```

---

## 🔍 Where Forms Appear in AI Prompt

**Current System Message (Line 223-229):**
```markdown
## Draft the Reply in Four Parts:
3. **Clear next step / call to action**
   - Schedule a service call → [YOUR REPAIR FORM]
   - Order chemicals/parts online → [YOUR PARTS FORM]
   - Browse new spas → [YOUR PRODUCT FORM]
```

**Your Actual Forms Get Injected As:**
```markdown
3. **Clear next step / call to action**
   - Schedule a service call → https://www.thehottubman.ca/repairs
   - Order products → https://www.thehottubman.ca/hot-tub-spas
   - Order covers → https://www.thehottubman.ca/grand-opening-1
   - Browse treatment packages → https://www.thehottubman.ca/treatment-packages
   - View supplies → https://www.thehottubman.ca/category/all-products
   - Read our blog → https://www.thehottubman.ca/free-chemical-treatment-guide
   - Contact us → https://www.thehottubman.ca/contact-us
```

---

## 📋 Form Link Mapping Strategy

**Current Hardcoded Links in AI Prompt:**
```javascript
// Lines 227-229 in hotTubManAIDraftAgentSystemMessage.js
- Schedule a service call → <https://www.thehottubman.ca/repairs>
- Order chemicals/parts online → <https://www.thehottubman.ca>
- Browse new spas → <https://www.thehottubman.ca/hot-tub-spas>

// Lines 336-339 (Additional Context section)
- Website ordering link: <https://www.thehottubman.ca>
- Spas page: <https://www.thehottubman.ca/hot-tub-spas>
- Service-call booking form: <https://www.thehottubman.ca/repairs>
- Treatment packages: <https://www.thehottubman.ca/treatment-packages>
- Supplies & accessories: <https://www.thehottubman.ca/category/all-products>
```

**Your Custom Links (From Form Input) Should Replace These!**

---

## ✅ What's Working

1. ✅ Forms are **stored** in database (`profiles.client_config.contact.formLinks`)
2. ✅ Forms are **loaded** during onboarding
3. ✅ AI **knows** to include form links in replies

---

## ⚠️ What's NOT Working (Current Gap)

The form links you enter in the UI are **NOT being injected** into the AI system message!

**Why:**
The `injectOnboardingData()` function currently uses **hardcoded URLs** instead of your custom form links.

**Evidence:**
Looking at your deployed workflow, it still has hardcoded links like:
```
https://example.com/repairs  // ← Generic placeholder!
```

---

## 🔧 Fix Needed

We need to:
1. Extract `formLinks` from `client_config`
2. Map them to inquiry types
3. Inject into AI prompt template

**Current Code (needs fix):**
```javascript
// supabase/functions/deploy-n8n/index.ts
// Currently NOT using formLinks from client_config

// Should be:
const formLinks = profile.client_config?.contact?.formLinks || [];
const callToActions = buildCallToActions(formLinks);
// Then inject callToActions into AI prompt
```

---

## 🎯 How Forms SHOULD Be Used

### Input (What You Enter):
```
[
  { label: "Repair Request", url: "https://www.thehottubman.ca/repairs" },
  { label: "Product Information", url: "https://www.thehottubman.ca/hot-tub-spas" },
  { label: "Hot Tub Covers", url: "https://www.thehottubman.ca/grand-opening-1" }
]
```

### Output (In AI Prompt):
```markdown
3. **Clear next step / call to action:**
   - Schedule a service call → https://www.thehottubman.ca/repairs
   - Browse new hot tubs → https://www.thehottubman.ca/hot-tub-spas
   - Order covers → https://www.thehottubman.ca/grand-opening-1
```

### AI Response (What Customer Sees):
```
Hi Sarah,

I can help you with that hot tub cover! We have several options available.

You can browse our full selection here:
https://www.thehottubman.ca/grand-opening-1

Or give us a call at (403) 550-5140 and we can help you find the perfect fit!

Thanks,
The Hot Tub Man Team
```

---

## 🔨 Quick Fix Implementation

I'll update the deployment function to properly use your custom form links!

**Status:** Currently using hardcoded links  
**Fix:** Extract and inject your custom links  
**Time:** 30 minutes

---

## 💡 Why This Feature Matters

### Without Custom Forms:
- AI sends generic links
- Customers land on wrong pages
- Conversion rate lower

### With Custom Forms:
- AI sends exact form for inquiry type
- Customers land on perfect page
- Higher conversion rate
- Better UX

---

## 📈 Use Cases

**Your Current Forms:**
1. **swim-spas** → Product browsing
2. **Repair Request** → Service booking
3. **Product Information** → General products
4. **treatment-packages** → Upsell opportunity
5. **Hot Tub Covers** → Specific product
6. **Supplies and accessories** → Parts ordering
7. **blog** → Educational content
8. **Contact Form** → General inquiries

**AI Will Use These When:**
- Customer asks about swim spas → swim-spas link
- Customer needs repair → Repair Request link
- Customer wants products → Product Information link
- Customer mentions covers → Hot Tub Covers link
- etc.

---

## ✅ Summary

**Current Status:**
- ✅ Forms stored in database
- ✅ Forms load in UI
- ❌ Forms NOT injected into AI prompt (using hardcoded URLs)

**Next Step:**
- 🔧 Update `injectOnboardingData()` to use custom form links
- 🔧 Map form labels to inquiry types
- 🔧 Redeploy workflow with custom links

**This will ensure the AI directs customers to YOUR specific pages!** 🎯


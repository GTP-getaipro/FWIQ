/**
 * ENHANCED DYNAMIC CLASSIFIER GENERATOR
 * 
 * This creates a comprehensive, business-specific classifier system message that matches
 * the quality and detail level of the current Hot Tub Man Ltd. classifier but dynamically
 * generates for all 12 supported business types.
 * 
 * Features:
 * - Business-specific tertiary categories (e-Transfer, Receipts)
 * - Dynamic manager/supplier injection with role-based keywords
 * - Industry-specific keywords and examples
 * - Business-specific support categories
 * - Comprehensive category descriptions
 * - Form submission override logic
 * - Manager-specific routing by name and role
 */

import { buildManagerInfoForAI, buildSupplierInfoForAI } from '@/constants/managerRoles.js';

// Business-specific tertiary customizations for all 12 business types
const BUSINESS_TERTIARY_CUSTOMIZATIONS = {
  "Electrician": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to suppliers/contractors",
        keywords: ["sent", "outgoing", "payment sent", "contractor payment", "material payment"],
        aiContext: "Outgoing e-transfers for electrical suppliers, contractors, and material vendors"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "service payment", "electrical work"],
        aiContext: "Incoming e-transfers from customers for electrical services and repairs"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for electrical services",
        keywords: ["payment received", "service payment", "customer payment", "electrical work"],
        aiContext: "Receipts for electrical service payments received from customers"
      },
      "Payment Sent": {
        description: "Supplier and material payment receipts",
        keywords: ["payment sent", "material payment", "supplier payment", "contractor payment"],
        aiContext: "Receipts for payments sent to electrical suppliers and material vendors"
      }
    }
  },

  "Flooring": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to flooring suppliers",
        keywords: ["sent", "outgoing", "payment sent", "flooring supplier", "material payment"],
        aiContext: "Outgoing e-transfers for flooring materials, tools, and supplier payments"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "flooring service", "installation payment"],
        aiContext: "Incoming e-transfers from customers for flooring installation and services"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for flooring services",
        keywords: ["payment received", "flooring payment", "installation payment", "customer payment"],
        aiContext: "Receipts for flooring service payments received from customers"
      },
      "Payment Sent": {
        description: "Flooring material and supplier payment receipts",
        keywords: ["payment sent", "material payment", "flooring supplier", "tool payment"],
        aiContext: "Receipts for payments sent to flooring suppliers and material vendors"
      }
    }
  },

  "General Construction": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to subcontractors and suppliers",
        keywords: ["sent", "outgoing", "payment sent", "subcontractor payment", "material payment"],
        aiContext: "Outgoing e-transfers for subcontractors, suppliers, and construction materials"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "construction payment", "renovation payment"],
        aiContext: "Incoming e-transfers from customers for construction and renovation projects"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for construction services",
        keywords: ["payment received", "construction payment", "renovation payment", "customer payment"],
        aiContext: "Receipts for construction service payments received from customers"
      },
      "Payment Sent": {
        description: "Subcontractor and supplier payment receipts",
        keywords: ["payment sent", "subcontractor payment", "supplier payment", "material payment"],
        aiContext: "Receipts for payments sent to subcontractors and construction suppliers"
      }
    }
  },

  "HVAC": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to HVAC suppliers",
        keywords: ["sent", "outgoing", "payment sent", "hvac supplier", "equipment payment"],
        aiContext: "Outgoing e-transfers for HVAC equipment, parts, and supplier payments"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "hvac service", "heating cooling payment"],
        aiContext: "Incoming e-transfers from customers for HVAC services and maintenance"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for HVAC services",
        keywords: ["payment received", "hvac payment", "heating payment", "cooling payment"],
        aiContext: "Receipts for HVAC service payments received from customers"
      },
      "Payment Sent": {
        description: "HVAC equipment and supplier payment receipts",
        keywords: ["payment sent", "equipment payment", "hvac supplier", "part payment"],
        aiContext: "Receipts for payments sent to HVAC suppliers and equipment vendors"
      }
    }
  },

  "Insulation & Foam Spray": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to insulation suppliers",
        keywords: ["sent", "outgoing", "payment sent", "insulation supplier", "foam payment"],
        aiContext: "Outgoing e-transfers for insulation materials, foam supplies, and equipment"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "insulation service", "foam service"],
        aiContext: "Incoming e-transfers from customers for insulation and foam spray services"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for insulation services",
        keywords: ["payment received", "insulation payment", "foam payment", "customer payment"],
        aiContext: "Receipts for insulation service payments received from customers"
      },
      "Payment Sent": {
        description: "Insulation material and supplier payment receipts",
        keywords: ["payment sent", "insulation material", "foam supplier", "equipment payment"],
        aiContext: "Receipts for payments sent to insulation suppliers and material vendors"
      }
    }
  },

  "Landscaping": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to landscaping suppliers",
        keywords: ["sent", "outgoing", "payment sent", "landscaping supplier", "plant payment"],
        aiContext: "Outgoing e-transfers for plants, landscaping materials, and equipment"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "landscaping service", "lawn care payment"],
        aiContext: "Incoming e-transfers from customers for landscaping and lawn care services"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for landscaping services",
        keywords: ["payment received", "landscaping payment", "lawn care payment", "customer payment"],
        aiContext: "Receipts for landscaping service payments received from customers"
      },
      "Payment Sent": {
        description: "Landscaping material and supplier payment receipts",
        keywords: ["payment sent", "plant payment", "landscaping supplier", "equipment payment"],
        aiContext: "Receipts for payments sent to landscaping suppliers and material vendors"
      }
    }
  },

  "Painting": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to painting suppliers",
        keywords: ["sent", "outgoing", "payment sent", "paint supplier", "material payment"],
        aiContext: "Outgoing e-transfers for paint, supplies, and painting equipment"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "painting service", "paint job payment"],
        aiContext: "Incoming e-transfers from customers for painting services and projects"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for painting services",
        keywords: ["payment received", "painting payment", "paint job payment", "customer payment"],
        aiContext: "Receipts for painting service payments received from customers"
      },
      "Payment Sent": {
        description: "Painting material and supplier payment receipts",
        keywords: ["payment sent", "paint payment", "supplier payment", "equipment payment"],
        aiContext: "Receipts for payments sent to painting suppliers and material vendors"
      }
    }
  },

  "Plumber": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to plumbing suppliers",
        keywords: ["sent", "outgoing", "payment sent", "plumbing supplier", "fixture payment"],
        aiContext: "Outgoing e-transfers for plumbing fixtures, parts, and supplier payments"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "plumbing service", "repair payment"],
        aiContext: "Incoming e-transfers from customers for plumbing services and repairs"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for plumbing services",
        keywords: ["payment received", "plumbing payment", "repair payment", "customer payment"],
        aiContext: "Receipts for plumbing service payments received from customers"
      },
      "Payment Sent": {
        description: "Plumbing fixture and supplier payment receipts",
        keywords: ["payment sent", "fixture payment", "plumbing supplier", "part payment"],
        aiContext: "Receipts for payments sent to plumbing suppliers and fixture vendors"
      }
    }
  },

  "Pools": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to pool suppliers",
        keywords: ["sent", "outgoing", "payment sent", "pool supplier", "equipment payment"],
        aiContext: "Outgoing e-transfers for pool equipment, chemicals, and supplier payments"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "pool service", "maintenance payment"],
        aiContext: "Incoming e-transfers from customers for pool services and maintenance"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for pool services",
        keywords: ["payment received", "pool payment", "maintenance payment", "customer payment"],
        aiContext: "Receipts for pool service payments received from customers"
      },
      "Payment Sent": {
        description: "Pool equipment and supplier payment receipts",
        keywords: ["payment sent", "equipment payment", "pool supplier", "chemical payment"],
        aiContext: "Receipts for payments sent to pool suppliers and equipment vendors"
      }
    }
  },

  "Hot tub & Spa": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to spa suppliers",
        keywords: ["sent", "outgoing", "payment sent", "spa supplier", "hot tub supplier"],
        aiContext: "Outgoing e-transfers for spa equipment, chemicals, and supplier payments"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "spa service", "hot tub service"],
        aiContext: "Incoming e-transfers from customers for spa and hot tub services"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for spa services",
        keywords: ["payment received", "spa payment", "hot tub payment", "customer payment"],
        aiContext: "Receipts for spa service payments received from customers"
      },
      "Payment Sent": {
        description: "Spa equipment and supplier payment receipts",
        keywords: ["payment sent", "spa equipment", "hot tub supplier", "chemical payment"],
        aiContext: "Receipts for payments sent to spa suppliers and equipment vendors"
      }
    }
  },

  "Sauna & Icebath": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to sauna suppliers",
        keywords: ["sent", "outgoing", "payment sent", "sauna supplier", "ice bath supplier"],
        aiContext: "Outgoing e-transfers for sauna equipment, heaters, and supplier payments"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "sauna service", "ice bath service"],
        aiContext: "Incoming e-transfers from customers for sauna and ice bath services"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for sauna services",
        keywords: ["payment received", "sauna payment", "ice bath payment", "customer payment"],
        aiContext: "Receipts for sauna service payments received from customers"
      },
      "Payment Sent": {
        description: "Sauna equipment and supplier payment receipts",
        keywords: ["payment sent", "sauna equipment", "heater payment", "ice bath equipment"],
        aiContext: "Receipts for payments sent to sauna suppliers and equipment vendors"
      }
    }
  },

  "Roofing": {
    "e-Transfer": {
      "From Business": {
        description: "Money transfers sent from business account to roofing suppliers",
        keywords: ["sent", "outgoing", "payment sent", "roofing supplier", "material payment"],
        aiContext: "Outgoing e-transfers for roofing materials, shingles, and supplier payments"
      },
      "To Business": {
        description: "Money transfers received by business from customers",
        keywords: ["received", "incoming", "customer payment", "roofing service", "repair payment"],
        aiContext: "Incoming e-transfers from customers for roofing services and repairs"
      }
    },
    "Receipts": {
      "Payment Received": {
        description: "Customer payment receipts for roofing services",
        keywords: ["payment received", "roofing payment", "repair payment", "customer payment"],
        aiContext: "Receipts for roofing service payments received from customers"
      },
      "Payment Sent": {
        description: "Roofing material and supplier payment receipts",
        keywords: ["payment sent", "shingle payment", "roofing supplier", "material payment"],
        aiContext: "Receipts for payments sent to roofing suppliers and material vendors"
      }
    }
  }
};


export class EnhancedDynamicClassifierGenerator {
  constructor(businessType, businessInfo, managers = [], suppliers = [], actualLabels = null, departmentScope = ['all']) {
    this.businessType = businessType;
    this.businessInfo = businessInfo;
    this.managers = managers;
    this.suppliers = suppliers;
    this.actualLabels = actualLabels || {}; // Store actual label IDs for debugging
    this.departmentScope = departmentScope; // Department scope for filtering (e.g., ['sales', 'support'] or ['all'])
  }
  
  generateClassifierSystemMessage() {
    const categoryStructure = this.generateCategoryStructure();
    const businessRules = this.generateBusinessRules();
    const tertiaryRules = this.generateTertiaryRules();
    const managerInfo = this.generateManagerInfo();
    const supplierInfo = this.generateSupplierInfo();
    const labelIdInfo = this.generateLabelIdDocumentation();
    
    return `You are an expert email processing and routing system for "${this.businessInfo.name}".

Your SOLE task is to analyze the provided email (sender, subject, and body) and return a single, well-structured JSON object containing:
A concise summary of the email's purpose.
A precise classification with exactly ONE primary_category.
The most appropriate secondary_category if applicable.
The appropriate tertiary_category for specific banking emails, or null.
All relevant extracted entities (contact name, phone number, order number).
A confidence score between 0.0 and 1.0.
A brief reasoning explaining the classification choice.

### Rules:
If the email is from an external sender, and primary_category is Support or Sales, and confidence is at least 0.75, always set "ai_can_reply": true—including for Support > General complaints, unless the sender is internal or the message is abusive/illegal.
If the sender's email address ends with "@${this.businessInfo.emailDomain}", always set:
"ai_can_reply": false

1. Analyze the entire email context (sender, subject, body).
2. Choose exactly ONE primary_category from the list below.
3. If the primary category has sub-categories, choose the most fitting secondary_category.
4. For banking-related emails, choose the correct tertiary_category.
5. Extract all available entities: contact name, phone number, order/invoice number.
6. Provide a confidence score (0.0 to 1.0) based on your certainty.
7. Provide a brief explanation of your classification reasoning.
8. If a category or subcategory does not apply, return null for those fields.
9. Return ONLY the JSON object below — no additional text.

${categoryStructure}

${tertiaryRules}

${businessRules}
${managerInfo}
${supplierInfo}

${labelIdInfo}

### JSON Output Format:
Return ONLY the following JSON structure. Do not add any other text or explanations.

\`\`\`json
{
  "summary": "A concise, one-sentence summary of the email's purpose.",
  "reasoning": "A brief explanation for the chosen categories.",
  "confidence": 0.9,
  "primary_category": "The chosen primary category",
  "secondary_category": "The chosen secondary category, or null if not applicable.",
  "tertiary_category": "The chosen tertiary category, or null if not applicable.",
  "entities": {
    "contact_name": "Extracted contact name, or null.",
    "email_address": "Extracted email address, or null.",
    "phone_number": "Extracted phone number, or null.",
    "order_number": "Extracted order/invoice number, or null."
  },
  "ai_can_reply": true
}
\`\`\``;
  }
  
  generateCategoryStructure() {
    const categories = this.getBusinessSpecificCategories();
    let structure = '### Categories:\n';
    
    Object.entries(categories).forEach(([categoryName, category]) => {
      structure += `\n**${categoryName}**: ${category.description}\n`;
      
      if (category.examples) {
        structure += `Examples: ${category.examples.join(', ')}\n`;
      }
      
      if (category.keywords) {
        structure += `Keywords: ${category.keywords.join(', ')}\n`;
      }
      
      if (category.secondary) {
        structure += `secondary_category: [${Object.keys(category.secondary).join(', ')}]\n`;
        
        Object.entries(category.secondary).forEach(([subName, subConfig]) => {
          structure += `${subName} - ${subConfig.description}\n`;
          if (subConfig.keywords) {
            structure += `Keywords: ${subConfig.keywords.join(', ')}\n`;
          }
          if (subConfig.examples) {
            structure += `Examples: ${subConfig.examples.join(', ')}\n`;
          }
        });
      }
    });
    
    return structure;
  }
  
  generateBusinessRules() {
    const rules = this.getBusinessSpecificRules();
    let ruleText = '### Business-Specific Rules:\n';
    
    rules.forEach(rule => {
      ruleText += `${rule}\n`;
    });
    
    return ruleText;
  }
  
  generateTertiaryRules() {
    const tertiary = this.getBusinessSpecificTertiary();
    let ruleText = '### Tertiary Category Rules:\n';
    
    Object.entries(tertiary).forEach(([category, rules]) => {
      ruleText += `\n**${category}**:\n`;
      Object.entries(rules).forEach(([ruleName, ruleDesc]) => {
        ruleText += `${ruleName} - ${ruleDesc}\n`;
      });
    });
    
    return ruleText;
  }
  
  getBusinessSpecificCategories() {
    // Return only base categories - no business-specific customizations
    // Keeping it generic and consistent across all business types
    return this.getBaseCategories();
  }
  
  getBaseCategories() {
    return {
      "Phone": {
        description: "Only emails from phone/SMS/voicemail providers (e.g., service@ringcentral.com) should be tagged PHONE.",
        keywords: ["voicemail", "voice message", "missed call", "SMS", "text message", "RingCentral", "caller ID", "message transcript", "new message", "call recording", "callback number", "you have a new text", "you have a new voicemail"],
        examples: ["You have a new voice message from (403) 123-4567.", "New SMS received from customer.", "Missed call alert."],
        secondary: {
          "Phone": {
            description: "All emails originating specifically from service@ringcentral.com",
            keywords: ["service@ringcentral.com", "RingCentral", "voicemail", "SMS", "missed call"]
          }
        }
      },
      
      "Promo": {
        description: "Marketing, discounts, sales flyers.",
        keywords: ["marketing", "discount", "sale", "promotion", "offer", "deal", "bundle", "referral", "rewards"],
        examples: ["Save 25% this weekend only!", "Refer a friend and earn rewards", "Bundle deal on accessories", "Exclusive vendor promotion"],
        secondary: {
          "Promo": {
            description: "Marketing campaigns, discount announcements, referral programs, or seasonal events"
          }
        }
      },
      
      "Socialmedia": {
        description: "Emails related to social media platforms like Facebook, Instagram, TikTok, YouTube, or Google.",
        keywords: ["DM", "tagged", "post", "reel", "story", "influencer", "collab", "partnership", "Facebook", "Instagram", "TikTok", "YouTube", "social media"],
        examples: ["You've been tagged in a post", "New DM from customer", "Influencer collaboration request"],
        secondary: {
          "Socialmedia": {
            description: "Engagement alerts, collaboration requests, content inquiries, influencer outreach"
          }
        }
      },
      
      "Sales": {
        description: `Emails from leads or customers expressing interest in purchasing ${this.getBusinessSpecificProduct()}, requesting pricing, or discussing specific models or service packages.`,
        keywords: this.getBusinessSpecificSalesKeywords(),
        examples: this.getBusinessSpecificSalesExamples(),
        secondary: this.generateSalesSecondary()
      },
      
      "Recruitment": {
        description: "Job applications, resumes, interviews.",
        keywords: ["job application", "resume", "cover letter", "interview", "hiring", "candidate", "recruitment", "job opportunity", "position available", "apply", "job posting", "applicant", "interview schedule", "candidate inquiry", "job offer"],
        examples: ["Application for Customer Service Position", "Resume and cover letter for Service Technician role", "Interview schedule confirmation", "Inquiry about open positions"],
        secondary: {
          "Recruitment": {
            description: "Job applications, resumes, cover letters, interview scheduling, candidate inquiries, job offers, and hiring updates"
          }
        }
      },
      
      "GoogleReview": {
        description: "Notifications about new Google Reviews.",
        keywords: ["google review", "review notification", "customer review", "rating", "review left"],
        examples: ["Brenda left a review...", "Rating: ★★★★☆", "Review ID: g123abc456"],
        secondary: {
          "GoogleReview": {
            description: "New Google Reviews with reviewer name, rating, review text, and review ID"
          }
        }
      },
      
      "Urgent": {
        description: `E-mails from alerts@servicetitan.com. Requests a response by a specific date/time (even without using "urgent") Uses phrases like "as soon as possible", "ASAP", "immediately", "today", "noon". Emails emergency-related, or requiring immediate action.`,
        keywords: ["urgent", "emergency", "ASAP", "as soon as possible", "immediately", "critical", "need help now", "high priority", "right away", "problem", "broken", "not working", "serious issue", "can't wait", "urgent matter", "please respond quickly"],
        examples: this.getBusinessSpecificUrgentExamples(),
        secondary: {
          "Urgent": {
            description: "Emergency-related emails requiring immediate action, escalated service issues, last-minute cancellations, equipment failures"
          }
        }
      },
      
      "Misc": {
        description: "Use as a last resort for unclassifiable emails.",
        keywords: ["unclassifiable", "irrelevant", "spam", "unknown"],
        secondary: {
          "Misc": {
            description: "Only return MISC as a last resort if, after exhaustive evaluation of all other categories, the email's content remains fundamentally unclassifiable"
          }
        }
      },
      
      "Manager": {
        description: "Emails that require leadership oversight, involve internal company operations, or are directed at a specific manager.",
        keywords: ["manager", "leadership", "oversight", "internal", "escalation", "strategic", "vendor", "alert"],
        secondary: this.generateManagerSecondary(),
        examples: ["Mail explicitly for Hailey", "Mail explicitly for Jillian", "Internal alerts requiring manager review"]
      },
      
      "FormSub": {
        description: "This category is for automated submissions from your website forms or field service apps.",
        keywords: ["form submission", "website form", "field service", "automated submission"],
        examples: this.getBusinessSpecificFormExamples(),
        secondary: {
          "NewSubmission": {
            description: "Site visitor submissions with contact details and requests"
          },
          "WorkOrderForms": {
            description: "Emails from noreply@reports.connecteam.com containing completed work forms"
          }
        }
      },
      
      "Suppliers": {
        description: "Emails from suppliers and vendors.",
        keywords: ["supplier", "vendor", "order", "delivery", "invoice", "quote"],
        secondary: this.generateSupplierSecondary(),
        examples: this.getBusinessSpecificSupplierExamples()
      },
      
      "Support": {
        description: "Emails from existing customers related to post-sales support.",
        keywords: ["support", "customer service", "help", "assistance", "troubleshooting", "question"],
        secondary: this.generateSupportSecondary(),
        examples: this.getBusinessSpecificSupportExamples()
      },
      
      "Banking": {
        description: "Financial transactions, invoices, payments, and banking communications.",
        keywords: ["banking", "financial", "payment", "invoice", "transfer", "receipt", "refund"],
        secondary: {
          "e-transfer": {
            description: "Interac e-Transfers confirming completed payments either sent or received",
            keywords: ["interac", "e-transfer", "you received", "you sent", "payment received", "funds deposited", "transfer completed", "money sent"]
          },
          "invoice": {
            description: "Emails that include sent or received invoices, typically as part of billing, accounting, or financial tracking",
            keywords: ["invoice", "payment due", "invoice attached", "bill", "amount owing", "statement", "billing", "past due", "balance", "total due", "due date"]
          },
          "bank-alert": {
            description: "Automated security-related messages sent by a bank or financial platform",
            keywords: ["bank alert", "suspicious activity", "login attempt", "password changed", "reset your password", "security alert", "account update", "new sign-in", "verification code", "unauthorized access", "device login", "fraud detection"]
          },
          "refund": {
            description: "Emails indicating that a refund has been issued or received",
            keywords: ["refund issued", "refund processed", "your refund", "money returned", "credit to your account", "refunded", "return processed", "reversed payment", "transaction failed and refunded"]
          },
          "receipts": {
            description: "Emails that prove a payment has already cleared—whether the business paid a vendor or a customer paid us",
            keywords: ["receipt", "order confirmation", "payment summary", "transaction details", "amount paid", "paid with", "you've been charged", "view receipt"]
          }
        }
      }
    };
  }
  
  getBusinessSpecificProduct() {
    const products = {
      "Hot tub & Spa": "hot tubs",
      "Pools": "pools",
      "Sauna & Icebath": "saunas or ice baths",
      "Electrician": "electrical services",
      "HVAC": "HVAC services",
      "Plumber": "plumbing services",
      "Roofing": "roofing services",
      "Painting": "painting services",
      "Flooring": "flooring services",
      "Landscaping": "landscaping services",
      "General Construction": "construction services",
      "Insulation & Foam Spray": "insulation services"
    };
    return products[this.businessType] || "services";
  }
  
  getBusinessSpecificSalesKeywords() {
    const keywords = {
      "Hot tub & Spa": ["hot tub", "spa", "jacuzzi", "whirlpool", "installation", "maintenance", "water care", "winterization"],
      "Pools": ["pool", "swimming pool", "inground", "above ground", "installation", "maintenance", "cleaning", "repair"],
      "Sauna & Icebath": ["sauna", "ice bath", "cold plunge", "infrared", "heater", "chiller", "installation", "repair"],
      "Electrician": ["electrical", "wiring", "panel", "lighting", "outlet", "breaker", "installation", "repair"],
      "HVAC": ["heating", "cooling", "air conditioning", "furnace", "duct", "installation", "maintenance", "repair"],
      "Plumber": ["plumbing", "pipe", "fixture", "water heater", "drain", "installation", "repair", "maintenance"],
      "Roofing": ["roof", "shingle", "gutter", "ventilation", "repair", "replacement", "inspection", "maintenance"],
      "Painting": ["painting", "paint", "color", "interior", "exterior", "surface", "prep", "finish"],
      "Flooring": ["flooring", "hardwood", "tile", "carpet", "installation", "repair", "refinishing", "maintenance"],
      "Landscaping": ["landscaping", "lawn", "garden", "tree", "irrigation", "design", "maintenance", "care"],
      "General Construction": ["construction", "renovation", "remodel", "building", "project", "permit", "contractor"],
      "Insulation & Foam Spray": ["insulation", "foam", "spray", "air sealing", "soundproofing", "energy efficiency", "upgrade"]
    };
    return keywords[this.businessType] || ["service", "installation", "repair", "maintenance"];
  }
  
  getBusinessSpecificSalesExamples() {
    const examples = {
      "Hot tub & Spa": ["New inquiries about hot tubs or installation services", "Replies to promotions where the sender shows purchase intent", "Requests for quotes on spa models", "Conversations about available spa features"],
      "Pools": ["New inquiries about pool installation", "Requests for pool maintenance quotes", "Discussions about pool features and packages", "Follow-up on pool installation inquiries"],
      "Electrician": ["New inquiries about electrical services", "Requests for electrical installation quotes", "Discussions about electrical upgrades", "Follow-up on electrical service inquiries"],
      "HVAC": ["New inquiries about HVAC services", "Requests for heating/cooling quotes", "Discussions about HVAC systems", "Follow-up on HVAC service inquiries"]
    };
    return examples[this.businessType] || ["New inquiries about services", "Requests for quotes", "Follow-up on prior communication"];
  }
  
  getBusinessSpecificUrgentExamples() {
    const examples = {
      "Hot tub & Spa": ["My spa heater isn't heating", "Spa is leaking water", "Control panel won't light up", "Jets aren't working"],
      "Pools": ["Pool pump not working", "Pool is leaking", "Water chemistry is off", "Pool equipment failure"],
      "Electrician": ["Power outage", "Electrical emergency", "Breaker keeps tripping", "No power to outlets"],
      "HVAC": ["No heat", "No cooling", "Furnace not working", "AC unit failure"],
      "Plumber": ["Water leak", "Burst pipe", "No water", "Water heater failure"]
    };
    return examples[this.businessType] || ["Equipment failure", "Service emergency", "Urgent repair needed"];
  }
  
  generateManagerSecondary() {
    const managerSecondary = {};
    
    this.managers.forEach(manager => {
      // ✨ ENHANCED: Include manager email in keywords for better routing
      const keywords = [
        manager.name.toLowerCase(), 
        "manager", 
        "assigned"
      ];
      
      // Add email to keywords if available
      if (manager.email) {
        keywords.push(manager.email.toLowerCase());
      }
      
      managerSecondary[manager.name] = {
        description: `Mail explicitly for ${manager.name}${manager.email ? ` (${manager.email})` : ''}`,
        keywords: keywords.filter(Boolean),
        email: manager.email // ✨ Store for classifier reference
      };
    });
    
    managerSecondary["Unassigned"] = {
      description: "Internal alerts or platform notices requiring manager review without a specific person",
      keywords: ["no-reply@accounts.google.com", "donotreply@auth.atb.com", "verification code", "daily attendance report", "You've invited a new employee", "autobatching failed payments"]
    };
    
    return managerSecondary;
  }
  
  generateSupplierSecondary() {
    const supplierSecondary = {};
    
    this.suppliers.forEach(supplier => {
      // ✨ ENHANCED: Extract domain from email if available
      const domain = supplier.domain || (supplier.email ? '@' + supplier.email.split('@')[1] : null);
      const keywords = [
        supplier.name.toLowerCase(), 
        "supplier", 
        "vendor"
      ];
      
      // Add domain to keywords if available
      if (domain) {
        keywords.push(domain);
        keywords.push(domain.replace('@', '')); // Also add without @
      }
      
      supplierSecondary[supplier.name] = {
        description: `Emails from ${supplier.name}${domain ? ` (${domain})` : ''}`,
        keywords: keywords.filter(Boolean),
        domain: domain // ✨ Store for classifier reference
      };
    });
    
    return supplierSecondary;
  }
  
  generateSupportSecondary() {
    const supportSecondary = {
      "AppointmentScheduling": {
        description: "Booking/rescheduling/canceling visits or service appointments",
        keywords: ["schedule", "book", "appointment", "reschedule", "cancel", "visit", "maintenance", "service"]
      },
      "General": {
        description: "Other support inquiries not fitting above categories",
        keywords: ["general", "inquiry", "question", "help", "assistance", "support"]
      }
    };
    
    // Add business-specific support categories (including business-specific technical support)
    const businessSupport = this.getBusinessSpecificSupportCategories();
    return { ...supportSecondary, ...businessSupport };
  }
  
  generateSalesSecondary() {
    const salesSecondary = {
      "NewInquiry": {
        description: "New customer inquiries and lead generation",
        keywords: ["inquiry", "interested", "quote", "estimate", "price", "cost", "new customer", "lead"]
      },
      "FollowUp": {
        description: "Follow-up on previous sales conversations",
        keywords: ["follow up", "follow-up", "checking", "update", "status", "progress", "next step"]
      },
      "QuoteRequest": {
        description: "Specific requests for quotes and pricing",
        keywords: ["quote", "quotation", "pricing", "estimate", "cost", "price", "budget"]
      }
    };
    
    // Add business-specific sales categories
    const businessSales = this.getBusinessSpecificSalesCategories();
    return { ...salesSecondary, ...businessSales };
  }
  
  getBusinessSpecificSalesCategories() {
    const salesCategories = {
      "Hot tub & Spa": {
        "InstallationInquiry": {
          description: "Inquiries about hot tub/spa installation services",
          keywords: ["installation", "install", "setup", "delivery", "placement", "site preparation"]
        },
        "ModelSelection": {
          description: "Questions about specific hot tub/spa models and features",
          keywords: ["model", "features", "specifications", "size", "capacity", "jets", "heating"]
        },
        "MaintenancePackage": {
          description: "Inquiries about maintenance and service packages",
          keywords: ["maintenance", "service package", "care plan", "winterization", "cleaning"]
        }
      },
      "Pools": {
        "PoolDesign": {
          description: "Inquiries about pool design and construction",
          keywords: ["design", "construction", "inground", "above ground", "size", "shape", "features"]
        },
        "EquipmentSelection": {
          description: "Questions about pool equipment and accessories",
          keywords: ["equipment", "pump", "filter", "heater", "lighting", "accessories", "automation"]
        },
        "InstallationService": {
          description: "Inquiries about pool installation and setup services",
          keywords: ["installation", "install", "setup", "construction", "excavation", "permits"]
        }
      },
      "Electrician": {
        "ServiceUpgrade": {
          description: "Inquiries about electrical service upgrades and panel work",
          keywords: ["service upgrade", "panel upgrade", "electrical service", "main breaker", "capacity"]
        },
        "WiringProject": {
          description: "Questions about wiring projects and electrical installations",
          keywords: ["wiring", "outlets", "switches", "lighting", "electrical work", "installation"]
        },
        "CodeCompliance": {
          description: "Inquiries about electrical code compliance and permits",
          keywords: ["code compliance", "permit", "inspection", "electrical code", "safety"]
        }
      },
      "HVAC": {
        "SystemReplacement": {
          description: "Inquiries about HVAC system replacement and upgrades",
          keywords: ["replacement", "upgrade", "new system", "furnace", "air conditioning", "heat pump"]
        },
        "InstallationService": {
          description: "Questions about HVAC installation and setup services",
          keywords: ["installation", "install", "setup", "ductwork", "ventilation", "zoning"]
        },
        "MaintenancePlan": {
          description: "Inquiries about HVAC maintenance and service plans",
          keywords: ["maintenance", "service plan", "tune-up", "cleaning", "filter replacement"]
        }
      },
      "Plumber": {
        "FixtureInstallation": {
          description: "Inquiries about plumbing fixture installation and replacement",
          keywords: ["fixture", "faucet", "toilet", "sink", "shower", "bathtub", "installation"]
        },
        "WaterHeaterService": {
          description: "Questions about water heater installation and service",
          keywords: ["water heater", "tankless", "installation", "replacement", "maintenance"]
        },
        "PipeWork": {
          description: "Inquiries about pipe installation, repair, and replacement",
          keywords: ["pipe", "plumbing", "repair", "replacement", "installation", "leak"]
        }
      },
      "Roofing": {
        "RoofReplacement": {
          description: "Inquiries about roof replacement and major repairs",
          keywords: ["roof replacement", "new roof", "shingles", "materials", "warranty"]
        },
        "RoofRepair": {
          description: "Questions about roof repairs and maintenance",
          keywords: ["roof repair", "leak", "damage", "patch", "maintenance", "inspection"]
        },
        "GutterService": {
          description: "Inquiries about gutter installation and maintenance",
          keywords: ["gutter", "downspout", "installation", "cleaning", "maintenance", "repair"]
        }
      },
      "Painting": {
        "InteriorPainting": {
          description: "Inquiries about interior painting services",
          keywords: ["interior", "inside", "rooms", "walls", "ceiling", "trim", "color"]
        },
        "ExteriorPainting": {
          description: "Questions about exterior painting and weather protection",
          keywords: ["exterior", "outside", "house", "siding", "trim", "weather", "protection"]
        },
        "ColorConsultation": {
          description: "Inquiries about color selection and design consultation",
          keywords: ["color", "consultation", "design", "selection", "advice", "recommendation"]
        }
      },
      "Flooring": {
        "FloorInstallation": {
          description: "Inquiries about flooring installation and replacement",
          keywords: ["flooring", "installation", "hardwood", "tile", "carpet", "laminate", "vinyl"]
        },
        "FloorRepair": {
          description: "Questions about floor repair and restoration services",
          keywords: ["repair", "restoration", "refinishing", "damage", "refinish", "sand"]
        },
        "MaterialSelection": {
          description: "Inquiries about flooring materials and options",
          keywords: ["materials", "options", "types", "durability", "maintenance", "cost"]
        }
      },
      "Landscaping": {
        "DesignConsultation": {
          description: "Inquiries about landscape design and planning",
          keywords: ["design", "landscape", "planning", "consultation", "garden", "outdoor"]
        },
        "InstallationService": {
          description: "Questions about landscape installation and construction",
          keywords: ["installation", "construction", "planting", "hardscape", "irrigation", "lighting"]
        },
        "MaintenanceService": {
          description: "Inquiries about landscape maintenance and care",
          keywords: ["maintenance", "care", "mowing", "pruning", "fertilizing", "seasonal"]
        }
      },
      "General Construction": {
        "ProjectPlanning": {
          description: "Inquiries about construction project planning and design",
          keywords: ["project", "planning", "design", "blueprint", "permits", "timeline"]
        },
        "RenovationService": {
          description: "Questions about renovation and remodeling services",
          keywords: ["renovation", "remodeling", "renovate", "remodel", "upgrade", "improvement"]
        },
        "NewConstruction": {
          description: "Inquiries about new construction and building services",
          keywords: ["new construction", "building", "custom home", "addition", "extension"]
        }
      },
      "Insulation & Foam Spray": {
        "EnergyAudit": {
          description: "Inquiries about energy audits and efficiency assessments",
          keywords: ["energy audit", "efficiency", "assessment", "evaluation", "savings", "performance"]
        },
        "InsulationInstallation": {
          description: "Questions about insulation installation and upgrades",
          keywords: ["insulation", "installation", "upgrade", "foam", "spray", "batts", "blown"]
        },
        "AirSealing": {
          description: "Inquiries about air sealing and weatherization services",
          keywords: ["air sealing", "weatherization", "draft", "air leak", "caulking", "weatherstrip"]
        }
      },
      "Sauna & Icebath": {
        "SaunaInstallation": {
          description: "Inquiries about sauna installation and setup",
          keywords: ["sauna", "installation", "setup", "infrared", "traditional", "steam"]
        },
        "IceBathInstallation": {
          description: "Questions about ice bath and cold plunge installation",
          keywords: ["ice bath", "cold plunge", "installation", "chiller", "temperature", "plunge"]
        },
        "EquipmentSelection": {
          description: "Inquiries about sauna and ice bath equipment options",
          keywords: ["equipment", "heater", "chiller", "controls", "features", "specifications"]
        }
      }
    };
    
    return salesCategories[this.businessType] || {};
  }
  
  getBusinessSpecificSupportCategories() {
    const supportCategories = {
      "Hot tub & Spa": {
        "WaterCare": {
          description: "Spa water care and chemical balance questions",
          keywords: ["water", "care", "chemicals", "balance", "ph", "maintenance", "treatment"]
        },
        "Winterization": {
          description: "Spa winterization and seasonal maintenance",
          keywords: ["winterization", "winter", "seasonal", "maintenance", "closing", "preparation"]
        },
        "PartsAndChemicals": {
          description: "Orders or inquiries about spa parts, chemicals, and supplies",
          keywords: ["parts", "chemicals", "filter", "order", "price", "stock", "supply", "purchase", "spa chemicals", "hot tub parts"]
        },
        "SpaRepair": {
          description: "Spa equipment repair and troubleshooting",
          keywords: ["repair", "troubleshoot", "jets", "heater", "pump", "filter", "broken", "not working", "error"]
        }
      },
      "Pools": {
        "WaterChemistry": {
          description: "Pool water chemistry and balance",
          keywords: ["water", "chemistry", "balance", "ph", "chemicals", "testing", "treatment"]
        },
        "EquipmentRepair": {
          description: "Pool equipment repair and maintenance",
          keywords: ["equipment", "repair", "maintenance", "pump", "filter", "heater", "cleaning"]
        },
        "PartsAndChemicals": {
          description: "Orders or inquiries about pool parts, chemicals, and supplies",
          keywords: ["parts", "chemicals", "filter", "order", "price", "stock", "supply", "purchase", "pool chemicals", "pool parts"]
        },
        "PoolTroubleshooting": {
          description: "Pool system troubleshooting and repair",
          keywords: ["troubleshoot", "repair", "pump", "filter", "heater", "cleaning system", "broken", "not working"]
        }
      },
      "Electrician": {
        "CodeCompliance": {
          description: "Electrical code questions and compliance issues",
          keywords: ["code", "compliance", "permit", "inspection", "electrical code", "safety"]
        },
        "PanelUpgrades": {
          description: "Electrical panel upgrades and service upgrades",
          keywords: ["panel", "upgrade", "service", "breaker", "electrical panel", "main"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about electrical parts, supplies, and materials",
          keywords: ["parts", "supplies", "materials", "order", "price", "stock", "supply", "purchase", "electrical parts", "wire", "outlets"]
        },
        "ElectricalRepair": {
          description: "Electrical system repair and troubleshooting",
          keywords: ["repair", "troubleshoot", "outlet", "switch", "breaker", "wiring", "circuit", "broken", "not working"]
        }
      },
      "HVAC": {
        "IndoorAirQuality": {
          description: "Indoor air quality testing and improvement",
          keywords: ["air quality", "indoor air", "testing", "allergies", "ventilation", "filtration"]
        },
        "DuctCleaning": {
          description: "Duct cleaning and maintenance services",
          keywords: ["duct", "cleaning", "maintenance", "air ducts", "ventilation", "air flow"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about HVAC parts, supplies, and materials",
          keywords: ["parts", "supplies", "materials", "order", "price", "stock", "supply", "purchase", "hvac parts", "filters", "thermostats"]
        },
        "HVACRepair": {
          description: "HVAC system repair and troubleshooting",
          keywords: ["repair", "troubleshoot", "furnace", "air conditioning", "heat pump", "thermostat", "broken", "not working"]
        }
      },
      "Plumber": {
        "FixtureInstallation": {
          description: "Plumbing fixture installation and replacement",
          keywords: ["fixture", "installation", "replacement", "faucet", "toilet"]
        },
        "PipeInspection": {
          description: "Pipe inspection and maintenance services",
          keywords: ["pipe", "inspection", "maintenance", "camera", "diagnostic"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about plumbing parts, supplies, and materials",
          keywords: ["parts", "supplies", "materials", "order", "price", "stock", "supply", "purchase", "plumbing parts", "pipes", "fittings"]
        },
        "PlumbingRepair": {
          description: "Plumbing system repair and troubleshooting",
          keywords: ["repair", "troubleshoot", "leak", "clog", "drain", "pipe", "faucet", "toilet", "broken", "not working"]
        }
      },
      "Roofing": {
        "RoofInspection": {
          description: "Roof inspection and assessment services",
          keywords: ["inspection", "assessment", "roof", "check", "evaluation"]
        },
        "GutterCleaning": {
          description: "Gutter cleaning and maintenance services",
          keywords: ["gutter", "cleaning", "maintenance", "drainage", "cleaning"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about roofing parts, supplies, and materials",
          keywords: ["parts", "supplies", "materials", "order", "price", "stock", "supply", "purchase", "roofing materials", "shingles", "gutters"]
        },
        "RoofRepair": {
          description: "Roof repair and maintenance services",
          keywords: ["repair", "maintenance", "leak", "damage", "patch", "shingles", "gutter", "broken", "not working"]
        }
      },
      "Painting": {
        "ColorConsultation": {
          description: "Color consultation and paint selection",
          keywords: ["color", "consultation", "selection", "advice", "recommendation"]
        },
        "SurfacePrep": {
          description: "Surface preparation and paint preparation",
          keywords: ["surface", "prep", "preparation", "sanding", "priming"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about painting supplies, materials, and equipment",
          keywords: ["supplies", "materials", "equipment", "order", "price", "stock", "supply", "purchase", "paint", "brushes", "rollers"]
        },
        "PaintIssues": {
          description: "Paint problems and touch-up services",
          keywords: ["touch-up", "repair", "peeling", "cracking", "fading", "stain", "problem", "issue"]
        }
      },
      "Flooring": {
        "FloorRepair": {
          description: "Floor repair and restoration services",
          keywords: ["repair", "fix", "damage", "restoration", "refinishing"]
        },
        "MaterialSelection": {
          description: "Flooring material consultation and selection",
          keywords: ["material", "selection", "consultation", "advice", "recommendation"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about flooring materials, supplies, and tools",
          keywords: ["materials", "supplies", "tools", "order", "price", "stock", "supply", "purchase", "flooring materials", "adhesives", "tools"]
        },
        "FlooringIssues": {
          description: "Flooring problems and maintenance",
          keywords: ["problem", "issue", "damage", "warping", "squeaking", "stain", "scratch", "maintenance"]
        }
      },
      "Landscaping": {
        "GardenDesign": {
          description: "Garden design and landscaping consultation",
          keywords: ["design", "garden", "landscaping", "consultation", "planning"]
        },
        "Irrigation": {
          description: "Irrigation system installation and maintenance",
          keywords: ["irrigation", "sprinkler", "watering", "system", "maintenance"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about landscaping supplies, plants, and equipment",
          keywords: ["supplies", "plants", "equipment", "order", "price", "stock", "supply", "purchase", "landscaping supplies", "seeds", "tools"]
        },
        "LandscapeMaintenance": {
          description: "Landscape maintenance and care issues",
          keywords: ["maintenance", "care", "problem", "issue", "disease", "pest", "watering", "pruning"]
        }
      },
      "General Construction": {
        "ProjectManagement": {
          description: "Construction project management and coordination",
          keywords: ["project", "management", "coordination", "timeline", "schedule"]
        },
        "PermitAssistance": {
          description: "Building permit assistance and documentation",
          keywords: ["permit", "documentation", "approval", "building permit", "inspection"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about construction materials, supplies, and equipment",
          keywords: ["materials", "supplies", "equipment", "order", "price", "stock", "supply", "purchase", "construction materials", "lumber", "tools"]
        },
        "ConstructionIssues": {
          description: "Construction problems and quality issues",
          keywords: ["problem", "issue", "quality", "defect", "repair", "warranty", "damage"]
        }
      },
      "Insulation & Foam Spray": {
        "EnergyEfficiency": {
          description: "Energy efficiency consultation and upgrades",
          keywords: ["energy", "efficiency", "upgrade", "consultation", "savings"]
        },
        "Soundproofing": {
          description: "Soundproofing solutions and installation",
          keywords: ["soundproofing", "noise", "sound", "acoustic", "quiet"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about insulation materials, supplies, and equipment",
          keywords: ["materials", "supplies", "equipment", "order", "price", "stock", "supply", "purchase", "insulation materials", "foam", "equipment"]
        },
        "InsulationIssues": {
          description: "Insulation problems and performance issues",
          keywords: ["problem", "issue", "performance", "efficiency", "draft", "cold", "hot", "repair"]
        }
      },
      "Sauna & Icebath": {
        "HeaterRepair": {
          description: "Sauna heater repair and maintenance",
          keywords: ["heater", "repair", "maintenance", "sauna", "temperature"]
        },
        "ChillerRepair": {
          description: "Ice bath chiller repair and maintenance",
          keywords: ["chiller", "repair", "maintenance", "ice bath", "cold"]
        },
        "PartsAndSupplies": {
          description: "Orders or inquiries about sauna/ice bath parts, supplies, and equipment",
          keywords: ["parts", "supplies", "equipment", "order", "price", "stock", "supply", "purchase", "sauna parts", "ice bath parts", "heaters"]
        },
        "SaunaIceBathIssues": {
          description: "Sauna and ice bath system problems",
          keywords: ["problem", "issue", "temperature", "heater", "chiller", "broken", "not working", "repair"]
        }
      }
    };
    
    return supportCategories[this.businessType] || {};
  }
  
  getBusinessSpecificFormExamples() {
    const examples = {
      "Hot tub & Spa": ["Schedule a Service got a new submission", "Contact us got a new submission", "Hot Tub Treatment Form completed"],
      "Pools": ["Pool Service Request got a new submission", "Pool Maintenance Form completed"],
      "Electrician": ["Electrical Service Request got a new submission", "Electrical Work Form completed"],
      "HVAC": ["HVAC Service Request got a new submission", "HVAC Maintenance Form completed"]
    };
    return examples[this.businessType] || ["Service Request got a new submission", "Work Form completed"];
  }
  
  getBusinessSpecificSupplierExamples() {
    const examples = {
      "Hot tub & Spa": ["Emails from Aqua Spa Pool Supply", "Emails from Strong Spas", "Emails from Paradise Patio Furniture"],
      "Pools": ["Emails from pool suppliers", "Emails from chemical suppliers", "Emails from equipment suppliers"],
      "Electrician": ["Emails from electrical suppliers", "Emails from material suppliers", "Emails from tool suppliers"],
      "HVAC": ["Emails from HVAC suppliers", "Emails from equipment suppliers", "Emails from part suppliers"]
    };
    return examples[this.businessType] || ["Emails from suppliers", "Emails from vendors"];
  }
  
  getBusinessSpecificSupportExamples() {
    const examples = {
      "Hot tub & Spa": ["My jets aren't working, what should I check?", "How do I fix the error code on my display?", "The water isn't heating, can you help me troubleshoot?"],
      "Pools": ["My pool pump isn't working", "Water chemistry is off", "Pool is leaking", "Filter needs replacement"],
      "Electrician": ["My outlets aren't working", "Breaker keeps tripping", "Need help with wiring", "Panel upgrade needed"],
      "HVAC": ["Furnace not heating", "AC unit not cooling", "Duct cleaning needed", "Air quality issues"]
    };
    return examples[this.businessType] || ["Equipment not working", "Need help troubleshooting", "Service request"];
  }
  
  getBusinessSpecificRules() {
    const rules = [
      `If the email confirms a purchase or payment by ${this.businessInfo.name} (or relevant business/person), classify as: "primary_category": "Banking", "secondary_category": "receipts", "tertiary_category": "PaymentSent"`,
      `If the email confirms the business received money (e.g., from a customer): "primary_category": "Banking", "secondary_category": "receipts", "tertiary_category": "PaymentReceived"`,
      `If secondary_category is 'e-transfer', set tertiary_category: [FromBusiness, ToBusiness]`,
      `If secondary_category is 'receipts', set tertiary_category: [PaymentSent, PaymentReceived]`,
      `Form Submission Override: An email that is a form submission MUST BE CLASSIFIED AS URGENT if the "How can we help?" section contains keywords indicating a critical service issue.`,
      `Keywords for urgent form submissions: ${this.getBusinessSpecificUrgentKeywords().join(', ')}`
    ];
    
    return rules;
  }
  
  /**
   * Generate manager information section with role-based keywords
   * Uses the shared managerRoles constants for consistency
   * Automatically filters managers based on department scope
   */
  generateManagerInfo() {
    if (!this.managers || this.managers.length === 0) {
      return '';
    }
    
    try {
      // Pass department scope to filter managers by relevant roles
      return buildManagerInfoForAI(this.managers, this.departmentScope);
    } catch (error) {
      console.error('Error generating manager info for AI:', error);
      // Fallback to simple manager list
      const managerNames = this.managers
        .filter(m => m.name && m.name.trim())
        .map(m => m.name)
        .join(', ');
      
      if (managerNames) {
        return `\n\n### Team Managers:\n${managerNames}\n`;
      }
      return '';
    }
  }
  
  /**
   * Generate supplier information section
   * Uses the shared managerRoles constants for consistency
   */
  generateSupplierInfo() {
    if (!this.suppliers || this.suppliers.length === 0) {
      return '';
    }
    
    try {
      return buildSupplierInfoForAI(this.suppliers);
    } catch (error) {
      console.error('Error generating supplier info for AI:', error);
      // Fallback to simple supplier list
      const supplierNames = this.suppliers
        .filter(s => s.name && s.name.trim())
        .map(s => s.name)
        .join(', ');
      
      if (supplierNames) {
        return `\n\n### Known Suppliers:\n${supplierNames}\n`;
      }
      return '';
    }
  }
  
  getBusinessSpecificUrgentKeywords() {
    const keywords = {
      "Hot tub & Spa": ["broken", "not working", "leaking", "won't start", "no power", "error code", "tripping breaker", "won't heat"],
      "Pools": ["broken", "not working", "leaking", "pump failure", "no power", "water chemistry", "equipment failure"],
      "Electrician": ["broken", "not working", "no power", "tripping breaker", "electrical emergency", "sparking", "fire risk"],
      "HVAC": ["broken", "not working", "no heat", "no cooling", "emergency", "equipment failure", "temperature issue"],
      "Plumber": ["broken", "not working", "leaking", "burst pipe", "no water", "emergency", "water damage"]
    };
    return keywords[this.businessType] || ["broken", "not working", "emergency", "urgent"];
  }
  
  getBusinessSpecificTertiary() {
    const tertiary = {
      "e-transfer": {
        "FromBusiness": `Emails confirming that ${this.businessInfo.name} has sent a payment or successfully transferred funds to a vendor, contractor, or external service provider.`,
        "ToBusiness": `Emails confirming that a payment has been deposited into ${this.businessInfo.name}'s account.`
      },
      "receipts": {
        "PaymentSent": `Email confirming ${this.businessInfo.name} sent a payment`,
        "PaymentReceived": `Email confirming ${this.businessInfo.name} received a payment`
      }
    };
    
    return tertiary;
  }
  
  /**
   * Generate label ID documentation section
   * Shows actual folder IDs for debugging purposes
   * NOTE: This is for documentation only - the workflow uses a separate Label Mapping node
   */
  generateLabelIdDocumentation() {
    // Only include if actualLabels were provided
    if (!this.actualLabels || Object.keys(this.actualLabels).length === 0) {
      return ''; // No label IDs available
    }
    
    let documentation = '\n### Folder Structure (For Reference Only):\n\n';
    documentation += 'NOTE: After you classify the email, the workflow will automatically map your category names to the correct folder IDs below.\n';
    documentation += 'You should ONLY return category names in your JSON response, NOT folder IDs.\n\n';
    
    // Group labels by primary category
    const labelsByCategory = {};
    
    Object.entries(this.actualLabels).forEach(([labelName, labelData]) => {
      const labelId = labelData?.id || labelData; // Handle both {id: "..."} and "..." formats
      
      if (!labelId) return;
      
      // Parse label name to determine category
      const parts = labelName.split('/');
      const primaryCategory = parts[0];
      
      if (!labelsByCategory[primaryCategory]) {
        labelsByCategory[primaryCategory] = [];
      }
      
      labelsByCategory[primaryCategory].push({
        name: labelName,
        id: labelId,
        depth: parts.length
      });
    });
    
    // Generate documentation for each category
    Object.entries(labelsByCategory).forEach(([category, labels]) => {
      // Sort by depth (primary → secondary → tertiary)
      labels.sort((a, b) => a.depth - b.depth);
      
      documentation += `**${category}**:\n`;
      
      labels.forEach(label => {
        const indent = '  '.repeat(label.depth - 1);
        const shortId = label.id.length > 15 ? label.id.substring(0, 12) + '...' : label.id;
        documentation += `${indent}- ${label.name} → ${shortId}\n`;
      });
      
      documentation += '\n';
    });
    
    documentation += 'Remember: Return category names only (e.g., "BANKING", not "Label_123"). The workflow handles ID mapping automatically.\n';
    
    return documentation;
  }
}

// Export the class and customizations for use in other modules
export { BUSINESS_TERTIARY_CUSTOMIZATIONS };

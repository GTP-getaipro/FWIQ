// Comprehensive Label Library for All Business Types
// This library contains descriptions for ALL possible labels/folders that can be created during provisioning

export const labelLibrary = {
  // BANKING Category
  'BANKING': {
    description: 'Financial transactions, invoices, payments, bank alerts, receipts, and money-related communications',
    critical: true,
    subcategories: {
      'e-transfer': {
        description: 'Interac e-Transfers confirming completed payments either sent or received, typically involving banks or payment platforms. These messages are commonly used to track:  Vendor payments  Reimbursements  Fast business-related fund transfers  Message types may include:  "You received an Interac e-Transfer"  "You sent an e-Transfer"  "Funds have been deposited"  "Transfer completed successfully"  Keywords: interac, e-transfer, you received, you sent, payment received, funds deposited, transfer completed, money sent  Classification Guidance:  ✅ Include only if the email confirms that the transfer has been successfully processed  🚫 Exclude pending, failed, or canceled transfers (those may go under bank-alert)',
        keywords: ['interac', 'e-transfer', 'you received', 'you sent', 'payment received', 'funds deposited', 'transfer completed', 'money sent'],
        tertiary: {
          'FromBusiness': 'Emails confirming that {{BUSINESS_NAME}} has sent a payment or successfully transferred funds to a vendor, contractor, or external service provider. These are typically receipts, payment confirmations, or e-Transfer acknowledgments indicating money was sent from the business account.  Examples include: "Transfer from: {{BUSINESS_NAME_UPPER}}" Confirmation of outgoing Interac e-Transfers  Subject lines like: "Funds sent", "Your e-Transfer was successful", "Payment completed"  Body text with phrases like:  "You sent an Interac e-Transfer"  "Funds deposited to the recipient"  "Your payment has been processed"  Keywords: you sent, payment completed, funds deposited to, interac e-transfer sent, transaction receipt, payment confirmation, amount paid, transfer successful, Your transfer to, to recipient  Classification Tip: ✅ Classify as From Business only if the email confirms that {{BUSINESS_NAME}} has sent funds. 🚫 Do not use for notifications of incoming transfers (those go under To Business).',
          'ToBusiness': 'Emails confirming that a payment has been deposited into {{BUSINESS_NAME}}\'s account. These typically come from banks, payment platforms, or customers and indicate successful incoming transfers.  Examples include:  Interac e-Transfer deposit confirmations  Subject lines like: "Funds have been deposited", "You\'ve received money", "Deposit successful"  Body text mentioning:  "You received an Interac e-Transfer"  "Funds have been deposited into your account"  "The payment has been successfully deposited"  Keywords: e-transfer received, funds deposited, you\'ve received, payment received, money has been sent to you, You\'ve received,  deposit completed, interac transfer to {{BUSINESS_NAME}}  Classification Tip: ✅ Only classify as To Business if the message confirms a completed deposit into your account. 🚫 Do not include messages about pending transfers or sent by your business — those should go under from Business.'
        }
      },
      'invoice': {
        description: 'Emails that include sent or received invoices, typically as part of billing, accounting, or financial tracking. These messages often contain:  Attached invoice PDFs  Payment due notices  Invoice confirmations  Billing summaries or reminders  They are key for financial reconciliation, vendor management, and customer billing.  Common elements:  Invoice number (e.g., INV-12345)  Total amount due  Due date or payment terms  Vendor or customer info  Line items or service descriptions  Keywords: invoice, payment due, invoice attached, bill, amount owing, statement, billing, past due, balance, total due, due date  Classification Guidance:  ✅ Include if the email references or attaches a formal invoice document or clearly outlines payment terms  🚫 Exclude if the email simply mentions a payment has been made or received — use payment-confirmation or e-transfer instead Exclude all  invoices with "Re: Your Invoice from {{BUSINESS_NAME}}"',
        keywords: ['invoice', 'payment due', 'invoice attached', 'bill', 'amount owing', 'statement', 'billing', 'past due', 'balance', 'total due', 'due date']
      },
      'bank-alert': {
        description: 'Automated security-related messages sent by a bank or financial platform. They flag events that could affect account safety or require fast action.  Typical alerts  Balance or daily-limit updates  Suspicious-activity or fraud warnings  Password or PIN reset confirmations  New login / new-device sign-ins  2-factor or one-time passcodes (OTP/2FA)  Account-detail changes (e-mail, phone, address)  Trigger keywords (examples) bank alert, suspicious activity, login attempt, password changed, reset your password, security alert, account update, new sign-in, verification code, unauthorized access, device login, fraud detection  Classification rules ✅ Label as BankAlert when the email is an automated, security-focused notification from a bank or financial system. 🚫 Do not use this label for transactional receipts, invoices, or e-transfer notices—those belong in Payment-Confirmation, Invoice, or e-Transfer.',
        keywords: ['bank alert', 'suspicious activity', 'login attempt', 'password changed', 'reset your password', 'security alert', 'account update', 'new sign-in', 'verification code', 'unauthorized access', 'device login', 'fraud detection']
      },
      'refund': {
        description: 'Emails indicating that a refund has been issued or received, usually in response to a returned product, canceled service, or failed payment. These messages confirm that funds have been reversed and returned to the sender or original payment method.  Common refund scenarios include:  Canceled orders or subscriptions  Payment failures followed by refund  Returned merchandise or parts  Duplicate charge corrections  Service billing adjustments  Typical content includes:  "Your refund has been processed"  "We\'ve issued a refund to your card/account"  "Refund confirmation"  Reference or transaction ID  Amount refunded  Payment method used for the refund  Keywords: refund issued, refund processed, your refund, money returned, credit to your account, refunded, return processed, reversed payment, transaction failed and refunded, you\'ll see the funds in',
        keywords: ['refund issued', 'refund processed', 'your refund', 'money returned', 'credit to your account', 'refunded', 'return processed', 'reversed payment', 'transaction failed and refunded', 'you\'ll see the funds in']
      },
      'receipts': {
        description: 'Emails that prove a payment has already cleared—whether {{BUSINESS_NAME}} paid a vendor or a customer paid us. They\'re usually auto-generated by banks, payment platforms, or e-commerce systems and include full transaction details.  Typical contents "Thank you for your purchase / payment"  Order, receipt, or confirmation number (e.g., #452319)  Amount paid and date settled  Payment method (Visa, Interac, PayPal, Stripe, ACH, POS, etc.)  Links or attachments (PDF / HTML receipts)  Common subject-line cues Payment completed · Transaction successful · Order summary · Your payment has been confirmed · Here\'s your receipt  Keywords receipt, order confirmation, payment summary, transaction details, amount paid, paid with, you\'ve been charged, view receipt  Classification guidance ✅ Include when the email confirms a finalized transaction and provides proof of payment. 🚫 Exclude:  Invoices requesting payment (use Invoice category).  Pending, failed, or canceled transfers (use Bank-Alert if security-related).  Interac e-Transfer notices (use E-Transfer sub-labels).',
        keywords: ['receipt', 'order confirmation', 'payment summary', 'transaction details', 'amount paid', 'paid with', 'you\'ve been charged', 'view receipt'],
        tertiary: {
          'PaymentSent': 'Email confirming you sent a payment',
          'PaymentReceived': 'Email confirming you\'ve received a payment'
        }
      }
    }
  },

  // FORMSUB Category
  'FORMSUB': {
    description: 'Website form submissions, contact forms, and online inquiry forms',
    subcategories: {
      'New Submission': {
        description: 'New form submissions from website contact or inquiry forms',
        keywords: ['form submission', 'contact form', 'inquiry form', 'website submission']
      },
      'Work Order Forms': {
        description: 'Work order and service request forms',
        keywords: ['work order', 'service request', 'job form', 'completed form']
      }
    }
  },

  // GOOGLE REVIEW Category
  'GOOGLE REVIEW': {
    description: 'Google Business reviews, review notifications, and review response tracking',
    subcategories: {
      'New Reviews': {
        description: 'New Google review notifications and customer feedback alerts',
        keywords: ['google review', 'new review', 'customer review', 'review notification']
      },
      'Review Responses': {
        description: 'Business responses to reviews and review reply tracking',
        keywords: ['review response', 'reply to review', 'review management']
      }
    }
  },

  // MANAGER Category
  'MANAGER': {
    description: 'Internal management routing and team oversight. Routes emails requiring manager attention, team assignments, or items not yet assigned to a team member.',
    subcategories: {
      'Unassigned': {
        description: 'Emails not yet assigned to any team member. Requires manager review for routing.',
        keywords: ['unassigned', 'no-reply@accounts.google.com', 'donotreply@auth.atb.com', 'verification code', 'daily attendance report', 'You\'ve invited a new employee', 'autobatching failed payments']
      }
    }
  },

  // SALES Category
  'SALES': {
    description: 'Sales inquiries, product sales, consultations, and revenue-generating opportunities',
    subcategories: {
      'New Spa Sales': {
        description: 'New hot tub or spa purchase inquiries, showroom visits, and sales opportunities',
        keywords: ['new spa', 'hot tub purchase', 'showroom visit', 'spa sales', 'buy hot tub']
      },
      'Accessory Sales': {
        description: 'Sales of spa covers, steps, chemicals, filters, and other accessories',
        keywords: ['spa cover', 'accessories', 'chemicals', 'filters', 'spa steps', 'accessory sales']
      },
      'Consultations': {
        description: 'Sales consultations, product demonstrations, and buyer guidance sessions',
        keywords: ['consultation', 'product demo', 'buyer guidance', 'sales meeting']
      },
      'Quote Requests': {
        description: 'Pricing requests, quote follow-ups, and sales estimate inquiries',
        keywords: ['quote', 'pricing', 'estimate', 'cost', 'price request']
      }
    }
  },

  // SUPPLIERS Category
  'SUPPLIERS': {
    description: 'Supplier and vendor communications, orders, invoices, and supply chain management',
    subcategories: {
      // Dynamic supplier names will be injected here
    }
  },

  // SUPPORT Category
  'SUPPORT': {
    description: 'Customer service, technical support, appointments, parts inquiries, and general help requests for existing customers',
    subcategories: {
      'Technical Support': {
        description: 'Technical issues, troubleshooting, error codes, equipment malfunctions, and repair guidance',
        keywords: ['troubleshoot', 'repair', 'issue', 'problem', 'error', 'functional', 'broken', 'diagnostic', 'help', 'technical', 'guide', 'manual']
      },
      'Parts And Chemicals': {
        description: 'Replacement parts inquiries, chemical supply orders, and filtration system questions',
        keywords: ['parts', 'chemicals', 'filter', 'cover', 'accessories', 'order', 'purchase', 'stock', 'supply', 'inquire', 'availability', 'price', 'product', 'recommend']
      },
      'Appointment Scheduling': {
        description: 'Service appointment requests, installation scheduling, and maintenance visit bookings',
        keywords: ['schedule', 'book', 'appointment', 'reschedule', 'cancel', 'visit', 'maintenance', 'time', 'date', 'confirm', 'availability', 'service']
      },
      'General': {
        description: 'General customer questions, basic support inquiries, and non-technical assistance',
        keywords: ['general', 'inquiry', 'miscellaneous', 'follow-up', 'question', 'status', 'invoice', 'hours', 'contact']
      }
    }
  },

  // URGENT Category
  'URGENT': {
    description: 'Emergency situations requiring immediate attention, safety issues, and critical system failures',
    critical: true,
    subcategories: {
      'Emergency Repairs': {
        description: 'Urgent repair requests, equipment failures, and breakdown emergencies',
        keywords: ['emergency', 'urgent', 'broken', 'not working', 'leaking', 'won\'t start', 'no power', 'error code', 'tripping breaker', 'won\'t heat']
      },
      'Leak Emergencies': {
        description: 'Water leaks, plumbing emergencies, and urgent leak repair requests',
        keywords: ['leak', 'leaking', 'water leak', 'plumbing emergency', 'urgent leak']
      },
      'Power Outages': {
        description: 'Electrical failures, power issues, and urgent electrical repair needs',
        keywords: ['power outage', 'electrical failure', 'no power', 'power issue', 'electrical emergency']
      },
      'Other': {
        description: 'Other urgent matters requiring immediate attention',
        keywords: ['urgent', 'emergency', 'ASAP', 'as soon as possible', 'immediately', 'critical', 'need help now', 'high priority', 'right away']
      }
    }
  },

  // MISC Category
  'MISC': {
    description: 'Miscellaneous emails, general correspondence, and personal messages',
    subcategories: {
      'General': {
        description: 'General emails and uncategorized correspondence',
        keywords: ['general', 'miscellaneous', 'uncategorized']
      },
      'Personal': {
        description: 'Personal emails and non-business messages',
        keywords: ['personal', 'non-business', 'private']
      }
    }
  },

  // PHONE Category
  'PHONE': {
    description: 'Only emails from phone/SMS/voicemail providers (e.g., service@ringcentral.com) should be tagged PHONE.\nIf the subject or body includes \'New Text Message\' and the sender includes \'RingCentral\', classify as Phone.\nThis category includes all emails originating specifically from service@ringcentral.com. These notifications typically contain:  Voicemail notifications (voice message transcripts or audio attachments).  Missed call alerts (with caller ID and callback numbers).  SMS/text message alerts (text message transcripts or content).  These messages indicate customer or vendor attempts to communicate via the business phone number managed by RingCentral.  Examples:  "You have a new voice message from (403) 123-4567."  "New SMS received from customer."  "Missed call alert."  Keywords: voicemail, voice message, missed call, SMS, text message, RingCentral, caller ID, message transcript, new message, call recording, callback number, you have a new text, you have a new voicemail  Classifier Rule: ✅ Always classify as RingCentral Communications if the sender is exactly service@ringcentral.com',
    subcategories: {
      'Phone': {
        description: 'This category includes all emails originating specifically from service@ringcentral.com. These notifications typically contain:  Voicemail notifications (voice message transcripts or audio attachments).  Missed call alerts (with caller ID and callback numbers).  SMS/text message alerts (text message transcripts or content).  These messages indicate customer or vendor attempts to communicate via the business phone number managed by RingCentral.  Examples:  "You have a new voice message from (403) 123-4567."  "New SMS received from customer."  "Missed call alert."  Keywords: voicemail, voice message, missed call, SMS, text message, RingCentral, caller ID, message transcript, new message, call recording, callback number, you have a new text, you have a new voicemail  Classifier Rule: ✅ Always classify as RingCentral Communications if the sender is exactly service@ringcentral.com',
        keywords: ['voicemail', 'voice message', 'missed call', 'SMS', 'text message', 'RingCentral', 'caller ID', 'message transcript', 'new message', 'call recording', 'callback number', 'you have a new text', 'you have a new voicemail']
      }
    }
  },

  // PROMO Category
  'PROMO': {
    description: 'Marketing, discounts, sales flyers.\nEmails promoting marketing campaigns, discount announcements, referral programs, or seasonal events. These include vendor offers, sales flyers, promotional codes, limited-time deals, or partnership pitches. They do NOT include direct customer inquiries or leads about purchasing a product or service.',
    subcategories: {
      'Promo': {
        description: 'Emails promoting marketing campaigns, discount announcements, referral programs, or seasonal events. These include vendor offers, sales flyers, promotional codes, limited-time deals, or partnership pitches. They do NOT include direct customer inquiries or leads about purchasing a product or service.',
        keywords: ['marketing', 'discount', 'promotion', 'deal', 'sale', 'limited time', 'referral', 'seasonal', 'vendor offer', 'promotional code'],
        examples: ['"Save 25% this weekend only!"', '"Refer a friend and earn rewards"', '"Bundle deal on spa accessories"', '"Exclusive vendor promotion for your business"']
      }
    }
  },

  // RECRUITMENT Category
  'RECRUITMENT': {
    description: 'Human resources, recruitment, job applications, interviews, and hiring communications',
    subcategories: {
      'Job Applications': {
        description: 'Job applications, resumes, and candidate submissions',
        keywords: ['job application', 'resume', 'cover letter', 'candidate', 'applicant']
      },
      'Interviews': {
        description: 'Interview scheduling, candidate evaluations, and interview feedback',
        keywords: ['interview', 'interview schedule', 'candidate evaluation', 'interview feedback']
      },
      'New Hires': {
        description: 'Onboarding communications, new employee setup, and hiring confirmations',
        keywords: ['new hire', 'onboarding', 'employee setup', 'hiring confirmation']
      }
    }
  },

  // SOCIALMEDIA Category
  'SOCIALMEDIA': {
    description: 'Emails related to social media platforms like Facebook, Instagram, TikTok, YouTube, or Google. These messages typically include:  Engagement alerts (DMs, tags, mentions)  Collaboration or sponsorship requests  Content inquiries (reels, stories, posts)  Influencer or partnership outreach  These emails originate from social platforms or brands/agencies interacting via social channels. This does not include general social media notifications like password resets (those go under Security or System Alerts if applicable).',
    subcategories: {
      'Socialmedia': {
        description: 'Emails related to social media platforms like Facebook, Instagram, TikTok, YouTube, or Google. These messages typically include:  Engagement alerts (DMs, tags, mentions)  Collaboration or sponsorship requests  Content inquiries (reels, stories, posts)  Influencer or partnership outreach  These emails originate from social platforms or brands/agencies interacting via social channels. This does not include general social media notifications like password resets (those go under Security or System Alerts if applicable).',
        keywords: ['DM', 'tagged', 'post', 'reel', 'story', 'influencer', 'collab', 'partnership', 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'social media']
      }
    }
  }
};

// Function to get label description by name
export function getLabelDescription(labelName, businessInfo = {}, managers = [], suppliers = []) {
  const businessName = businessInfo.name || 'the business';
  
  // Extract the actual label name from the full path (e.g., "MANAGER/{{Manager1}}" -> "{{Manager1}}")
  const actualLabelName = labelName.includes('/') ? labelName.split('/').pop() : labelName;
  
  // Handle dynamic supplier names
  if (actualLabelName.startsWith('{{Supplier') && actualLabelName.endsWith('}}')) {
    const supplierIndex = parseInt(actualLabelName.match(/\d+/)?.[0]) - 1;
    const supplier = suppliers[supplierIndex];
    if (supplier) {
      return `Emails from ${supplier.name} - ${supplier.description || 'supplier communications, orders, and invoices'}`;
    }
    return `Supplier communications, orders, and invoices`;
  }
  
  // Handle dynamic manager names
  if (actualLabelName.startsWith('{{Manager') && actualLabelName.endsWith('}}')) {
    const managerIndex = parseInt(actualLabelName.match(/\d+/)?.[0]) - 1;
    const manager = managers[managerIndex];
    if (manager) {
      return `Emails specifically for ${manager.name} - ${manager.description || 'manager-specific communications and tasks'}`;
    }
    return `Manager-specific communications and tasks`;
  }
  
  // Handle top-level categories
  if (labelLibrary[labelName]) {
    return replaceBusinessPlaceholders(labelLibrary[labelName].description, businessInfo, managers, suppliers);
  }
  
  // Handle subcategories (e.g., "SUPPORT/Technical Support")
  if (labelName.includes('/')) {
    const [category, subcategory] = labelName.split('/');
    if (labelLibrary[category]?.subcategories?.[subcategory]) {
      return replaceBusinessPlaceholders(labelLibrary[category].subcategories[subcategory].description, businessInfo, managers, suppliers);
    }
  }
  
  // Handle tertiary categories (e.g., "BANKING/Receipts/Payment Received")
  if (labelName.includes('/') && labelName.split('/').length === 3) {
    const [category, subcategory, tertiary] = labelName.split('/');
    if (labelLibrary[category]?.subcategories?.[subcategory]?.tertiary?.[tertiary]) {
      return replaceBusinessPlaceholders(labelLibrary[category].subcategories[subcategory].tertiary[tertiary], businessInfo, managers, suppliers);
    }
  }
  
  // Fallback
  return `${labelName.toLowerCase().replace(/_/g, ' ')} related communications for ${businessName}`;
}

// Function to get all possible labels for a business type
export function getAllPossibleLabels(businessTypes = []) {
  const allLabels = [];
  
  // Add all base labels
  Object.keys(labelLibrary).forEach(category => {
    allLabels.push(category);
    
    // Add subcategories
    if (labelLibrary[category].subcategories) {
      Object.keys(labelLibrary[category].subcategories).forEach(subcategory => {
        allLabels.push(`${category}/${subcategory}`);
        
        // Add tertiary categories
        if (labelLibrary[category].subcategories[subcategory].tertiary) {
          Object.keys(labelLibrary[category].subcategories[subcategory].tertiary).forEach(tertiary => {
            allLabels.push(`${category}/${subcategory}/${tertiary}`);
          });
        }
      });
    }
  });
  
  return allLabels;
}

// Function to replace placeholders with actual business data
function replaceBusinessPlaceholders(text, businessInfo, managers = [], suppliers = []) {
  if (!text || typeof text !== 'string') return text;
  
  const businessName = businessInfo.name || 'the business';
  const businessNameUpper = businessName.toUpperCase();
  const businessEmailDomain = businessInfo.emailDomain || 'yourdomain.com';
  
  return text
    .replace(/\{\{BUSINESS_NAME\}\}/g, businessName)
    .replace(/\{\{BUSINESS_NAME_UPPER\}\}/g, businessNameUpper)
    .replace(/\{\{BUSINESS_EMAIL_DOMAIN\}\}/g, businessEmailDomain);
}

// Function to generate business-specific system message with all provisioned labels
export function generateSystemMessageWithLabels(provisionedLabels, businessInfo, managers = [], suppliers = []) {
  // Debug: Log what we're receiving
  console.log('🔍 DEBUG: generateSystemMessageWithLabels received:', {
    businessInfo: {
      name: businessInfo.name,
      phone: businessInfo.phone,
      websiteUrl: businessInfo.websiteUrl,
      emailDomain: businessInfo.emailDomain,
      businessTypes: businessInfo.businessTypes
    },
    managers: managers?.length || 0,
    suppliers: suppliers?.length || 0,
    provisionedLabels: provisionedLabels?.length || 0
  });
  
  let message = '';
  
  // Group labels by category
  const labelCategories = {};
  
  provisionedLabels.forEach(labelName => {
    let category = 'MISC';
    if (labelName.includes('/')) {
      category = labelName.split('/')[0];
    } else if (labelLibrary[labelName]) {
      category = labelName;
    }
    
    if (!labelCategories[category]) {
      labelCategories[category] = [];
    }
    labelCategories[category].push(labelName);
  });
  
  // Generate system message for each category in the exact format from the example
  Object.entries(labelCategories).forEach(([category, labels]) => {
    const categoryData = labelLibrary[category];
    if (!categoryData) return;
    
    message += `${category}:\n`;
    
    // Add main description
    message += `${getLabelDescription(category, businessInfo, managers, suppliers)}\n`;
    
    // Add subcategories with detailed descriptions
    const subcategories = labels.filter(l => l.includes('/'));
    if (subcategories.length > 0) {
      const subcategoryNames = subcategories.map(l => l.split('/').slice(1).join('/'));
      message += `secondary_category: [${subcategoryNames.join(', ')}]\n`;
      
      subcategories.forEach(label => {
        const subcategoryName = label.split('/').slice(1).join('/');
        const subcategoryData = categoryData.subcategories?.[subcategoryName];
        
        if (subcategoryData) {
          message += `${subcategoryName} - ${replaceBusinessPlaceholders(subcategoryData.description, businessInfo, managers, suppliers)}\n`;
          
          // Add keywords if available
          if (subcategoryData.keywords && subcategoryData.keywords.length > 0) {
            message += `Keywords: ${subcategoryData.keywords.join(', ')}\n`;
          }
          
          // Add examples if available
          if (subcategoryData.examples && subcategoryData.examples.length > 0) {
            message += `Examples: ${subcategoryData.examples.join(', ')}\n`;
          }
          
          // Add tertiary categories if available
          if (subcategoryData.tertiary) {
            message += `Tertiary categories: [${Object.keys(subcategoryData.tertiary).join(', ')}]\n`;
            Object.entries(subcategoryData.tertiary).forEach(([tertiaryName, tertiaryDesc]) => {
              message += `${tertiaryName}: ${replaceBusinessPlaceholders(tertiaryDesc, businessInfo, managers, suppliers)}\n`;
            });
          }
        } else {
          message += `${subcategoryName} - ${getLabelDescription(label, businessInfo, managers, suppliers)}\n`;
        }
      });
    } else {
      message += `secondary_category: [${category}]\n`;
    }
    
    message += `\n`;
  });
  
  return message;
}

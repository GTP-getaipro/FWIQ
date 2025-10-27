// Floworx Master Business Label Schema (Base Template)
// Production-grade universal schema for all Floworx business types

/**
 * Base Master Schema - Universal template for all business types
 * This schema provides consistency, validation, and dynamic customization
 * across every trade vertical (Pools & Spas, HVAC, Plumbing, etc.)
 */
export const baseMasterSchema = {
  schemaVersion: "1.3.0",
  lastUpdated: "2025-01-05",
  author: "Floworx Automation Core",
  description: "Universal Gmail/Outlook label provisioning template for all Floworx business types. Acts as the base schema for vertical-specific extensions.",
  compatibleSystems: {
    gmail: true,
    outlook: true,
    n8n: true
  },
  supportsDynamicInjection: true,
  dynamicVariables: {
    managers: ["{{Manager1}}", "{{Manager2}}", "{{Manager3}}", "{{Manager4}}", "{{Manager5}}"],
    suppliers: ["{{Supplier1}}", "{{Supplier2}}", "{{Supplier3}}", "{{Supplier4}}", "{{Supplier5}}", 
                "{{Supplier6}}", "{{Supplier7}}", "{{Supplier8}}", "{{Supplier9}}", "{{Supplier10}}"]
  },
  provisioningOrder: [
    "BANKING",
    "SALES", 
    "GOOGLE REVIEW",
    "MANAGER",
    "SUPPLIERS",
    "SUPPORT",
    "URGENT",
    "MISC",
    "PHONE",
    "PROMO",
    "RECRUITMENT",
    "SOCIALMEDIA"
  ],
  defaultIntents: {
    BANKING: "ai.financial_transaction",
    FORMSUB: "ai.form_submission",
    GOOGLE_REVIEW: "ai.customer_feedback",
    MANAGER: "ai.internal_routing",
    SALES: "ai.sales_inquiry",
    SUPPLIERS: "ai.vendor_communication",
    SUPPORT: "ai.support_ticket",
    URGENT: "ai.emergency_request",
    MISC: "ai.general",
    PHONE: "ai.call_log",
    PROMO: "ai.marketing",
    RECRUITMENT: "ai.hr",
    SOCIALMEDIA: "ai.social_engagement"
  },
  labels: [
    {
      name: "BANKING",
      color: { backgroundColor: "#16a766", textColor: "#ffffff" },
      critical: true,
      intent: "ai.financial_transaction",
      description: "Financial transactions, invoices, payments, bank alerts, receipts, and money-related communications",
      sub: [
        { 
          name: "BankAlert",
          description: "Bank notifications, account alerts, transaction confirmations, and banking system messages"
        },
        {
          name: "e-Transfer",
          description: "Electronic money transfers, Interac e-Transfers, and digital payment transfers",
          sub: [
            { 
              name: "Transfer Sent",
              description: "Outgoing e-Transfers and money sent to others"
            },
            { 
              name: "Transfer Received",
              description: "Incoming e-Transfers and money received from others"
            }
          ]
        },
        { 
          name: "Invoice",
          description: "Invoices sent to customers, billing statements, and payment requests"
        },
        { 
          name: "Payment Confirmation",
          description: "Payment confirmations, transaction receipts, and payment processing notifications"
        },
        {
          name: "Receipts",
          description: "Payment receipts and transaction records",
          sub: [
            { 
              name: "Payment Received",
              description: "Receipts for payments received from customers"
            },
            { 
              name: "Payment Sent",
              description: "Receipts for payments sent to suppliers or vendors"
            }
          ]
        },
        { 
          name: "Refund",
          description: "Refund requests, refund confirmations, and credit memos"
        }
      ]
    },
    {
      name: "FORMSUB",
      color: { backgroundColor: "#0b804b", textColor: "#ffffff" },
      intent: "ai.form_submission",
      description: "Website form submissions, contact forms, and online inquiry forms",
      sub: [
        { 
          name: "New Submission",
          description: "New form submissions from website contact or inquiry forms"
        },
        { 
          name: "Work Order Forms",
          description: "Work order and service request forms"
        }
      ]
    },
    {
      name: "GOOGLE REVIEW",
      color: { backgroundColor: "#fad165", textColor: "#000000" },
      intent: "ai.customer_feedback",
      description: "Google Business reviews, review notifications, and review response tracking. All review-related emails go here (no subfolders - classifier handles as single category).",
      sub: []  // ✅ NO SUBFOLDERS - Classifier can only handle GoogleReview as single category
    },
    {
      name: "MANAGER",
      color: { backgroundColor: "#ffad47", textColor: "#000000" },
      intent: "ai.internal_routing",
      description: "Internal management routing and team oversight. Routes emails requiring manager attention, team assignments, or items not yet assigned to a team member.",
      sub: [
        { 
          name: "Unassigned",
          description: "Emails not yet assigned to any team member. Requires manager review for routing."
        },
        { name: "{{Manager1}}" },
        { name: "{{Manager2}}" },
        { name: "{{Manager3}}" },
        { name: "{{Manager4}}" },
        { name: "{{Manager5}}" }
      ]
    },
    {
      name: "SALES",
      color: { backgroundColor: "#16a766", textColor: "#ffffff" },
      intent: "ai.sales_inquiry",
      description: "Sales inquiries, quotes, consultations, and revenue-generating opportunities (business-specific subcategories defined per business type)",
      sub: [
        { 
          name: "Quotes",
          description: "Price quotes, estimates, and pricing requests"
        },
        { 
          name: "Consultations",
          description: "Sales consultations, product demos, and buyer guidance"
        },
        { 
          name: "Follow-ups",
          description: "Sales follow-ups and prospect nurturing"
        }
      ]
    },
    {
      name: "SUPPLIERS",
      color: { backgroundColor: "#ffad47", textColor: "#000000" },
      intent: "ai.vendor_communication",
      description: "Supplier and vendor communications, orders, invoices, and supply chain management",
      sub: [
        { name: "{{Supplier1}}" },
        { name: "{{Supplier2}}" },
        { name: "{{Supplier3}}" },
        { name: "{{Supplier4}}" },
        { name: "{{Supplier5}}" },
        { name: "{{Supplier6}}" },
        { name: "{{Supplier7}}" },
        { name: "{{Supplier8}}" },
        { name: "{{Supplier9}}" },
        { name: "{{Supplier10}}" }
      ]
    },
    {
      name: "SUPPORT",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.support_ticket",
      description: "Customer support, service requests, technical help, and general assistance",
      sub: [
        { 
          name: "Appointment Scheduling",
          description: "Service appointments, bookings, and scheduling requests"
        },
        { 
          name: "General",
          description: "General support questions and basic assistance"
        },
        { 
          name: "Technical Support",
          description: "Technical issues, troubleshooting, and expert help"
        }
      ]
    },
    {
      name: "URGENT",
      color: { backgroundColor: "#fb4c2f", textColor: "#ffffff" },
      critical: true,
      intent: "ai.emergency_request",
      description: "Emergency situations, critical issues, and time-sensitive requests requiring immediate attention",
      sub: [
        { 
          name: "Emergency Repairs",
          description: "Urgent repair requests and emergency service calls"
        },
        { 
          name: "Safety Issues",
          description: "Safety hazards and security concerns"
        },
        { 
          name: "System Outages",
          description: "System failures, outages, and critical downtime"
        },
        { 
          name: "Other",
          description: "Other urgent matters requiring immediate attention"
        }
      ]
    },
    {
      name: "MISC",
      color: { backgroundColor: "#999999", textColor: "#ffffff" },
      intent: "ai.general",
      description: "Miscellaneous emails, general correspondence, and personal messages",
      sub: [
        { 
          name: "General",
          description: "General emails and uncategorized correspondence"
        },
        { 
          name: "Personal",
          description: "Personal emails and non-business messages"
        }
      ]
    },
    {
      name: "PHONE",
      color: { backgroundColor: "#6d9eeb", textColor: "#ffffff" },
      intent: "ai.call_log",
      description: "Phone communications, call logs, voicemails, and telephony notifications",
      sub: [
        { 
          name: "Incoming Calls",
          description: "Incoming call notifications and received calls"
        },
        { 
          name: "Voicemails",
          description: "Voicemail notifications and voice messages"
        }
      ]
    },
    {
      name: "PROMO",
      color: { backgroundColor: "#43d692", textColor: "#000000" },
      intent: "ai.marketing",
      description: "Marketing campaigns, promotional content, and advertising communications",
      sub: [
        { 
          name: "Social Media",
          description: "Social media marketing posts and advertising campaigns"
        },
        { 
          name: "Special Offers",
          description: "Promotional offers, discounts, and special deals"
        }
      ]
    },
    {
      name: "RECRUITMENT",
      color: { backgroundColor: "#e07798", textColor: "#ffffff" },
      intent: "ai.hr",
      description: "Human resources, recruitment, job applications, interviews, and hiring communications",
      sub: [
        { 
          name: "Job Applications",
          description: "Job applications, resumes, and candidate submissions"
        },
        { 
          name: "Interviews",
          description: "Interview scheduling, candidate evaluations, and interview feedback"
        },
        { 
          name: "New Hires",
          description: "Onboarding communications, new employee setup, and hiring confirmations"
        }
      ]
    },
    {
      name: "SOCIALMEDIA",
      color: { backgroundColor: "#ffad47", textColor: "#000000" },
      intent: "ai.social_engagement",
      description: "Social media notifications, platform messages, comments, mentions, and social engagement",
      sub: [
        { 
          name: "Facebook",
          description: "Facebook messages, comments, page notifications, and social interactions"
        },
        { 
          name: "Instagram",
          description: "Instagram DMs, comments, mentions, and engagement notifications"
        },
        { 
          name: "Google My Business",
          description: "Google Business Profile messages, Q&A, and location notifications"
        },
        { 
          name: "LinkedIn",
          description: "LinkedIn messages, connection requests, and professional network communications"
        }
      ]
    }
  ]
};

/**
 * Business-Specific Schema Extensions
 * Each business type extends the base schema with domain-specific customizations
 */

/**
 * Pools & Spas Business Extension
 */
export const poolsSpasExtension = {
  businessType: "Pools & Spas",
  extends: "baseMasterSchema",
  overrides: {
    FORMSUB: {
      description: "Website form submissions, work orders, and service requests from online channels",
      sub: [
        { 
          name: "New Submission",
          description: "New form submissions from website contact forms or inquiry forms"
        },
        { 
          name: "Work Order Forms",
          description: "Service work order requests and job scheduling forms"
        },
        { 
          name: "Service Requests",
          description: "Customer service requests for repairs, maintenance, or support"
        },
        { 
          name: "Quote Requests",
          description: "Price quote requests and estimate inquiries"
        }
      ]
    },
    SALES: {
      description: "Sales inquiries, product sales, consultations, and revenue-generating opportunities for hot tubs, spas, and related products",
      sub: [
        { 
          name: "New Spa Sales",
          description: "New hot tub or spa purchase inquiries, showroom visits, and sales opportunities"
        },
        { 
          name: "Accessory Sales",
          description: "Sales of spa covers, steps, chemicals, filters, and other accessories"
        },
        { 
          name: "Consultations",
          description: "Sales consultations, product demonstrations, and buyer guidance sessions"
        },
        { 
          name: "Quote Requests",
          description: "Pricing requests, quote follow-ups, and sales estimate inquiries"
        }
      ]
    },
    SUPPORT: {
      description: "Customer service, technical support, appointments, parts inquiries, and general help requests for existing customers",
      sub: [
        { 
          name: "Appointment Scheduling",
          description: "Service appointment requests, installation scheduling, and maintenance visit bookings"
        },
        { 
          name: "General",
          description: "General customer questions, basic support inquiries, and non-technical assistance"
        },
        { 
          name: "Technical Support",
          description: "Technical issues, troubleshooting, error codes, equipment malfunctions, and repair guidance"
        },
        { 
          name: "Parts And Chemicals",
          description: "Replacement parts inquiries, chemical supply orders, and filtration system questions"
        }
      ]
    },
    URGENT: {
      description: "Emergency situations requiring immediate attention, safety issues, and critical system failures",
      sub: [
        { 
          name: "Emergency Repairs",
          description: "Urgent repair requests, equipment failures, and breakdown emergencies"
        },
        { 
          name: "Leak Emergencies",
          description: "Water leaks, plumbing emergencies, and urgent leak repair requests"
        },
        { 
          name: "Power Outages",
          description: "Electrical failures, power issues, and urgent electrical repair needs"
        },
        { 
          name: "Other",
          description: "Other urgent matters requiring immediate attention"
        }
      ]
    },
    MANAGER: {
      description: "Internal management routing and team oversight for pools & spas business. Routes emails requiring manager attention or items not yet assigned.",
      sub: [
        { 
          name: "Unassigned",
          description: "Emails not yet assigned to any team member. Requires manager review for routing."
        }
        // Dynamic manager names will be added via labelProvisionService
      ]
    }
  },
  additions: [],
  provisioningOrderOverride: [
    "BANKING",
    "SALES",
    "SUPPORT",
    "MANAGER",
    "SUPPLIERS",
    "PHONE",
    "URGENT",
    "SOCIALMEDIA",
    "GOOGLE REVIEW",
    "FORMSUB",
    "RECRUITMENT",
    "PROMO",
    "MISC"
  ]
};

/**
 * HVAC Business Extension - Complete HVAC-specific schema
 */
export const hvacExtension = {
  businessType: "HVAC",
  extends: "baseMasterSchema",
  version: "1.3.0",
  lastUpdated: "2025-01-05",
  description: "Dynamic Gmail/Outlook label provisioning schema for HVAC businesses. Extends the Floworx base schema with service-specific categories and supplier placeholders.",
  overrides: {
    BANKING: {
      sub: [
        { name: "Invoices" },
        { name: "Receipts" },
        { name: "Refunds" },
        { name: "Payment Confirmations" },
        { name: "Bank Alerts" },
        {
          name: "e-Transfer",
          sub: [
            { name: "From Business" },
            { name: "To Business" }
          ]
        }
      ]
    },
    FORMSUB: {
      sub: [
        { name: "New Submissions" },
        { name: "Estimate Requests" },
        { name: "Maintenance Signup" }
      ]
    },
    GOOGLE_REVIEW: {
      sub: []  // ✅ NO SUBFOLDERS - Classifier can only handle GoogleReview as single category
    },
    MANAGER: {
      sub: [
        { name: "Unassigned" },
        { name: "Escalations" },
        { name: "Dispatch" },
        { name: "{{Manager1}}" },
        { name: "{{Manager2}}" },
        { name: "{{Manager3}}" },
        { name: "{{Manager4}}" },
        { name: "{{Manager5}}" }
      ]
    },
    SALES: {
      sub: [
        { name: "New System Quotes" },
        { name: "Consultations" },
        { name: "Maintenance Plans" },
        { name: "Ductless Quotes" }
      ]
    },
    SUPPLIERS: {
      sub: [
        { name: "Lennox" },
        { name: "Carrier" },
        { name: "Trane" },
        { name: "Goodman" },
        { name: "Honeywell" },
        { name: "{{Supplier1}}" },
        { name: "{{Supplier2}}" },
        { name: "{{Supplier3}}" },
        { name: "{{Supplier4}}" },
        { name: "{{Supplier5}}" },
        { name: "{{Supplier6}}" },
        { name: "{{Supplier7}}" },
        { name: "{{Supplier8}}" },
        { name: "{{Supplier9}}" },
        { name: "{{Supplier10}}" }
      ]
    },
    SUPPORT: {
      sub: [
        { name: "Technical Support" },
        { name: "Parts & Filters" },
        { name: "Appointment Scheduling" },
        { name: "General Inquiries" }
      ]
    },
    URGENT: {
      sub: [
        { name: "No Heat" },
        { name: "No Cooling" },
        { name: "Carbon Monoxide Alert" },
        { name: "Water Leak" }
      ]
    },
    PHONE: {
      sub: [
        { name: "Incoming Calls" },
        { name: "Voicemails" },
        { name: "After Hours Calls" }
      ]
    },
    PROMO: {
      sub: [
        { name: "Seasonal Promotions" },
        { name: "Financing Offers" },
        { name: "Email Campaigns" }
      ]
    },
    RECRUITMENT: {
      sub: [
        { name: "Job Applications" },
        { name: "Interview Scheduling" },
        { name: "Technician Hiring" }
      ]
    },
    SOCIALMEDIA: {
      sub: [
        { name: "Facebook" },
        { name: "Instagram" },
        { name: "Google My Business" }
      ]
    },
    MISC: {
      sub: [
        { name: "General" },
        { name: "Archive" },
        { name: "Internal Notes" }
      ]
    }
  },
  additions: [
    {
      name: "SERVICE",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.service_request",
      critical: true,
      sub: [
        {
          name: "Emergency Heating",
          sub: [
            { name: "Furnace No Heat" },
            { name: "Boiler Failure" },
            { name: "Gas Leak Concern" }
          ]
        },
        {
          name: "Emergency Cooling",
          sub: [
            { name: "AC Not Cooling" },
            { name: "Compressor Failure" },
            { name: "Thermostat Malfunction" }
          ]
        },
        {
          name: "Seasonal Maintenance",
          sub: [
            { name: "Spring Tune-up" },
            { name: "Fall Inspection" }
          ]
        },
        {
          name: "New Installations",
          sub: [
            { name: "HVAC System Install" },
            { name: "Ductless Mini Split" },
            { name: "Heat Pump" }
          ]
        },
        {
          name: "Indoor Air Quality",
          sub: [
            { name: "Filter Replacement" },
            { name: "Air Purifier Install" },
            { name: "Humidity Control" }
          ]
        },
        {
          name: "Duct Cleaning",
          sub: [
            { name: "Residential" },
            { name: "Commercial" }
          ]
        }
      ]
    },
    {
      name: "WARRANTY",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.warranty_claim",
      critical: true,
      sub: [
        { name: "Claims" },
        { name: "Pending Review" },
        { name: "Approved" },
        { name: "Denied" },
        { name: "Parts Replacement" }
      ]
    }
  ]
};

/**
 * Electrician Business Extension - Complete Electrician-specific schema
 */
export const electricianExtension = {
  businessType: "Electrician",
  extends: "baseMasterSchema",
  version: "1.3.0",
  lastUpdated: "2025-01-05",
  description: "Dynamic Gmail/Outlook label provisioning schema for Electrician businesses. Includes support for up to 5 managers and 10 suppliers with service-specific AI routing.",
  overrides: {
    BANKING: {
      sub: [
        { name: "Invoices" },
        { name: "Receipts" },
        { name: "Refunds" },
        { name: "Payment Confirmations" },
        { name: "Bank Alerts" },
        {
          name: "e-Transfer",
          sub: [
            { name: "From Business" },
            { name: "To Business" }
          ]
        }
      ]
    },
    FORMSUB: {
      sub: [
        { name: "New Submission" },
        { name: "Estimate Request" },
        { name: "Project Inquiry" }
      ]
    },
    GOOGLE_REVIEW: {
      sub: []  // ✅ NO SUBFOLDERS - Classifier can only handle GoogleReview as single category
    },
    MANAGER: {
      sub: [
        { name: "Unassigned" },
        { name: "Dispatch" },
        { name: "Escalations" },
        { name: "{{Manager1}}" },
        { name: "{{Manager2}}" },
        { name: "{{Manager3}}" },
        { name: "{{Manager4}}" },
        { name: "{{Manager5}}" }
      ]
    },
    SALES: {
      sub: [
        { name: "New Project Quotes" },
        { name: "Residential Estimates" },
        { name: "Commercial Bids" },
        { name: "Lighting Upgrades" }
      ]
    },
    SUPPLIERS: {
      sub: [
        { name: "Home Depot Pro" },
        { name: "Graybar" },
        { name: "Wesco" },
        { name: "Rexel" },
        { name: "Ideal Industries" },
        { name: "{{Supplier1}}" },
        { name: "{{Supplier2}}" },
        { name: "{{Supplier3}}" },
        { name: "{{Supplier4}}" },
        { name: "{{Supplier5}}" },
        { name: "{{Supplier6}}" },
        { name: "{{Supplier7}}" },
        { name: "{{Supplier8}}" },
        { name: "{{Supplier9}}" },
        { name: "{{Supplier10}}" }
      ]
    },
    SUPPORT: {
      sub: [
        { name: "Appointment Scheduling" },
        { name: "Estimate Follow-up" },
        { name: "Technical Support" },
        { name: "General" }
      ]
    },
    URGENT: {
      sub: [
        { name: "Power Loss" },
        { name: "Burning Smell" },
        { name: "Sparking Outlet" },
        { name: "Tripped Breaker" }
      ]
    },
    PHONE: {
      sub: [
        { name: "Incoming Calls" },
        { name: "Outgoing Calls" },
        { name: "Voicemails" },
        { name: "After Hours Calls" }
      ]
    },
    PROMO: {
      sub: [
        { name: "Seasonal Offers" },
        { name: "Email Campaigns" },
        { name: "Social Media Promotions" }
      ]
    },
    RECRUITMENT: {
      sub: [
        { name: "Job Applications" },
        { name: "Interview Scheduling" },
        { name: "Electrician Hiring" },
        { name: "Apprentice Programs" }
      ]
    },
    SOCIALMEDIA: {
      sub: [
        { name: "Facebook" },
        { name: "Instagram" },
        { name: "Google My Business" },
        { name: "LinkedIn" }
      ]
    },
    MISC: {
      sub: [
        { name: "General" },
        { name: "Archive" },
        { name: "Personal" }
      ]
    }
  },
  additions: [
    {
      name: "SERVICE",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.service_request",
      critical: true,
      sub: [
        {
          name: "Emergency Repairs",
          sub: [
            { name: "Power Outage" },
            { name: "Circuit Failure" },
            { name: "Breaker Trip" },
            { name: "Burning Smell" }
          ]
        },
        {
          name: "Wiring",
          sub: [
            { name: "New Construction" },
            { name: "Rewiring Projects" },
            { name: "Panel Upgrades" },
            { name: "Subpanel Installs" }
          ]
        },
        {
          name: "Lighting",
          sub: [
            { name: "Interior Lighting" },
            { name: "Exterior Lighting" },
            { name: "LED Upgrades" },
            { name: "Landscape Lighting" }
          ]
        },
        {
          name: "Safety Inspections",
          sub: [
            { name: "Code Compliance" },
            { name: "Insurance Inspections" },
            { name: "Fire Risk Checks" }
          ]
        },
        {
          name: "Installations",
          sub: [
            { name: "Ceiling Fans" },
            { name: "EV Chargers" },
            { name: "Smart Home Systems" },
            { name: "Generators" }
          ]
        }
      ]
    }
  ]
};

/**
 * General Contractor Business Extension - Complete General Contractor-specific schema
 */
export const generalContractorExtension = {
  businessType: "General Contractor",
  extends: "baseMasterSchema",
  version: "1.3.0",
  lastUpdated: "2025-01-05",
  description: "Dynamic Gmail/Outlook label provisioning schema for General Contractor businesses. Supports up to 5 managers and 10 subcontractors/vendors defined in onboarding.",
  overrides: {
    BANKING: {
      sub: [
        { name: "Invoice" },
        { name: "Receipts" },
        { name: "Refund" },
        { name: "Payment Confirmation" },
        { name: "e-Transfer" },
        { name: "Bank Alert" }
      ]
    },
    FORMSUB: {
      sub: [
        { name: "New Submission" },
        { name: "Work Order Forms" },
        { name: "Estimate Requests" },
        { name: "Permit Applications" }
      ]
    },
    MANAGER: {
      sub: [
        { name: "Unassigned" },
        { name: "Escalations" },
        { name: "Team Assignments" },
        { name: "Project Oversight" },
        { name: "{{Manager1}}" },
        { name: "{{Manager2}}" },
        { name: "{{Manager3}}" },
        { name: "{{Manager4}}" },
        { name: "{{Manager5}}" }
      ]
    },
    SALES: {
      sub: [
        { name: "New Leads" },
        { name: "Quote Follow-ups" },
        { name: "Project Bids" },
        { name: "Consultations" }
      ]
    },
    SUPPLIERS: {
      sub: [
        { name: "Building Materials" },
        { name: "Concrete Supplier" },
        { name: "Electrical Supplies" },
        { name: "Plumbing Supplies" },
        { name: "{{Supplier1}}" },
        { name: "{{Supplier2}}" },
        { name: "{{Supplier3}}" },
        { name: "{{Supplier4}}" },
        { name: "{{Supplier5}}" },
        { name: "{{Supplier6}}" },
        { name: "{{Supplier7}}" },
        { name: "{{Supplier8}}" },
        { name: "{{Supplier9}}" },
        { name: "{{Supplier10}}" }
      ]
    },
    SUPPORT: {
      sub: [
        { name: "Scheduling" },
        { name: "Customer Service" },
        { name: "Technical Support" },
        { name: "General" }
      ]
    },
    URGENT: {
      sub: [
        { name: "Site Emergencies" },
        { name: "Power Failures" },
        { name: "Structural Damage" },
        { name: "Weather Impact" }
      ]
    },
    PHONE: {
      sub: [
        { name: "Incoming Calls" },
        { name: "Outgoing Calls" },
        { name: "Voicemails" },
        { name: "Call Logs" }
      ]
    },
    PROMO: {
      sub: [
        { name: "Email Campaigns" },
        { name: "Social Media" },
        { name: "Newsletters" },
        { name: "Special Offers" }
      ]
    },
    RECRUITMENT: {
      sub: [
        { name: "Job Applications" },
        { name: "Interview Scheduling" },
        { name: "New Hires" },
        { name: "HR Communications" }
      ]
    },
    SOCIALMEDIA: {
      sub: [
        { name: "Facebook" },
        { name: "Instagram" },
        { name: "Google My Business" },
        { name: "LinkedIn" }
      ]
    },
    MISC: {
      sub: [
        { name: "General" },
        { name: "Archive" },
        { name: "Personal" }
      ]
    }
  },
  additions: [
    {
      name: "PROJECTS",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.project_management",
      critical: true,
      sub: [
        { name: "Active Projects" },
        { name: "Pending Approval" },
        { name: "Completed Projects" },
        { name: "Change Orders" },
        { name: "Site Updates" }
      ]
    },
    {
      name: "PERMITS",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.permit_and_compliance",
      sub: [
        { name: "Permit Requests" },
        { name: "Inspections" },
        { name: "City Correspondence" },
        { name: "Compliance Docs" }
      ]
    },
    {
      name: "SAFETY",
      color: { backgroundColor: "#fb4c2f", textColor: "#ffffff" },
      intent: "ai.safety_alert",
      critical: true,
      sub: [
        { name: "Incident Reports" },
        { name: "Safety Meetings" },
        { name: "Equipment Failures" },
        { name: "Worksite Hazards" }
      ]
    }
  ]
};

/**
 * Insulation & Foam Spray Business Extension - Complete Insulation & Foam Spray-specific schema
 */
export const insulationFoamSprayExtension = {
  businessType: "Insulation & Foam Spray",
  extends: "baseMasterSchema",
  version: "1.3.0",
  lastUpdated: "2025-01-05",
  description: "Dynamic Gmail/Outlook label provisioning schema for Insulation & Foam Spray businesses. Supports up to 5 managers and 10 suppliers defined in onboarding.",
  overrides: {
    BANKING: {
      sub: [
        { name: "Invoice" },
        { name: "Receipts" },
        { name: "Refund" },
        { name: "Payment Confirmation" },
        { name: "Bank Alert" },
        { name: "e-Transfer" }
      ]
    },
    FORMSUB: {
      sub: [
        { name: "New Submission" },
        { name: "Work Order Forms" },
        { name: "Estimate Requests" },
        { name: "Site Inspections" }
      ]
    },
    MANAGER: {
      sub: [
        { name: "Unassigned" },
        { name: "Escalations" },
        { name: "Team Assignments" },
        { name: "Project Oversight" },
        { name: "{{Manager1}}" },
        { name: "{{Manager2}}" },
        { name: "{{Manager3}}" },
        { name: "{{Manager4}}" },
        { name: "{{Manager5}}" }
      ]
    },
    SALES: {
      sub: [
        { name: "New Leads" },
        { name: "Quote Follow-ups" },
        { name: "Consultations" },
        { name: "Commercial Contracts" },
        { name: "Residential Estimates" }
      ]
    },
    SUPPLIERS: {
      sub: [
        { name: "Foam & Insulation Supply Co." },
        { name: "EnergySeal Products" },
        { name: "ThermoGuard Materials" },
        { name: "EcoFoam Systems" },
        { name: "{{Supplier1}}" },
        { name: "{{Supplier2}}" },
        { name: "{{Supplier3}}" },
        { name: "{{Supplier4}}" },
        { name: "{{Supplier5}}" },
        { name: "{{Supplier6}}" },
        { name: "{{Supplier7}}" },
        { name: "{{Supplier8}}" },
        { name: "{{Supplier9}}" },
        { name: "{{Supplier10}}" }
      ]
    },
    SUPPORT: {
      sub: [
        { name: "Scheduling" },
        { name: "Customer Service" },
        { name: "Warranty Questions" },
        { name: "Technical Support" },
        { name: "General" }
      ]
    },
    URGENT: {
      sub: [
        { name: "Equipment Failure" },
        { name: "On-Site Issue" },
        { name: "Safety Concern" },
        { name: "Material Shortage" }
      ]
    },
    PHONE: {
      sub: [
        { name: "Incoming Calls" },
        { name: "Outgoing Calls" },
        { name: "Voicemails" },
        { name: "Call Logs" }
      ]
    },
    PROMO: {
      sub: [
        { name: "Email Campaigns" },
        { name: "Social Media" },
        { name: "Newsletters" },
        { name: "Special Offers" }
      ]
    },
    RECRUITMENT: {
      sub: [
        { name: "Job Applications" },
        { name: "Interview Scheduling" },
        { name: "New Hires" },
        { name: "HR Communications" }
      ]
    },
    SOCIALMEDIA: {
      sub: [
        { name: "Facebook" },
        { name: "Instagram" },
        { name: "Google My Business" },
        { name: "LinkedIn" }
      ]
    },
    MISC: {
      sub: [
        { name: "General" },
        { name: "Archive" },
        { name: "Personal" }
      ]
    }
  },
  additions: [
    {
      name: "PROJECTS",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.project_management",
      critical: true,
      sub: [
        { name: "Active Projects" },
        { name: "Pending Approval" },
        { name: "Completed Jobs" },
        { name: "Change Orders" },
        { name: "Site Updates" }
      ]
    },
    {
      name: "SPRAY JOBS",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.job_operations",
      sub: [
        { name: "Attic Insulation" },
        { name: "Wall Insulation" },
        { name: "Spray Foam" },
        { name: "Air Sealing" },
        { name: "Soundproofing" },
        { name: "Energy Efficiency Upgrades" }
      ]
    },
    {
      name: "QUALITY CONTROL",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.quality_feedback",
      sub: [
        { name: "Inspection Reports" },
        { name: "Deficiency Lists" },
        { name: "Customer Feedback" },
        { name: "Post-Job Surveys" }
      ]
    }
  ]
};

/**
 * Flooring Contractor Business Extension - Complete Flooring Contractor-specific schema
 */
export const flooringContractorExtension = {
  businessType: "Flooring Contractor",
  extends: "baseMasterSchema",
  version: "1.3.0",
  lastUpdated: "2025-01-05",
  description: "Dynamic Gmail/Outlook label provisioning schema for Flooring Contractor businesses. Supports up to 5 managers and 10 suppliers defined in onboarding.",
  overrides: {
    BANKING: {
      sub: [
        { name: "Invoice" },
        { name: "Receipts" },
        { name: "Refund" },
        { name: "Payment Confirmation" },
        { name: "Bank Alert" },
        { name: "e-Transfer" }
      ]
    },
    FORMSUB: {
      sub: [
        { name: "New Submission" },
        { name: "Quote Requests" },
        { name: "Work Order Forms" },
        { name: "Warranty Claims" }
      ]
    },
    MANAGER: {
      sub: [
        { name: "Unassigned" },
        { name: "Escalations" },
        { name: "Team Assignments" },
        { name: "Project Oversight" },
        { name: "{{Manager1}}" },
        { name: "{{Manager2}}" },
        { name: "{{Manager3}}" },
        { name: "{{Manager4}}" },
        { name: "{{Manager5}}" }
      ]
    },
    SALES: {
      sub: [
        { name: "New Leads" },
        { name: "Consultations" },
        { name: "Commercial Quotes" },
        { name: "Residential Quotes" },
        { name: "Follow-Ups" }
      ]
    },
    SUPPLIERS: {
      sub: [
        { name: "Mohawk Flooring" },
        { name: "Shaw Floors" },
        { name: "Armstrong Flooring" },
        { name: "Tarkett" },
        { name: "Beaulieu Canada" },
        { name: "{{Supplier1}}" },
        { name: "{{Supplier2}}" },
        { name: "{{Supplier3}}" },
        { name: "{{Supplier4}}" },
        { name: "{{Supplier5}}" },
        { name: "{{Supplier6}}" },
        { name: "{{Supplier7}}" },
        { name: "{{Supplier8}}" },
        { name: "{{Supplier9}}" },
        { name: "{{Supplier10}}" }
      ]
    },
    SUPPORT: {
      sub: [
        { name: "Scheduling" },
        { name: "Product Questions" },
        { name: "Warranty Support" },
        { name: "Customer Service" },
        { name: "General" }
      ]
    },
    URGENT: {
      sub: [
        { name: "On-Site Accident" },
        { name: "Material Shortage" },
        { name: "Equipment Failure" },
        { name: "Water Damage Repair" }
      ]
    },
    PHONE: {
      sub: [
        { name: "Incoming Calls" },
        { name: "Outgoing Calls" },
        { name: "Voicemails" },
        { name: "Call Logs" }
      ]
    },
    PROMO: {
      sub: [
        { name: "Email Campaigns" },
        { name: "Social Media" },
        { name: "Newsletters" },
        { name: "Seasonal Offers" }
      ]
    },
    RECRUITMENT: {
      sub: [
        { name: "Job Applications" },
        { name: "Interview Scheduling" },
        { name: "New Hires" },
        { name: "HR Communications" }
      ]
    },
    SOCIALMEDIA: {
      sub: [
        { name: "Facebook" },
        { name: "Instagram" },
        { name: "Google My Business" },
        { name: "LinkedIn" }
      ]
    },
    MISC: {
      sub: [
        { name: "General" },
        { name: "Archive" },
        { name: "Personal" }
      ]
    }
  },
  additions: [
    {
      name: "PROJECTS",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.project_management",
      critical: true,
      sub: [
        { name: "Active Jobs" },
        { name: "Pending Start" },
        { name: "Completed Jobs" },
        { name: "Change Orders" },
        { name: "Site Inspections" }
      ]
    },
    {
      name: "INSTALLATIONS",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.job_operations",
      sub: [
        { name: "Hardwood Installation" },
        { name: "Laminate Installation" },
        { name: "Tile Installation" },
        { name: "Carpet Installation" },
        { name: "Vinyl Plank Installation" },
        { name: "Commercial Flooring" },
        { name: "Repairs & Refinishing" }
      ]
    },
    {
      name: "QUALITY CONTROL",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.quality_feedback",
      sub: [
        { name: "Inspection Reports" },
        { name: "Deficiency Lists" },
        { name: "Customer Feedback" },
        { name: "Post-Installation Reviews" }
      ]
    }
  ]
};

/**
 * Landscaping Business Extension - Complete Landscaping-specific schema
 */
export const landscapingExtension = {
  businessType: "Landscaping",
  extends: "baseMasterSchema",
  version: "1.3.0",
  lastUpdated: "2025-01-05",
  description: "Dynamic Gmail/Outlook label provisioning schema for Landscaping businesses. Supports up to 5 managers and 10 suppliers defined during onboarding.",
  overrides: {
    BANKING: {
      sub: [
        { name: "Invoices" },
        { name: "Receipts" },
        { name: "Refunds" },
        { name: "Payment Confirmations" },
        { name: "e-Transfers" },
        { name: "Bank Alerts" }
      ]
    },
    FORMSUB: {
      sub: [
        { name: "New Submission" },
        { name: "Quote Requests" },
        { name: "Work Orders" },
        { name: "Service Requests" }
      ]
    },
    MANAGER: {
      sub: [
        { name: "Unassigned" },
        { name: "Team Assignments" },
        { name: "Job Review" },
        { name: "Escalations" },
        { name: "{{Manager1}}" },
        { name: "{{Manager2}}" },
        { name: "{{Manager3}}" },
        { name: "{{Manager4}}" },
        { name: "{{Manager5}}" }
      ]
    },
    SALES: {
      sub: [
        { name: "New Leads" },
        { name: "Consultations" },
        { name: "Commercial Quotes" },
        { name: "Residential Quotes" },
        { name: "Follow-Ups" }
      ]
    },
    SUPPLIERS: {
      sub: [
        { name: "Landscape Supply Co" },
        { name: "GreenEarth Nurseries" },
        { name: "Irrigation Depot" },
        { name: "Garden Pro Tools" },
        { name: "TurfSmart" },
        { name: "{{Supplier1}}" },
        { name: "{{Supplier2}}" },
        { name: "{{Supplier3}}" },
        { name: "{{Supplier4}}" },
        { name: "{{Supplier5}}" },
        { name: "{{Supplier6}}" },
        { name: "{{Supplier7}}" },
        { name: "{{Supplier8}}" },
        { name: "{{Supplier9}}" },
        { name: "{{Supplier10}}" }
      ]
    },
    SUPPORT: {
      sub: [
        { name: "Scheduling" },
        { name: "General Inquiries" },
        { name: "Billing Questions" },
        { name: "Service Complaints" },
        { name: "Warranty Issues" }
      ]
    },
    URGENT: {
      sub: [
        { name: "Storm Damage" },
        { name: "Equipment Breakdown" },
        { name: "Safety Hazards" },
        { name: "Flooding" }
      ]
    },
    PHONE: {
      sub: [
        { name: "Incoming Calls" },
        { name: "Outgoing Calls" },
        { name: "Voicemails" },
        { name: "Call Logs" }
      ]
    },
    PROMO: {
      sub: [
        { name: "Email Campaigns" },
        { name: "Social Media" },
        { name: "Newsletters" },
        { name: "Seasonal Offers" }
      ]
    },
    RECRUITMENT: {
      sub: [
        { name: "Job Applications" },
        { name: "Interview Scheduling" },
        { name: "New Hires" },
        { name: "HR Communications" }
      ]
    },
    SOCIALMEDIA: {
      sub: [
        { name: "Facebook" },
        { name: "Instagram" },
        { name: "Google My Business" },
        { name: "LinkedIn" }
      ]
    },
    MISC: {
      sub: [
        { name: "General" },
        { name: "Archive" },
        { name: "Personal" }
      ]
    }
  },
  additions: [
    {
      name: "PROJECTS",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.project_management",
      critical: true,
      sub: [
        { name: "Active Jobs" },
        { name: "Pending Start" },
        { name: "Completed Jobs" },
        { name: "Site Planning" },
        { name: "Hardscape Installations" },
        { name: "Landscape Design" }
      ]
    },
    {
      name: "MAINTENANCE",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.maintenance_task",
      sub: [
        { name: "Lawn Care" },
        { name: "Tree Trimming" },
        { name: "Garden Maintenance" },
        { name: "Irrigation Services" },
        { name: "Seasonal Cleanup" },
        { name: "Snow Removal" }
      ]
    },
    {
      name: "ESTIMATES",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.estimate_request",
      sub: [
        { name: "Pending Estimates" },
        { name: "Approved Estimates" },
        { name: "Revisions" },
        { name: "Completed Quotes" }
      ]
    }
  ]
};

/**
 * Painting Contractor Business Extension - Complete Painting Contractor-specific schema
 */
export const paintingContractorExtension = {
  businessType: "Painting Contractor",
  extends: "baseMasterSchema",
  version: "1.3.0",
  lastUpdated: "2025-01-05",
  description: "Dynamic Gmail/Outlook label provisioning schema for Painting Contractor businesses. Supports up to 5 managers and 10 suppliers defined in onboarding.",
  overrides: {
    BANKING: {
      sub: [
        { name: "Invoices" },
        { name: "Receipts" },
        { name: "Refunds" },
        { name: "Payment Confirmations" },
        { name: "e-Transfers" },
        { name: "Bank Alerts" }
      ]
    },
    FORMSUB: {
      sub: [
        { name: "New Submission" },
        { name: "Quote Requests" },
        { name: "Work Orders" },
        { name: "Color Consultation Forms" }
      ]
    },
    MANAGER: {
      sub: [
        { name: "Unassigned" },
        { name: "Team Assignments" },
        { name: "Job Review" },
        { name: "Escalations" },
        { name: "{{Manager1}}" },
        { name: "{{Manager2}}" },
        { name: "{{Manager3}}" },
        { name: "{{Manager4}}" },
        { name: "{{Manager5}}" }
      ]
    },
    SALES: {
      sub: [
        { name: "New Leads" },
        { name: "Consultations" },
        { name: "Commercial Quotes" },
        { name: "Residential Quotes" },
        { name: "Follow-Ups" }
      ]
    },
    SUPPLIERS: {
      sub: [
        { name: "Sherwin Williams" },
        { name: "Benjamin Moore" },
        { name: "Home Depot Pro" },
        { name: "PPG Paints" },
        { name: "Dulux Paints" },
        { name: "{{Supplier1}}" },
        { name: "{{Supplier2}}" },
        { name: "{{Supplier3}}" },
        { name: "{{Supplier4}}" },
        { name: "{{Supplier5}}" },
        { name: "{{Supplier6}}" },
        { name: "{{Supplier7}}" },
        { name: "{{Supplier8}}" },
        { name: "{{Supplier9}}" },
        { name: "{{Supplier10}}" }
      ]
    },
    SUPPORT: {
      sub: [
        { name: "Scheduling" },
        { name: "General Inquiries" },
        { name: "Paint Warranty Issues" },
        { name: "Color Adjustments" },
        { name: "Post-Job Support" }
      ]
    },
    URGENT: {
      sub: [
        { name: "Job Delays" },
        { name: "Equipment Failure" },
        { name: "Paint Delivery Issues" },
        { name: "Safety Concerns" }
      ]
    },
    PHONE: {
      sub: [
        { name: "Incoming Calls" },
        { name: "Outgoing Calls" },
        { name: "Voicemails" },
        { name: "Call Logs" }
      ]
    },
    PROMO: {
      sub: [
        { name: "Email Campaigns" },
        { name: "Social Media" },
        { name: "Newsletters" },
        { name: "Discount Offers" }
      ]
    },
    RECRUITMENT: {
      sub: [
        { name: "Job Applications" },
        { name: "Interview Scheduling" },
        { name: "New Hires" },
        { name: "HR Communications" }
      ]
    },
    SOCIALMEDIA: {
      sub: [
        { name: "Facebook" },
        { name: "Instagram" },
        { name: "Google My Business" },
        { name: "LinkedIn" }
      ]
    },
    MISC: {
      sub: [
        { name: "General" },
        { name: "Archive" },
        { name: "Personal" }
      ]
    }
  },
  additions: [
    {
      name: "ESTIMATES",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.estimate_request",
      sub: [
        { name: "Pending Estimates" },
        { name: "Approved Estimates" },
        { name: "Revisions" },
        { name: "Completed Quotes" }
      ]
    },
    {
      name: "PROJECTS",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.project_management",
      critical: true,
      sub: [
        { name: "Active Jobs" },
        { name: "Surface Prep" },
        { name: "Interior Painting" },
        { name: "Exterior Painting" },
        { name: "Commercial Projects" },
        { name: "Completed Projects" }
      ]
    }
  ]
};

/**
 * Roofing Contractor Business Extension - Complete Roofing Contractor-specific schema
 */
export const roofingContractorExtension = {
  businessType: "Roofing Contractor",
  extends: "baseMasterSchema",
  version: "1.3.0",
  lastUpdated: "2025-01-05",
  description: "Dynamic Gmail/Outlook label provisioning schema for Roofing Contractor businesses. Supports up to 5 managers and 10 suppliers defined in onboarding.",
  overrides: {
    BANKING: {
      sub: [
        { name: "Invoices" },
        { name: "Receipts" },
        { name: "Refunds" },
        { name: "Payment Confirmations" },
        { name: "e-Transfers" },
        { name: "Bank Alerts" }
      ]
    },
    FORMSUB: {
      sub: [
        { name: "New Submission" },
        { name: "Work Order Forms" },
        { name: "Roof Inspection Requests" },
        { name: "Quote Requests" }
      ]
    },
    MANAGER: {
      sub: [
        { name: "Unassigned" },
        { name: "Escalations" },
        { name: "Team Assignments" },
        { name: "Project Review" },
        { name: "{{Manager1}}" },
        { name: "{{Manager2}}" },
        { name: "{{Manager3}}" },
        { name: "{{Manager4}}" },
        { name: "{{Manager5}}" }
      ]
    },
    SALES: {
      sub: [
        { name: "New Leads" },
        { name: "Consultations" },
        { name: "Commercial Quotes" },
        { name: "Residential Quotes" },
        { name: "Follow-Ups" }
      ]
    },
    SUPPLIERS: {
      sub: [
        { name: "ABC Supply" },
        { name: "IKO Roofing" },
        { name: "GAF Materials" },
        { name: "Owens Corning" },
        { name: "Beacon Building Products" },
        { name: "{{Supplier1}}" },
        { name: "{{Supplier2}}" },
        { name: "{{Supplier3}}" },
        { name: "{{Supplier4}}" },
        { name: "{{Supplier5}}" },
        { name: "{{Supplier6}}" },
        { name: "{{Supplier7}}" },
        { name: "{{Supplier8}}" },
        { name: "{{Supplier9}}" },
        { name: "{{Supplier10}}" }
      ]
    },
    SUPPORT: {
      sub: [
        { name: "Scheduling" },
        { name: "Warranty Repairs" },
        { name: "Leak Concerns" },
        { name: "Customer Questions" },
        { name: "Post-Install Support" }
      ]
    },
    URGENT: {
      sub: [
        { name: "Emergency Leak Repairs" },
        { name: "Storm Damage" },
        { name: "Safety Hazards" },
        { name: "Roof Collapse Risk" }
      ]
    },
    PHONE: {
      sub: [
        { name: "Incoming Calls" },
        { name: "Outgoing Calls" },
        { name: "Voicemails" },
        { name: "Call Logs" }
      ]
    },
    PROMO: {
      sub: [
        { name: "Email Campaigns" },
        { name: "Social Media" },
        { name: "Newsletters" },
        { name: "Discount Offers" }
      ]
    },
    RECRUITMENT: {
      sub: [
        { name: "Job Applications" },
        { name: "Interview Scheduling" },
        { name: "New Hires" },
        { name: "HR Communications" }
      ]
    },
    SOCIALMEDIA: {
      sub: [
        { name: "Facebook" },
        { name: "Instagram" },
        { name: "Google My Business" },
        { name: "LinkedIn" }
      ]
    },
    MISC: {
      sub: [
        { name: "General" },
        { name: "Archive" },
        { name: "Personal" }
      ]
    }
  },
  additions: [
    {
      name: "INSPECTIONS",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.site_inspection",
      sub: [
        { name: "Initial Inspections" },
        { name: "Pre-Install Inspections" },
        { name: "Post-Repair Inspections" },
        { name: "Drone Reports" }
      ]
    },
    {
      name: "PROJECTS",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.project_management",
      critical: true,
      sub: [
        { name: "Active Jobs" },
        { name: "Shingle Installations" },
        { name: "Metal Roofing" },
        { name: "Flat Roofing" },
        { name: "Gutter Work" },
        { name: "Completed Projects" }
      ]
    },
    {
      name: "INSURANCE",
      color: { backgroundColor: "#a479e2", textColor: "#ffffff" },
      intent: "ai.claim_management",
      sub: [
        { name: "New Claims" },
        { name: "In Progress" },
        { name: "Approved" },
        { name: "Denied" },
        { name: "Adjuster Communication" }
      ]
    }
  ]
};

/**
 * Schema Registry - Maps business types to their extensions
 */
export const businessExtensions = {
  "Pools & Spas": poolsSpasExtension,
  "Hot tub & Spa": poolsSpasExtension,
  "Sauna & Icebath": poolsSpasExtension,
  "Pools": poolsSpasExtension,
  "HVAC": hvacExtension,
  "Electrician": electricianExtension,
  "General Construction": generalContractorExtension,
  "General Contractor": generalContractorExtension,
  "Insulation & Foam Spray": insulationFoamSprayExtension,
  "Flooring": flooringContractorExtension,
  "Flooring Contractor": flooringContractorExtension,
  "Landscaping": landscapingExtension,
  "Painting": paintingContractorExtension,
  "Painting Contractor": paintingContractorExtension,
  "Roofing": roofingContractorExtension,
  "Roofing Contractor": roofingContractorExtension,
  "Plumber": hvacExtension
};

/**
 * Apply business extension to base schema
 * @param {string} businessType - Business type
 * @returns {Object} Extended schema with business-specific customizations
 */
export function applyBusinessExtension(businessType) {
  const extension = businessExtensions[businessType];
  if (!extension) {
    throw new Error(`No extension found for business type: ${businessType}`);
  }

  // Start with base schema
  const extendedSchema = structuredClone(baseMasterSchema);
  
  // Apply overrides
  if (extension.overrides) {
    for (const [labelName, override] of Object.entries(extension.overrides)) {
      const labelIndex = extendedSchema.labels.findIndex(label => label.name === labelName);
      if (labelIndex !== -1) {
        extendedSchema.labels[labelIndex] = {
          ...extendedSchema.labels[labelIndex],
          ...override
        };
      }
    }
  }

  // Update provisioning order to include new labels
  if (extension.additions) {
    extendedSchema.labels.push(...extension.additions);
    
    // Update provisioning order to include new labels
    for (const addition of extension.additions) {
      if (!extendedSchema.provisioningOrder.includes(addition.name)) {
        // For HVAC, insert SERVICE and WARRANTY before SALES
        if (extension.businessType === 'HVAC') {
          const salesIndex = extendedSchema.provisioningOrder.indexOf('SALES');
          extendedSchema.provisioningOrder.splice(salesIndex, 0, addition.name);
        } 
        // For General Contractor, insert PROJECTS, PERMITS, SAFETY before SUPPORT
        else if (extension.businessType === 'General Contractor') {
          const supportIndex = extendedSchema.provisioningOrder.indexOf('SUPPORT');
          extendedSchema.provisioningOrder.splice(supportIndex, 0, addition.name);
        } 
        // For Insulation & Foam Spray, insert PROJECTS, SPRAY JOBS, QUALITY CONTROL before SUPPORT
        else if (extension.businessType === 'Insulation & Foam Spray') {
          const supportIndex = extendedSchema.provisioningOrder.indexOf('SUPPORT');
          extendedSchema.provisioningOrder.splice(supportIndex, 0, addition.name);
        } 
        // For Flooring Contractor, insert PROJECTS, INSTALLATIONS, QUALITY CONTROL before SUPPORT
        else if (extension.businessType === 'Flooring Contractor') {
          const supportIndex = extendedSchema.provisioningOrder.indexOf('SUPPORT');
          extendedSchema.provisioningOrder.splice(supportIndex, 0, addition.name);
        } 
        // For Landscaping, insert PROJECTS, MAINTENANCE, ESTIMATES before SUPPORT
        else if (extension.businessType === 'Landscaping') {
          const supportIndex = extendedSchema.provisioningOrder.indexOf('SUPPORT');
          extendedSchema.provisioningOrder.splice(supportIndex, 0, addition.name);
        } 
        // For Painting Contractor, insert ESTIMATES, PROJECTS before SUPPORT
        else if (extension.businessType === 'Painting Contractor') {
          const supportIndex = extendedSchema.provisioningOrder.indexOf('SUPPORT');
          extendedSchema.provisioningOrder.splice(supportIndex, 0, addition.name);
        } 
        // For Roofing Contractor, insert INSPECTIONS, PROJECTS, INSURANCE before SUPPORT
        else if (extension.businessType === 'Roofing Contractor') {
          const supportIndex = extendedSchema.provisioningOrder.indexOf('SUPPORT');
          extendedSchema.provisioningOrder.splice(supportIndex, 0, addition.name);
        } 
        // For other business types, insert before MISC
        else {
          const miscIndex = extendedSchema.provisioningOrder.indexOf('MISC');
          extendedSchema.provisioningOrder.splice(miscIndex, 0, addition.name);
        }
      }
    }
  }

  // Apply provisioning order override if provided
  if (extension.provisioningOrderOverride) {
    extendedSchema.provisioningOrder = extension.provisioningOrderOverride;
  }

  // Update schema metadata
  extendedSchema.businessType = extension.businessType;
  extendedSchema.description = `${baseMasterSchema.description} Extended for ${extension.businessType} businesses.`;

  return extendedSchema;
}

/**
 * Inject dynamic values into schema
 * @param {Object} schema - Schema to inject values into
 * @param {Array} managers - Array of manager objects
 * @param {Array} suppliers - Array of supplier objects
 * @returns {Object} Schema with dynamic placeholders replaced
 */
export function injectDynamicValues(schema, managers = [], suppliers = []) {
  const processedSchema = structuredClone(schema);

  // Replace manager placeholders
  if (managers.length > 0) {
    const managerNames = managers
      .filter(m => m.name && m.name.trim() !== '')
      .map(m => m.name.trim());

    // Find MANAGER label and replace placeholders
    const managerLabel = processedSchema.labels.find(label => label.name === 'MANAGER');
    if (managerLabel && managerLabel.sub) {
      managerLabel.sub = managerLabel.sub.map(subLabel => {
        // Handle both string and object formats
        const labelName = typeof subLabel === 'string' ? subLabel : subLabel.name;
        
        if (labelName && labelName.startsWith('{{Manager') && labelName.endsWith('}}')) {
          const index = parseInt(labelName.match(/\d+/)?.[0]) - 1;
          const replacement = managerNames[index] || null;
          
          if (replacement) {
            // Return the replacement in the same format as the original
            return typeof subLabel === 'string' ? replacement : { ...subLabel, name: replacement };
          }
          return null;
        }
        return subLabel;
      }).filter(Boolean); // Remove null values
    }
  }

  // Replace supplier placeholders
  if (suppliers.length > 0) {
    const supplierNames = suppliers
      .filter(s => s.name && s.name.trim() !== '')
      .map(s => s.name.trim());

    // Find SUPPLIERS label and replace placeholders
    const suppliersLabel = processedSchema.labels.find(label => label.name === 'SUPPLIERS');
    if (suppliersLabel && suppliersLabel.sub) {
      suppliersLabel.sub = suppliersLabel.sub.map(subLabel => {
        // Handle both string and object formats
        const labelName = typeof subLabel === 'string' ? subLabel : subLabel.name;
        
        if (labelName && labelName.startsWith('{{Supplier') && labelName.endsWith('}}')) {
          const index = parseInt(labelName.match(/\d+/)?.[0]) - 1;
          const replacement = supplierNames[index] || null;
          
          if (replacement) {
            // Return the replacement in the same format as the original
            return typeof subLabel === 'string' ? replacement : { ...subLabel, name: replacement };
          }
          return null;
        }
        return subLabel;
      }).filter(Boolean); // Remove null values
    }
  }

  return processedSchema;
}

/**
 * Get complete processed schema for a business type
 * @param {string} businessType - Business type
 * @param {Array} managers - Array of manager objects
 * @param {Array} suppliers - Array of supplier objects
 * @returns {Object} Complete processed schema ready for provisioning
 */
export function getCompleteSchemaForBusiness(businessType, managers = [], suppliers = []) {
  // Apply business extension
  const extendedSchema = applyBusinessExtension(businessType);
  
  // Inject dynamic values
  const processedSchema = injectDynamicValues(extendedSchema, managers, suppliers);
  
  return processedSchema;
}

/**
 * Validate schema integrity
 * @param {string} businessType - Business type to validate
 * @returns {Object} Validation result
 */
export function validateSchemaIntegrity(businessType) {
  const schema = getCompleteSchemaForBusiness(businessType);
  const errors = [];
  const warnings = [];

  // Check provisioning order includes all labels
  const schemaLabels = schema.labels.map(label => label.name);
  const orderLabels = schema.provisioningOrder;

  const missingInOrder = schemaLabels.filter(label => !orderLabels.includes(label));
  const extraInOrder = orderLabels.filter(label => !schemaLabels.includes(label));

  if (missingInOrder.length > 0) {
    errors.push(`Labels missing from provisioning order: ${missingInOrder.join(', ')}`);
  }

  if (extraInOrder.length > 0) {
    warnings.push(`Extra labels in provisioning order: ${extraInOrder.join(', ')}`);
  }

  // Check for duplicate intents
  const intents = schema.labels.map(label => label.intent).filter(Boolean);
  const duplicateIntents = intents.filter((intent, index) => intents.indexOf(intent) !== index);

  if (duplicateIntents.length > 0) {
    warnings.push(`Duplicate intents found: ${[...new Set(duplicateIntents)].join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate n8n environment variables from schema
 * @param {Object} schema - Processed schema
 * @param {Object} labelMap - Map of label names to Gmail label IDs
 * @returns {Object} Environment variables for n8n
 */
export function generateN8nEnvironmentVariables(schema, labelMap) {
  const envVars = {};
  
  // Generate environment variables for each label
  for (const label of schema.labels) {
    const envVarName = `LABEL_${label.name.toUpperCase()}`;
    envVars[envVarName] = labelMap[label.name] || '';
    
    // Generate sub-label environment variables
    if (label.sub && Array.isArray(label.sub)) {
      for (const subLabel of label.sub) {
        const subName = typeof subLabel === 'string' ? subLabel : subLabel.name;
        const subEnvVarName = `LABEL_${label.name.toUpperCase()}_${subName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
        envVars[subEnvVarName] = labelMap[`${label.name}/${subName}`] || '';
      }
    }
  }
  
  return envVars;
}

export default baseMasterSchema;

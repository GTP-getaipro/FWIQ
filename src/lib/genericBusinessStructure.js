/**
 * Generic Business Folder Structure
 * 
 * Streamlined, universal folder structure that works for all business types
 * Focuses on core business functions rather than industry-specific details
 * Reduces complexity while maintaining functionality
 */

export const GENERIC_BUSINESS_STRUCTURE = {
  schemaVersion: "2.0.0",
  lastUpdated: "2025-01-21",
  description: "Generic, streamlined folder structure for all business types. Focuses on core business functions rather than industry-specific details.",
  
  // Universal categories that work for all businesses
  categories: [
    {
      name: "BANKING",
      color: { backgroundColor: "#16a766", textColor: "#ffffff" },
      intent: "ai.financial_transaction",
      description: "Financial transactions, invoices, payments, and money-related communications",
      sub: [
        { name: "BankAlert", description: "Bank notifications and account alerts" },
        { 
          name: "e-Transfer", 
          description: "Electronic money transfers",
          sub: [
            { name: "From Business", description: "Outgoing transfers" },
            { name: "To Business", description: "Incoming transfers" }
          ]
        },
        { name: "Invoice", description: "Invoices and billing statements" },
        { 
          name: "Receipts", 
          description: "Payment receipts and transaction records",
          sub: [
            { name: "Payment Received", description: "Receipts for payments received" },
            { name: "Payment Sent", description: "Receipts for payments sent" }
          ]
        },
        { name: "Refund", description: "Refund requests and confirmations" }
      ]
    },
    {
      name: "FORMSUB",
      color: { backgroundColor: "#0b804b", textColor: "#ffffff" },
      intent: "ai.form_submission",
      description: "Website form submissions and online inquiries",
      sub: [
        { name: "New Submission", description: "New form submissions from website" },
        { name: "Service Requests", description: "Service request forms" }
      ]
    },
    {
      name: "GOOGLE_REVIEW",
      color: { backgroundColor: "#fad165", textColor: "#000000" },
      intent: "ai.customer_feedback",
      description: "Google Business reviews and customer feedback",
      sub: [
        { name: "New Review", description: "New review notifications" },
        { name: "Resolved", description: "Reviews that have been addressed" },
        { name: "Response Needed", description: "Reviews requiring business response" }
      ]
    },
    {
      name: "MANAGER",
      color: { backgroundColor: "#ffad47", textColor: "#000000" },
      intent: "ai.internal_routing",
      description: "Internal management routing and team oversight",
      sub: [
        { name: "Unassigned", description: "Emails not yet assigned to team members" },
        { name: "Escalations", description: "Issues requiring manager attention" },
        { name: "{{Manager1}}", description: "Manager-specific folder", dynamic: true },
        { name: "{{Manager2}}", description: "Manager-specific folder", dynamic: true },
        { name: "{{Manager3}}", description: "Manager-specific folder", dynamic: true }
      ]
    },
    {
      name: "SALES",
      color: { backgroundColor: "#16a766", textColor: "#ffffff" },
      intent: "ai.sales_inquiry",
      description: "Sales inquiries, quotes, and revenue-generating opportunities",
      sub: [
        { name: "Quotes", description: "Price quotes and estimates" },
        { name: "Follow-ups", description: "Sales follow-ups and nurturing" },
        { name: "Consultations", description: "Sales consultations and demos" },
        { name: "{{BusinessSpecific1}}", description: "Business-specific sales category", dynamic: true },
        { name: "{{BusinessSpecific2}}", description: "Business-specific sales category", dynamic: true }
      ]
    },
    {
      name: "SUPPLIERS",
      color: { backgroundColor: "#ffad47", textColor: "#000000" },
      intent: "ai.vendor_communication",
      description: "Supplier and vendor communications",
      sub: [
        { name: "{{Supplier1}}", description: "Primary supplier", dynamic: true },
        { name: "{{Supplier2}}", description: "Secondary supplier", dynamic: true },
        { name: "{{Supplier3}}", description: "Tertiary supplier", dynamic: true },
        { name: "{{Supplier4}}", description: "Additional supplier", dynamic: true },
        { name: "{{Supplier5}}", description: "Additional supplier", dynamic: true }
      ]
    },
    {
      name: "SUPPORT",
      color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
      intent: "ai.support_ticket",
      description: "Customer support and service requests",
      sub: [
        { name: "Appointment Scheduling", description: "Service appointments and bookings" },
        { name: "Technical Support", description: "Technical issues and troubleshooting" },
        { name: "General", description: "General support questions" },
        { name: "Parts & Materials", description: "Parts inquiries and material requests" }
      ]
    },
    {
      name: "URGENT",
      color: { backgroundColor: "#fb4c2f", textColor: "#ffffff" },
      intent: "ai.emergency_request",
      description: "Emergency situations requiring immediate attention",
      sub: [
        { name: "Emergency", description: "General emergency situations" },
        { name: "Safety Issues", description: "Safety hazards and concerns" },
        { name: "System Outage", description: "System failures and outages" },
        { name: "Other", description: "Other urgent matters" }
      ]
    },
    {
      name: "MISC",
      color: { backgroundColor: "#999999", textColor: "#ffffff" },
      intent: "ai.general",
      description: "Miscellaneous emails and general correspondence",
      sub: [
        { name: "Archive", description: "Archived emails and old correspondence" },
        { name: "General", description: "General emails and uncategorized items" }
      ]
    },
    {
      name: "PHONE",
      color: { backgroundColor: "#6d9eeb", textColor: "#ffffff" },
      intent: "ai.call_log",
      description: "Phone communications and call logs",
      sub: [
        { name: "Call Backs", description: "Calls requiring return calls" },
        { name: "Missed Calls", description: "Missed call notifications" },
        { name: "Voicemails", description: "Voicemail messages" }
      ]
    },
    {
      name: "PROMO",
      color: { backgroundColor: "#43d692", textColor: "#000000" },
      intent: "ai.marketing",
      description: "Marketing campaigns and promotional content",
      sub: [
        { name: "Email Campaigns", description: "Email marketing campaigns" },
        { name: "Newsletters", description: "Newsletter communications" },
        { name: "Special Offers", description: "Promotional offers and deals" }
      ]
    },
    {
      name: "RECRUITMENT",
      color: { backgroundColor: "#e07798", textColor: "#ffffff" },
      intent: "ai.hr",
      description: "Human resources and recruitment",
      sub: [
        { name: "Applications", description: "Job applications and resumes" },
        { name: "Interviews", description: "Interview scheduling and feedback" },
        { name: "New Hires", description: "Onboarding and new employee setup" }
      ]
    },
    {
      name: "SOCIALMEDIA",
      color: { backgroundColor: "#ffad47", textColor: "#000000" },
      intent: "ai.social_engagement",
      description: "Social media notifications and engagement",
      sub: [
        { name: "Facebook", description: "Facebook messages and notifications" },
        { name: "Instagram", description: "Instagram DMs and engagement" },
        { name: "LinkedIn", description: "LinkedIn messages and connections" }
      ]
    },
    {
      name: "SEASONAL",
      color: { backgroundColor: "#8e44ad", textColor: "#ffffff" },
      intent: "ai.seasonal_service",
      description: "Seasonal services and maintenance",
      sub: [
        { name: "Annual Service", description: "Annual maintenance and service" },
        { name: "Maintenance", description: "Regular maintenance tasks" },
        { name: "Seasonal Prep", description: "Seasonal preparation work" },
        { name: "Other", description: "Other seasonal activities" }
      ]
    }
  ],
  
  // Dynamic value injection
  dynamicVariables: {
    managers: ["{{Manager1}}", "{{Manager2}}", "{{Manager3}}"],
    suppliers: ["{{Supplier1}}", "{{Supplier2}}", "{{Supplier3}}", "{{Supplier4}}", "{{Supplier5}}"],
    businessSpecific: ["{{BusinessSpecific1}}", "{{BusinessSpecific2}}"]
  },
  
  // Folder creation order
  provisioningOrder: [
    "BANKING",
    "FORMSUB", 
    "GOOGLE_REVIEW",
    "MANAGER",
    "SALES",
    "SUPPLIERS",
    "SUPPORT",
    "URGENT",
    "MISC",
    "PHONE",
    "PROMO",
    "RECRUITMENT",
    "SOCIALMEDIA",
    "SEASONAL"
  ]
};

/**
 * Business-specific customizations for generic structure
 */
export const BUSINESS_CUSTOMIZATIONS = {
  "Pools & Spas": {
    businessSpecific: ["New Hot Tubs", "Covers & Accessories"],
    urgent: ["Leaking", "No Power", "Pump Not Working", "Heater Error", "Control Panel Issue"]
  },
  "HVAC": {
    businessSpecific: ["New System Quotes", "Maintenance Plans"],
    urgent: ["No Heat", "No Cooling", "Carbon Monoxide Alert", "Water Leak"]
  },
  "Electrician": {
    businessSpecific: ["New Installation Quotes", "Service Quotes"],
    urgent: ["Power Outage", "Electrical Emergency", "Safety Hazard", "Fire Risk"]
  },
  "General Contractor": {
    businessSpecific: ["New Project Quotes", "Renovation Quotes"],
    urgent: ["Safety Issues", "Weather Damage", "Structural Problems", "Other"]
  },
  "Landscaping": {
    businessSpecific: ["Design Consultations", "Installation Quotes"],
    urgent: ["Storm Damage", "Irrigation Emergency", "Tree Removal", "Other"]
  },
  "Roofing": {
    businessSpecific: ["Roof Replacement Quotes", "Repair Quotes"],
    urgent: ["Storm Damage", "Leak Emergency", "Structural Damage", "Other"]
  }
};

/**
 * Generate generic folder structure for any business type
 * @param {string} businessType - Business type
 * @param {Array} managers - Array of manager names
 * @param {Array} suppliers - Array of supplier names
 * @returns {Object} Complete folder structure
 */
export function generateGenericStructure(businessType, managers = [], suppliers = []) {
  const customization = BUSINESS_CUSTOMIZATIONS[businessType] || {};
  
  // Clone the base structure
  const structure = JSON.parse(JSON.stringify(GENERIC_BUSINESS_STRUCTURE));
  
  // Inject dynamic values
  structure.categories.forEach(category => {
    if (category.name === "MANAGER") {
      category.sub = category.sub.map(sub => {
        if (sub.dynamic) {
          const managerIndex = parseInt(sub.name.match(/\d+/)[0]) - 1;
          return {
            ...sub,
            name: managers[managerIndex] || sub.name,
            description: `Manager: ${managers[managerIndex] || 'Not assigned'}`
          };
        }
        return sub;
      });
    }
    
    if (category.name === "SUPPLIERS") {
      category.sub = category.sub.map(sub => {
        if (sub.dynamic) {
          const supplierIndex = parseInt(sub.name.match(/\d+/)[0]) - 1;
          return {
            ...sub,
            name: suppliers[supplierIndex] || sub.name,
            description: `Supplier: ${suppliers[supplierIndex] || 'Not assigned'}`
          };
        }
        return sub;
      });
    }
    
    if (category.name === "SALES" && customization.businessSpecific) {
      category.sub = category.sub.map(sub => {
        if (sub.name === "{{BusinessSpecific1}}") {
          return {
            ...sub,
            name: customization.businessSpecific[0] || "Product Sales",
            description: `Primary sales category for ${businessType}`
          };
        }
        if (sub.name === "{{BusinessSpecific2}}") {
          return {
            ...sub,
            name: customization.businessSpecific[1] || "Service Sales",
            description: `Secondary sales category for ${businessType}`
          };
        }
        return sub;
      });
    }
    
    if (category.name === "URGENT" && customization.urgent) {
      category.sub = customization.urgent.map(urgentType => ({
        name: urgentType,
        description: `${urgentType} emergency for ${businessType}`
      }));
    }
  });
  
  return structure;
}

export default GENERIC_BUSINESS_STRUCTURE;

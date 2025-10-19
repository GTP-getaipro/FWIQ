/**
 * CORRECTED Unified Intent-Based Folder Structure
 * 
 * This structure respects the existing hierarchical organization from poolsSpasLabels.js
 * and creates a cleaner, intent-driven structure that reduces redundancy while
 * maintaining the proper parent/subfolder relationships.
 */

export const CORRECTED_UNIFIED_STRUCTURE = {
  /**
   * Banking & Financial Operations
   * Combines all financial activities across business types
   */
  BANKING: {
    category: 'Banking',
    sort_order: 1,
    color: '#16a766', // Green
    subfolders: [
      {
        name: 'Invoice',
        intent: 'invoice',
        keywords: ['invoice', 'bill', 'statement'],
        sort_order: 1
      },
      {
        name: 'Receipts',
        intent: 'receipt',
        keywords: ['receipt', 'payment confirmation'],
        sort_order: 2,
        children: [
          { name: 'Payment Sent', intent: 'payment_sent', keywords: ['payment sent', 'outgoing'] },
          { name: 'Payment Received', intent: 'payment_received', keywords: ['payment received', 'incoming'] }
        ]
      },
      {
        name: 'Refund',
        intent: 'refund',
        keywords: ['refund', 'return', 'credit'],
        sort_order: 3
      },
      {
        name: 'Payment Confirmation',
        intent: 'payment_confirmation',
        keywords: ['payment confirmation', 'paid'],
        sort_order: 4
      },
      {
        name: 'Bank Alert',
        intent: 'bank_alert',
        keywords: ['bank alert', 'banking', 'account'],
        sort_order: 5
      },
      {
        name: 'e-Transfer',
        intent: 'etransfer',
        keywords: ['e-transfer', 'interac', 'transfer'],
        sort_order: 6
      }
    ]
  },

  /**
   * Service Operations
   * All service-related activities (repairs, installations, maintenance)
   */
  SERVICE: {
    category: 'Service',
    sort_order: 2,
    color: '#4a86e8', // Blue
    subfolders: [
      {
        name: 'Repairs',
        intent: 'repair',
        keywords: ['repair', 'fix', 'broken', 'damaged'],
        sort_order: 1,
        children: [
          { name: 'Pump Repairs', intent: 'pump_repair', keywords: ['pump', 'motor'] },
          { name: 'Heater Repairs', intent: 'heater_repair', keywords: ['heater', 'heating'] },
          { name: 'Filter Repairs', intent: 'filter_repair', keywords: ['filter', 'cartridge'] },
          { name: 'Leak Repairs', intent: 'leak_repair', keywords: ['leak', 'leaking'] },
          { name: 'Electrical Repairs', intent: 'electrical_repair', keywords: ['electrical', 'wiring'] }
        ]
      },
      {
        name: 'Installations',
        intent: 'installation',
        keywords: ['installation', 'install', 'setup'],
        sort_order: 2,
        children: [
          { name: 'New Spa Installation', intent: 'spa_installation', keywords: ['spa', 'hot tub'] },
          { name: 'Cold Plunge Installation', intent: 'cold_plunge_installation', keywords: ['cold plunge', 'ice bath'] },
          { name: 'Sauna Installation', intent: 'sauna_installation', keywords: ['sauna', 'infrared'] },
          { name: 'Accessory Installation', intent: 'accessory_installation', keywords: ['accessory', 'part'] }
        ]
      },
      {
        name: 'Maintenance',
        intent: 'maintenance',
        keywords: ['maintenance', 'service', 'check-up'],
        sort_order: 3,
        children: [
          { name: 'Regular Maintenance', intent: 'regular_maintenance', keywords: ['regular', 'routine'] },
          { name: 'Seasonal Maintenance', intent: 'seasonal_maintenance', keywords: ['seasonal', 'winter', 'summer'] },
          { name: 'Winterization', intent: 'winterization', keywords: ['winterize', 'winter'] },
          { name: 'Spring Opening', intent: 'spring_opening', keywords: ['spring', 'opening'] }
        ]
      },
      {
        name: 'Water Care Visits',
        intent: 'water_care',
        keywords: ['water care', 'chemical', 'testing'],
        sort_order: 4,
        children: [
          { name: 'Water Testing', intent: 'water_testing', keywords: ['water test', 'testing'] },
          { name: 'Chemical Balancing', intent: 'chemical_balancing', keywords: ['chemical', 'balance'] },
          { name: 'Filter Cleaning', intent: 'filter_cleaning', keywords: ['filter clean', 'cleaning'] },
          { name: 'Water Treatment', intent: 'water_treatment', keywords: ['water treatment', 'treatment'] }
        ]
      },
      {
        name: 'Warranty Service',
        intent: 'warranty_service',
        keywords: ['warranty', 'covered', 'claim'],
        sort_order: 5
      },
      {
        name: 'Emergency Service',
        intent: 'emergency_service',
        keywords: ['emergency', 'urgent', 'asap'],
        sort_order: 6
      }
    ]
  },

  /**
   * Sales & New Business
   * All sales activities across business types
   */
  SALES: {
    category: 'Sales',
    sort_order: 3,
    color: '#149e60', // Green
    subfolders: [
      {
        name: 'New Spa Sales',
        intent: 'spa_sales',
        keywords: ['spa', 'hot tub', 'jacuzzi'],
        sort_order: 1,
        children: [
          { name: 'Hot Tub Sales', intent: 'hot_tub_sales', keywords: ['hot tub'] },
          { name: 'Spa Packages', intent: 'spa_packages', keywords: ['package', 'bundle'] },
          { name: 'Financing Options', intent: 'financing', keywords: ['financing', 'loan', 'payment plan'] }
        ]
      },
      {
        name: 'Cold Plunge Sales',
        intent: 'cold_plunge_sales',
        keywords: ['cold plunge', 'ice bath', 'cold therapy'],
        sort_order: 2
      },
      {
        name: 'Sauna Sales',
        intent: 'sauna_sales',
        keywords: ['sauna', 'infrared', 'steam'],
        sort_order: 3
      },
      {
        name: 'Accessory Sales',
        intent: 'accessory_sales',
        keywords: ['accessory', 'part', 'add-on'],
        sort_order: 4
      },
      {
        name: 'Consultations',
        intent: 'consultation',
        keywords: ['consultation', 'quote', 'estimate'],
        sort_order: 5,
        children: [
          { name: 'Site Visits', intent: 'site_visit', keywords: ['site visit', 'inspection'] },
          { name: 'Product Demos', intent: 'product_demo', keywords: ['demo', 'demonstration'] },
          { name: 'Custom Quotes', intent: 'custom_quote', keywords: ['custom', 'quote'] }
        ]
      }
    ]
  },

  /**
   * Customer Support & Technical Assistance
   */
  SUPPORT: {
    category: 'Support',
    sort_order: 4,
    color: '#4a86e8', // Blue
    subfolders: [
      {
        name: 'Technical Support',
        intent: 'technical_support',
        keywords: ['technical', 'help', 'issue', 'problem'],
        sort_order: 1,
        children: [
          { name: 'Troubleshooting', intent: 'troubleshooting', keywords: ['troubleshoot', 'diagnose'] },
          { name: 'Remote Support', intent: 'remote_support', keywords: ['remote', 'online'] },
          { name: 'Technical Documentation', intent: 'technical_docs', keywords: ['documentation', 'manual'] }
        ]
      },
      {
        name: 'Appointment Scheduling',
        intent: 'appointment',
        keywords: ['appointment', 'schedule', 'booking'],
        sort_order: 2
      },
      {
        name: 'Electrical Issues',
        intent: 'electrical_issue',
        keywords: ['electrical', 'power', 'wiring'],
        sort_order: 3
      },
      {
        name: 'Water Chemistry',
        intent: 'water_chemistry',
        keywords: ['water chemistry', 'chemical', 'ph'],
        sort_order: 4,
        children: [
          { name: 'Water Testing', intent: 'water_testing_support', keywords: ['water test'] },
          { name: 'Chemical Questions', intent: 'chemical_questions', keywords: ['chemical question'] },
          { name: 'Water Balance Issues', intent: 'water_balance', keywords: ['water balance', 'imbalance'] }
        ]
      },
      {
        name: 'Parts & Chemicals',
        intent: 'parts_chemicals',
        keywords: ['parts', 'chemicals', 'supplies'],
        sort_order: 5,
        children: [
          { name: 'Parts Orders', intent: 'parts_order', keywords: ['parts order'] },
          { name: 'Chemical Orders', intent: 'chemical_order', keywords: ['chemical order'] },
          { name: 'Product Questions', intent: 'product_question', keywords: ['product question'] }
        ]
      },
      {
        name: 'General',
        intent: 'general_support',
        keywords: ['general', 'other', 'misc'],
        sort_order: 6
      }
    ]
  },

  /**
   * Warranty & Claims Management
   */
  WARRANTY: {
    category: 'Warranty',
    sort_order: 5,
    color: '#a479e2', // Purple
    subfolders: [
      {
        name: 'Claims',
        intent: 'warranty_claim',
        keywords: ['claim', 'warranty', 'defect'],
        sort_order: 1,
        children: [
          { name: 'New Claims', intent: 'new_claim', keywords: ['new claim'] },
          { name: 'Claim Documentation', intent: 'claim_docs', keywords: ['claim documentation'] },
          { name: 'Claim Follow-up', intent: 'claim_followup', keywords: ['claim follow up'] }
        ]
      },
      {
        name: 'Pending Review',
        intent: 'pending_review',
        keywords: ['pending', 'review', 'waiting'],
        sort_order: 2
      },
      {
        name: 'Resolved',
        intent: 'resolved',
        keywords: ['resolved', 'fixed', 'completed'],
        sort_order: 3
      },
      {
        name: 'Denied',
        intent: 'denied',
        keywords: ['denied', 'rejected', 'not covered'],
        sort_order: 4
      },
      {
        name: 'Warranty Parts',
        intent: 'warranty_parts',
        keywords: ['warranty part', 'replacement'],
        sort_order: 5,
        children: [
          { name: 'Parts Ordered', intent: 'parts_ordered', keywords: ['parts ordered'] },
          { name: 'Parts Received', intent: 'parts_received', keywords: ['parts received'] },
          { name: 'Parts Installation', intent: 'parts_installation', keywords: ['parts installation'] }
        ]
      }
    ]
  },

  /**
   * Supplier & Vendor Management
   */
  SUPPLIERS: {
    category: 'Suppliers',
    sort_order: 6,
    color: '#ffad47', // Orange
    subfolders: [
      {
        name: 'AquaSpaPoolSupply',
        intent: 'aquaspa_supplier',
        keywords: ['aquaspa', 'pool supply'],
        sort_order: 1,
        children: [
          { name: 'Parts Orders', intent: 'aquaspa_parts', keywords: ['parts order'] },
          { name: 'Chemical Orders', intent: 'aquaspa_chemicals', keywords: ['chemical order'] },
          { name: 'Equipment Orders', intent: 'aquaspa_equipment', keywords: ['equipment order'] }
        ]
      },
      {
        name: 'StrongSpas',
        intent: 'strongspas_supplier',
        keywords: ['strongspas', 'spa manufacturer'],
        sort_order: 2,
        children: [
          { name: 'Spa Orders', intent: 'strongspas_orders', keywords: ['spa order'] },
          { name: 'Warranty Claims', intent: 'strongspas_warranty', keywords: ['warranty claim'] },
          { name: 'Technical Support', intent: 'strongspas_support', keywords: ['technical support'] }
        ]
      },
      {
        name: 'WaterwayPlastics',
        intent: 'waterway_supplier',
        keywords: ['waterway', 'plastics'],
        sort_order: 3,
        children: [
          { name: 'Plumbing Parts', intent: 'waterway_plumbing', keywords: ['plumbing parts'] },
          { name: 'Filter Orders', intent: 'waterway_filters', keywords: ['filter order'] },
          { name: 'Replacement Parts', intent: 'waterway_replacement', keywords: ['replacement parts'] }
        ]
      },
      {
        name: 'Cold Plunge Co',
        intent: 'cold_plunge_co',
        keywords: ['cold plunge co'],
        sort_order: 4,
        children: [
          { name: 'Cold Plunge Orders', intent: 'cold_plunge_orders', keywords: ['cold plunge order'] },
          { name: 'Installation Support', intent: 'cold_plunge_install', keywords: ['installation support'] },
          { name: 'Maintenance', intent: 'cold_plunge_maintenance', keywords: ['maintenance'] }
        ]
      },
      {
        name: 'Sauna Suppliers',
        intent: 'sauna_suppliers',
        keywords: ['sauna supplier'],
        sort_order: 5,
        children: [
          { name: 'Sauna Orders', intent: 'sauna_orders', keywords: ['sauna order'] },
          { name: 'Heater Orders', intent: 'sauna_heater', keywords: ['heater order'] },
          { name: 'Accessory Orders', intent: 'sauna_accessories', keywords: ['accessory order'] }
        ]
      }
    ]
  },

  /**
   * Management & Team Operations
   */
  MANAGER: {
    category: 'Manager',
    sort_order: 7,
    color: '#ffad47', // Orange
    subfolders: [
      {
        name: 'Unassigned',
        intent: 'unassigned',
        keywords: ['unassigned', 'new', 'pending assignment'],
        sort_order: 1
      },
      {
        name: 'Team Assignments',
        intent: 'team_assignment',
        keywords: ['team assignment', 'assign', 'dispatch'],
        sort_order: 2
      },
      {
        name: 'Manager Review',
        intent: 'manager_review',
        keywords: ['manager review', 'approval', 'supervisor'],
        sort_order: 3
      },
      {
        name: 'Escalations',
        intent: 'escalation',
        keywords: ['escalate', 'escalation', 'urgent'],
        sort_order: 4
      }
    ]
  },

  /**
   * Form Submissions & Work Orders
   */
  FORMSUB: {
    category: 'FormSub',
    sort_order: 8,
    color: '#0b804b', // Dark Green
    subfolders: [
      {
        name: 'New Submission',
        intent: 'new_submission',
        keywords: ['new submission', 'form submitted'],
        sort_order: 1
      },
      {
        name: 'Work Order Forms',
        intent: 'work_order',
        keywords: ['work order', 'service request'],
        sort_order: 2
      },
      {
        name: 'Service Requests',
        intent: 'service_request',
        keywords: ['service request', 'maintenance request'],
        sort_order: 3
      },
      {
        name: 'Quote Requests',
        intent: 'quote_request',
        keywords: ['quote request', 'estimate request'],
        sort_order: 4
      }
    ]
  },

  /**
   * Google Reviews & Reputation Management
   */
  GOOGLE_REVIEW: {
    category: 'GoogleReview',
    sort_order: 9,
    color: '#fad165', // Yellow
    subfolders: [
      {
        name: 'New Reviews',
        intent: 'new_review',
        keywords: ['new review', 'review received'],
        sort_order: 1
      },
      {
        name: 'Review Responses',
        intent: 'review_response',
        keywords: ['review response', 'reply'],
        sort_order: 2
      },
      {
        name: 'Review Requests',
        intent: 'review_request',
        keywords: ['review request', 'ask for review'],
        sort_order: 3
      }
    ]
  },

  /**
   * Social Media & Marketing
   */
  SOCIALMEDIA: {
    category: 'SocialMedia',
    sort_order: 10,
    color: '#ffad47', // Orange
    subfolders: [
      {
        name: 'Facebook',
        intent: 'facebook',
        keywords: ['facebook', 'fb'],
        sort_order: 1
      },
      {
        name: 'Instagram',
        intent: 'instagram',
        keywords: ['instagram', 'ig', 'insta'],
        sort_order: 2
      },
      {
        name: 'Google My Business',
        intent: 'google_business',
        keywords: ['google business', 'gmb'],
        sort_order: 3
      },
      {
        name: 'LinkedIn',
        intent: 'linkedin',
        keywords: ['linkedin'],
        sort_order: 4
      }
    ]
  },

  /**
   * Promotional & Marketing Communications
   */
  PROMO: {
    category: 'Promo',
    sort_order: 11,
    color: '#43d692', // Light Green
    subfolders: [
      {
        name: 'Email Campaigns',
        intent: 'email_campaign',
        keywords: ['email campaign', 'newsletter'],
        sort_order: 1
      },
      {
        name: 'Social Media',
        intent: 'social_media',
        keywords: ['social media', 'social'],
        sort_order: 2
      },
      {
        name: 'Newsletters',
        intent: 'newsletter',
        keywords: ['newsletter', 'bulletin'],
        sort_order: 3
      },
      {
        name: 'Special Offers',
        intent: 'special_offer',
        keywords: ['special offer', 'promotion', 'deal'],
        sort_order: 4
      }
    ]
  },

  /**
   * Phone Communications
   */
  PHONE: {
    category: 'Phone',
    sort_order: 12,
    color: '#6d9eeb', // Blue
    subfolders: [
      {
        name: 'Incoming Calls',
        intent: 'incoming_call',
        keywords: ['incoming call', 'call received'],
        sort_order: 1
      },
      {
        name: 'Outgoing Calls',
        intent: 'outgoing_call',
        keywords: ['outgoing call', 'call made'],
        sort_order: 2
      },
      {
        name: 'Voicemails',
        intent: 'voicemail',
        keywords: ['voicemail', 'message'],
        sort_order: 3
      },
      {
        name: 'Call Logs',
        intent: 'call_log',
        keywords: ['call log', 'call history'],
        sort_order: 4
      }
    ]
  },

  /**
   * Recruitment & HR
   */
  RECRUITMENT: {
    category: 'Recruitment',
    sort_order: 13,
    color: '#e07798', // Pink
    subfolders: [
      {
        name: 'Job Applications',
        intent: 'job_application',
        keywords: ['job application', 'resume', 'cv'],
        sort_order: 1
      },
      {
        name: 'Interview Scheduling',
        intent: 'interview_scheduling',
        keywords: ['interview', 'scheduling'],
        sort_order: 2
      },
      {
        name: 'New Hires',
        intent: 'new_hire',
        keywords: ['new hire', 'onboarding'],
        sort_order: 3
      },
      {
        name: 'HR Communications',
        intent: 'hr_communication',
        keywords: ['hr', 'human resources'],
        sort_order: 4
      }
    ]
  },

  /**
   * Urgent & Emergency
   */
  URGENT: {
    category: 'Urgent',
    sort_order: 14,
    color: '#fb4c2f', // Red
    subfolders: [
      {
        name: 'Emergency Repairs',
        intent: 'emergency_repair',
        keywords: ['emergency repair', 'urgent repair'],
        sort_order: 1
      },
      {
        name: 'Safety Issues',
        intent: 'safety_issue',
        keywords: ['safety', 'hazard', 'danger'],
        sort_order: 2
      },
      {
        name: 'Leak Emergencies',
        intent: 'leak_emergency',
        keywords: ['leak emergency', 'water leak'],
        sort_order: 3
      },
      {
        name: 'Power Outages',
        intent: 'power_outage',
        keywords: ['power outage', 'no power'],
        sort_order: 4
      }
    ]
  },

  /**
   * Miscellaneous & General
   */
  MISC: {
    category: 'Misc',
    sort_order: 15,
    color: '#999999', // Grey
    subfolders: [
      {
        name: 'General',
        intent: 'general',
        keywords: ['general', 'other'],
        sort_order: 1
      },
      {
        name: 'Archive',
        intent: 'archive',
        keywords: ['archive', 'old'],
        sort_order: 2
      },
      {
        name: 'Personal',
        intent: 'personal',
        keywords: ['personal', 'private'],
        sort_order: 3
      }
    ]
  }
};

/**
 * Generate the corrected folder structure for migration
 */
export function getCorrectedFolderStructure() {
  const folders = [];
  
  Object.entries(CORRECTED_UNIFIED_STRUCTURE).forEach(([key, category]) => {
    // Add parent category folder
    folders.push({
      name: category.category,
      category: category.category,
      intent: category.category.toLowerCase(),
      path: category.category,
      sort_order: category.sort_order,
      color: category.color,
      isParent: true,
      level: 1
    });

    // Add subfolders
    category.subfolders.forEach(subfolder => {
      folders.push({
        name: subfolder.name,
        category: category.category,
        intent: subfolder.intent,
        path: `${category.category}/${subfolder.name}`,
        keywords: subfolder.keywords || [],
        priority: subfolder.priority || 'normal',
        sort_order: subfolder.sort_order,
        color: category.color,
        isParent: false,
        hasChildren: !!subfolder.children,
        level: 2,
        parentIntent: category.category.toLowerCase()
      });

      // Add children (nested folders)
      if (subfolder.children) {
        subfolder.children.forEach(child => {
          folders.push({
            name: child.name,
            category: category.category,
            intent: child.intent,
            path: `${category.category}/${subfolder.name}/${child.name}`,
            keywords: child.keywords || [],
            priority: 'normal',
            sort_order: child.sort_order || 0,
            color: category.color,
            isParent: false,
            hasChildren: false,
            level: 3,
            parentIntent: subfolder.intent
          });
        });
      }
    });
  });

  return folders;
}

/**
 * Map existing flat folders to new hierarchical structure
 */
export const FOLDER_MIGRATION_MAP = {
  // Banking
  'Invoice': { category: 'Banking', parent: 'Banking', intent: 'invoice' },
  'Receipts': { category: 'Banking', parent: 'Banking', intent: 'receipt' },
  'Refund': { category: 'Banking', parent: 'Banking', intent: 'refund' },
  'Payment Confirmation': { category: 'Banking', parent: 'Banking', intent: 'payment_confirmation' },
  'Bank Alert': { category: 'Banking', parent: 'Banking', intent: 'bank_alert' },
  'e-Transfer': { category: 'Banking', parent: 'Banking', intent: 'etransfer' },
  
  // Service
  'Repairs': { category: 'Service', parent: 'Service', intent: 'repair' },
  'Installations': { category: 'Service', parent: 'Service', intent: 'installation' },
  'Maintenance': { category: 'Service', parent: 'Service', intent: 'maintenance' },
  'Water Care Visits': { category: 'Service', parent: 'Service', intent: 'water_care' },
  'Warranty Service': { category: 'Service', parent: 'Service', intent: 'warranty_service' },
  'Emergency Service': { category: 'Service', parent: 'Service', intent: 'emergency_service' },
  
  // Sales
  'New Spa Sales': { category: 'Sales', parent: 'Sales', intent: 'spa_sales' },
  'Cold Plunge Sales': { category: 'Sales', parent: 'Sales', intent: 'cold_plunge_sales' },
  'Sauna Sales': { category: 'Sales', parent: 'Sales', intent: 'sauna_sales' },
  'Accessory Sales': { category: 'Sales', parent: 'Sales', intent: 'accessory_sales' },
  'Consultations': { category: 'Sales', parent: 'Sales', intent: 'consultation' },
  'Quote Requests': { category: 'Sales', parent: 'Sales', intent: 'quote_request' },
  
  // Support
  'Technical Support': { category: 'Support', parent: 'Support', intent: 'technical_support' },
  'Appointment Scheduling': { category: 'Support', parent: 'Support', intent: 'appointment' },
  'Electrical Issues': { category: 'Support', parent: 'Support', intent: 'electrical_issue' },
  'Water Chemistry': { category: 'Support', parent: 'Support', intent: 'water_chemistry' },
  'Parts & Chemicals': { category: 'Support', parent: 'Support', intent: 'parts_chemicals' },
  'General': { category: 'Support', parent: 'Support', intent: 'general_support' },
  
  // Warranty
  'Claims': { category: 'Warranty', parent: 'Warranty', intent: 'warranty_claim' },
  'Pending Review': { category: 'Warranty', parent: 'Warranty', intent: 'pending_review' },
  'Resolved': { category: 'Warranty', parent: 'Warranty', intent: 'resolved' },
  'Denied': { category: 'Warranty', parent: 'Warranty', intent: 'denied' },
  'Warranty Parts': { category: 'Warranty', parent: 'Warranty', intent: 'warranty_parts' },
  
  // Suppliers
  'AquaSpaPoolSupply': { category: 'Suppliers', parent: 'Suppliers', intent: 'aquaspa_supplier' },
  'StrongSpas': { category: 'Suppliers', parent: 'Suppliers', intent: 'strongspas_supplier' },
  'WaterwayPlastics': { category: 'Suppliers', parent: 'Suppliers', intent: 'waterway_supplier' },
  'Cold Plunge Co': { category: 'Suppliers', parent: 'Suppliers', intent: 'cold_plunge_co' },
  'Sauna Suppliers': { category: 'Suppliers', parent: 'Suppliers', intent: 'sauna_suppliers' },
  
  // Manager
  'Unassigned': { category: 'Manager', parent: 'Manager', intent: 'unassigned' },
  'Team Assignments': { category: 'Manager', parent: 'Manager', intent: 'team_assignment' },
  'Manager Review': { category: 'Manager', parent: 'Manager', intent: 'manager_review' },
  'Escalations': { category: 'Manager', parent: 'Manager', intent: 'escalation' },
  
  // FormSub
  'New Submission': { category: 'FormSub', parent: 'FormSub', intent: 'new_submission' },
  'Work Order Forms': { category: 'FormSub', parent: 'FormSub', intent: 'work_order' },
  'Service Requests': { category: 'FormSub', parent: 'FormSub', intent: 'service_request' },
  
  // Google Review
  'New Reviews': { category: 'GoogleReview', parent: 'Google Review', intent: 'new_review' },
  'Review Responses': { category: 'GoogleReview', parent: 'Google Review', intent: 'review_response' },
  'Review Requests': { category: 'GoogleReview', parent: 'Google Review', intent: 'review_request' },
  
  // Social Media
  'Facebook': { category: 'SocialMedia', parent: 'Social Media', intent: 'facebook' },
  'Instagram': { category: 'SocialMedia', parent: 'Social Media', intent: 'instagram' },
  'Google My Business': { category: 'SocialMedia', parent: 'Social Media', intent: 'google_business' },
  'LinkedIn': { category: 'SocialMedia', parent: 'Social Media', intent: 'linkedin' },
  
  // Promo
  'Email Campaigns': { category: 'Promo', parent: 'Promo', intent: 'email_campaign' },
  'Social Media': { category: 'Promo', parent: 'Promo', intent: 'social_media' },
  'Newsletters': { category: 'Promo', parent: 'Promo', intent: 'newsletter' },
  'Special Offers': { category: 'Promo', parent: 'Promo', intent: 'special_offer' },
  
  // Phone
  'Incoming Calls': { category: 'Phone', parent: 'Phone', intent: 'incoming_call' },
  'Outgoing Calls': { category: 'Phone', parent: 'Phone', intent: 'outgoing_call' },
  'Voicemails': { category: 'Phone', parent: 'Phone', intent: 'voicemail' },
  'Call Logs': { category: 'Phone', parent: 'Phone', intent: 'call_log' },
  
  // Recruitment
  'Job Applications': { category: 'Recruitment', parent: 'Recruitment', intent: 'job_application' },
  'Interview Scheduling': { category: 'Recruitment', parent: 'Recruitment', intent: 'interview_scheduling' },
  'New Hires': { category: 'Recruitment', parent: 'Recruitment', intent: 'new_hire' },
  'HR Communications': { category: 'Recruitment', parent: 'Recruitment', intent: 'hr_communication' },
  
  // Urgent
  'Emergency Repairs': { category: 'Urgent', parent: 'Urgent', intent: 'emergency_repair' },
  'Safety Issues': { category: 'Urgent', parent: 'Urgent', intent: 'safety_issue' },
  'Leak Emergencies': { category: 'Urgent', parent: 'Urgent', intent: 'leak_emergency' },
  'Power Outages': { category: 'Urgent', parent: 'Urgent', intent: 'power_outage' },
  
  // Misc
  'General': { category: 'Misc', parent: 'Misc', intent: 'general' },
  'Archive': { category: 'Misc', parent: 'Misc', intent: 'archive' },
  'Personal': { category: 'Misc', parent: 'Misc', intent: 'personal' }
};



/**
 * Unified Intent-Based Folder Structure
 * 
 * This structure combines multiple business types (Pools, Spas, Saunas, etc.)
 * into a single, intelligent hierarchy organized by functional intent rather
 * than business type.
 * 
 * Benefits:
 * - Cleaner Outlook/Gmail navigation
 * - Simpler n8n routing logic
 * - AI-friendly classification
 * - Multi-business scalability
 * - ~40% fewer total folders
 */

export const UNIFIED_FOLDER_STRUCTURE = {
  /**
   * Sales Department - All revenue-generating activities
   */
  SALES: {
    category: 'Sales',
    sort_order: 1,
    color: '#34D399', // Green
    subfolders: [
      {
        name: 'Pools Sales',
        intent: 'lead_pools',
        keywords: ['pool', 'swimming pool', 'inground', 'above ground'],
        sort_order: 1
      },
      {
        name: 'Spa Sales',
        intent: 'lead_spa',
        keywords: ['spa', 'hot tub', 'jacuzzi', 'whirlpool'],
        sort_order: 2
      },
      {
        name: 'Sauna & Icebath Sales',
        intent: 'lead_sauna',
        keywords: ['sauna', 'ice bath', 'cold plunge', 'infrared'],
        sort_order: 3
      },
      {
        name: 'Accessory Sales',
        intent: 'lead_accessory',
        keywords: ['cover', 'filter', 'chemical', 'accessory', 'part'],
        sort_order: 4
      },
      {
        name: 'Quotes',
        intent: 'quote',
        keywords: ['quote', 'estimate', 'pricing', 'proposal'],
        sort_order: 5
      },
      {
        name: 'Denied',
        intent: 'denied',
        keywords: ['denied', 'rejected', 'not interested', 'lost'],
        sort_order: 6
      }
    ]
  },

  /**
   * Support Department - Customer service and technical assistance
   */
  SUPPORT: {
    category: 'Support',
    sort_order: 2,
    color: '#F59E0B', // Amber
    subfolders: [
      {
        name: 'Emergency Service',
        intent: 'emergency',
        keywords: ['emergency', 'urgent', 'ASAP', 'leak', 'broken'],
        priority: 'high',
        sort_order: 1
      },
      {
        name: 'Technical Support',
        intent: 'technical',
        keywords: ['technical', 'help', 'issue', 'problem', 'not working'],
        sort_order: 2
      },
      {
        name: 'Maintenance',
        intent: 'maintenance',
        keywords: ['maintenance', 'cleaning', 'service', 'check-up'],
        sort_order: 3
      },
      {
        name: 'Warranty Service',
        intent: 'warranty',
        keywords: ['warranty', 'defect', 'claim', 'covered'],
        sort_order: 4
      },
      {
        name: 'Warranty Parts',
        intent: 'warranty_parts',
        keywords: ['warranty part', 'replacement', 'defective part'],
        sort_order: 5
      },
      {
        name: 'Repairs',
        intent: 'repair',
        keywords: ['repair', 'fix', 'broken', 'damaged'],
        sort_order: 6
      },
      {
        name: 'Resolved',
        intent: 'resolved',
        keywords: ['resolved', 'fixed', 'completed', 'closed'],
        sort_order: 7
      },
      {
        name: 'Urgent',
        intent: 'urgent',
        keywords: ['urgent', 'priority', 'critical'],
        priority: 'high',
        sort_order: 8
      }
    ]
  },

  /**
   * Operations Department - Job lifecycle and execution
   */
  OPERATIONS: {
    category: 'Operations',
    sort_order: 3,
    color: '#3B82F6', // Blue
    subfolders: [
      {
        name: 'Installations',
        intent: 'installation',
        keywords: ['installation', 'install', 'setup', 'delivery'],
        sort_order: 1
      },
      {
        name: 'Consultations',
        intent: 'consultation',
        keywords: ['consultation', 'assessment', 'evaluation', 'site visit'],
        sort_order: 2
      },
      {
        name: 'Team Assignments',
        intent: 'assignment',
        keywords: ['assign', 'schedule', 'dispatch', 'technician'],
        sort_order: 3
      },
      {
        name: 'Pending Review',
        intent: 'pending_review',
        keywords: ['pending', 'review', 'waiting', 'hold'],
        sort_order: 4
      },
      {
        name: 'Manager Review',
        intent: 'manager_review',
        keywords: ['manager', 'approval', 'supervisor'],
        sort_order: 5
      },
      {
        name: 'Completed',
        intent: 'completed',
        keywords: ['completed', 'done', 'finished'],
        sort_order: 6
      }
    ]
  },

  /**
   * Marketing Department - Outbound campaigns and brand activities
   */
  MARKETING: {
    category: 'Marketing',
    sort_order: 4,
    color: '#EC4899', // Pink
    subfolders: [
      {
        name: 'Social Media',
        intent: 'social_media',
        sort_order: 1,
        children: [
          {
            name: 'Instagram',
            intent: 'instagram',
            keywords: ['instagram', 'ig', 'insta']
          },
          {
            name: 'Facebook',
            intent: 'facebook',
            keywords: ['facebook', 'fb']
          },
          {
            name: 'LinkedIn',
            intent: 'linkedin',
            keywords: ['linkedin']
          },
          {
            name: 'Google My Business',
            intent: 'google_business',
            keywords: ['google', 'gmb', 'google review']
          }
        ]
      },
      {
        name: 'Email Campaigns',
        intent: 'email_campaign',
        keywords: ['campaign', 'newsletter', 'promotion'],
        sort_order: 2
      },
      {
        name: 'Special Offers',
        intent: 'special_offer',
        keywords: ['offer', 'discount', 'sale', 'promo'],
        sort_order: 3
      }
    ]
  },

  /**
   * HR Department - People operations
   */
  HR: {
    category: 'HR',
    sort_order: 5,
    color: '#8B5CF6', // Purple
    subfolders: [
      {
        name: 'Job Applications',
        intent: 'job_application',
        keywords: ['application', 'apply', 'resume', 'cv'],
        sort_order: 1
      },
      {
        name: 'Interviews',
        intent: 'interview',
        keywords: ['interview', 'candidate', 'screening'],
        sort_order: 2
      },
      {
        name: 'New Hires',
        intent: 'new_hire',
        keywords: ['new hire', 'onboarding', 'welcome'],
        sort_order: 3
      }
    ]
  },

  /**
   * Admin Department - Internal operations and escalations
   */
  ADMIN: {
    category: 'Admin',
    sort_order: 6,
    color: '#6B7280', // Gray
    subfolders: [
      {
        name: 'Claims',
        intent: 'claim',
        keywords: ['claim', 'dispute', 'complaint'],
        sort_order: 1
      },
      {
        name: 'Escalations',
        intent: 'escalation',
        keywords: ['escalate', 'manager', 'urgent'],
        priority: 'high',
        sort_order: 2
      },
      {
        name: 'Incoming Calls',
        intent: 'incoming_call',
        keywords: ['call', 'phone', 'voicemail'],
        sort_order: 3
      },
      {
        name: 'Outgoing Calls',
        intent: 'outgoing_call',
        keywords: ['callback', 'follow up', 'outreach'],
        sort_order: 4
      },
      {
        name: 'Personal',
        intent: 'personal',
        keywords: ['personal', 'private'],
        sort_order: 5
      }
    ]
  },

  /**
   * Unassigned - Catch-all for unclassified items
   */
  UNASSIGNED: {
    category: 'Unassigned',
    sort_order: 7,
    color: '#9CA3AF', // Light Gray
    subfolders: [
      {
        name: 'Uncategorized',
        intent: 'uncategorized',
        keywords: [],
        sort_order: 1
      },
      {
        name: 'To Classify',
        intent: 'to_classify',
        keywords: [],
        sort_order: 2
      }
    ]
  }
};

/**
 * Flatten the folder structure for easy iteration
 * @returns {Array} Array of all folders with metadata
 */
export function getFlattenedFolders() {
  const folders = [];

  Object.entries(UNIFIED_FOLDER_STRUCTURE).forEach(([key, category]) => {
    // Add parent category folder
    folders.push({
      name: category.category,
      category: category.category,
      intent: category.category.toLowerCase(),
      path: category.category,
      sort_order: category.sort_order,
      color: category.color,
      isParent: true
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
        hasChildren: !!subfolder.children
      });

      // Add children (for nested folders like Social Media)
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
            parentIntent: subfolder.intent
          });
        });
      }
    });
  });

  return folders;
}

/**
 * Get folder by intent for AI classification routing
 * @param {string} intent - Intent identifier
 * @returns {object|null} Folder metadata
 */
export function getFolderByIntent(intent) {
  const folders = getFlattenedFolders();
  return folders.find(f => f.intent === intent) || null;
}

/**
 * Get all folders for a specific category
 * @param {string} category - Category name (Sales, Support, etc.)
 * @returns {Array} Array of folders in that category
 */
export function getFoldersByCategory(category) {
  const folders = getFlattenedFolders();
  return folders.filter(f => f.category === category && !f.isParent);
}

/**
 * Map AI classification result to folder intent
 * @param {string} classification - AI classification result
 * @returns {string} Intent identifier
 */
export function classificationToIntent(classification) {
  const mapping = {
    // Sales intents
    'pool_lead': 'lead_pools',
    'spa_lead': 'lead_spa',
    'sauna_lead': 'lead_sauna',
    'accessory_lead': 'lead_accessory',
    'quote_request': 'quote',
    'lost_sale': 'denied',
    
    // Support intents
    'emergency': 'emergency',
    'technical_issue': 'technical',
    'maintenance_request': 'maintenance',
    'warranty_claim': 'warranty',
    'repair_request': 'repair',
    
    // Operations intents
    'installation_request': 'installation',
    'consultation_request': 'consultation',
    'job_assignment': 'assignment',
    
    // Marketing intents
    'social_media_inquiry': 'social_media',
    'campaign_response': 'email_campaign',
    
    // HR intents
    'job_application': 'job_application',
    'interview_request': 'interview',
    
    // Admin intents
    'complaint': 'claim',
    'escalation': 'escalation',
    
    // Fallback
    'unknown': 'uncategorized'
  };

  return mapping[classification] || 'uncategorized';
}

/**
 * Generate n8n label map for dynamic routing
 * @param {object} labelMap - Map of label_id to provider IDs
 * @returns {object} n8n-compatible label map
 */
export function generateN8nLabelMap(labelMap) {
  const n8nMap = {};
  
  const folders = getFlattenedFolders();
  folders.forEach(folder => {
    if (!folder.isParent && labelMap[folder.intent]) {
      // Convert intent to SCREAMING_SNAKE_CASE for n8n
      const key = folder.intent.toUpperCase().replace(/-/g, '_');
      n8nMap[key] = labelMap[folder.intent];
    }
  });
  
  return n8nMap;
}



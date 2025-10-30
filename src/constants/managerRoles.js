/**
 * MANAGER ROLE DEFINITIONS
 * 
 * This file defines the available manager roles used during onboarding
 * and for AI classification. Each role includes:
 * - id: Unique identifier for the role
 * - label: Display name for the role
 * - description: What this role handles
 * - icon: Visual emoji for UI
 * - routes: Primary email categories this role should receive
 * - keywords: Keywords that indicate emails for this role
 * 
 * These roles are used in:
 * - Onboarding team setup (StepTeamSetup.jsx)
 * - AI Master Classifier system message generation
 * - Email routing and classification logic
 */

export const AVAILABLE_ROLES = [
  {
    id: 'sales_manager',
    label: 'Sales Manager',
    description: 'Handles quotes, new leads, pricing inquiries',
    icon: '💰',
    routes: ['SALES'],
    keywords: ['price', 'quote', 'buy', 'purchase', 'how much', 'cost', 'pricing', 'estimate', 'proposal', 'new customer', 'lead', 'interested in', 'want to buy']
  },
  {
    id: 'service_manager',
    label: 'Service Manager',
    description: 'Handles repairs, appointments, emergencies',
    icon: '🔧',
    routes: ['SUPPORT', 'URGENT'],
    keywords: ['repair', 'fix', 'broken', 'appointment', 'emergency', 'service call', 'urgent', 'not working', 'need help', 'schedule', 'maintenance', 'inspection']
  },
  {
    id: 'operations_manager',
    label: 'Operations Manager',
    description: 'Handles vendors, internal ops, hiring',
    icon: '⚙️',
    routes: ['MANAGER', 'SUPPLIERS'],
    keywords: ['vendor', 'supplier', 'hiring', 'internal', 'operations', 'procurement', 'inventory', 'order', 'partnership', 'contract', 'staff', 'employee']
  },
  {
    id: 'support_lead',
    label: 'Support Lead',
    description: 'Handles general questions, parts, how-to',
    icon: '💬',
    routes: ['SUPPORT'],
    keywords: ['help', 'question', 'parts', 'chemicals', 'how to', 'support', 'assistance', 'information', 'inquiry', 'general question', 'product info']
  },
  {
    id: 'owner',
    label: 'Owner/CEO',
    description: 'Handles strategic, legal, high-priority',
    icon: '👔',
    routes: ['MANAGER', 'URGENT'],
    keywords: ['strategic', 'legal', 'partnership', 'media', 'press', 'executive', 'important', 'confidential', 'high priority', 'compliance', 'regulation']
  }
];

/**
 * Get role definition by ID
 * @param {string} roleId - Role identifier
 * @returns {object|null} - Role definition or null if not found
 */
export const getRoleById = (roleId) => {
  return AVAILABLE_ROLES.find(role => role.id === roleId) || null;
};

/**
 * Get all keywords for a set of role IDs
 * @param {Array<string>} roleIds - Array of role identifiers
 * @returns {Array<string>} - Combined array of all keywords
 */
export const getKeywordsForRoles = (roleIds) => {
  if (!Array.isArray(roleIds)) return [];
  
  const uniqueKeywords = new Set();
  roleIds.forEach(roleId => {
    const role = getRoleById(roleId);
    if (role && role.keywords) {
      role.keywords.forEach(keyword => uniqueKeywords.add(keyword));
    }
  });
  
  return Array.from(uniqueKeywords);
};

/**
 * Get all routes for a set of role IDs
 * @param {Array<string>} roleIds - Array of role identifiers
 * @returns {Array<string>} - Combined array of all routes
 */
export const getRoutesForRoles = (roleIds) => {
  if (!Array.isArray(roleIds)) return [];
  
  const uniqueRoutes = new Set();
  roleIds.forEach(roleId => {
    const role = getRoleById(roleId);
    if (role && role.routes) {
      role.routes.forEach(route => uniqueRoutes.add(route));
    }
  });
  
  return Array.from(uniqueRoutes);
};

/**
 * Build a formatted manager info string with roles for AI classifier
 * @param {Array<object>} managers - Array of manager objects with name, email, and roles
 * @param {Array<string>} departmentScope - Optional department scope filter (e.g., ['sales', 'support'] or ['all'])
 * @returns {string} - Formatted manager information for AI
 */
export const buildManagerInfoForAI = (managers, departmentScope = ['all']) => {
  if (!managers || managers.length === 0) return '';
  
  // Determine if we need to filter managers based on department scope
  const isHubMode = !departmentScope || departmentScope.includes('all');
  
  // Map department scope to role routes for filtering
  const departmentToRoutes = {
    'sales': ['SALES'],
    'support': ['SUPPORT', 'URGENT'],
    'operations': ['MANAGER', 'SUPPLIERS'],
    'all': [] // No filtering
  };
  
  // Get allowed routes based on department scope
  const allowedRoutes = new Set();
  if (!isHubMode) {
    departmentScope.forEach(dept => {
      const routes = departmentToRoutes[dept] || [];
      routes.forEach(route => allowedRoutes.add(route));
    });
  }
  
  // Filter managers who have roles matching the department scope
  const relevantManagers = managers.filter(manager => {
    if (!manager.name || manager.name.trim() === '') return false;
    if (isHubMode) return true; // Show all managers in hub mode
    
    // In department mode, only show managers with relevant roles
    if (!manager.roles || !Array.isArray(manager.roles) || manager.roles.length === 0) {
      return false; // Skip managers without roles in department mode
    }
    
    // Check if any of the manager's roles match the department scope
    return manager.roles.some(roleId => {
      const role = getRoleById(roleId);
      if (!role) return false;
      return role.routes.some(route => allowedRoutes.has(route));
    });
  });
  
  if (relevantManagers.length === 0) return '';
  
  let managerInfo = '\n\n### Team Manager Information:\n\n';
  managerInfo += 'Use this information to identify emails intended for specific managers by name or by their role responsibilities.\n\n';
  
  relevantManagers.forEach((manager, index) => {
    managerInfo += `**${manager.name}**`;
    if (manager.email) {
      managerInfo += ` (${manager.email})`;
    }
    managerInfo += '\n';
    
    // Add roles if available
    if (manager.roles && Array.isArray(manager.roles) && manager.roles.length > 0) {
      const roleDetails = manager.roles
        .map(roleId => getRoleById(roleId))
        .filter(role => role !== null)
        .filter(role => {
          // In department mode, only show roles that match the allowed routes
          if (isHubMode) return true;
          return role.routes.some(route => allowedRoutes.has(route));
        });
      
      if (roleDetails.length > 0) {
        managerInfo += `Roles:\n`;
        roleDetails.forEach(role => {
          managerInfo += `  - ${role.label}: ${role.description}\n`;
          managerInfo += `    Keywords: ${role.keywords.join(', ')}\n`;
        });
      }
    }
    
    if (index < relevantManagers.length - 1) {
      managerInfo += '\n';
    }
  });
  
  managerInfo += '\n**Classification Guidance for Manager Routing:**\n';
  managerInfo += '- When an email mentions a manager by name, consider routing to that manager\n';
  managerInfo += '- When an email contains keywords matching a manager\'s role, consider categorizing accordingly\n';
  managerInfo += '- For emails addressed "Dear [Manager Name]" or "Hi [Manager Name]", prioritize that manager\n';
  managerInfo += '- Combine manager role keywords with email content to determine the appropriate category\n';
  
  if (!isHubMode) {
    managerInfo += `\n**Department Mode:** Only showing managers relevant to ${departmentScope.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(' + ')} department(s)\n`;
  }
  
  return managerInfo;
};

/**
 * Filter and rebuild manager section in existing system message based on department scope
 * This is used in the Edge Function to filter manager info after department scope is known
 * @param {string} systemMessage - Existing AI system message
 * @param {Array<object>} managers - Array of manager objects
 * @param {Array<string>} departmentScope - Department scope filter
 * @returns {string} - System message with filtered manager section
 */
export const filterManagerInfoByDepartment = (systemMessage, managers, departmentScope) => {
  if (!systemMessage || !managers || managers.length === 0) return systemMessage;
  if (!departmentScope || departmentScope.includes('all')) return systemMessage; // No filtering for hub mode
  
  // Check if system message contains manager section
  if (!systemMessage.includes('### Team Manager Information')) {
    return systemMessage; // No manager section to filter
  }
  
  // Split the message to isolate and replace the manager section
  const managerSectionStart = systemMessage.indexOf('### Team Manager Information');
  const nextSectionStart = systemMessage.indexOf('\n\n###', managerSectionStart + 1);
  
  if (managerSectionStart === -1) return systemMessage;
  
  // Extract parts of the message
  const beforeManagerSection = systemMessage.substring(0, managerSectionStart);
  const afterManagerSection = nextSectionStart > -1 ? systemMessage.substring(nextSectionStart) : '';
  
  // Generate filtered manager section
  const filteredManagerInfo = buildManagerInfoForAI(managers, departmentScope);
  
  // Reconstruct the message
  return beforeManagerSection + filteredManagerInfo + afterManagerSection;
};

/**
 * Build a formatted supplier info string for AI classifier
 * @param {Array<object>} suppliers - Array of supplier objects with name and domains
 * @returns {string} - Formatted supplier information for AI
 */
export const buildSupplierInfoForAI = (suppliers) => {
  if (!suppliers || suppliers.length === 0) return '';
  
  let supplierInfo = '\n\n### Known Suppliers:\n\n';
  supplierInfo += 'Use this information to identify emails from known suppliers and vendors.\n\n';
  
  suppliers.forEach((supplier, index) => {
    if (!supplier.name || supplier.name.trim() === '') return;
    
    supplierInfo += `- **${supplier.name}**`;
    
    // Add domains if available
    if (supplier.domains) {
      const domainList = Array.isArray(supplier.domains) 
        ? supplier.domains 
        : supplier.domains.split(',').map(d => d.trim());
      
      if (domainList.length > 0) {
        supplierInfo += ` (Domains: ${domainList.join(', ')})`;
      }
    }
    
    supplierInfo += '\n';
  });
  
  supplierInfo += '\n**Classification Guidance for Supplier Emails:**\n';
  supplierInfo += '- Emails from supplier domains should typically be categorized as SUPPLIERS\n';
  supplierInfo += '- Invoices and receipts from suppliers go to Banking > receipts > PaymentSent\n';
  supplierInfo += '- Supplier promotional emails go to Promo category\n';
  
  return supplierInfo;
};


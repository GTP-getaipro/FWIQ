/**
 * MANAGER FORWARDING UTILITIES
 * 
 * Utilities for forwarding emails to managers with AI draft replies
 * Integrates with the manager role system for intelligent routing
 */

import { AVAILABLE_ROLES, getRoleById } from './managerRoles.js';

/**
 * Generate n8n team configuration from manager data
 * This creates the configuration object used in the "Route to Manager" node
 * 
 * @param {Array<object>} managers - Array of manager objects with name, email, roles
 * @param {Array<object>} suppliers - Array of supplier objects
 * @returns {object} - Team configuration for n8n workflow
 */
export const generateTeamConfigForN8n = (managers, suppliers = []) => {
  if (!managers || managers.length === 0) {
    return {
      managers: [],
      suppliers: suppliers || []
    };
  }
  
  // Transform managers to n8n format
  const n8nManagers = managers
    .filter(m => m.name && m.name.trim())
    .map(manager => ({
      name: manager.name.trim(),
      email: manager.email || null,
      roles: Array.isArray(manager.roles) ? manager.roles : [],
      forward_enabled: manager.forward_enabled !== undefined ? manager.forward_enabled : !!manager.email
    }));
  
  // Transform suppliers to n8n format
  const n8nSuppliers = suppliers
    .filter(s => s.name && s.name.trim())
    .map(supplier => ({
      name: supplier.name.trim(),
      email: supplier.email || null,
      domains: Array.isArray(supplier.domains) 
        ? supplier.domains 
        : (supplier.domains ? supplier.domains.split(',').map(d => d.trim()) : [])
    }));
  
  return {
    managers: n8nManagers,
    suppliers: n8nSuppliers
  };
};

/**
 * Generate role configuration object for n8n routing logic
 * Creates the getRoleConfig() function content for the Route to Manager node
 * 
 * @returns {string} - JavaScript code for role configuration
 */
export const generateRoleConfigCode = () => {
  const configs = {};
  
  AVAILABLE_ROLES.forEach(role => {
    configs[role.id] = {
      categories: role.routes,
      keywords: role.keywords,
      weight: 10 // Default weight, adjust based on priority
    };
  });
  
  return `function getRoleConfig(roleId) {
  const configs = ${JSON.stringify(configs, null, 2)};
  return configs[roleId] || { categories: [], keywords: [], weight: 0 };
}`;
};

/**
 * Build email forward body with AI draft
 * This is used in the "Build Forward Email Body" node
 * 
 * @param {object} emailData - Original email data
 * @param {object} classification - AI classification result
 * @param {object} manager - Matched manager
 * @param {string} draftText - AI draft response (if available)
 * @returns {string} - Formatted email body for forwarding
 */
export const buildForwardEmailBody = (emailData, classification, manager, draftText = null) => {
  const hasDraft = draftText && draftText.trim() !== '' && !draftText.includes('No AI draft');
  
  let forwardBody = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 FloWorx AI Email Routing - Action Required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CLASSIFICATION:
Category: ${classification.primary_category || 'N/A'} > ${classification.secondary_category || 'General'}
${classification.tertiary_category ? `Tertiary: ${classification.tertiary_category}\n` : ''}Confidence: ${classification.confidence ? (classification.confidence * 100).toFixed(1) + '%' : 'N/A'}
AI Can Reply: ${classification.ai_can_reply ? '✅ Yes' : '❌ No'}
Summary: ${classification.summary || 'N/A'}

👤 ROUTED TO YOU:
Name: ${manager?.name || 'Unassigned'}
Email: ${manager?.email || 'Not configured'}
Reason: ${classification.routing_decision?.routing_reason || 'N/A'}
Routing Confidence: ${classification.routing_decision?.routing_confidence || 0}%
${manager?.roles?.length > 0 ? `Roles: ${manager.roles.map(roleId => getRoleById(roleId)?.label || roleId).join(', ')}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 ORIGINAL EMAIL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From: ${emailData.fromName || emailData.from} <${emailData.from}>
To: ${emailData.to}
Date: ${new Date(emailData.date).toLocaleString()}
Subject: ${emailData.subject}

${emailData.body || 'No content'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  if (hasDraft) {
    forwardBody += `🤖 AI SUGGESTED DRAFT RESPONSE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${draftText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  } else {
    forwardBody += `⚠️ NO AI DRAFT GENERATED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reason: ${classification.ai_can_reply ? 'Draft generation failed' : `Low confidence (${classification.confidence ? (classification.confidence * 100).toFixed(1) + '%' : 'N/A'}) - requires human review`}

This email needs your personal attention and response.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  forwardBody += `
💡 NEXT STEPS:
${hasDraft ? '1. Review the AI draft above\n2. Edit if needed or approve as-is\n3. Reply to customer' : '1. Review the original email\n2. Write your response\n3. Reply to customer'}

📧 Reply to: ${emailData.from}
📂 Filed in: ${classification.manager_folder || classification.primary_category || 'N/A'}
🤖 Processed by FloWorx AI
⏰ Timestamp: ${new Date().toLocaleString()}
`;

  return forwardBody;
};

/**
 * Generate forward subject line
 * 
 * @param {object} emailData - Original email data
 * @param {object} classification - AI classification result
 * @returns {string} - Subject line for forwarded email
 */
export const generateForwardSubject = (emailData, classification) => {
  const category = classification.primary_category || 'Email';
  const originalSubject = emailData.subject || 'No Subject';
  
  return `[FloWorx ${category}] ${originalSubject}`;
};

/**
 * Check if manager should receive forwarded email
 * Based on forward_enabled setting and email availability
 * 
 * @param {object} manager - Manager object
 * @returns {boolean} - Whether to forward
 */
export const shouldForwardToManager = (manager) => {
  if (!manager || !manager.email || manager.email.trim() === '') {
    return false;
  }
  
  // Check forward_enabled setting (defaults to true if email exists)
  if (manager.forward_enabled !== undefined) {
    return manager.forward_enabled === true;
  }
  
  // Default: forward if email exists
  return true;
};

/**
 * Build n8n routing node JavaScript code
 * This generates the complete code for the "Route to Manager" node
 * Dynamically includes team configuration
 * 
 * @param {Array<object>} managers - Array of managers
 * @param {Array<object>} suppliers - Array of suppliers
 * @returns {string} - Complete JavaScript code for n8n node
 */
export const buildRoutingNodeCode = (managers, suppliers = []) => {
  const teamConfig = generateTeamConfigForN8n(managers, suppliers);
  const roleConfigCode = generateRoleConfigCode();
  
  return `// ═══════════════════════════════════════════════════════════
// DYNAMIC MANAGER ROUTING ENGINE
// Intelligently matches emails to the right manager
// Auto-generated from FloWorx manager configuration
// ═══════════════════════════════════════════════════════════

const classification = $json.parsed_output || $json;
const emailData = $('Prepare Email Data').first()?.json || {};

// TEAM CONFIGURATION (auto-generated)
const TEAM_CONFIG = ${JSON.stringify(teamConfig, null, 2)};

const managers = TEAM_CONFIG.managers;
const suppliers = TEAM_CONFIG.suppliers;

console.log('🎯 Starting Manager Routing...', {
  primaryCategory: classification.primary_category,
  secondaryCategory: classification.secondary_category,
  emailFrom: emailData.from,
  teamSize: managers.length
});

// ═══════════════════════════════════════════════════════════
// ROLE CONFIGURATION
// ═══════════════════════════════════════════════════════════
${roleConfigCode}

// ═══════════════════════════════════════════════════════════
// ROUTING PRIORITY LOGIC
// ═══════════════════════════════════════════════════════════

let matchedManager = null;
let routingReason = '';
let routingConfidence = 0;

const emailBody = emailData.body?.toLowerCase() || '';
const emailSubject = emailData.subject?.toLowerCase() || '';
const fullEmailText = \`\${emailSubject} \${emailBody}\`;

// PRIORITY 1: Name Detection (Highest Priority)
for (const manager of managers) {
  const fullName = manager.name.toLowerCase();
  const firstName = fullName.split(' ')[0];
  
  if (fullEmailText.includes(fullName) || fullEmailText.includes(firstName)) {
    matchedManager = manager;
    routingReason = \`Name mentioned: "\${manager.name}"\`;
    routingConfidence = 100;
    console.log(\`✅ Priority 1: Name Match - \${manager.name}\`);
    break;
  }
}

// PRIORITY 2: Secondary Category Match (AI classified as MANAGER/[Name])
if (!matchedManager && classification.secondary_category) {
  const secondaryCategory = classification.secondary_category;
  const managerByCategory = managers.find(m => 
    m.name.toLowerCase() === secondaryCategory.toLowerCase()
  );
  
  if (managerByCategory) {
    matchedManager = managerByCategory;
    routingReason = \`AI classified as MANAGER/\${managerByCategory.name}\`;
    routingConfidence = 95;
    console.log(\`✅ Priority 2: AI Category Match - \${managerByCategory.name}\`);
  }
}

// PRIORITY 3: Category + Role Match
if (!matchedManager) {
  const primaryCategory = classification.primary_category?.toUpperCase() || '';
  const scores = [];
  
  for (const manager of managers) {
    let score = 0;
    const managerRoles = Array.isArray(manager.roles) ? manager.roles : [];
    const matchedRoles = [];
    
    for (const roleId of managerRoles) {
      const roleConfig = getRoleConfig(roleId);
      
      if (roleConfig.categories.includes(primaryCategory)) {
        score += roleConfig.weight;
        matchedRoles.push(roleId);
      }
    }
    
    if (score > 0) {
      scores.push({ manager, score, reason: \`Category: \${primaryCategory}\`, matchedRoles });
    }
  }
  
  if (scores.length > 0) {
    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0];
    matchedManager = winner.manager;
    routingReason = winner.reason;
    routingConfidence = Math.min(95, 70 + winner.score);
    console.log(\`✅ Priority 3: Category Match - \${winner.manager.name}\`);
  }
}

// PRIORITY 4: MANAGER Category + Keyword Analysis
if (!matchedManager && classification.primary_category?.toUpperCase() === 'MANAGER') {
  const scores = [];
  
  for (const manager of managers) {
    let score = 0;
    const managerRoles = Array.isArray(manager.roles) ? manager.roles : [];
    const matchedKeywords = [];
    
    for (const roleId of managerRoles) {
      const roleConfig = getRoleConfig(roleId);
      
      for (const keyword of roleConfig.keywords) {
        if (fullEmailText.includes(keyword.toLowerCase())) {
          score += 2;
          matchedKeywords.push(keyword);
        }
      }
    }
    
    if (score > 0) {
      scores.push({ manager, score, reason: \`Keywords: \${matchedKeywords.slice(0, 3).join(', ')}\`, matchedKeywords });
    }
  }
  
  if (scores.length > 0) {
    scores.sort((a, b) => b.score - a.score);
    const winner = scores[0];
    matchedManager = winner.manager;
    routingReason = winner.reason;
    routingConfidence = Math.min(85, 50 + winner.score * 2);
    console.log(\`✅ Priority 4: Keyword Match - \${winner.manager.name}\`);
  }
}

// PRIORITY 5: Supplier Detection
if (!matchedManager && suppliers.length > 0) {
  const senderEmail = emailData.from?.toLowerCase() || '';
  
  for (const supplier of suppliers) {
    const supplierName = supplier.name.toLowerCase();
    
    if (fullEmailText.includes(supplierName)) {
      const opsManager = managers.find(m => {
        const roles = Array.isArray(m.roles) ? m.roles : [];
        return roles.includes('operations_manager');
      });
      
      if (opsManager) {
        matchedManager = opsManager;
        routingReason = \`Supplier: \${supplier.name}\`;
        routingConfidence = 90;
        console.log(\`✅ Priority 5: Supplier - \${opsManager.name}\`);
        break;
      }
    }
  }
}

// FALLBACK: Default or Unassigned
if (!matchedManager) {
  if (managers.length > 0) {
    matchedManager = managers[0];
    routingReason = 'Default routing';
    routingConfidence = 30;
    console.log(\`⚠️ Fallback: Default to \${matchedManager.name}\`);
  } else {
    matchedManager = { name: 'Unassigned', email: null, roles: [] };
    routingReason = 'No managers configured';
    routingConfidence = 0;
    console.log('⚠️ No managers - Unassigned');
  }
}

// ═══════════════════════════════════════════════════════════
// OUTPUT
// ═══════════════════════════════════════════════════════════
return {
  json: {
    ...classification,
    matched_manager: matchedManager,
    routing_decision: {
      manager_name: matchedManager?.name,
      manager_email: matchedManager?.email,
      matched_roles: Array.isArray(matchedManager?.roles) ? matchedManager.roles : [],
      routing_reason: routingReason,
      routing_confidence: routingConfidence,
      timestamp: new Date().toISOString()
    },
    manager_folder: matchedManager?.name ? \`MANAGER/\${matchedManager.name}\` : 'MANAGER/Unassigned'
  }
};`;
};


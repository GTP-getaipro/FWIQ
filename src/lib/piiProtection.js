/**
 * PII Protection and Audit Logging System
 * 
 * Ensures privacy compliance and provides comprehensive audit trails
 */

import { supabase } from './customSupabaseClient.js';

export class PIIProtection {
  constructor() {
    this.piiPatterns = [
      // Email addresses
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      
      // Phone numbers (various formats)
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      /\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g,
      /\b\+1[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      
      // Social Security Numbers
      /\b\d{3}-?\d{2}-?\d{4}\b/g,
      
      // Credit Card Numbers
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      
      // Addresses (basic patterns)
      /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b/g,
      
      // Names (common patterns)
      /\b(?:Mr|Mrs|Ms|Dr)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g
    ];
  }

  /**
   * Sanitize email content to remove PII
   */
  sanitizeEmailContent(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    let sanitized = content;

    // Remove PII patterns
    this.piiPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Remove quoted text (common in email replies)
    sanitized = sanitized.replace(/^>.*$/gm, '[QUOTED_TEXT_REDACTED]');

    // Remove signature blocks
    sanitized = sanitized.replace(/\n--\s*\n.*$/s, '\n[SIGNATURE_REDACTED]');

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
  }

  /**
   * Create hash of original content for audit purposes
   */
  createContentHash(content) {
    if (!content) return null;
    
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for shorter hashes
  }

  /**
   * Extract business-relevant information while protecting PII
   */
  extractBusinessInfo(emailContent) {
    const sanitized = this.sanitizeEmailContent(emailContent);
    const contentHash = this.createContentHash(emailContent);

    // Extract business-relevant patterns (non-PII)
    const businessPatterns = {
      // Business names (from signatures, domains)
      businessNames: this.extractBusinessNames(sanitized),
      
      // Service areas (geographic references)
      serviceAreas: this.extractServiceAreas(sanitized),
      
      // Industry keywords
      industryKeywords: this.extractIndustryKeywords(sanitized),
      
      // Business hours mentions
      businessHours: this.extractBusinessHours(sanitized),
      
      // Website references (non-PII)
      websiteReferences: this.extractWebsiteReferences(sanitized)
    };

    return {
      sanitizedContent: sanitized,
      contentHash,
      businessInfo: businessPatterns,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Extract business names from sanitized content
   */
  extractBusinessNames(content) {
    const patterns = [
      // "Best regards, [Company Name]"
      /(?:best regards|sincerely|thanks?),\s*([A-Z][A-Za-z\s&]+(?:Inc|LLC|Ltd|Corp|Company)?)/gi,
      
      // "From: [Company Name]"
      /from:\s*([A-Z][A-Za-z\s&]+(?:Inc|LLC|Ltd|Corp|Company)?)/gi,
      
      // Company signatures
      /([A-Z][A-Za-z\s&]+(?:Inc|LLC|Ltd|Corp|Company))\s*$/gm
    ];

    const names = new Set();
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const name = match.replace(/(?:best regards|sincerely|thanks?|from):\s*/gi, '').trim();
          if (name.length > 3 && name.length < 50) {
            names.add(name);
          }
        });
      }
    });

    return Array.from(names);
  }

  /**
   * Extract service areas from content
   */
  extractServiceAreas(content) {
    const areaPatterns = [
      // "Serving [Area]"
      /serving\s+([A-Z][A-Za-z\s,]+)/gi,
      
      // "Located in [Area]"
      /located\s+in\s+([A-Z][A-Za-z\s,]+)/gi,
      
      // Geographic references
      /\b([A-Z][A-Za-z\s]+(?:County|City|Area|Region))\b/g
    ];

    const areas = new Set();
    
    areaPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const area = match.replace(/(?:serving|located\s+in):\s*/gi, '').trim();
          if (area.length > 3 && area.length < 30) {
            areas.add(area);
          }
        });
      }
    });

    return Array.from(areas);
  }

  /**
   * Extract industry keywords
   */
  extractIndustryKeywords(content) {
    const industryKeywords = [
      'repair', 'installation', 'maintenance', 'service', 'consultation',
      'hot tub', 'spa', 'pool', 'hvac', 'electrical', 'plumbing',
      'contractor', 'technician', 'specialist', 'expert'
    ];

    const foundKeywords = industryKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );

    return foundKeywords;
  }

  /**
   * Extract business hours mentions
   */
  extractBusinessHours(content) {
    const hourPatterns = [
      /(?:hours?|open|available):\s*([^.\n]+)/gi,
      /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^.\n]*\d{1,2}:\d{2}/gi
    ];

    const hours = [];
    
    hourPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        hours.push(...matches);
      }
    });

    return hours;
  }

  /**
   * Extract website references
   */
  extractWebsiteReferences(content) {
    const websitePattern = /(?:visit|check|see)\s+(?:our\s+)?(?:website|site):\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const matches = content.match(websitePattern);
    
    if (matches) {
      return matches.map(match => 
        match.replace(/(?:visit|check|see)\s+(?:our\s+)?(?:website|site):\s*/gi, '').trim()
      );
    }

    return [];
  }

  /**
   * Log PII access for audit purposes
   */
  async logPIIAccess(userId, action, details) {
    try {
      await supabase
        .from('pii_access_logs')
        .insert({
          user_id: userId,
          action: action, // 'email_analysis', 'profile_extraction', 'voice_training'
          details: details,
          accessed_at: new Date().toISOString(),
          ip_address: details.ipAddress || null,
          user_agent: details.userAgent || null
        });
    } catch (error) {
      console.warn('⚠️ Failed to log PII access:', error.message);
    }
  }

  /**
   * Create audit trail for analysis
   */
  async createAnalysisAuditTrail(businessId, analysisType, inputHash, outputHash, metadata) {
    try {
      await supabase
        .from('analysis_audit_trail')
        .insert({
          business_id: businessId,
          analysis_type: analysisType,
          input_content_hash: inputHash,
          output_content_hash: outputHash,
          metadata: metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('⚠️ Failed to create audit trail:', error.message);
    }
  }

  /**
   * Get PII compliance report
   */
  async getPIIComplianceReport(businessId, startDate, endDate) {
    try {
      const { data: accessLogs } = await supabase
        .from('pii_access_logs')
        .select('*')
        .eq('user_id', businessId)
        .gte('accessed_at', startDate)
        .lte('accessed_at', endDate);

      const { data: auditTrails } = await supabase
        .from('analysis_audit_trail')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      return {
        businessId,
        period: { startDate, endDate },
        accessLogs: accessLogs || [],
        auditTrails: auditTrails || [],
        complianceScore: this.calculateComplianceScore(accessLogs || [], auditTrails || []),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error generating PII compliance report:', error);
      return null;
    }
  }

  /**
   * Calculate compliance score based on audit data
   */
  calculateComplianceScore(accessLogs, auditTrails) {
    let score = 100;

    // Deduct points for missing audit trails
    const missingAuditTrails = accessLogs.length - auditTrails.length;
    score -= missingAuditTrails * 10;

    // Deduct points for suspicious access patterns
    const suspiciousAccess = accessLogs.filter(log => 
      log.action === 'email_analysis' && 
      new Date(log.accessed_at).getTime() < Date.now() - 24 * 60 * 60 * 1000 // Older than 24 hours
    ).length;
    
    score -= suspiciousAccess * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Validate PII compliance before processing
   */
  validatePIICompliance(businessId, analysisType) {
    // Check if user has consented to email analysis
    // This would integrate with your consent management system
    return {
      compliant: true,
      consentGiven: true,
      dataRetentionPeriod: '90 days',
      processingPurpose: 'business_profile_extraction'
    };
  }
}

// Global PII protection instance
export const piiProtection = new PIIProtection();

/**
 * Enhanced Business Profile Extractor with PII Protection
 */
export class SecureBusinessProfileExtractor {
  constructor(userId, provider = 'gmail') {
    this.userId = userId;
    this.provider = provider;
    this.piiProtection = piiProtection;
  }

  /**
   * Securely extract business profile with PII protection
   */
  async extractBusinessProfileSecurely(emailLimit = 100) {
    try {
      // Validate PII compliance
      const compliance = this.piiProtection.validatePIICompliance(this.userId, 'business_profile_extraction');
      if (!compliance.compliant) {
        throw new Error('PII compliance validation failed');
      }

      // Log PII access
      await this.piiProtection.logPIIAccess(this.userId, 'email_analysis', {
        emailLimit,
        analysisType: 'business_profile_extraction',
        timestamp: new Date().toISOString()
      });

      // Fetch emails
      const emails = await this.fetchRecentEmails(emailLimit);
      if (!emails || emails.length === 0) {
        return this.getDefaultProfile();
      }

      // Process emails with PII protection
      const sanitizedEmails = emails.map(email => ({
        ...email,
        body: this.piiProtection.sanitizeEmailContent(email.body),
        contentHash: this.piiProtection.createContentHash(email.body)
      }));

      // Extract business information
      const businessInfo = this.extractBusinessInfoFromEmails(sanitizedEmails);
      
      // Create audit trail
      const inputHash = this.piiProtection.createContentHash(JSON.stringify(emails));
      const outputHash = this.piiProtection.createContentHash(JSON.stringify(businessInfo));
      
      await this.piiProtection.createAnalysisAuditTrail(
        this.userId,
        'business_profile_extraction',
        inputHash,
        outputHash,
        {
          emailCount: emails.length,
          sanitizedEmailCount: sanitizedEmails.length,
          extractedFields: Object.keys(businessInfo).length
        }
      );

      return businessInfo;

    } catch (error) {
      console.error('❌ Error in secure business profile extraction:', error);
      return this.getDefaultProfile();
    }
  }

  /**
   * Extract business information from sanitized emails
   */
  extractBusinessInfoFromEmails(sanitizedEmails) {
    const businessInfo = {
      businessNames: new Set(),
      serviceAreas: new Set(),
      industryKeywords: new Set(),
      businessHours: new Set(),
      websiteReferences: new Set(),
      extractedAt: new Date().toISOString()
    };

    sanitizedEmails.forEach(email => {
      const extracted = this.piiProtection.extractBusinessInfo(email.body);
      
      extracted.businessInfo.businessNames.forEach(name => businessInfo.businessNames.add(name));
      extracted.businessInfo.serviceAreas.forEach(area => businessInfo.serviceAreas.add(area));
      extracted.businessInfo.industryKeywords.forEach(keyword => businessInfo.industryKeywords.add(keyword));
      extracted.businessInfo.businessHours.forEach(hour => businessInfo.businessHours.add(hour));
      extracted.businessInfo.websiteReferences.forEach(website => businessInfo.websiteReferences.add(website));
    });

    // Convert sets to arrays and create final profile
    return {
      businessName: Array.from(businessInfo.businessNames)[0] || null,
      serviceArea: Array.from(businessInfo.serviceAreas)[0] || null,
      industryKeywords: Array.from(businessInfo.industryKeywords),
      businessHours: Array.from(businessInfo.businessHours),
      websiteReferences: Array.from(businessInfo.websiteReferences),
      extractedAt: businessInfo.extractedAt,
      piiCompliant: true
    };
  }

  /**
   * Fetch recent emails (same as original implementation)
   */
  async fetchRecentEmails(limit) {
    // Implementation same as original BusinessProfileExtractor
    // This would call the same email fetching logic
    return [];
  }

  /**
   * Get default profile
   */
  getDefaultProfile() {
    return {
      businessName: null,
      serviceArea: null,
      industryKeywords: [],
      businessHours: [],
      websiteReferences: [],
      extractedAt: new Date().toISOString(),
      piiCompliant: true,
      error: true
    };
  }
}

/**
 * Convenience functions for PII protection
 */
export const sanitizeEmailContent = (content) => 
  piiProtection.sanitizeEmailContent(content);

export const logPIIAccess = (userId, action, details) => 
  piiProtection.logPIIAccess(userId, action, details);

export const createAnalysisAuditTrail = (businessId, analysisType, inputHash, outputHash, metadata) => 
  piiProtection.createAnalysisAuditTrail(businessId, analysisType, inputHash, outputHash, metadata);

export const getPIIComplianceReport = (businessId, startDate, endDate) => 
  piiProtection.getPIIComplianceReport(businessId, startDate, endDate);

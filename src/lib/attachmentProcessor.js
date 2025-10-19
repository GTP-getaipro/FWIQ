/**
 * Email Attachment Processor
 * 
 * Provides comprehensive attachment processing including extraction,
 * analysis, storage, and security scanning capabilities.
 */

import { supabase } from './customSupabaseClient';

export class AttachmentProcessor {
  constructor() {
    this.supportedTypes = {
      documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
      spreadsheets: ['.xls', '.xlsx', '.csv', '.ods'],
      presentations: ['.ppt', '.pptx', '.odp'],
      images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
      archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
      code: ['.js', '.html', '.css', '.py', '.java', '.cpp', '.c', '.php'],
      audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
      video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    };

    this.maxFileSize = 25 * 1024 * 1024; // 25MB
    this.dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar'];
    this.processingCache = new Map();
  }

  /**
   * Process attachments from email
   * @param {Object} parsedData - Parsed email data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Attachment processing result
   */
  async processAttachments(parsedData, userId) {
    try {
      const attachments = this.extractAttachments(parsedData);
      
      if (attachments.length === 0) {
        return {
          attachments: [],
          totalCount: 0,
          totalSize: 0,
          processingStatus: 'no_attachments'
        };
      }

      const processedAttachments = [];
      let totalSize = 0;
      let processingErrors = [];

      for (const attachment of attachments) {
        try {
          const processedAttachment = await this.processIndividualAttachment(attachment, userId);
          processedAttachments.push(processedAttachment);
          totalSize += attachment.size || 0;
        } catch (error) {
          console.error(`Failed to process attachment ${attachment.name}:`, error);
          processingErrors.push({
            name: attachment.name,
            error: error.message
          });
        }
      }

      // Store attachment metadata
      await this.storeAttachmentMetadata(userId, parsedData.id, processedAttachments);

      return {
        attachments: processedAttachments,
        totalCount: processedAttachments.length,
        totalSize,
        processingStatus: processingErrors.length > 0 ? 'partial_success' : 'success',
        errors: processingErrors
      };

    } catch (error) {
      console.error('Attachment processing failed:', error);
      return {
        attachments: [],
        totalCount: 0,
        totalSize: 0,
        processingStatus: 'error',
        error: error.message
      };
    }
  }

  /**
   * Extract attachments from email data
   * @param {Object} parsedData - Parsed email data
   * @returns {Array} Extracted attachments
   */
  extractAttachments(parsedData) {
    const attachments = [];

    // Extract from HTML body
    if (parsedData.htmlBody?.original) {
      const htmlAttachments = this.extractAttachmentsFromHtml(parsedData.htmlBody.original);
      attachments.push(...htmlAttachments);
    }

    // Extract from email metadata (if available)
    if (parsedData.metadata?.attachments) {
      attachments.push(...parsedData.metadata.attachments);
    }

    // Remove duplicates based on name and size
    const uniqueAttachments = this.removeDuplicateAttachments(attachments);

    return uniqueAttachments;
  }

  /**
   * Extract attachments from HTML content
   * @param {string} html - HTML content
   * @returns {Array} Extracted attachments
   */
  extractAttachmentsFromHtml(html) {
    const attachments = [];

    // Extract inline images
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (this.isAttachmentUrl(src)) {
        attachments.push({
          name: this.extractFileName(src),
          url: src,
          type: 'image',
          size: null,
          inline: true
        });
      }
    }

    // Extract file links
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const linkText = match[2];
      
      if (this.isAttachmentUrl(href)) {
        attachments.push({
          name: linkText || this.extractFileName(href),
          url: href,
          type: this.getFileType(href),
          size: null,
          inline: false
        });
      }
    }

    return attachments;
  }

  /**
   * Check if URL is an attachment
   * @param {string} url - URL to check
   * @returns {boolean} Is attachment
   */
  isAttachmentUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      
      // Check for common attachment patterns
      const attachmentPatterns = [
        /attachment/i,
        /download/i,
        /file/i,
        /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|zip|rar)$/i
      ];

      return attachmentPatterns.some(pattern => pattern.test(pathname));
    } catch {
      return false;
    }
  }

  /**
   * Extract filename from URL
   * @param {string} url - URL
   * @returns {string} Filename
   */
  extractFileName(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop();
      return filename || 'unknown_file';
    } catch {
      return 'unknown_file';
    }
  }

  /**
   * Get file type from URL or filename
   * @param {string} url - URL or filename
   * @returns {string} File type
   */
  getFileType(url) {
    const filename = this.extractFileName(url);
    const extension = this.getFileExtension(filename);

    for (const [type, extensions] of Object.entries(this.supportedTypes)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }

    return 'unknown';
  }

  /**
   * Get file extension
   * @param {string} filename - Filename
   * @returns {string} File extension
   */
  getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
  }

  /**
   * Remove duplicate attachments
   * @param {Array} attachments - Attachments array
   * @returns {Array} Unique attachments
   */
  removeDuplicateAttachments(attachments) {
    const seen = new Set();
    return attachments.filter(attachment => {
      const key = `${attachment.name}_${attachment.size || 0}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Process individual attachment
   * @param {Object} attachment - Attachment data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Processed attachment
   */
  async processIndividualAttachment(attachment, userId) {
    try {
      // Basic validation
      const validation = this.validateAttachment(attachment);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Analyze attachment
      const analysis = await this.analyzeAttachment(attachment);

      // Security scan
      const securityScan = await this.scanAttachment(attachment);

      // Generate metadata
      const metadata = this.generateAttachmentMetadata(attachment, analysis, securityScan);

      // Store attachment info
      const attachmentId = await this.storeAttachmentInfo(userId, attachment, metadata);

      return {
        id: attachmentId,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        url: attachment.url,
        inline: attachment.inline || false,
        analysis,
        securityScan,
        metadata,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to process individual attachment:', error);
      throw error;
    }
  }

  /**
   * Validate attachment
   * @param {Object} attachment - Attachment data
   * @returns {Object} Validation result
   */
  validateAttachment(attachment) {
    // Check if attachment has required fields
    if (!attachment.name) {
      return { valid: false, error: 'Attachment name is required' };
    }

    // Check file size
    if (attachment.size && attachment.size > this.maxFileSize) {
      return { valid: false, error: 'Attachment size exceeds maximum allowed size' };
    }

    // Check for dangerous extensions
    const extension = this.getFileExtension(attachment.name);
    if (this.dangerousExtensions.includes(extension)) {
      return { valid: false, error: 'Attachment type is not allowed for security reasons' };
    }

    return { valid: true };
  }

  /**
   * Analyze attachment
   * @param {Object} attachment - Attachment data
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeAttachment(attachment) {
    try {
      const extension = this.getFileExtension(attachment.name);
      const fileType = this.getFileType(attachment.name);

      const analysis = {
        fileType,
        extension,
        category: this.categorizeFileType(fileType),
        isImage: fileType === 'images',
        isDocument: fileType === 'documents',
        isSpreadsheet: fileType === 'spreadsheets',
        isPresentation: fileType === 'presentations',
        isArchive: fileType === 'archives',
        isCode: fileType === 'code',
        isAudio: fileType === 'audio',
        isVideo: fileType === 'video',
        estimatedSize: attachment.size || 'unknown',
        processingRequired: this.requiresProcessing(fileType),
        thumbnailAvailable: this.canGenerateThumbnail(fileType)
      };

      // Additional analysis based on file type
      if (fileType === 'images') {
        analysis.imageAnalysis = await this.analyzeImage(attachment);
      } else if (fileType === 'documents') {
        analysis.documentAnalysis = await this.analyzeDocument(attachment);
      }

      return analysis;

    } catch (error) {
      console.error('Attachment analysis failed:', error);
      return {
        fileType: 'unknown',
        extension: this.getFileExtension(attachment.name),
        category: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Categorize file type
   * @param {string} fileType - File type
   * @returns {string} Category
   */
  categorizeFileType(fileType) {
    const categories = {
      documents: 'document',
      spreadsheets: 'data',
      presentations: 'presentation',
      images: 'media',
      archives: 'archive',
      code: 'code',
      audio: 'media',
      video: 'media'
    };

    return categories[fileType] || 'other';
  }

  /**
   * Check if file requires processing
   * @param {string} fileType - File type
   * @returns {boolean} Requires processing
   */
  requiresProcessing(fileType) {
    const processingTypes = ['documents', 'spreadsheets', 'presentations', 'images'];
    return processingTypes.includes(fileType);
  }

  /**
   * Check if thumbnail can be generated
   * @param {string} fileType - File type
   * @returns {boolean} Can generate thumbnail
   */
  canGenerateThumbnail(fileType) {
    const thumbnailTypes = ['images', 'documents', 'presentations'];
    return thumbnailTypes.includes(fileType);
  }

  /**
   * Analyze image attachment
   * @param {Object} attachment - Attachment data
   * @returns {Promise<Object>} Image analysis
   */
  async analyzeImage(attachment) {
    try {
      // In a real implementation, you would analyze the actual image
      // For now, we'll return basic analysis
      return {
        format: this.getFileExtension(attachment.name),
        estimatedDimensions: 'unknown',
        colorSpace: 'unknown',
        hasTransparency: false,
        compressionType: 'unknown',
        quality: 'unknown'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Analyze document attachment
   * @param {Object} attachment - Attachment data
   * @returns {Promise<Object>} Document analysis
   */
  async analyzeDocument(attachment) {
    try {
      const extension = this.getFileExtension(attachment.name);
      
      return {
        format: extension,
        estimatedPages: 'unknown',
        hasImages: false,
        hasTables: false,
        language: 'unknown',
        encoding: 'unknown'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Scan attachment for security issues
   * @param {Object} attachment - Attachment data
   * @returns {Promise<Object>} Security scan result
   */
  async scanAttachment(attachment) {
    try {
      const extension = this.getFileExtension(attachment.name);
      
      const scan = {
        isSafe: true,
        threats: [],
        warnings: [],
        scanTime: new Date().toISOString()
      };

      // Check for dangerous extensions
      if (this.dangerousExtensions.includes(extension)) {
        scan.isSafe = false;
        scan.threats.push('Dangerous file type detected');
      }

      // Check for suspicious patterns in filename
      const suspiciousPatterns = [
        /\.exe$/i,
        /\.scr$/i,
        /\.bat$/i,
        /\.cmd$/i,
        /\.pif$/i,
        /\.vbs$/i,
        /\.js$/i
      ];

      if (suspiciousPatterns.some(pattern => pattern.test(attachment.name))) {
        scan.isSafe = false;
        scan.threats.push('Suspicious filename pattern');
      }

      // Check file size for potential issues
      if (attachment.size && attachment.size > 10 * 1024 * 1024) { // 10MB
        scan.warnings.push('Large file size may indicate potential issues');
      }

      return scan;

    } catch (error) {
      console.error('Security scan failed:', error);
      return {
        isSafe: false,
        threats: ['Security scan failed'],
        warnings: [],
        scanTime: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Generate attachment metadata
   * @param {Object} attachment - Attachment data
   * @param {Object} analysis - Analysis result
   * @param {Object} securityScan - Security scan result
   * @returns {Object} Metadata
   */
  generateAttachmentMetadata(attachment, analysis, securityScan) {
    return {
      originalName: attachment.name,
      fileType: analysis.fileType,
      category: analysis.category,
      size: attachment.size,
      extension: analysis.extension,
      isSafe: securityScan.isSafe,
      threats: securityScan.threats,
      warnings: securityScan.warnings,
      processingRequired: analysis.processingRequired,
      thumbnailAvailable: analysis.thumbnailAvailable,
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Store attachment info in database
   * @param {string} userId - User ID
   * @param {Object} attachment - Attachment data
   * @param {Object} metadata - Attachment metadata
   * @returns {Promise<string>} Attachment ID
   */
  async storeAttachmentInfo(userId, attachment, metadata) {
    try {
      const attachmentId = `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from('email_attachments')
        .insert({
          id: attachmentId,
          user_id: userId,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          url: attachment.url,
          inline: attachment.inline || false,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return attachmentId;

    } catch (error) {
      console.error('Failed to store attachment info:', error);
      throw error;
    }
  }

  /**
   * Store attachment metadata for email
   * @param {string} userId - User ID
   * @param {string} emailId - Email ID
   * @param {Array} attachments - Processed attachments
   */
  async storeAttachmentMetadata(userId, emailId, attachments) {
    try {
      const attachmentIds = attachments.map(att => att.id);

      await supabase
        .from('email_attachment_links')
        .insert(
          attachmentIds.map(attachmentId => ({
            email_id: emailId,
            attachment_id: attachmentId,
            user_id: userId,
            created_at: new Date().toISOString()
          }))
        );

    } catch (error) {
      console.error('Failed to store attachment metadata:', error);
    }
  }

  /**
   * Get attachments for email
   * @param {string} emailId - Email ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Email attachments
   */
  async getEmailAttachments(emailId, userId) {
    try {
      const { data: attachments, error } = await supabase
        .from('email_attachment_links')
        .select(`
          attachment_id,
          email_attachments (*)
        `)
        .eq('email_id', emailId)
        .eq('user_id', userId);

      if (error) throw error;

      return attachments.map(link => link.email_attachments).filter(Boolean);

    } catch (error) {
      console.error('Failed to get email attachments:', error);
      return [];
    }
  }

  /**
   * Get attachment by ID
   * @param {string} attachmentId - Attachment ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Attachment data
   */
  async getAttachment(attachmentId, userId) {
    try {
      const { data: attachment, error } = await supabase
        .from('email_attachments')
        .select('*')
        .eq('id', attachmentId)
        .eq('user_id', userId)
        .single();

      if (error || !attachment) return null;

      return attachment;

    } catch (error) {
      console.error('Failed to get attachment:', error);
      return null;
    }
  }

  /**
   * Delete attachment
   * @param {string} attachmentId - Attachment ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteAttachment(attachmentId, userId) {
    try {
      // Delete attachment links first
      await supabase
        .from('email_attachment_links')
        .delete()
        .eq('attachment_id', attachmentId)
        .eq('user_id', userId);

      // Delete attachment
      const { error } = await supabase
        .from('email_attachments')
        .delete()
        .eq('id', attachmentId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, message: 'Attachment deleted successfully' };

    } catch (error) {
      console.error('Failed to delete attachment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get attachment statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Attachment statistics
   */
  async getAttachmentStatistics(userId) {
    try {
      const { data: attachments, error } = await supabase
        .from('email_attachments')
        .select('type, size, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        totalAttachments: attachments.length,
        totalSize: attachments.reduce((sum, att) => sum + (att.size || 0), 0),
        byType: {},
        byMonth: {},
        averageSize: 0
      };

      // Count by type
      attachments.forEach(attachment => {
        const type = attachment.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });

      // Count by month
      attachments.forEach(attachment => {
        const month = new Date(attachment.created_at).toISOString().substring(0, 7);
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
      });

      // Calculate average size
      if (attachments.length > 0) {
        stats.averageSize = stats.totalSize / attachments.length;
      }

      return stats;

    } catch (error) {
      console.error('Failed to get attachment statistics:', error);
      return {
        totalAttachments: 0,
        totalSize: 0,
        byType: {},
        byMonth: {},
        averageSize: 0
      };
    }
  }

  /**
   * Clear processing cache
   * @param {string} userId - Optional user ID
   */
  clearCache(userId = null) {
    if (userId) {
      this.processingCache.delete(userId);
    } else {
      this.processingCache.clear();
    }
  }
}

// Export singleton instance
export const attachmentProcessor = new AttachmentProcessor();

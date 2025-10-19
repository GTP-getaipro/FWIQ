/**
 * Secure System Message Manager
 * 
 * Handles secure storage, encryption, and retrieval of system messages
 * to prevent source code exposure in client-side applications
 * 
 * @module secureSystemMessageManager
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const ALGORITHM = 'aes-256-gcm';

export class SecureSystemMessageManager {
  constructor(supabaseClient, encryptionKey) {
    this.supabase = supabaseClient;
    this.encryptionKey = encryptionKey || process.env.SYSTEM_MESSAGE_ENCRYPTION_KEY;
    
    if (!this.encryptionKey) {
      throw new Error('SYSTEM_MESSAGE_ENCRYPTION_KEY environment variable is required');
    }
  }

  /**
   * Generate and store system message securely
   * @param {string} userId - User ID
   * @param {string} messageType - Type of system message ('classifier', 'draft_agent', 'multi_business')
   * @param {Array} businessTypes - Array of business types
   * @param {string} content - System message content
   * @returns {Object} - Message reference with ID and hash
   */
  async generateAndStoreSystemMessage(userId, messageType, businessTypes, content) {
    try {
      console.log(`🔒 Securely storing system message for user ${userId}, type: ${messageType}`);
      
      // Generate hash for integrity checking
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      // Encrypt content
      const encryptedContent = this.encryptContent(content);
      
      // Store in database
      const { data: message, error } = await this.supabase
        .from('system_messages')
        .upsert({
          user_id: userId,
          message_type: messageType,
          business_types: businessTypes,
          message_hash: hash,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error storing system message metadata:', error);
        throw error;
      }

      // Store encrypted content
      const { error: contentError } = await this.supabase
        .from('system_message_content')
        .insert({
          message_id: message.id,
          content: encryptedContent,
          version: 1
        });

      if (contentError) {
        console.error('❌ Error storing encrypted system message content:', contentError);
        throw contentError;
      }

      console.log(`✅ System message stored securely with ID: ${message.id}`);
      
      return {
        messageId: message.id,
        hash: hash,
        type: messageType,
        businessTypes: businessTypes
      };
      
    } catch (error) {
      console.error('❌ Error in generateAndStoreSystemMessage:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt system message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @returns {Object} - Decrypted system message content
   */
  async getSystemMessage(messageId, userId) {
    try {
      console.log(`🔓 Retrieving system message ${messageId} for user ${userId}`);
      
      // Verify access and get message
      const { data: message, error } = await this.supabase
        .from('system_messages')
        .select(`
          id,
          message_type,
          business_types,
          message_hash,
          system_message_content(content, version)
        `)
        .eq('id', messageId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !message) {
        console.error('❌ System message not found or access denied:', error);
        throw new Error('System message not found or access denied');
      }

      if (!message.system_message_content || message.system_message_content.length === 0) {
        throw new Error('System message content not found');
      }

      // Decrypt content
      const encryptedContent = message.system_message_content[0].content;
      const decryptedContent = this.decryptContent(encryptedContent);

      // Verify integrity
      const computedHash = crypto.createHash('sha256').update(decryptedContent).digest('hex');
      if (computedHash !== message.message_hash) {
        console.error('❌ System message integrity check failed');
        throw new Error('System message integrity check failed');
      }

      console.log(`✅ System message retrieved and verified for user ${userId}`);
      
      return {
        content: decryptedContent,
        type: message.message_type,
        businessTypes: message.business_types,
        hash: message.message_hash,
        version: message.system_message_content[0].version
      };
      
    } catch (error) {
      console.error('❌ Error in getSystemMessage:', error);
      throw error;
    }
  }

  /**
   * Update existing system message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} content - New system message content
   * @returns {Object} - Updated message reference
   */
  async updateSystemMessage(messageId, userId, content) {
    try {
      console.log(`🔄 Updating system message ${messageId} for user ${userId}`);
      
      // Generate new hash
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      // Encrypt new content
      const encryptedContent = this.encryptContent(content);
      
      // Update message metadata
      const { error: updateError } = await this.supabase
        .from('system_messages')
        .update({
          message_hash: hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Error updating system message metadata:', updateError);
        throw updateError;
      }

      // Get current version
      const { data: currentContent, error: contentError } = await this.supabase
        .from('system_message_content')
        .select('version')
        .eq('message_id', messageId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (contentError) {
        console.error('❌ Error getting current content version:', contentError);
        throw contentError;
      }

      // Insert new version
      const { error: insertError } = await this.supabase
        .from('system_message_content')
        .insert({
          message_id: messageId,
          content: encryptedContent,
          version: (currentContent?.version || 0) + 1
        });

      if (insertError) {
        console.error('❌ Error inserting new content version:', insertError);
        throw insertError;
      }

      console.log(`✅ System message updated successfully`);
      
      return {
        messageId: messageId,
        hash: hash,
        version: (currentContent?.version || 0) + 1
      };
      
    } catch (error) {
      console.error('❌ Error in updateSystemMessage:', error);
      throw error;
    }
  }

  /**
   * Delete system message (soft delete)
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @returns {boolean} - Success status
   */
  async deleteSystemMessage(messageId, userId) {
    try {
      console.log(`🗑️ Deleting system message ${messageId} for user ${userId}`);
      
      const { error } = await this.supabase
        .from('system_messages')
        .update({ is_active: false })
        .eq('id', messageId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting system message:', error);
        throw error;
      }

      console.log(`✅ System message deleted successfully`);
      return true;
      
    } catch (error) {
      console.error('❌ Error in deleteSystemMessage:', error);
      throw error;
    }
  }

  /**
   * List system messages for a user
   * @param {string} userId - User ID
   * @param {string} messageType - Optional message type filter
   * @returns {Array} - List of system message references
   */
  async listSystemMessages(userId, messageType = null) {
    try {
      console.log(`📋 Listing system messages for user ${userId}`);
      
      let query = this.supabase
        .from('system_messages')
        .select('id, message_type, business_types, message_hash, created_at, updated_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (messageType) {
        query = query.eq('message_type', messageType);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('❌ Error listing system messages:', error);
        throw error;
      }

      console.log(`✅ Found ${messages.length} system messages for user ${userId}`);
      
      return messages.map(msg => ({
        id: msg.id,
        type: msg.message_type,
        businessTypes: msg.business_types,
        hash: msg.message_hash,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at
      }));
      
    } catch (error) {
      console.error('❌ Error in listSystemMessages:', error);
      throw error;
    }
  }

  /**
   * Encrypt content
   * @param {string} content - Content to encrypt
   * @returns {string} - Encrypted content as JSON string
   */
  encryptContent(content) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(ALGORITHM, this.encryptionKey);
      cipher.setAAD(Buffer.from('system-message', 'utf8'));
      
      let encrypted = cipher.update(content, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return JSON.stringify({
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      });
      
    } catch (error) {
      console.error('❌ Error encrypting content:', error);
      throw error;
    }
  }

  /**
   * Decrypt content
   * @param {string} encryptedDataString - Encrypted data as JSON string
   * @returns {string} - Decrypted content
   */
  decryptContent(encryptedDataString) {
    try {
      const encryptedData = JSON.parse(encryptedDataString);
      const decipher = crypto.createDecipher(ALGORITHM, this.encryptionKey);
      decipher.setAAD(Buffer.from('system-message', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
      
    } catch (error) {
      console.error('❌ Error decrypting content:', error);
      throw error;
    }
  }

  /**
   * Generate encryption key (for setup)
   * @returns {string} - 256-bit encryption key
   */
  static generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify encryption key format
   * @param {string} key - Encryption key to verify
   * @returns {boolean} - Whether key is valid
   */
  static verifyEncryptionKey(key) {
    return key && key.length === 64 && /^[a-f0-9]+$/i.test(key);
  }
}

export default SecureSystemMessageManager;

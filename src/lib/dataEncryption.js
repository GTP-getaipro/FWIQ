/**
 * Data Encryption Utilities
 * Advanced data encryption and security utilities for FloWorx
 */

import { logger } from './logger.js';
import { securityAuditLogger } from './securityAudit.js';

export class DataEncryption {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for GCM
    this.tagLength = 128; // 128 bits for GCM
    this.saltLength = 16;
    this.iterations = 100000; // PBKDF2 iterations
    this.initialize();
  }

  /**
   * Initialize encryption system
   */
  initialize() {
    // Check for Web Crypto API support
    if (!window.crypto || !window.crypto.subtle) {
      logger.error('Web Crypto API not supported');
      throw new Error('Web Crypto API not supported');
    }

    logger.info('Data Encryption system initialized');
  }

  /**
   * Generate encryption key from password
   * @param {string} password - Password to derive key from
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>} Derived encryption key
   */
  async deriveKeyFromPassword(password, salt) {
    try {
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: this.iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: this.algorithm,
          length: this.keyLength
        },
        false,
        ['encrypt', 'decrypt']
      );

      return key;
    } catch (error) {
      logger.error('Failed to derive key from password:', error);
      throw new Error('Key derivation failed');
    }
  }

  /**
   * Generate random encryption key
   * @returns {Promise<CryptoKey>} Random encryption key
   */
  async generateRandomKey() {
    try {
      const key = await window.crypto.subtle.generateKey(
        {
          name: this.algorithm,
          length: this.keyLength
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      return key;
    } catch (error) {
      logger.error('Failed to generate random key:', error);
      throw new Error('Key generation failed');
    }
  }

  /**
   * Generate random salt
   * @returns {Uint8Array} Random salt
   */
  generateSalt() {
    return window.crypto.getRandomValues(new Uint8Array(this.saltLength));
  }

  /**
   * Generate random IV
   * @returns {Uint8Array} Random IV
   */
  generateIV() {
    return window.crypto.getRandomValues(new Uint8Array(this.ivLength));
  }

  /**
   * Encrypt data with key
   * @param {string|Uint8Array} data - Data to encrypt
   * @param {CryptoKey} key - Encryption key
   * @param {Uint8Array} iv - Initialization vector
   * @returns {Promise<Uint8Array>} Encrypted data
   */
  async encryptData(data, key, iv) {
    try {
      let dataBuffer;
      
      if (typeof data === 'string') {
        dataBuffer = new TextEncoder().encode(data);
      } else if (data instanceof Uint8Array) {
        dataBuffer = data;
      } else {
        throw new Error('Invalid data type for encryption');
      }

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
          tagLength: this.tagLength
        },
        key,
        dataBuffer
      );

      return new Uint8Array(encrypted);
    } catch (error) {
      logger.error('Failed to encrypt data:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data with key
   * @param {Uint8Array} encryptedData - Encrypted data
   * @param {CryptoKey} key - Decryption key
   * @param {Uint8Array} iv - Initialization vector
   * @returns {Promise<Uint8Array>} Decrypted data
   */
  async decryptData(encryptedData, key, iv) {
    try {
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
          tagLength: this.tagLength
        },
        key,
        encryptedData
      );

      return new Uint8Array(decrypted);
    } catch (error) {
      logger.error('Failed to decrypt data:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt data with password
   * @param {string} data - Data to encrypt
   * @param {string} password - Password for encryption
   * @returns {Promise<Object>} Encrypted data with metadata
   */
  async encryptWithPassword(data, password) {
    try {
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = await this.deriveKeyFromPassword(password, salt);
      
      const encryptedData = await this.encryptData(data, key, iv);
      
      const result = {
        encryptedData: Array.from(encryptedData),
        salt: Array.from(salt),
        iv: Array.from(iv),
        algorithm: this.algorithm,
        iterations: this.iterations,
        timestamp: new Date().toISOString()
      };

      // Log encryption event
      securityAuditLogger.logSecurityEvent('data_encrypted', {
        dataLength: data.length,
        algorithm: this.algorithm,
        keyDerivation: 'PBKDF2'
      }, null, 'low');

      return result;
    } catch (error) {
      logger.error('Failed to encrypt with password:', error);
      throw new Error('Password encryption failed');
    }
  }

  /**
   * Decrypt data with password
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} password - Password for decryption
   * @returns {Promise<string>} Decrypted data
   */
  async decryptWithPassword(encryptedData, password) {
    try {
      const salt = new Uint8Array(encryptedData.salt);
      const iv = new Uint8Array(encryptedData.iv);
      const data = new Uint8Array(encryptedData.encryptedData);
      
      const key = await this.deriveKeyFromPassword(password, salt);
      const decryptedData = await this.decryptData(data, key, iv);
      
      const result = new TextDecoder().decode(decryptedData);

      // Log decryption event
      securityAuditLogger.logSecurityEvent('data_decrypted', {
        dataLength: result.length,
        algorithm: encryptedData.algorithm
      }, null, 'low');

      return result;
    } catch (error) {
      logger.error('Failed to decrypt with password:', error);
      throw new Error('Password decryption failed');
    }
  }

  /**
   * Hash data using SHA-256
   * @param {string|Uint8Array} data - Data to hash
   * @returns {Promise<string>} Hash in hex format
   */
  async hashData(data) {
    try {
      let dataBuffer;
      
      if (typeof data === 'string') {
        dataBuffer = new TextEncoder().encode(data);
      } else if (data instanceof Uint8Array) {
        dataBuffer = data;
      } else {
        throw new Error('Invalid data type for hashing');
      }

      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      logger.error('Failed to hash data:', error);
      throw new Error('Hashing failed');
    }
  }

  /**
   * Generate HMAC signature
   * @param {string} data - Data to sign
   * @param {CryptoKey} key - HMAC key
   * @returns {Promise<string>} HMAC signature in hex format
   */
  async generateHMAC(data, key) {
    try {
      const dataBuffer = new TextEncoder().encode(data);
      const signature = await window.crypto.subtle.sign(
        'HMAC',
        key,
        dataBuffer
      );

      const signatureArray = Array.from(new Uint8Array(signature));
      return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      logger.error('Failed to generate HMAC:', error);
      throw new Error('HMAC generation failed');
    }
  }

  /**
   * Verify HMAC signature
   * @param {string} data - Data to verify
   * @param {string} signature - Signature to verify
   * @param {CryptoKey} key - HMAC key
   * @returns {Promise<boolean>} Signature validity
   */
  async verifyHMAC(data, signature, key) {
    try {
      const expectedSignature = await this.generateHMAC(data, key);
      return expectedSignature === signature;
    } catch (error) {
      logger.error('Failed to verify HMAC:', error);
      return false;
    }
  }

  /**
   * Generate HMAC key
   * @returns {Promise<CryptoKey>} HMAC key
   */
  async generateHMACKey() {
    try {
      const key = await window.crypto.subtle.generateKey(
        {
          name: 'HMAC',
          hash: 'SHA-256'
        },
        true,
        ['sign', 'verify']
      );

      return key;
    } catch (error) {
      logger.error('Failed to generate HMAC key:', error);
      throw new Error('HMAC key generation failed');
    }
  }

  /**
   * Encrypt sensitive data for storage
   * @param {Object} data - Data to encrypt
   * @param {string} password - Password for encryption
   * @returns {Promise<string>} Encrypted data as JSON string
   */
  async encryptSensitiveData(data, password) {
    try {
      const jsonData = JSON.stringify(data);
      const encrypted = await this.encryptWithPassword(jsonData, password);
      
      return JSON.stringify(encrypted);
    } catch (error) {
      logger.error('Failed to encrypt sensitive data:', error);
      throw new Error('Sensitive data encryption failed');
    }
  }

  /**
   * Decrypt sensitive data from storage
   * @param {string} encryptedData - Encrypted data as JSON string
   * @param {string} password - Password for decryption
   * @returns {Promise<Object>} Decrypted data object
   */
  async decryptSensitiveData(encryptedData, password) {
    try {
      const encrypted = JSON.parse(encryptedData);
      const decryptedJson = await this.decryptWithPassword(encrypted, password);
      
      return JSON.parse(decryptedJson);
    } catch (error) {
      logger.error('Failed to decrypt sensitive data:', error);
      throw new Error('Sensitive data decryption failed');
    }
  }

  /**
   * Secure data transmission
   * @param {Object} data - Data to transmit
   * @param {CryptoKey} key - Encryption key
   * @returns {Promise<Object>} Encrypted transmission data
   */
  async secureTransmission(data, key) {
    try {
      const iv = this.generateIV();
      const jsonData = JSON.stringify(data);
      const encryptedData = await this.encryptData(jsonData, key, iv);
      
      // Generate HMAC for integrity
      const hmacKey = await this.generateHMACKey();
      const payload = {
        data: Array.from(encryptedData),
        iv: Array.from(iv),
        timestamp: new Date().toISOString()
      };
      
      const payloadString = JSON.stringify(payload);
      const signature = await this.generateHMAC(payloadString, hmacKey);
      
      return {
        payload: payloadString,
        signature: signature,
        algorithm: this.algorithm
      };
    } catch (error) {
      logger.error('Failed to secure transmission:', error);
      throw new Error('Secure transmission failed');
    }
  }

  /**
   * Verify secure transmission
   * @param {Object} transmissionData - Encrypted transmission data
   * @param {CryptoKey} key - Decryption key
   * @param {CryptoKey} hmacKey - HMAC verification key
   * @returns {Promise<Object>} Decrypted data
   */
  async verifySecureTransmission(transmissionData, key, hmacKey) {
    try {
      // Verify HMAC signature
      const isValid = await this.verifyHMAC(transmissionData.payload, transmissionData.signature, hmacKey);
      
      if (!isValid) {
        throw new Error('Invalid transmission signature');
      }

      // Decrypt payload
      const payload = JSON.parse(transmissionData.payload);
      const encryptedData = new Uint8Array(payload.data);
      const iv = new Uint8Array(payload.iv);
      
      const decryptedData = await this.decryptData(encryptedData, key, iv);
      const jsonData = new TextDecoder().decode(decryptedData);
      
      return JSON.parse(jsonData);
    } catch (error) {
      logger.error('Failed to verify secure transmission:', error);
      throw new Error('Secure transmission verification failed');
    }
  }

  /**
   * Generate secure random string
   * @param {number} length - String length
   * @returns {string} Secure random string
   */
  generateSecureRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }

  /**
   * Generate secure random number
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Secure random number
   */
  generateSecureRandomNumber(min = 0, max = 1000000) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    
    return min + (array[0] % (max - min + 1));
  }

  /**
   * Encrypt file data
   * @param {File} file - File to encrypt
   * @param {string} password - Password for encryption
   * @returns {Promise<Object>} Encrypted file data
   */
  async encryptFile(file, password) {
    try {
      const fileBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);
      
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = await this.deriveKeyFromPassword(password, salt);
      
      const encryptedData = await this.encryptData(fileData, key, iv);
      
      return {
        encryptedData: Array.from(encryptedData),
        salt: Array.from(salt),
        iv: Array.from(iv),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        algorithm: this.algorithm,
        iterations: this.iterations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to encrypt file:', error);
      throw new Error('File encryption failed');
    }
  }

  /**
   * Decrypt file data
   * @param {Object} encryptedFile - Encrypted file data
   * @param {string} password - Password for decryption
   * @returns {Promise<Blob>} Decrypted file blob
   */
  async decryptFile(encryptedFile, password) {
    try {
      const salt = new Uint8Array(encryptedFile.salt);
      const iv = new Uint8Array(encryptedFile.iv);
      const encryptedData = new Uint8Array(encryptedFile.encryptedData);
      
      const key = await this.deriveKeyFromPassword(password, salt);
      const decryptedData = await this.decryptData(encryptedData, key, iv);
      
      return new Blob([decryptedData], { type: encryptedFile.fileType });
    } catch (error) {
      logger.error('Failed to decrypt file:', error);
      throw new Error('File decryption failed');
    }
  }

  /**
   * Create encrypted storage wrapper
   * @param {string} password - Storage password
   * @returns {Object} Encrypted storage wrapper
   */
  createEncryptedStorage(password) {
    return {
      setItem: async (key, value) => {
        try {
          const encrypted = await this.encryptWithPassword(value, password);
          localStorage.setItem(key, JSON.stringify(encrypted));
        } catch (error) {
          logger.error('Failed to encrypt storage item:', error);
          throw error;
        }
      },

      getItem: async (key) => {
        try {
          const encrypted = localStorage.getItem(key);
          if (!encrypted) return null;
          
          const encryptedData = JSON.parse(encrypted);
          return await this.decryptWithPassword(encryptedData, password);
        } catch (error) {
          logger.error('Failed to decrypt storage item:', error);
          return null;
        }
      },

      removeItem: (key) => {
        localStorage.removeItem(key);
      },

      clear: () => {
        localStorage.clear();
      }
    };
  }

  /**
   * Validate encryption configuration
   * @returns {Object} Validation result
   */
  validateConfiguration() {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check Web Crypto API support
    if (!window.crypto || !window.crypto.subtle) {
      validation.valid = false;
      validation.errors.push('Web Crypto API not supported');
    }

    // Check algorithm support
    if (window.crypto && window.crypto.subtle) {
      window.crypto.subtle.importKey(
        'raw',
        new Uint8Array(32),
        { name: this.algorithm, length: this.keyLength },
        false,
        ['encrypt']
      ).catch(() => {
        validation.valid = false;
        validation.errors.push(`Algorithm ${this.algorithm} not supported`);
      });
    }

    // Check key length
    if (this.keyLength < 128) {
      validation.warnings.push('Key length is less than 128 bits');
    }

    // Check iterations
    if (this.iterations < 100000) {
      validation.warnings.push('PBKDF2 iterations less than recommended minimum');
    }

    return validation;
  }

  /**
   * Get encryption statistics
   * @returns {Object} Encryption statistics
   */
  getStatistics() {
    return {
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      ivLength: this.ivLength,
      tagLength: this.tagLength,
      saltLength: this.saltLength,
      iterations: this.iterations,
      webCryptoSupported: !!(window.crypto && window.crypto.subtle),
      configuration: this.validateConfiguration()
    };
  }
}

// Export singleton instance
export const dataEncryption = new DataEncryption();

export default DataEncryption;

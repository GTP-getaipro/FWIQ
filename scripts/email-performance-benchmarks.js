/**
 * Email Performance Benchmarks
 * Comprehensive performance benchmarking for email processing
 */

import { emailService } from '../src/lib/emailService.js';
import { supabase } from '../src/lib/customSupabaseClient.js';
import { logger } from '../src/lib/logger.js';

export class EmailPerformanceBenchmarks {
  constructor() {
    this.benchmarks = {
      parsing: {
        single: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
        batch: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 }
      },
      contentExtraction: {
        single: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
        batch: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 }
      },
      providerIntegration: {
        gmail: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
        outlook: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 }
      },
      errorRecovery: {
        single: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
        batch: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 }
      }
    };
    
    this.targets = {
      parsing: { single: 500, batch: 200 }, // milliseconds
      contentExtraction: { single: 1000, batch: 500 },
      providerIntegration: { gmail: 2000, outlook: 3000 },
      errorRecovery: { single: 1000, batch: 500 }
    };
    
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Run comprehensive performance benchmarks
   * @param {string} userId - User ID for testing
   * @param {Object} options - Benchmark options
   * @returns {Promise<Object>} Benchmark results
   */
  async runBenchmarks(userId, options = {}) {
    if (this.isRunning) {
      throw new Error('Benchmarks already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    logger.info('Starting email performance benchmarks', { userId, options });

    try {
      // Run all benchmark categories
      const [
        parsingResults,
        contentExtractionResults,
        providerIntegrationResults,
        errorRecoveryResults
      ] = await Promise.all([
        this.benchmarkEmailParsing(userId, options),
        this.benchmarkContentExtraction(userId, options),
        this.benchmarkProviderIntegration(userId, options),
        this.benchmarkErrorRecovery(userId, options)
      ]);

      const totalTime = Date.now() - startTime;
      
      const results = {
        userId,
        timestamp: new Date().toISOString(),
        totalTime,
        benchmarks: this.benchmarks,
        targets: this.targets,
        results: {
          parsing: parsingResults,
          contentExtraction: contentExtractionResults,
          providerIntegration: providerIntegrationResults,
          errorRecovery: errorRecoveryResults
        },
        summary: this.generateBenchmarkSummary(),
        recommendations: this.generatePerformanceRecommendations()
      };

      // Store benchmark results
      await this.storeBenchmarkResults(userId, results);
      
      logger.info('Email performance benchmarks completed', {
        userId,
        totalTime,
        summary: results.summary
      });

      return results;
    } catch (error) {
      logger.error('Email performance benchmarks failed', {
        userId,
        error: error.message
      });
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Benchmark email parsing performance
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Parsing benchmark results
   */
  async benchmarkEmailParsing(userId, options) {
    const results = { single: [], batch: [] };
    
    logger.info('Benchmarking email parsing performance', { userId });

    // Single email parsing benchmarks
    for (let i = 0; i < (options.iterations || 10); i++) {
      const testEmail = this.generateTestEmail('parsing');
      const startTime = Date.now();
      
      try {
        await emailService.processIncomingEmail(testEmail);
        const duration = Date.now() - startTime;
        results.single.push(duration);
      } catch (error) {
        logger.warn('Email parsing benchmark failed', { error: error.message });
        results.single.push(null);
      }
    }

    // Batch email parsing benchmarks
    const batchSizes = [5, 10, 25, 50];
    for (const batchSize of batchSizes) {
      const testEmails = this.generateTestEmails(batchSize, 'parsing');
      const startTime = Date.now();
      
      try {
        await Promise.all(testEmails.map(email => emailService.processIncomingEmail(email)));
        const duration = Date.now() - startTime;
        results.batch.push({ size: batchSize, duration });
      } catch (error) {
        logger.warn('Batch email parsing benchmark failed', { 
          batchSize, 
          error: error.message 
        });
        results.batch.push({ size: batchSize, duration: null });
      }
    }

    // Calculate statistics
    this.calculateStatistics('parsing', 'single', results.single.filter(t => t !== null));
    this.calculateStatistics('parsing', 'batch', results.batch.map(b => b.duration).filter(t => t !== null));

    return results;
  }

  /**
   * Benchmark content extraction performance
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Content extraction benchmark results
   */
  async benchmarkContentExtraction(userId, options) {
    const results = { single: [], batch: [] };
    
    logger.info('Benchmarking content extraction performance', { userId });

    // Single content extraction benchmarks
    for (let i = 0; i < (options.iterations || 10); i++) {
      const testEmail = this.generateTestEmail('content');
      const startTime = Date.now();
      
      try {
        await this.extractEmailContent(testEmail);
        const duration = Date.now() - startTime;
        results.single.push(duration);
      } catch (error) {
        logger.warn('Content extraction benchmark failed', { error: error.message });
        results.single.push(null);
      }
    }

    // Batch content extraction benchmarks
    const batchSizes = [5, 10, 25, 50];
    for (const batchSize of batchSizes) {
      const testEmails = this.generateTestEmails(batchSize, 'content');
      const startTime = Date.now();
      
      try {
        await Promise.all(testEmails.map(email => this.extractEmailContent(email)));
        const duration = Date.now() - startTime;
        results.batch.push({ size: batchSize, duration });
      } catch (error) {
        logger.warn('Batch content extraction benchmark failed', { 
          batchSize, 
          error: error.message 
        });
        results.batch.push({ size: batchSize, duration: null });
      }
    }

    // Calculate statistics
    this.calculateStatistics('contentExtraction', 'single', results.single.filter(t => t !== null));
    this.calculateStatistics('contentExtraction', 'batch', results.batch.map(b => b.duration).filter(t => t !== null));

    return results;
  }

  /**
   * Benchmark provider integration performance
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Provider integration benchmark results
   */
  async benchmarkProviderIntegration(userId, options) {
    const results = { gmail: [], outlook: [] };
    
    logger.info('Benchmarking provider integration performance', { userId });

    // Get user's active integrations
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('provider, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('provider', ['gmail', 'outlook']);

    if (error || !integrations || integrations.length === 0) {
      logger.warn('No active email integrations found for benchmarking');
      return results;
    }

    // Benchmark each provider
    for (const integration of integrations) {
      const provider = integration.provider;
      
      for (let i = 0; i < (options.iterations || 5); i++) {
        const startTime = Date.now();
        
        try {
          await this.testProviderOperation(provider);
          const duration = Date.now() - startTime;
          results[provider].push(duration);
        } catch (error) {
          logger.warn('Provider integration benchmark failed', { 
            provider, 
            error: error.message 
          });
          results[provider].push(null);
        }
      }

      // Calculate statistics for this provider
      this.calculateStatistics('providerIntegration', provider, results[provider].filter(t => t !== null));
    }

    return results;
  }

  /**
   * Benchmark error recovery performance
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Error recovery benchmark results
   */
  async benchmarkErrorRecovery(userId, options) {
    const results = { single: [], batch: [] };
    
    logger.info('Benchmarking error recovery performance', { userId });

    // Single error recovery benchmarks
    const errorScenarios = [
      'invalid_email',
      'missing_fields',
      'network_timeout',
      'provider_error'
    ];

    for (const scenario of errorScenarios) {
      for (let i = 0; i < (options.iterations || 5); i++) {
        const startTime = Date.now();
        
        try {
          await this.simulateErrorRecovery(scenario);
          const duration = Date.now() - startTime;
          results.single.push(duration);
        } catch (error) {
          logger.warn('Error recovery benchmark failed', { 
            scenario, 
            error: error.message 
          });
          results.single.push(null);
        }
      }
    }

    // Batch error recovery benchmarks
    const batchSizes = [3, 5, 10];
    for (const batchSize of batchSizes) {
      const startTime = Date.now();
      
      try {
        await Promise.all(
          Array(batchSize).fill().map(() => this.simulateErrorRecovery('batch_error'))
        );
        const duration = Date.now() - startTime;
        results.batch.push({ size: batchSize, duration });
      } catch (error) {
        logger.warn('Batch error recovery benchmark failed', { 
          batchSize, 
          error: error.message 
        });
        results.batch.push({ size: batchSize, duration: null });
      }
    }

    // Calculate statistics
    this.calculateStatistics('errorRecovery', 'single', results.single.filter(t => t !== null));
    this.calculateStatistics('errorRecovery', 'batch', results.batch.map(b => b.duration).filter(t => t !== null));

    return results;
  }

  /**
   * Calculate performance statistics
   * @param {string} category - Benchmark category
   * @param {string} type - Benchmark type
   * @param {Array} times - Array of timing measurements
   */
  calculateStatistics(category, type, times) {
    if (times.length === 0) return;

    const sortedTimes = times.sort((a, b) => a - b);
    const count = sortedTimes.length;
    
    const stats = {
      min: sortedTimes[0],
      max: sortedTimes[count - 1],
      avg: sortedTimes.reduce((sum, time) => sum + time, 0) / count,
      p95: sortedTimes[Math.floor(count * 0.95)],
      p99: sortedTimes[Math.floor(count * 0.99)]
    };

    this.benchmarks[category][type] = stats;
  }

  /**
   * Generate benchmark summary
   * @returns {Object} Summary
   */
  generateBenchmarkSummary() {
    const summary = {
      overall: { passed: 0, failed: 0, total: 0 },
      categories: {}
    };

    // Check each category against targets
    Object.keys(this.benchmarks).forEach(category => {
      const categoryResults = { passed: 0, failed: 0, total: 0 };
      
      Object.keys(this.benchmarks[category]).forEach(type => {
        const stats = this.benchmarks[category][type];
        const target = this.targets[category][type];
        
        if (stats.avg > 0) {
          categoryResults.total++;
          if (stats.avg <= target) {
            categoryResults.passed++;
            summary.overall.passed++;
          } else {
            categoryResults.failed++;
            summary.overall.failed++;
          }
        }
      });
      
      summary.categories[category] = categoryResults;
    });

    summary.overall.total = summary.overall.passed + summary.overall.failed;
    summary.successRate = summary.overall.total > 0 
      ? (summary.overall.passed / summary.overall.total) * 100 
      : 0;

    return summary;
  }

  /**
   * Generate performance recommendations
   * @returns {Array} Recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = [];

    // Check each category against targets
    Object.keys(this.benchmarks).forEach(category => {
      Object.keys(this.benchmarks[category]).forEach(type => {
        const stats = this.benchmarks[category][type];
        const target = this.targets[category][type];
        
        if (stats.avg > target) {
          const improvement = ((stats.avg - target) / target) * 100;
          
          recommendations.push({
            category,
            type,
            priority: improvement > 100 ? 'critical' : improvement > 50 ? 'high' : 'medium',
            title: `${category} ${type} Performance Issue`,
            description: `Average time (${stats.avg}ms) exceeds target (${target}ms) by ${improvement.toFixed(1)}%`,
            action: this.getPerformanceAction(category, type),
            currentPerformance: stats,
            targetPerformance: target
          });
        }
      });
    });

    return recommendations;
  }

  /**
   * Get performance improvement action
   * @param {string} category - Category
   * @param {string} type - Type
   * @returns {string} Action recommendation
   */
  getPerformanceAction(category, type) {
    const actions = {
      parsing: {
        single: 'Optimize email parsing algorithms and reduce processing overhead',
        batch: 'Implement parallel processing and batch optimization'
      },
      contentExtraction: {
        single: 'Optimize content extraction algorithms and caching',
        batch: 'Implement batch content extraction and parallel processing'
      },
      providerIntegration: {
        gmail: 'Optimize Gmail API calls and implement connection pooling',
        outlook: 'Optimize Outlook API calls and implement connection pooling'
      },
      errorRecovery: {
        single: 'Optimize error handling and recovery mechanisms',
        batch: 'Implement batch error recovery and parallel processing'
      }
    };

    return actions[category]?.[type] || 'Review and optimize performance';
  }

  /**
   * Store benchmark results
   * @param {string} userId - User ID
   * @param {Object} results - Benchmark results
   */
  async storeBenchmarkResults(userId, results) {
    try {
      const { error } = await supabase
        .from('email_performance_benchmarks')
        .insert({
          user_id: userId,
          benchmark_data: results,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to store benchmark results', {
        userId,
        error: error.message
      });
    }
  }

  /**
   * Generate test email
   * @param {string} type - Email type
   * @returns {Object} Test email
   */
  generateTestEmail(type) {
    const baseEmail = {
      messageId: `benchmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subject: 'Performance Test Email',
      from: 'test@example.com',
      to: 'recipient@example.com',
      body: 'This is a performance test email for benchmarking purposes.',
      timestamp: new Date().toISOString(),
      attachments: []
    };

    switch (type) {
      case 'parsing':
        return {
          ...baseEmail,
          subject: 'Parsing Test Email',
          body: 'This email is specifically designed for parsing performance testing.'
        };
      
      case 'content':
        return {
          ...baseEmail,
          subject: 'Content Extraction Test',
          body: 'This email contains content for extraction testing including keywords like service, pool, maintenance, and repair.'
        };
      
      default:
        return baseEmail;
    }
  }

  /**
   * Generate test emails
   * @param {number} count - Number of emails
   * @param {string} type - Email type
   * @returns {Array} Test emails
   */
  generateTestEmails(count, type = 'general') {
    const emails = [];
    
    for (let i = 0; i < count; i++) {
      emails.push({
        ...this.generateTestEmail(type),
        messageId: `batch-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        subject: `Batch Test Email ${i}`,
        body: `This is batch test email number ${i} for ${type} testing.`
      });
    }
    
    return emails;
  }

  /**
   * Extract email content (simulated)
   * @param {Object} email - Email data
   * @returns {Promise<Object>} Extracted content
   */
  async extractEmailContent(email) {
    // Simulate content extraction processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    return {
      subject: email.subject,
      from: email.from,
      body: email.body,
      categories: this.extractCategories(email.body),
      urgency: this.extractUrgency(email.subject, email.body),
      keywords: this.extractKeywords(email.body)
    };
  }

  /**
   * Test provider operation (simulated)
   * @param {string} provider - Provider name
   * @returns {Promise<void>}
   */
  async testProviderOperation(provider) {
    // Simulate provider operation based on provider type
    const delays = {
      gmail: 100 + Math.random() * 200,
      outlook: 150 + Math.random() * 300
    };
    
    await new Promise(resolve => setTimeout(resolve, delays[provider] || 200));
  }

  /**
   * Simulate error recovery (simulated)
   * @param {string} scenario - Error scenario
   * @returns {Promise<void>}
   */
  async simulateErrorRecovery(scenario) {
    // Simulate error recovery processing
    const delays = {
      invalid_email: 50 + Math.random() * 100,
      missing_fields: 30 + Math.random() * 80,
      network_timeout: 200 + Math.random() * 300,
      provider_error: 100 + Math.random() * 200,
      batch_error: 150 + Math.random() * 250
    };
    
    await new Promise(resolve => setTimeout(resolve, delays[scenario] || 100));
  }

  /**
   * Extract categories from email body
   * @param {string} body - Email body
   * @returns {Array} Categories
   */
  extractCategories(body) {
    const categories = [];
    
    if (body.toLowerCase().includes('service')) categories.push('service');
    if (body.toLowerCase().includes('quote')) categories.push('quote');
    if (body.toLowerCase().includes('support')) categories.push('support');
    if (body.toLowerCase().includes('complaint')) categories.push('complaint');
    
    return categories.length > 0 ? categories : ['general'];
  }

  /**
   * Extract urgency from email
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @returns {string} Urgency level
   */
  extractUrgency(subject, body) {
    const urgentKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'critical'];
    const text = (subject + ' ' + body).toLowerCase();
    
    for (const keyword of urgentKeywords) {
      if (text.includes(keyword)) {
        return 'urgent';
      }
    }
    
    return 'normal';
  }

  /**
   * Extract keywords from email body
   * @param {string} body - Email body
   * @returns {Array} Keywords
   */
  extractKeywords(body) {
    const keywords = [];
    const words = body.toLowerCase().split(/\s+/);
    
    const importantWords = ['pool', 'spa', 'service', 'repair', 'maintenance', 'cleaning'];
    
    for (const word of words) {
      if (importantWords.includes(word) && !keywords.includes(word)) {
        keywords.push(word);
      }
    }
    
    return keywords;
  }

  /**
   * Get current benchmarks
   * @returns {Object} Current benchmarks
   */
  getBenchmarks() {
    return this.benchmarks;
  }

  /**
   * Get performance targets
   * @returns {Object} Performance targets
   */
  getTargets() {
    return this.targets;
  }

  /**
   * Update performance targets
   * @param {Object} newTargets - New targets
   */
  updateTargets(newTargets) {
    this.targets = { ...this.targets, ...newTargets };
  }

  /**
   * Reset benchmarks
   */
  resetBenchmarks() {
    Object.keys(this.benchmarks).forEach(category => {
      Object.keys(this.benchmarks[category]).forEach(type => {
        this.benchmarks[category][type] = { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
      });
    });
  }
}

// Export singleton instance
export const emailPerformanceBenchmarks = new EmailPerformanceBenchmarks();

export default EmailPerformanceBenchmarks;

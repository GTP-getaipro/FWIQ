/**
 * AI Response Time Benchmarks
 * Comprehensive performance benchmarking for AI response generation
 */

import { aiService } from '../src/lib/aiService.js';
import { supabase } from '../src/lib/customSupabaseClient.js';
import { logger } from '../src/lib/logger.js';

export class AIResponseTimeBenchmarks {
  constructor() {
    this.benchmarks = {
      classification: {
        single: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
        batch: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 }
      },
      generation: {
        single: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
        batch: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 }
      },
      styleAnalysis: {
        single: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
        batch: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 }
      },
      errorRecovery: {
        single: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 },
        batch: { min: 0, max: 0, avg: 0, p95: 0, p99: 0 }
      }
    };
    
    this.targets = {
      classification: { single: 2000, batch: 1000 }, // milliseconds
      generation: { single: 5000, batch: 3000 },
      styleAnalysis: { single: 3000, batch: 2000 },
      errorRecovery: { single: 1000, batch: 500 }
    };
    
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Run comprehensive AI response time benchmarks
   * @param {string} userId - User ID for testing
   * @param {Object} options - Benchmark options
   * @returns {Promise<Object>} Benchmark results
   */
  async runBenchmarks(userId, options = {}) {
    if (this.isRunning) {
      throw new Error('AI response time benchmarks already running');
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    logger.info('Starting AI response time benchmarks', { userId, options });

    try {
      // Run all benchmark categories
      const [
        classificationResults,
        generationResults,
        styleAnalysisResults,
        errorRecoveryResults
      ] = await Promise.all([
        this.benchmarkClassification(userId, options),
        this.benchmarkGeneration(userId, options),
        this.benchmarkStyleAnalysis(userId, options),
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
          classification: classificationResults,
          generation: generationResults,
          styleAnalysis: styleAnalysisResults,
          errorRecovery: errorRecoveryResults
        },
        summary: this.generateBenchmarkSummary(),
        recommendations: this.generatePerformanceRecommendations()
      };

      // Store benchmark results
      await this.storeBenchmarkResults(userId, results);
      
      logger.info('AI response time benchmarks completed', {
        userId,
        totalTime,
        summary: results.summary
      });

      return results;
    } catch (error) {
      logger.error('AI response time benchmarks failed', {
        userId,
        error: error.message
      });
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Benchmark AI classification performance
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Classification benchmark results
   */
  async benchmarkClassification(userId, options) {
    const results = { single: [], batch: [] };
    
    logger.info('Benchmarking AI classification performance', { userId });

    // Single classification benchmarks
    for (let i = 0; i < (options.iterations || 10); i++) {
      const testEmail = this.generateTestEmail('classification');
      const startTime = Date.now();
      
      try {
        await aiService.classifyEmail(testEmail);
        const duration = Date.now() - startTime;
        results.single.push(duration);
      } catch (error) {
        logger.warn('AI classification benchmark failed', { error: error.message });
        results.single.push(null);
      }
    }

    // Batch classification benchmarks
    const batchSizes = [3, 5, 10, 20];
    for (const batchSize of batchSizes) {
      const testEmails = this.generateTestEmails(batchSize, 'classification');
      const startTime = Date.now();
      
      try {
        await Promise.all(testEmails.map(email => aiService.classifyEmail(email)));
        const duration = Date.now() - startTime;
        results.batch.push({ size: batchSize, duration });
      } catch (error) {
        logger.warn('Batch AI classification benchmark failed', { 
          batchSize, 
          error: error.message 
        });
        results.batch.push({ size: batchSize, duration: null });
      }
    }

    // Calculate statistics
    this.calculateStatistics('classification', 'single', results.single.filter(t => t !== null));
    this.calculateStatistics('classification', 'batch', results.batch.map(b => b.duration).filter(t => t !== null));

    return results;
  }

  /**
   * Benchmark AI response generation performance
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Generation benchmark results
   */
  async benchmarkGeneration(userId, options) {
    const results = { single: [], batch: [] };
    
    logger.info('Benchmarking AI response generation performance', { userId });

    // Single generation benchmarks
    for (let i = 0; i < (options.iterations || 10); i++) {
      const testEmail = this.generateTestEmail('generation');
      const context = this.generateTestContext();
      const startTime = Date.now();
      
      try {
        await aiService.generateResponse(testEmail, context);
        const duration = Date.now() - startTime;
        results.single.push(duration);
      } catch (error) {
        logger.warn('AI generation benchmark failed', { error: error.message });
        results.single.push(null);
      }
    }

    // Batch generation benchmarks
    const batchSizes = [3, 5, 10];
    for (const batchSize of batchSizes) {
      const testEmails = this.generateTestEmails(batchSize, 'generation');
      const contexts = Array(batchSize).fill().map(() => this.generateTestContext());
      const startTime = Date.now();
      
      try {
        await Promise.all(testEmails.map((email, index) => 
          aiService.generateResponse(email, contexts[index])
        ));
        const duration = Date.now() - startTime;
        results.batch.push({ size: batchSize, duration });
      } catch (error) {
        logger.warn('Batch AI generation benchmark failed', { 
          batchSize, 
          error: error.message 
        });
        results.batch.push({ size: batchSize, duration: null });
      }
    }

    // Calculate statistics
    this.calculateStatistics('generation', 'single', results.single.filter(t => t !== null));
    this.calculateStatistics('generation', 'batch', results.batch.map(b => b.duration).filter(t => t !== null));

    return results;
  }

  /**
   * Benchmark AI style analysis performance
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Style analysis benchmark results
   */
  async benchmarkStyleAnalysis(userId, options) {
    const results = { single: [], batch: [] };
    
    logger.info('Benchmarking AI style analysis performance', { userId });

    // Single style analysis benchmarks
    for (let i = 0; i < (options.iterations || 5); i++) {
      const emailHistory = this.generateTestEmailHistory(10);
      const startTime = Date.now();
      
      try {
        await aiService.analyzeCommunicationStyle(userId, emailHistory);
        const duration = Date.now() - startTime;
        results.single.push(duration);
      } catch (error) {
        logger.warn('AI style analysis benchmark failed', { error: error.message });
        results.single.push(null);
      }
    }

    // Batch style analysis benchmarks
    const batchSizes = [2, 3, 5];
    for (const batchSize of batchSizes) {
      const emailHistories = Array(batchSize).fill().map(() => 
        this.generateTestEmailHistory(10)
      );
      const startTime = Date.now();
      
      try {
        await Promise.all(emailHistories.map(history => 
          aiService.analyzeCommunicationStyle(userId, history)
        ));
        const duration = Date.now() - startTime;
        results.batch.push({ size: batchSize, duration });
      } catch (error) {
        logger.warn('Batch AI style analysis benchmark failed', { 
          batchSize, 
          error: error.message 
        });
        results.batch.push({ size: batchSize, duration: null });
      }
    }

    // Calculate statistics
    this.calculateStatistics('styleAnalysis', 'single', results.single.filter(t => t !== null));
    this.calculateStatistics('styleAnalysis', 'batch', results.batch.map(b => b.duration).filter(t => t !== null));

    return results;
  }

  /**
   * Benchmark AI error recovery performance
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Error recovery benchmark results
   */
  async benchmarkErrorRecovery(userId, options) {
    const results = { single: [], batch: [] };
    
    logger.info('Benchmarking AI error recovery performance', { userId });

    // Single error recovery benchmarks
    const errorScenarios = [
      'api_timeout',
      'rate_limit',
      'invalid_api_key',
      'model_error',
      'network_error'
    ];

    for (const scenario of errorScenarios) {
      for (let i = 0; i < (options.iterations || 3); i++) {
        const startTime = Date.now();
        
        try {
          await this.simulateErrorRecovery(scenario);
          const duration = Date.now() - startTime;
          results.single.push(duration);
        } catch (error) {
          logger.warn('AI error recovery benchmark failed', { 
            scenario, 
            error: error.message 
          });
          results.single.push(null);
        }
      }
    }

    // Batch error recovery benchmarks
    const batchSizes = [3, 5];
    for (const batchSize of batchSizes) {
      const startTime = Date.now();
      
      try {
        await Promise.all(
          Array(batchSize).fill().map(() => this.simulateErrorRecovery('batch_error'))
        );
        const duration = Date.now() - startTime;
        results.batch.push({ size: batchSize, duration });
      } catch (error) {
        logger.warn('Batch AI error recovery benchmark failed', { 
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
      classification: {
        single: 'Optimize AI classification algorithms and reduce processing overhead',
        batch: 'Implement parallel classification and batch optimization'
      },
      generation: {
        single: 'Optimize AI response generation and implement caching',
        batch: 'Implement batch response generation and parallel processing'
      },
      styleAnalysis: {
        single: 'Optimize style analysis algorithms and reduce complexity',
        batch: 'Implement batch style analysis and parallel processing'
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
        .from('ai_performance_benchmarks')
        .insert({
          user_id: userId,
          benchmark_data: results,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to store AI benchmark results', {
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
      subject: 'Performance Test Email',
      sender: 'test@example.com',
      body: 'This is a performance test email for AI benchmarking purposes.',
      timestamp: new Date().toISOString()
    };

    switch (type) {
      case 'classification':
        return {
          ...baseEmail,
          subject: 'Classification Test Email',
          body: 'This email is specifically designed for AI classification performance testing.'
        };
      
      case 'generation':
        return {
          ...baseEmail,
          subject: 'Response Generation Test',
          body: 'This email contains content for AI response generation testing including service requests and customer inquiries.'
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
        subject: `Batch Test Email ${i}`,
        body: `This is batch test email number ${i} for ${type} testing.`
      });
    }
    
    return emails;
  }

  /**
   * Generate test context
   * @returns {Object} Test context
   */
  generateTestContext() {
    return {
      businessName: 'Test Business',
      businessType: 'Service Business',
      userPreferences: {
        tone: 'professional',
        formality: 'medium',
        length: 'medium'
      }
    };
  }

  /**
   * Generate test email history
   * @param {number} count - Number of emails
   * @returns {Array} Email history
   */
  generateTestEmailHistory(count) {
    const history = [];
    
    for (let i = 0; i < count; i++) {
      history.push({
        subject: `Historical Email ${i}`,
        body: `This is historical email ${i} for style analysis testing.`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return history;
  }

  /**
   * Simulate error recovery (simulated)
   * @param {string} scenario - Error scenario
   * @returns {Promise<void>}
   */
  async simulateErrorRecovery(scenario) {
    // Simulate error recovery processing based on scenario
    const delays = {
      api_timeout: 200 + Math.random() * 300,
      rate_limit: 100 + Math.random() * 200,
      invalid_api_key: 50 + Math.random() * 100,
      model_error: 150 + Math.random() * 250,
      network_error: 300 + Math.random() * 400,
      batch_error: 200 + Math.random() * 300
    };
    
    await new Promise(resolve => setTimeout(resolve, delays[scenario] || 100));
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
export const aiResponseTimeBenchmarks = new AIResponseTimeBenchmarks();

export default AIResponseTimeBenchmarks;

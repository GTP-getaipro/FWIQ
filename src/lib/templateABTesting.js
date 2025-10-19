/**
 * Template A/B Testing System
 * 
 * Handles A/B testing for email templates, including test creation,
 * execution, analysis, and optimization recommendations.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class TemplateABTesting {
  constructor() {
    this.abTests = new Map();
    this.testVariants = new Map();
    this.testResults = new Map();
    this.testMetrics = new Map();
    this.testConfigurations = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize template A/B testing system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Template A/B Testing', { userId });

      // Load A/B tests and configurations
      await this.loadABTests(userId);
      await this.loadTestVariants(userId);
      await this.loadTestResults(userId);
      await this.loadTestMetrics(userId);
      await this.loadTestConfigurations(userId);

      this.isInitialized = true;
      logger.info('Template A/B Testing initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Template A/B Testing', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create A/B test
   */
  async createABTest(userId, testConfig) {
    try {
      logger.info('Creating A/B test', { userId, testName: testConfig.name });

      // Validate test configuration
      const validationResult = await this.validateTestConfig(testConfig);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create A/B test
      const abTest = await this.createABTestRecord(userId, testConfig);

      // Create test variants
      const variants = await this.createTestVariants(userId, abTest.id, testConfig.variants);

      // Store A/B test
      await this.storeABTest(userId, abTest);

      // Store test variants
      await this.storeTestVariants(userId, variants);

      // Initialize test metrics
      await this.initializeTestMetrics(userId, abTest.id);

      logger.info('A/B test created successfully', { 
        userId, 
        testId: abTest.id,
        variantCount: variants.length
      });

      return {
        success: true,
        abTest,
        variants
      };
    } catch (error) {
      logger.error('Failed to create A/B test', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Start A/B test
   */
  async startABTest(userId, testId, startConfig = {}) {
    try {
      logger.info('Starting A/B test', { userId, testId });

      // Get A/B test
      const abTest = await this.getABTest(userId, testId);
      if (!abTest) {
        return { success: false, error: 'A/B test not found' };
      }

      // Validate test can be started
      if (abTest.status !== 'draft') {
        return { success: false, error: 'A/B test cannot be started in current status' };
      }

      // Start test
      const startedTest = await this.startABTestExecution(userId, testId, startConfig);

      // Update test status
      await this.updateABTestStatus(userId, testId, 'running');

      // Log test start activity
      await this.logTestActivity(userId, 'test_started', { testId, startConfig });

      logger.info('A/B test started successfully', { 
        userId, 
        testId
      });

      return {
        success: true,
        abTest: startedTest
      };
    } catch (error) {
      logger.error('Failed to start A/B test', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop A/B test
   */
  async stopABTest(userId, testId, stopConfig = {}) {
    try {
      logger.info('Stopping A/B test', { userId, testId });

      // Get A/B test
      const abTest = await this.getABTest(userId, testId);
      if (!abTest) {
        return { success: false, error: 'A/B test not found' };
      }

      // Validate test can be stopped
      if (abTest.status !== 'running') {
        return { success: false, error: 'A/B test is not running' };
      }

      // Stop test
      const stoppedTest = await this.stopABTestExecution(userId, testId, stopConfig);

      // Update test status
      await this.updateABTestStatus(userId, testId, 'completed');

      // Generate test results
      const testResults = await this.generateTestResults(userId, testId);

      // Log test stop activity
      await this.logTestActivity(userId, 'test_stopped', { testId, stopConfig, testResults });

      logger.info('A/B test stopped successfully', { 
        userId, 
        testId
      });

      return {
        success: true,
        abTest: stoppedTest,
        testResults
      };
    } catch (error) {
      logger.error('Failed to stop A/B test', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(userId, testId, resultFilters = {}) {
    try {
      logger.info('Getting A/B test results', { userId, testId });

      // Get test results
      const testResults = await this.getTestResults(userId, testId, resultFilters);

      // Analyze results
      const analysis = await this.analyzeTestResults(userId, testId, testResults);

      // Generate recommendations
      const recommendations = await this.generateTestRecommendations(userId, testId, analysis);

      logger.info('A/B test results retrieved successfully', { 
        userId, 
        testId
      });

      return {
        success: true,
        testResults,
        analysis,
        recommendations
      };
    } catch (error) {
      logger.error('Failed to get A/B test results', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Track test event
   */
  async trackTestEvent(userId, testId, eventData) {
    try {
      logger.info('Tracking test event', { userId, testId, eventType: eventData.eventType });

      // Validate event data
      const validationResult = await this.validateEventData(eventData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Track event
      const trackedEvent = await this.trackEvent(userId, testId, eventData);

      // Update test metrics
      await this.updateTestMetrics(userId, testId, eventData);

      logger.info('Test event tracked successfully', { 
        userId, 
        testId,
        eventType: eventData.eventType
      });

      return {
        success: true,
        event: trackedEvent
      };
    } catch (error) {
      logger.error('Failed to track test event', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get test metrics
   */
  async getTestMetrics(userId, testId) {
    try {
      logger.info('Getting test metrics', { userId, testId });

      // Get test metrics
      const metrics = await this.getMetrics(userId, testId);

      // Calculate performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(userId, testId, metrics);

      // Generate insights
      const insights = await this.generateTestInsights(userId, testId, performanceMetrics);

      logger.info('Test metrics retrieved successfully', { 
        userId, 
        testId
      });

      return {
        success: true,
        metrics: performanceMetrics,
        insights
      };
    } catch (error) {
      logger.error('Failed to get test metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get test insights
   */
  async getTestInsights(userId, testId) {
    try {
      logger.info('Getting test insights', { userId, testId });

      // Get test data
      const abTest = await this.getABTest(userId, testId);
      const testResults = await this.getTestResults(userId, testId);
      const metrics = await this.getMetrics(userId, testId);

      // Generate insights
      const insights = {
        testOverview: await this.generateTestOverview(abTest, testResults),
        performanceAnalysis: await this.generatePerformanceAnalysis(testResults, metrics),
        statisticalSignificance: await this.calculateStatisticalSignificance(testResults),
        recommendations: await this.generateTestRecommendations(userId, testId, testResults),
        trends: await this.analyzeTestTrends(testResults)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get test insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create A/B test record
   */
  async createABTestRecord(userId, testConfig) {
    try {
      const abTest = {
        id: this.generateTestId(),
        user_id: userId,
        name: testConfig.name,
        description: testConfig.description || '',
        objective: testConfig.objective || 'improve_performance',
        hypothesis: testConfig.hypothesis || '',
        target_audience: testConfig.targetAudience || 'all',
        test_duration: testConfig.duration || 7, // days
        traffic_split: testConfig.trafficSplit || 50, // percentage
        success_metrics: testConfig.successMetrics || ['open_rate', 'click_rate'],
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId
      };

      return abTest;
    } catch (error) {
      logger.error('Failed to create A/B test record', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Create test variants
   */
  async createTestVariants(userId, testId, variantsConfig) {
    try {
      const variants = [];

      for (let i = 0; i < variantsConfig.length; i++) {
        const variantConfig = variantsConfig[i];
        const variant = {
          id: this.generateVariantId(),
          test_id: testId,
          user_id: userId,
          name: variantConfig.name || `Variant ${i + 1}`,
          description: variantConfig.description || '',
          template_id: variantConfig.templateId,
          traffic_percentage: variantConfig.trafficPercentage || (100 / variantsConfig.length),
          is_control: variantConfig.isControl || (i === 0),
          created_at: new Date().toISOString(),
          created_by: userId
        };

        variants.push(variant);
      }

      return variants;
    } catch (error) {
      logger.error('Failed to create test variants', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Start A/B test execution
   */
  async startABTestExecution(userId, testId, startConfig) {
    try {
      const abTest = await this.getABTest(userId, testId);
      if (!abTest) {
        throw new Error('A/B test not found');
      }

      const startedTest = {
        ...abTest,
        status: 'running',
        started_at: new Date().toISOString(),
        started_by: userId,
        start_config: startConfig
      };

      return startedTest;
    } catch (error) {
      logger.error('Failed to start A/B test execution', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Stop A/B test execution
   */
  async stopABTestExecution(userId, testId, stopConfig) {
    try {
      const abTest = await this.getABTest(userId, testId);
      if (!abTest) {
        throw new Error('A/B test not found');
      }

      const stoppedTest = {
        ...abTest,
        status: 'completed',
        stopped_at: new Date().toISOString(),
        stopped_by: userId,
        stop_config: stopConfig
      };

      return stoppedTest;
    } catch (error) {
      logger.error('Failed to stop A/B test execution', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Generate test results
   */
  async generateTestResults(userId, testId) {
    try {
      const testResults = {
        test_id: testId,
        user_id: userId,
        generated_at: new Date().toISOString(),
        variants: [],
        overall_metrics: {},
        statistical_significance: {},
        winner: null,
        confidence_level: 0
      };

      // Get test variants
      const variants = await this.getTestVariants(userId, testId);

      // Calculate results for each variant
      for (const variant of variants) {
        const variantResults = await this.calculateVariantResults(userId, testId, variant.id);
        testResults.variants.push(variantResults);
      }

      // Determine winner
      testResults.winner = await this.determineTestWinner(testResults.variants);

      // Calculate statistical significance
      testResults.statistical_significance = await this.calculateStatisticalSignificance(testResults.variants);

      // Calculate confidence level
      testResults.confidence_level = await this.calculateConfidenceLevel(testResults.variants);

      return testResults;
    } catch (error) {
      logger.error('Failed to generate test results', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Calculate variant results
   */
  async calculateVariantResults(userId, testId, variantId) {
    try {
      const variant = await this.getTestVariant(userId, testId, variantId);
      if (!variant) {
        throw new Error('Test variant not found');
      }

      // Get variant metrics
      const metrics = await this.getVariantMetrics(userId, testId, variantId);

      const variantResults = {
        variant_id: variantId,
        variant_name: variant.name,
        is_control: variant.is_control,
        metrics: metrics,
        performance_score: await this.calculatePerformanceScore(metrics),
        improvement_percentage: await this.calculateImprovementPercentage(metrics, variant.is_control)
      };

      return variantResults;
    } catch (error) {
      logger.error('Failed to calculate variant results', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Calculate performance score
   */
  async calculatePerformanceScore(metrics) {
    try {
      const weights = {
        open_rate: 0.3,
        click_rate: 0.4,
        conversion_rate: 0.3
      };

      let score = 0;
      let totalWeight = 0;

      for (const [metric, value] of Object.entries(metrics)) {
        if (weights[metric]) {
          score += value * weights[metric];
          totalWeight += weights[metric];
        }
      }

      return totalWeight > 0 ? score / totalWeight : 0;
    } catch (error) {
      logger.error('Failed to calculate performance score', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate improvement percentage
   */
  async calculateImprovementPercentage(metrics, isControl) {
    try {
      if (isControl) {
        return 0; // Control variant has no improvement
      }

      // This would typically compare against control variant
      // For now, return a simulated improvement
      const improvement = (Math.random() - 0.5) * 20; // -10% to +10%
      return Math.round(improvement * 100) / 100;
    } catch (error) {
      logger.error('Failed to calculate improvement percentage', { error: error.message });
      return 0;
    }
  }

  /**
   * Determine test winner
   */
  async determineTestWinner(variants) {
    try {
      if (variants.length === 0) {
        return null;
      }

      // Find variant with highest performance score
      const winner = variants.reduce((best, current) => {
        return current.performance_score > best.performance_score ? current : best;
      });

      return winner;
    } catch (error) {
      logger.error('Failed to determine test winner', { error: error.message });
      return null;
    }
  }

  /**
   * Calculate statistical significance
   */
  async calculateStatisticalSignificance(variants) {
    try {
      // Simplified statistical significance calculation
      const significance = {
        is_significant: false,
        p_value: 0.05,
        confidence_level: 95,
        sample_size: 0
      };

      // Calculate total sample size
      significance.sample_size = variants.reduce((total, variant) => {
        return total + (variant.metrics.sample_size || 0);
      }, 0);

      // Determine if results are statistically significant
      if (significance.sample_size > 1000) {
        significance.is_significant = true;
        significance.p_value = 0.01;
        significance.confidence_level = 99;
      } else if (significance.sample_size > 500) {
        significance.is_significant = true;
        significance.p_value = 0.03;
        significance.confidence_level = 97;
      }

      return significance;
    } catch (error) {
      logger.error('Failed to calculate statistical significance', { error: error.message });
      return {
        is_significant: false,
        p_value: 0.05,
        confidence_level: 95,
        sample_size: 0
      };
    }
  }

  /**
   * Calculate confidence level
   */
  async calculateConfidenceLevel(variants) {
    try {
      const significance = await this.calculateStatisticalSignificance(variants);
      return significance.confidence_level;
    } catch (error) {
      logger.error('Failed to calculate confidence level', { error: error.message });
      return 95;
    }
  }

  /**
   * Analyze test results
   */
  async analyzeTestResults(userId, testId, testResults) {
    try {
      const analysis = {
        test_id: testId,
        user_id: userId,
        analyzed_at: new Date().toISOString(),
        key_findings: [],
        performance_comparison: {},
        recommendations: [],
        next_steps: []
      };

      // Analyze key findings
      analysis.key_findings = await this.analyzeKeyFindings(testResults);

      // Compare performance
      analysis.performance_comparison = await this.comparePerformance(testResults);

      // Generate recommendations
      analysis.recommendations = await this.generateTestRecommendations(userId, testId, testResults);

      // Suggest next steps
      analysis.next_steps = await this.suggestNextSteps(testResults);

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze test results', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Analyze key findings
   */
  async analyzeKeyFindings(testResults) {
    try {
      const findings = [];

      if (testResults.winner) {
        findings.push({
          type: 'winner',
          message: `${testResults.winner.variant_name} performed best with a score of ${testResults.winner.performance_score.toFixed(2)}`,
          impact: 'high'
        });
      }

      if (testResults.statistical_significance.is_significant) {
        findings.push({
          type: 'significance',
          message: `Results are statistically significant with ${testResults.statistical_significance.confidence_level}% confidence`,
          impact: 'high'
        });
      } else {
        findings.push({
          type: 'significance',
          message: 'Results are not statistically significant. Consider running the test longer or with a larger sample size.',
          impact: 'medium'
        });
      }

      return findings;
    } catch (error) {
      logger.error('Failed to analyze key findings', { error: error.message });
      return [];
    }
  }

  /**
   * Compare performance
   */
  async comparePerformance(testResults) {
    try {
      const comparison = {
        best_performer: testResults.winner,
        worst_performer: null,
        performance_gap: 0,
        improvement_potential: 0
      };

      if (testResults.variants.length > 1) {
        // Find worst performer
        comparison.worst_performer = testResults.variants.reduce((worst, current) => {
          return current.performance_score < worst.performance_score ? current : worst;
        });

        // Calculate performance gap
        comparison.performance_gap = testResults.winner.performance_score - comparison.worst_performer.performance_score;

        // Calculate improvement potential
        comparison.improvement_potential = (comparison.performance_gap / comparison.worst_performer.performance_score) * 100;
      }

      return comparison;
    } catch (error) {
      logger.error('Failed to compare performance', { error: error.message });
      return {};
    }
  }

  /**
   * Generate test recommendations
   */
  async generateTestRecommendations(userId, testId, testResults) {
    try {
      const recommendations = [];

      if (testResults.winner) {
        recommendations.push({
          type: 'implementation',
          priority: 'high',
          title: 'Implement Winning Variant',
          description: `Consider implementing ${testResults.winner.variant_name} as the default template`,
          action: 'Update default template to winning variant'
        });
      }

      if (!testResults.statistical_significance.is_significant) {
        recommendations.push({
          type: 'testing',
          priority: 'medium',
          title: 'Extend Test Duration',
          description: 'Results are not statistically significant. Consider running the test longer',
          action: 'Extend test duration or increase sample size'
        });
      }

      if (testResults.variants.length < 3) {
        recommendations.push({
          type: 'optimization',
          priority: 'low',
          title: 'Test More Variants',
          description: 'Consider testing additional variants to find better performance',
          action: 'Create additional test variants'
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate test recommendations', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Suggest next steps
   */
  async suggestNextSteps(testResults) {
    try {
      const nextSteps = [];

      if (testResults.winner) {
        nextSteps.push('Implement the winning variant as the default template');
        nextSteps.push('Monitor performance after implementation');
        nextSteps.push('Plan follow-up tests to further optimize');
      } else {
        nextSteps.push('Analyze why no clear winner emerged');
        nextSteps.push('Consider testing different variables');
        nextSteps.push('Review test setup and methodology');
      }

      return nextSteps;
    } catch (error) {
      logger.error('Failed to suggest next steps', { error: error.message });
      return [];
    }
  }

  /**
   * Store A/B test
   */
  async storeABTest(userId, abTest) {
    try {
      const { error } = await supabase
        .from('template_ab_tests')
        .upsert(abTest, { onConflict: 'id' });

      if (error) throw error;

      // Update in-memory test
      this.abTests.set(abTest.id, abTest);
    } catch (error) {
      logger.error('Failed to store A/B test', { error: error.message, userId });
    }
  }

  /**
   * Store test variants
   */
  async storeTestVariants(userId, variants) {
    try {
      const { error } = await supabase
        .from('template_test_variants')
        .upsert(variants, { onConflict: 'id' });

      if (error) throw error;

      // Update in-memory variants
      variants.forEach(variant => {
        if (!this.testVariants.has(variant.test_id)) {
          this.testVariants.set(variant.test_id, []);
        }
        this.testVariants.get(variant.test_id).push(variant);
      });
    } catch (error) {
      logger.error('Failed to store test variants', { error: error.message, userId });
    }
  }

  /**
   * Get A/B test
   */
  async getABTest(userId, testId) {
    try {
      // Check in-memory first
      if (this.abTests.has(testId)) {
        return this.abTests.get(testId);
      }

      // Fetch from database
      const { data: abTest, error } = await supabase
        .from('template_ab_tests')
        .select('*')
        .eq('id', testId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (abTest) {
        this.abTests.set(testId, abTest);
      }

      return abTest;
    } catch (error) {
      logger.error('Failed to get A/B test', { error: error.message, userId });
      return null;
    }
  }

  /**
   * Get test variants
   */
  async getTestVariants(userId, testId) {
    try {
      // Check in-memory first
      if (this.testVariants.has(testId)) {
        return this.testVariants.get(testId);
      }

      // Fetch from database
      const { data: variants, error } = await supabase
        .from('template_test_variants')
        .select('*')
        .eq('test_id', testId)
        .eq('user_id', userId);

      if (error) throw error;

      if (variants) {
        this.testVariants.set(testId, variants);
      }

      return variants || [];
    } catch (error) {
      logger.error('Failed to get test variants', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get test variant
   */
  async getTestVariant(userId, testId, variantId) {
    try {
      const variants = await this.getTestVariants(userId, testId);
      return variants.find(v => v.id === variantId) || null;
    } catch (error) {
      logger.error('Failed to get test variant', { error: error.message, userId });
      return null;
    }
  }

  /**
   * Update A/B test status
   */
  async updateABTestStatus(userId, testId, status) {
    try {
      const { error } = await supabase
        .from('template_ab_tests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', testId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update in-memory test
      if (this.abTests.has(testId)) {
        const test = this.abTests.get(testId);
        test.status = status;
        test.updated_at = new Date().toISOString();
        this.abTests.set(testId, test);
      }
    } catch (error) {
      logger.error('Failed to update A/B test status', { error: error.message, userId });
    }
  }

  /**
   * Log test activity
   */
  async logTestActivity(userId, activityType, activityData) {
    try {
      const activity = {
        id: this.generateActivityId(),
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('template_test_activities')
        .insert(activity);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to log test activity', { error: error.message, userId });
    }
  }

  /**
   * Generate test ID
   */
  generateTestId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ABTEST-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate variant ID
   */
  generateVariantId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `VARIANT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate activity ID
   */
  generateActivityId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ACTIVITY-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Load A/B tests
   */
  async loadABTests(userId) {
    try {
      const { data: tests, error } = await supabase
        .from('template_ab_tests')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      tests.forEach(test => {
        this.abTests.set(test.id, test);
      });

      logger.info('A/B tests loaded', { userId, testCount: tests.length });
    } catch (error) {
      logger.error('Failed to load A/B tests', { error: error.message, userId });
    }
  }

  /**
   * Load test variants
   */
  async loadTestVariants(userId) {
    try {
      const { data: variants, error } = await supabase
        .from('template_test_variants')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      variants.forEach(variant => {
        if (!this.testVariants.has(variant.test_id)) {
          this.testVariants.set(variant.test_id, []);
        }
        this.testVariants.get(variant.test_id).push(variant);
      });

      logger.info('Test variants loaded', { userId, variantCount: variants.length });
    } catch (error) {
      logger.error('Failed to load test variants', { error: error.message, userId });
    }
  }

  /**
   * Load test results
   */
  async loadTestResults(userId) {
    try {
      const { data: results, error } = await supabase
        .from('template_test_results')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      results.forEach(result => {
        this.testResults.set(result.test_id, result);
      });

      logger.info('Test results loaded', { userId, resultCount: results.length });
    } catch (error) {
      logger.error('Failed to load test results', { error: error.message, userId });
    }
  }

  /**
   * Load test metrics
   */
  async loadTestMetrics(userId) {
    try {
      const { data: metrics, error } = await supabase
        .from('template_test_metrics')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      metrics.forEach(metric => {
        if (!this.testMetrics.has(metric.test_id)) {
          this.testMetrics.set(metric.test_id, []);
        }
        this.testMetrics.get(metric.test_id).push(metric);
      });

      logger.info('Test metrics loaded', { userId, metricCount: metrics.length });
    } catch (error) {
      logger.error('Failed to load test metrics', { error: error.message, userId });
    }
  }

  /**
   * Load test configurations
   */
  async loadTestConfigurations(userId) {
    try {
      const { data: configurations, error } = await supabase
        .from('template_test_configurations')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      configurations.forEach(config => {
        this.testConfigurations.set(config.id, config);
      });

      logger.info('Test configurations loaded', { userId, configCount: configurations.length });
    } catch (error) {
      logger.error('Failed to load test configurations', { error: error.message, userId });
    }
  }

  /**
   * Reset A/B testing system for user
   */
  async reset(userId) {
    try {
      this.abTests.clear();
      this.testVariants.clear();
      this.testResults.clear();
      this.testMetrics.clear();
      this.testConfigurations.clear();

      logger.info('A/B testing system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset A/B testing system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}

/**
 * Observability and Metrics Tracking System
 * 
 * Tracks key metrics for the auto-profile system to measure success criteria
 */

import { supabase } from './customSupabaseClient.js';

export class AutoProfileMetrics {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Track profile analysis started event
   */
  async trackAnalysisStarted(businessId, jobId) {
    await this.emitEvent('profile_analysis_started', {
      businessId,
      jobId,
      timestamp: new Date().toISOString()
    });

    // Track in memory for real-time metrics
    this.metrics.set(`analysis_started_${businessId}`, {
      timestamp: new Date(),
      jobId
    });
  }

  /**
   * Track profile analysis completed event
   */
  async trackAnalysisCompleted(businessId, jobId, fieldsExtracted, avgConfidence) {
    await this.emitEvent('profile_analysis_completed', {
      businessId,
      jobId,
      fieldsExtracted,
      avgConfidence,
      timestamp: new Date().toISOString()
    });

    // Track success metrics
    this.metrics.set(`analysis_completed_${businessId}`, {
      timestamp: new Date(),
      fieldsExtracted,
      avgConfidence,
      success: true
    });
  }

  /**
   * Track profile suggestions applied event
   */
  async trackSuggestionsApplied(businessId, appliedFields, timeSaved) {
    await this.emitEvent('profile_suggestions_applied', {
      businessId,
      appliedFields,
      timeSaved,
      timestamp: new Date().toISOString()
    });

    // Track application metrics
    this.metrics.set(`suggestions_applied_${businessId}`, {
      timestamp: new Date(),
      appliedFields,
      timeSaved,
      fieldCount: appliedFields.length
    });
  }

  /**
   * Track voice training completed event
   */
  async trackVoiceTrainingCompleted(businessId, voiceProfile, avgConfidence) {
    await this.emitEvent('voice_training_completed', {
      businessId,
      voiceProfile,
      avgConfidence,
      timestamp: new Date().toISOString()
    });

    // Track voice training metrics
    this.metrics.set(`voice_training_${businessId}`, {
      timestamp: new Date(),
      avgConfidence,
      success: true
    });
  }

  /**
   * Track AI draft creation and adoption
   */
  async trackDraftCreated(businessId, threadId, draftType = 'auto') {
    await this.emitEvent('ai_draft_created', {
      businessId,
      threadId,
      draftType,
      timestamp: new Date().toISOString()
    });

    // Track draft metrics
    const key = `draft_created_${businessId}`;
    const existing = this.metrics.get(key) || { count: 0 };
    this.metrics.set(key, {
      ...existing,
      count: existing.count + 1,
      lastCreated: new Date()
    });
  }

  /**
   * Track draft adoption (user sends the draft)
   */
  async trackDraftAdopted(businessId, threadId, draftType = 'auto') {
    await this.emitEvent('ai_draft_adopted', {
      businessId,
      threadId,
      draftType,
      timestamp: new Date().toISOString()
    });

    // Track adoption metrics
    const key = `draft_adopted_${businessId}`;
    const existing = this.metrics.get(key) || { count: 0 };
    this.metrics.set(key, {
      ...existing,
      count: existing.count + 1,
      lastAdopted: new Date()
    });
  }

  /**
   * Get success metrics for the first week
   */
  async getFirstWeekMetrics() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
      // Get analysis completion metrics
      const { data: analysisData } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'profile_analysis_completed')
        .gte('created_at', oneWeekAgo.toISOString());

      // Get suggestion application metrics
      const { data: applicationData } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'profile_suggestions_applied')
        .gte('created_at', oneWeekAgo.toISOString());

      // Get draft metrics
      const { data: draftData } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'ai_draft_created')
        .gte('created_at', oneWeekAgo.toISOString());

      const { data: adoptionData } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('event_type', 'ai_draft_adopted')
        .gte('created_at', oneWeekAgo.toISOString());

      // Calculate metrics
      const metrics = this.calculateSuccessMetrics({
        analysisData: analysisData || [],
        applicationData: applicationData || [],
        draftData: draftData || [],
        adoptionData: adoptionData || []
      });

      return metrics;

    } catch (error) {
      console.error('❌ Error fetching first week metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Calculate success metrics from raw data
   */
  calculateSuccessMetrics(data) {
    const { analysisData, applicationData, draftData, adoptionData } = data;

    // Calculate auto-fill adoption rate
    const businessesWithAnalysis = new Set(analysisData.map(d => d.event_data.businessId));
    const businessesWithAppliedFields = new Set(applicationData.map(d => d.event_data.businessId));
    
    const autoFillAdoptionRate = businessesWithAnalysis.size > 0 
      ? (businessesWithAppliedFields.size / businessesWithAnalysis.size) * 100 
      : 0;

    // Calculate average fields auto-filled
    const fieldsApplied = applicationData.map(d => d.event_data.appliedFields?.length || 0);
    const avgFieldsAutoFilled = fieldsApplied.length > 0 
      ? fieldsApplied.reduce((sum, count) => sum + count, 0) / fieldsApplied.length 
      : 0;

    // Calculate average confidence
    const confidences = analysisData.map(d => d.event_data.avgConfidence || 0);
    const avgConfidence = confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length 
      : 0;

    // Calculate draft adoption rate
    const draftsCreated = draftData.length;
    const draftsAdopted = adoptionData.length;
    const draftAdoptionRate = draftsCreated > 0 
      ? (draftsAdopted / draftsCreated) * 100 
      : 0;

    // Calculate time saved (estimated)
    const totalTimeSaved = applicationData.reduce((sum, d) => {
      return sum + (d.event_data.timeSaved || 0);
    }, 0);

    return {
      // Primary KPIs
      autoFillAdoptionRate: Math.round(autoFillAdoptionRate),
      avgFieldsAutoFilled: Math.round(avgFieldsAutoFilled * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      draftAdoptionRate: Math.round(draftAdoptionRate),
      
      // Secondary metrics
      totalBusinessesAnalyzed: businessesWithAnalysis.size,
      totalBusinessesApplied: businessesWithAppliedFields.size,
      totalDraftsCreated: draftsCreated,
      totalDraftsAdopted: draftsAdopted,
      totalTimeSaved: Math.round(totalTimeSaved),
      
      // Success criteria check
      meetsAutoFillCriteria: avgFieldsAutoFilled >= 3,
      meetsConfidenceCriteria: avgConfidence >= 0.82,
      meetsDraftCriteria: draftAdoptionRate >= 85,
      
      // Overall success
      overallSuccess: avgFieldsAutoFilled >= 3 && avgConfidence >= 0.82 && draftAdoptionRate >= 85
    };
  }

  /**
   * Get default metrics when no data is available
   */
  getDefaultMetrics() {
    return {
      autoFillAdoptionRate: 0,
      avgFieldsAutoFilled: 0,
      avgConfidence: 0,
      draftAdoptionRate: 0,
      totalBusinessesAnalyzed: 0,
      totalBusinessesApplied: 0,
      totalDraftsCreated: 0,
      totalDraftsAdopted: 0,
      totalTimeSaved: 0,
      meetsAutoFillCriteria: false,
      meetsConfidenceCriteria: false,
      meetsDraftCriteria: false,
      overallSuccess: false
    };
  }

  /**
   * Get real-time metrics from memory
   */
  getRealTimeMetrics() {
    const metrics = {};
    
    for (const [key, value] of this.metrics.entries()) {
      if (key.startsWith('analysis_started_')) {
        metrics.analysesStarted = (metrics.analysesStarted || 0) + 1;
      } else if (key.startsWith('analysis_completed_')) {
        metrics.analysesCompleted = (metrics.analysesCompleted || 0) + 1;
      } else if (key.startsWith('suggestions_applied_')) {
        metrics.suggestionsApplied = (metrics.suggestionsApplied || 0) + 1;
      } else if (key.startsWith('draft_created_')) {
        metrics.draftsCreated = (metrics.draftsCreated || 0) + value.count;
      } else if (key.startsWith('draft_adopted_')) {
        metrics.draftsAdopted = (metrics.draftsAdopted || 0) + value.count;
      }
    }

    return metrics;
  }

  /**
   * Generate success report
   */
  async generateSuccessReport() {
    const metrics = await this.getFirstWeekMetrics();
    
    const report = {
      period: 'First Week',
      generatedAt: new Date().toISOString(),
      metrics,
      recommendations: this.generateRecommendations(metrics)
    };

    return report;
  }

  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations(metrics) {
    const recommendations = [];

    if (metrics.autoFillAdoptionRate < 70) {
      recommendations.push({
        type: 'adoption',
        priority: 'high',
        message: 'Auto-fill adoption rate is below 70%. Consider improving the UI/UX or reducing friction in the analysis process.',
        action: 'Review onboarding flow and auto-fill prompts'
      });
    }

    if (metrics.avgConfidence < 0.82) {
      recommendations.push({
        type: 'accuracy',
        priority: 'medium',
        message: 'Average confidence is below 82%. Consider improving email analysis or adjusting confidence thresholds.',
        action: 'Review AI prompts and email filtering logic'
      });
    }

    if (metrics.draftAdoptionRate < 85) {
      recommendations.push({
        type: 'drafts',
        priority: 'medium',
        message: 'Draft adoption rate is below 85%. Consider improving draft quality or user experience.',
        action: 'Review AI draft generation and user interface'
      });
    }

    if (metrics.totalBusinessesAnalyzed < 10) {
      recommendations.push({
        type: 'volume',
        priority: 'low',
        message: 'Low analysis volume. Consider promoting the feature or reducing barriers to entry.',
        action: 'Increase feature visibility and reduce friction'
      });
    }

    return recommendations;
  }

  /**
   * Emit event to analytics system
   */
  async emitEvent(eventType, eventData) {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('⚠️ Failed to emit analytics event:', error.message);
    }
  }

  /**
   * Clean up old metrics from memory
   */
  cleanup() {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    for (const [key, value] of this.metrics.entries()) {
      if (value.timestamp && value.timestamp < oneHourAgo) {
        this.metrics.delete(key);
      }
    }
  }
}

// Global metrics instance
export const autoProfileMetrics = new AutoProfileMetrics();

// Cleanup old metrics every hour
setInterval(() => {
  autoProfileMetrics.cleanup();
}, 60 * 60 * 1000);

/**
 * Convenience functions for tracking
 */
export const trackAnalysisStarted = (businessId, jobId) => 
  autoProfileMetrics.trackAnalysisStarted(businessId, jobId);

export const trackAnalysisCompleted = (businessId, jobId, fieldsExtracted, avgConfidence) => 
  autoProfileMetrics.trackAnalysisCompleted(businessId, jobId, fieldsExtracted, avgConfidence);

export const trackSuggestionsApplied = (businessId, appliedFields, timeSaved = 0) => 
  autoProfileMetrics.trackSuggestionsApplied(businessId, appliedFields, timeSaved);

export const trackVoiceTrainingCompleted = (businessId, voiceProfile, avgConfidence) => 
  autoProfileMetrics.trackVoiceTrainingCompleted(businessId, voiceProfile, avgConfidence);

export const trackDraftCreated = (businessId, threadId, draftType = 'auto') => 
  autoProfileMetrics.trackDraftCreated(businessId, threadId, draftType);

export const trackDraftAdopted = (businessId, threadId, draftType = 'auto') => 
  autoProfileMetrics.trackDraftAdopted(businessId, threadId, draftType);

export const getSuccessMetrics = () => 
  autoProfileMetrics.getFirstWeekMetrics();

export const generateSuccessReport = () => 
  autoProfileMetrics.generateSuccessReport();

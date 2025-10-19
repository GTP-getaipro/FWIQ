/**
 * BI Scheduling System
 * 
 * Handles BI report scheduling, automation,
 * and delivery management.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class BIScheduler {
  constructor() {
    this.schedules = new Map();
    this.scheduleJobs = new Map();
    this.scheduleHistory = new Map();
    this.scheduleMetrics = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize BI scheduler system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing BI Scheduler', { userId });

      // Load schedules and history
      await this.loadSchedules(userId);
      await this.loadScheduleHistory(userId);
      await this.loadScheduleMetrics(userId);

      this.isInitialized = true;
      logger.info('BI Scheduler initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize BI Scheduler', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Create schedule
   */
  async createSchedule(userId, scheduleData) {
    try {
      logger.info('Creating schedule', { userId, scheduleType: scheduleData.type });

      // Validate schedule data
      const validationResult = await this.validateScheduleData(scheduleData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Generate schedule ID
      const scheduleId = this.generateScheduleId();

      // Create schedule
      const schedule = {
        id: scheduleId,
        user_id: userId,
        name: scheduleData.name,
        description: scheduleData.description || '',
        type: scheduleData.type,
        report_id: scheduleData.reportId,
        schedule_config: scheduleData.scheduleConfig || {},
        delivery_config: scheduleData.deliveryConfig || {},
        is_active: true,
        next_run: this.calculateNextRun(scheduleData.type, scheduleData.scheduleConfig),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store schedule
      await this.storeSchedule(userId, schedule);

      // Update in-memory schedules
      this.schedules.set(scheduleId, schedule);

      logger.info('Schedule created successfully', { 
        userId, 
        scheduleId, 
        scheduleType: scheduleData.type 
      });

      return {
        success: true,
        schedule
      };
    } catch (error) {
      logger.error('Failed to create schedule', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update schedule
   */
  async updateSchedule(userId, scheduleId, updateData) {
    try {
      logger.info('Updating schedule', { userId, scheduleId });

      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }

      if (schedule.user_id !== userId) {
        return { success: false, error: 'Unauthorized to update schedule' };
      }

      // Update schedule
      const updatedSchedule = {
        ...schedule,
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Recalculate next run if schedule config changed
      if (updateData.scheduleConfig) {
        updatedSchedule.next_run = this.calculateNextRun(updatedSchedule.type, updatedSchedule.schedule_config);
      }

      // Store updated schedule
      await this.storeSchedule(userId, updatedSchedule);

      // Update in-memory schedule
      this.schedules.set(scheduleId, updatedSchedule);

      logger.info('Schedule updated successfully', { userId, scheduleId });

      return {
        success: true,
        schedule: updatedSchedule
      };
    } catch (error) {
      logger.error('Failed to update schedule', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(userId, scheduleId) {
    try {
      logger.info('Deleting schedule', { userId, scheduleId });

      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }

      if (schedule.user_id !== userId) {
        return { success: false, error: 'Unauthorized to delete schedule' };
      }

      // Delete schedule from database
      const { error } = await supabase
        .from('bi_scheduled_reports')
        .delete()
        .eq('id', scheduleId)
        .eq('user_id', userId);

      if (error) throw error;

      // Remove from in-memory schedules
      this.schedules.delete(scheduleId);

      logger.info('Schedule deleted successfully', { userId, scheduleId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete schedule', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute schedule
   */
  async executeSchedule(userId, scheduleId) {
    try {
      logger.info('Executing schedule', { userId, scheduleId });

      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }

      if (schedule.user_id !== userId) {
        return { success: false, error: 'Unauthorized to execute schedule' };
      }

      // Create schedule job
      const scheduleJob = await this.createScheduleJob(userId, scheduleId);

      // Execute the scheduled report
      const executionResult = await this.executeScheduledReport(userId, schedule);

      // Update schedule job status
      await this.updateScheduleJobStatus(userId, scheduleJob.id, 'completed', executionResult);

      // Update next run time
      await this.updateNextRunTime(userId, scheduleId);

      logger.info('Schedule executed successfully', { userId, scheduleId });

      return {
        success: true,
        executionResult
      };
    } catch (error) {
      logger.error('Failed to execute schedule', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get schedule status
   */
  async getScheduleStatus(userId, scheduleId) {
    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        return { success: false, error: 'Schedule not found' };
      }

      const scheduleJobs = this.scheduleJobs.get(scheduleId) || [];
      const lastJob = scheduleJobs.length > 0 ? scheduleJobs[0] : null;

      const status = {
        schedule: schedule,
        isActive: schedule.is_active,
        nextRun: schedule.next_run,
        lastExecution: lastJob ? lastJob.executed_at : null,
        lastStatus: lastJob ? lastJob.status : null,
        executionCount: scheduleJobs.length,
        successRate: this.calculateSuccessRate(scheduleJobs)
      };

      return {
        success: true,
        status
      };
    } catch (error) {
      logger.error('Failed to get schedule status', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get schedule metrics
   */
  async getScheduleMetrics(userId) {
    try {
      const userSchedules = Array.from(this.schedules.values()).filter(schedule => 
        schedule.user_id === userId
      );

      const userScheduleJobs = Array.from(this.scheduleJobs.values()).flat().filter(job => 
        job.user_id === userId
      );

      const metrics = {
        totalSchedules: userSchedules.length,
        activeSchedules: userSchedules.filter(schedule => schedule.is_active).length,
        schedulesByType: this.groupSchedulesByType(userSchedules),
        totalExecutions: userScheduleJobs.length,
        successfulExecutions: userScheduleJobs.filter(job => job.status === 'completed').length,
        failedExecutions: userScheduleJobs.filter(job => job.status === 'failed').length,
        avgExecutionTime: this.calculateAvgExecutionTime(userScheduleJobs),
        executionFrequency: this.analyzeExecutionFrequency(userScheduleJobs)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get schedule metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get schedule insights
   */
  async getScheduleInsights(userId) {
    try {
      const userSchedules = Array.from(this.schedules.values()).filter(schedule => 
        schedule.user_id === userId
      );

      const userScheduleJobs = Array.from(this.scheduleJobs.values()).flat().filter(job => 
        job.user_id === userId
      );

      const insights = {
        scheduleTrends: this.analyzeScheduleTrends(userSchedules),
        executionPatterns: this.analyzeExecutionPatterns(userScheduleJobs),
        performanceAnalysis: this.analyzeSchedulePerformance(userScheduleJobs),
        recommendations: this.generateScheduleRecommendations(userSchedules, userScheduleJobs)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get schedule insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate next run time
   */
  calculateNextRun(scheduleType, scheduleConfig) {
    try {
      const now = new Date();
      let nextRun;

      switch (scheduleType) {
        case 'daily':
          nextRun = new Date(now);
          nextRun.setDate(now.getDate() + 1);
          nextRun.setHours(scheduleConfig.hour || 9, scheduleConfig.minute || 0, 0, 0);
          break;

        case 'weekly':
          nextRun = new Date(now);
          const daysUntilNext = (scheduleConfig.dayOfWeek || 1) - now.getDay();
          nextRun.setDate(now.getDate() + (daysUntilNext <= 0 ? daysUntilNext + 7 : daysUntilNext));
          nextRun.setHours(scheduleConfig.hour || 9, scheduleConfig.minute || 0, 0, 0);
          break;

        case 'monthly':
          nextRun = new Date(now);
          nextRun.setMonth(now.getMonth() + 1);
          nextRun.setDate(scheduleConfig.dayOfMonth || 1);
          nextRun.setHours(scheduleConfig.hour || 9, scheduleConfig.minute || 0, 0, 0);
          break;

        case 'hourly':
          nextRun = new Date(now);
          nextRun.setHours(now.getHours() + 1);
          nextRun.setMinutes(scheduleConfig.minute || 0, 0, 0);
          break;

        default:
          nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 24 hours
      }

      return nextRun.toISOString();
    } catch (error) {
      logger.error('Failed to calculate next run time', { error: error.message });
      return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Create schedule job
   */
  async createScheduleJob(userId, scheduleId) {
    try {
      const jobId = this.generateJobId();

      const scheduleJob = {
        id: jobId,
        user_id: userId,
        schedule_id: scheduleId,
        status: 'running',
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Store schedule job
      await this.storeScheduleJob(userId, scheduleJob);

      // Update in-memory jobs
      if (!this.scheduleJobs.has(scheduleId)) {
        this.scheduleJobs.set(scheduleId, []);
      }
      this.scheduleJobs.get(scheduleId).unshift(scheduleJob);

      return scheduleJob;
    } catch (error) {
      logger.error('Failed to create schedule job', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Execute scheduled report
   */
  async executeScheduledReport(userId, schedule) {
    try {
      const startTime = Date.now();

      // Simulate report execution
      const reportData = {
        reportId: schedule.report_id,
        userId: userId,
        executionTime: new Date().toISOString()
      };

      // Simulate report generation
      const reportResult = await this.generateScheduledReport(reportData);

      // Simulate report delivery
      const deliveryResult = await this.deliverScheduledReport(schedule, reportResult);

      const executionTime = Date.now() - startTime;

      return {
        reportResult,
        deliveryResult,
        executionTime,
        status: 'completed'
      };
    } catch (error) {
      logger.error('Failed to execute scheduled report', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Generate scheduled report
   */
  async generateScheduledReport(reportData) {
    try {
      // Simulate report generation
      const report = {
        id: this.generateReportId(),
        reportId: reportData.reportId,
        userId: reportData.userId,
        generatedAt: reportData.executionTime,
        format: 'pdf',
        size: Math.floor(Math.random() * 1000000) + 100000, // 100KB - 1MB
        downloadUrl: `https://reports.example.com/download/${this.generateReportId()}`
      };

      return report;
    } catch (error) {
      logger.error('Failed to generate scheduled report', { error: error.message });
      throw error;
    }
  }

  /**
   * Deliver scheduled report
   */
  async deliverScheduledReport(schedule, reportResult) {
    try {
      const deliveryConfig = schedule.delivery_config || {};
      const deliveryResult = {
        deliveryMethod: deliveryConfig.method || 'email',
        recipients: deliveryConfig.recipients || [],
        deliveredAt: new Date().toISOString(),
        status: 'delivered'
      };

      // Simulate delivery based on method
      switch (deliveryConfig.method) {
        case 'email':
          deliveryResult.emailSent = true;
          deliveryResult.emailRecipients = deliveryConfig.recipients || [];
          break;
        case 'webhook':
          deliveryResult.webhookSent = true;
          deliveryResult.webhookUrl = deliveryConfig.webhookUrl;
          break;
        case 'download':
          deliveryResult.downloadAvailable = true;
          deliveryResult.downloadUrl = reportResult.downloadUrl;
          break;
        default:
          deliveryResult.status = 'pending';
      }

      return deliveryResult;
    } catch (error) {
      logger.error('Failed to deliver scheduled report', { error: error.message });
      throw error;
    }
  }

  /**
   * Update schedule job status
   */
  async updateScheduleJobStatus(userId, jobId, status, result = null) {
    try {
      const updateData = {
        status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
        if (result) {
          updateData.result = result;
        }
      }

      const { error } = await supabase
        .from('bi_schedule_jobs')
        .update(updateData)
        .eq('id', jobId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update in-memory job
      for (const [scheduleId, jobs] of this.scheduleJobs.entries()) {
        const jobIndex = jobs.findIndex(job => job.id === jobId);
        if (jobIndex !== -1) {
          jobs[jobIndex] = { ...jobs[jobIndex], ...updateData };
          break;
        }
      }
    } catch (error) {
      logger.error('Failed to update schedule job status', { error: error.message, userId, jobId });
    }
  }

  /**
   * Update next run time
   */
  async updateNextRunTime(userId, scheduleId) {
    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) return;

      const nextRun = this.calculateNextRun(schedule.type, schedule.schedule_config);

      const { error } = await supabase
        .from('bi_scheduled_reports')
        .update({ next_run: nextRun })
        .eq('id', scheduleId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update in-memory schedule
      schedule.next_run = nextRun;
      this.schedules.set(scheduleId, schedule);
    } catch (error) {
      logger.error('Failed to update next run time', { error: error.message, userId, scheduleId });
    }
  }

  /**
   * Calculate success rate
   */
  calculateSuccessRate(scheduleJobs) {
    try {
      if (scheduleJobs.length === 0) return 0;

      const successfulJobs = scheduleJobs.filter(job => job.status === 'completed').length;
      return (successfulJobs / scheduleJobs.length) * 100;
    } catch (error) {
      logger.error('Failed to calculate success rate', { error: error.message });
      return 0;
    }
  }

  /**
   * Generate schedule ID
   */
  generateScheduleId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `SCHEDULE-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate job ID
   */
  generateJobId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `JOB-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate report ID
   */
  generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `REPORT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Store schedule
   */
  async storeSchedule(userId, schedule) {
    try {
      const { error } = await supabase
        .from('bi_scheduled_reports')
        .insert(schedule);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to store schedule', { error: error.message, userId });
    }
  }

  /**
   * Store schedule job
   */
  async storeScheduleJob(userId, scheduleJob) {
    try {
      const { error } = await supabase
        .from('bi_schedule_jobs')
        .insert(scheduleJob);

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to store schedule job', { error: error.message, userId });
    }
  }

  /**
   * Load schedules
   */
  async loadSchedules(userId) {
    try {
      const { data: schedules, error } = await supabase
        .from('bi_scheduled_reports')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      schedules.forEach(schedule => {
        this.schedules.set(schedule.id, schedule);
      });

      logger.info('Schedules loaded', { userId, scheduleCount: schedules.length });
    } catch (error) {
      logger.error('Failed to load schedules', { error: error.message, userId });
    }
  }

  /**
   * Load schedule history
   */
  async loadScheduleHistory(userId) {
    try {
      const { data: history, error } = await supabase
        .from('bi_schedule_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Group jobs by schedule ID
      const jobsBySchedule = {};
      history.forEach(job => {
        if (!jobsBySchedule[job.schedule_id]) {
          jobsBySchedule[job.schedule_id] = [];
        }
        jobsBySchedule[job.schedule_id].push(job);
      });

      // Update in-memory jobs
      Object.entries(jobsBySchedule).forEach(([scheduleId, jobs]) => {
        this.scheduleJobs.set(scheduleId, jobs);
      });

      this.scheduleHistory.set(userId, history || []);
      logger.info('Schedule history loaded', { userId, historyCount: history?.length || 0 });
    } catch (error) {
      logger.error('Failed to load schedule history', { error: error.message, userId });
    }
  }

  /**
   * Load schedule metrics
   */
  async loadScheduleMetrics(userId) {
    try {
      const { data: metrics, error } = await supabase
        .from('bi_schedule_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      this.scheduleMetrics.set(userId, metrics || []);
      logger.info('Schedule metrics loaded', { userId, metricCount: metrics?.length || 0 });
    } catch (error) {
      logger.error('Failed to load schedule metrics', { error: error.message, userId });
    }
  }

  /**
   * Reset scheduler system for user
   */
  async reset(userId) {
    try {
      this.schedules.clear();
      this.scheduleJobs.clear();
      this.scheduleHistory.delete(userId);
      this.scheduleMetrics.delete(userId);

      logger.info('Scheduler system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset scheduler system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}

import { supabase } from './customSupabaseClient';

export class ApprovalWorkflow {
  constructor() {
    this.workflows = new Map();
    this.pendingApprovals = new Map();
  }

  async createWorkflow(userId, workflowData) {
    try {
      const workflow = {
        user_id: userId,
        name: workflowData.name,
        description: workflowData.description,
        trigger_conditions: workflowData.triggerConditions || [],
        approval_steps: workflowData.approvalSteps || [],
        auto_approve_conditions: workflowData.autoApproveConditions || [],
        timeout_hours: workflowData.timeoutHours || 24,
        enabled: workflowData.enabled !== false,
        metadata: workflowData.metadata || {}
      };

      // In a real implementation, this would be stored in a workflows table
      // For now, we'll use the escalation_rules table with a special type
      const { data, error } = await supabase
        .from('escalation_rules')
        .insert({
          user_id: userId,
          condition: 'approval_workflow',
          value: workflowData.name,
          escalation_action: 'approval_required',
          priority: workflowData.priority || 5,
          description: workflowData.description,
          enabled: workflow.enabled,
          metadata: workflow
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Created approval workflow: ${workflowData.name}`);
      return data;

    } catch (error) {
      console.error('Failed to create approval workflow:', error);
      throw error;
    }
  }

  async triggerWorkflow(workflowId, emailData, userId, context = {}) {
    try {
      console.log(`Triggering approval workflow ${workflowId}`);

      // Get workflow configuration
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Check if approval is needed
      const needsApproval = await this.evaluateApprovalNeed(workflow, emailData, context);
      
      if (!needsApproval) {
        console.log('Auto-approval conditions met, no manual approval needed');
        return {
          approved: true,
          autoApproved: true,
          reason: 'Auto-approval conditions met'
        };
      }

      // Create approval request
      const approvalRequest = await this.createApprovalRequest(workflow, emailData, userId, context);
      
      // Start approval process
      const approvalProcess = await this.startApprovalProcess(approvalRequest);

      return {
        approved: false,
        pending: true,
        approvalId: approvalRequest.id,
        process: approvalProcess,
        estimatedTime: workflow.metadata?.timeout_hours || 24
      };

    } catch (error) {
      console.error('Failed to trigger approval workflow:', error);
      throw error;
    }
  }

  async evaluateApprovalNeed(workflow, emailData, context) {
    const autoApproveConditions = workflow.metadata?.auto_approve_conditions || [];
    
    if (autoApproveConditions.length === 0) {
      return true; // Always needs approval if no auto-approve conditions
    }

    // Check each auto-approve condition
    for (const condition of autoApproveConditions) {
      const conditionMet = await this.evaluateCondition(condition, emailData, context);
      if (conditionMet) {
        console.log(`Auto-approve condition met: ${condition.type}`);
        return false; // No approval needed
      }
    }

    return true; // Needs approval
  }

  async evaluateCondition(condition, emailData, context) {
    switch (condition.type) {
      case 'low_urgency':
        return context.classification?.urgency === 'low';
      
      case 'routine_category':
        return ['inquiry', 'general'].includes(context.classification?.category);
      
      case 'business_hours':
        return await this.isBusinessHours(condition.userId);
      
      case 'known_customer':
        return await this.isKnownCustomer(emailData.from, condition.userId);
      
      case 'small_amount':
        return this.isSmallAmount(emailData, condition.threshold);
      
      case 'standard_request':
        return this.isStandardRequest(emailData, condition.keywords);
      
      default:
        return false;
    }
  }

  async createApprovalRequest(workflow, emailData, userId, context) {
    try {
      const approvalData = {
        user_id: userId,
        workflow_id: workflow.id,
        email_from: emailData.from,
        email_subject: emailData.subject,
        email_body: emailData.body,
        context: context,
        status: 'pending',
        created_at: new Date().toISOString(),
        timeout_at: new Date(Date.now() + (workflow.metadata?.timeout_hours || 24) * 60 * 60 * 1000).toISOString(),
        approval_steps: workflow.metadata?.approval_steps || [],
        current_step: 0
      };

      // Store approval request (using email_logs table with special category)
      const { data, error } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: emailData.from,
          email_subject: emailData.subject,
          category: 'approval_request',
          urgency: context.classification?.urgency || 'normal',
          escalated: true,
          escalation_reason: `Approval required for workflow: ${workflow.metadata?.name}`,
          escalation_rule_id: workflow.id,
          metadata: approvalData
        })
        .select()
        .single();

      if (error) throw error;

      // Cache the approval request
      this.pendingApprovals.set(data.id, {
        ...approvalData,
        id: data.id
      });

      return {
        ...approvalData,
        id: data.id
      };

    } catch (error) {
      console.error('Failed to create approval request:', error);
      throw error;
    }
  }

  async startApprovalProcess(approvalRequest) {
    try {
      const approvalSteps = approvalRequest.approval_steps || [];
      
      if (approvalSteps.length === 0) {
        // Default approval process
        return await this.requestDefaultApproval(approvalRequest);
      }

      // Start with first step
      const firstStep = approvalSteps[0];
      return await this.processApprovalStep(approvalRequest, firstStep, 0);

    } catch (error) {
      console.error('Failed to start approval process:', error);
      throw error;
    }
  }

  async processApprovalStep(approvalRequest, step, stepIndex) {
    try {
      console.log(`Processing approval step ${stepIndex + 1}: ${step.type}`);

      switch (step.type) {
        case 'manager_approval':
          return await this.requestManagerApproval(approvalRequest, step);
        
        case 'automatic_check':
          return await this.performAutomaticCheck(approvalRequest, step);
        
        case 'external_review':
          return await this.requestExternalReview(approvalRequest, step);
        
        case 'customer_confirmation':
          return await this.requestCustomerConfirmation(approvalRequest, step);
        
        default:
          return await this.requestDefaultApproval(approvalRequest);
      }

    } catch (error) {
      console.error(`Failed to process approval step ${stepIndex}:`, error);
      throw error;
    }
  }

  async requestManagerApproval(approvalRequest, step) {
    try {
      // Get manager information
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', approvalRequest.user_id)
        .single();

      const managers = profile?.client_config?.managers || [];
      
      if (managers.length === 0) {
        return {
          success: false,
          error: 'No managers configured for approval'
        };
      }

      // In a real implementation, this would send approval requests to managers
      const approvalRequests = managers.map(manager => ({
        type: 'email',
        recipient: manager.email,
        subject: `Approval Required: ${approvalRequest.email_subject}`,
        message: `Please review and approve the following email response:\n\nFrom: ${approvalRequest.email_from}\nSubject: ${approvalRequest.email_subject}\n\nAction required: ${step.description || 'Manager approval'}`,
        approvalLink: `${process.env.VITE_APP_URL}/approve/${approvalRequest.id}`,
        status: 'simulated' // In real implementation, would be 'sent'
      }));

      return {
        success: true,
        type: 'manager_approval',
        requests: approvalRequests,
        managersNotified: managers.length,
        timeout: step.timeout_hours || 4
      };

    } catch (error) {
      console.error('Failed to request manager approval:', error);
      throw error;
    }
  }

  async performAutomaticCheck(approvalRequest, step) {
    try {
      // Perform automatic checks based on step configuration
      const checks = step.checks || [];
      const results = [];

      for (const check of checks) {
        const result = await this.runAutomaticCheck(check, approvalRequest);
        results.push(result);
      }

      const allPassed = results.every(result => result.passed);

      return {
        success: true,
        type: 'automatic_check',
        allPassed,
        results,
        approved: allPassed
      };

    } catch (error) {
      console.error('Failed to perform automatic check:', error);
      throw error;
    }
  }

  async runAutomaticCheck(check, approvalRequest) {
    switch (check.type) {
      case 'business_hours':
        const isBusinessHours = await this.isBusinessHours(approvalRequest.user_id);
        return {
          type: 'business_hours',
          passed: isBusinessHours,
          message: isBusinessHours ? 'Within business hours' : 'Outside business hours'
        };

      case 'customer_history':
        const isKnown = await this.isKnownCustomer(approvalRequest.email_from, approvalRequest.user_id);
        return {
          type: 'customer_history',
          passed: isKnown,
          message: isKnown ? 'Known customer' : 'New or unknown customer'
        };

      case 'content_filter':
        const contentSafe = this.isContentSafe(approvalRequest.email_body);
        return {
          type: 'content_filter',
          passed: contentSafe,
          message: contentSafe ? 'Content is appropriate' : 'Content needs review'
        };

      default:
        return {
          type: check.type,
          passed: false,
          message: `Unknown check type: ${check.type}`
        };
    }
  }

  async requestExternalReview(approvalRequest, step) {
    try {
      // Request external review (e.g., legal, compliance)
      const reviewers = step.reviewers || [];
      
      const reviewRequests = reviewers.map(reviewer => ({
        type: 'external_review',
        reviewer: reviewer.name,
        contact: reviewer.email,
        department: reviewer.department,
        subject: `External Review Required: ${approvalRequest.email_subject}`,
        message: `External review requested for email response`,
        status: 'simulated'
      }));

      return {
        success: true,
        type: 'external_review',
        requests: reviewRequests,
        reviewersNotified: reviewers.length,
        timeout: step.timeout_hours || 24
      };

    } catch (error) {
      console.error('Failed to request external review:', error);
      throw error;
    }
  }

  async requestCustomerConfirmation(approvalRequest, step) {
    try {
      // Request customer confirmation before proceeding
      const confirmationRequest = {
        type: 'customer_confirmation',
        customer: approvalRequest.email_from,
        subject: `Confirmation Required: ${step.subject || 'Service Request'}`,
        message: step.message || 'Please confirm you would like to proceed with this request.',
        confirmationLink: `${process.env.VITE_APP_URL}/confirm/${approvalRequest.id}`,
        status: 'simulated'
      };

      return {
        success: true,
        type: 'customer_confirmation',
        request: confirmationRequest,
        timeout: step.timeout_hours || 48
      };

    } catch (error) {
      console.error('Failed to request customer confirmation:', error);
      throw error;
    }
  }

  async requestDefaultApproval(approvalRequest) {
    try {
      // Default approval process - notify user for manual review
      const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', approvalRequest.user_id)
        .single();

      const notifications = [];

      if (notificationSettings?.email_notifications) {
        notifications.push({
          type: 'email',
          subject: `Approval Required: ${approvalRequest.email_subject}`,
          message: `Email from ${approvalRequest.email_from} requires your approval before responding.`,
          approvalLink: `${process.env.VITE_APP_URL}/approve/${approvalRequest.id}`,
          status: 'simulated'
        });
      }

      return {
        success: true,
        type: 'default_approval',
        notifications,
        timeout: 24
      };

    } catch (error) {
      console.error('Failed to request default approval:', error);
      throw error;
    }
  }

  async approveRequest(approvalId, approverId, decision, comments = '') {
    try {
      const approvalRequest = this.pendingApprovals.get(approvalId);
      
      if (!approvalRequest) {
        throw new Error(`Approval request ${approvalId} not found`);
      }

      // Update approval status
      const { error } = await supabase
        .from('email_logs')
        .update({
          metadata: {
            ...approvalRequest,
            status: decision,
            approved_by: approverId,
            approved_at: new Date().toISOString(),
            approval_comments: comments
          }
        })
        .eq('id', approvalId);

      if (error) throw error;

      // Remove from pending approvals
      this.pendingApprovals.delete(approvalId);

      // If approved, continue with next step or complete
      if (decision === 'approved') {
        return await this.continueWorkflow(approvalRequest);
      }

      return {
        success: true,
        decision,
        approvedBy: approverId,
        comments,
        completed: true
      };

    } catch (error) {
      console.error('Failed to approve request:', error);
      throw error;
    }
  }

  async continueWorkflow(approvalRequest) {
    try {
      const approvalSteps = approvalRequest.approval_steps || [];
      const currentStep = approvalRequest.current_step || 0;
      const nextStep = currentStep + 1;

      if (nextStep >= approvalSteps.length) {
        // All steps completed
        return {
          success: true,
          completed: true,
          allStepsApproved: true
        };
      }

      // Process next step
      const nextStepConfig = approvalSteps[nextStep];
      approvalRequest.current_step = nextStep;
      
      const stepResult = await this.processApprovalStep(approvalRequest, nextStepConfig, nextStep);

      return {
        success: true,
        completed: false,
        currentStep: nextStep,
        stepResult
      };

    } catch (error) {
      console.error('Failed to continue workflow:', error);
      throw error;
    }
  }

  async getWorkflow(workflowId) {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('id', workflowId)
        .eq('condition', 'approval_workflow')
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Failed to get workflow:', error);
      return null;
    }
  }

  async getPendingApprovals(userId) {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('category', 'approval_request')
        .is('metadata->status', 'pending');

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Failed to get pending approvals:', error);
      return [];
    }
  }

  // Helper methods
  async isBusinessHours(userId) {
    try {
      const { data: businessHours } = await supabase
        .from('business_hours')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!businessHours || !businessHours.schedule) {
        return true; // Default to always open
      }

      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTime = now.getHours() * 100 + now.getMinutes();

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      const todaySchedule = businessHours.schedule[dayName];
      
      if (!todaySchedule || !todaySchedule.open) {
        return false;
      }

      const startTime = parseInt(todaySchedule.start.replace(':', ''));
      const endTime = parseInt(todaySchedule.end.replace(':', ''));

      return currentTime >= startTime && currentTime <= endTime;

    } catch (error) {
      console.error('Failed to check business hours:', error);
      return true;
    }
  }

  async isKnownCustomer(email, userId) {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('email_from', email)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;

    } catch (error) {
      console.error('Failed to check customer history:', error);
      return false;
    }
  }

  isSmallAmount(emailData, threshold = 100) {
    // Extract amount from email content
    const content = (emailData.subject + ' ' + emailData.body).toLowerCase();
    const amountMatch = content.match(/\$(\d+(?:\.\d{2})?)/);
    
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      return amount <= threshold;
    }
    
    return false; // No amount found, assume needs approval
  }

  isStandardRequest(emailData, keywords = []) {
    const content = (emailData.subject + ' ' + emailData.body).toLowerCase();
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }

  isContentSafe(content) {
    const unsafeKeywords = [
      'lawsuit', 'legal action', 'attorney', 'lawyer', 'sue', 'court',
      'discrimination', 'harassment', 'threat', 'violence'
    ];
    
    const lowerContent = content.toLowerCase();
    return !unsafeKeywords.some(keyword => lowerContent.includes(keyword));
  }

  // Timeout handling
  async handleTimeouts() {
    const now = new Date();
    
    for (const [approvalId, approval] of this.pendingApprovals) {
      if (new Date(approval.timeout_at) <= now) {
        console.log(`Approval request ${approvalId} timed out`);
        
        // Handle timeout (could auto-reject or escalate)
        await this.handleApprovalTimeout(approvalId, approval);
      }
    }
  }

  async handleApprovalTimeout(approvalId, approval) {
    try {
      // Auto-reject on timeout or escalate to higher authority
      await this.approveRequest(approvalId, 'system', 'timeout', 'Approval request timed out');
      
      console.log(`Approval request ${approvalId} handled due to timeout`);

    } catch (error) {
      console.error(`Failed to handle timeout for approval ${approvalId}:`, error);
    }
  }
}

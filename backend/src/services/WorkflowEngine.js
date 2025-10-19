/**
 * FloWorx Secure Workflow Engine
 * 
 * Built specifically for hot tub business email automation
 * No external dependencies, complete control over security
 */

import nodemailer from 'nodemailer';
import {  createClient  } from '@supabase/supabase-js';

class WorkflowEngine {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Hot tub business specific workflow templates
    this.workflowTemplates = {
      'sales_inquiry': {
        name: 'Sales Lead Response',
        trigger: 'email_received',
        conditions: ['contains_keywords', 'from_new_contact'],
        actions: ['auto_reply', 'create_lead', 'schedule_followup']
      },
      'service_request': {
        name: 'Service Call Scheduling',
        trigger: 'email_received',
        conditions: ['contains_service_keywords', 'urgency_detected'],
        actions: ['auto_reply', 'create_service_ticket', 'notify_technician']
      },
      'warranty_claim': {
        name: 'Warranty Processing',
        trigger: 'email_received',
        conditions: ['contains_warranty_keywords', 'has_serial_number'],
        actions: ['auto_reply', 'create_warranty_ticket', 'schedule_inspection']
      },
      'parts_order': {
        name: 'Parts Order Processing',
        trigger: 'email_received',
        conditions: ['contains_parts_keywords', 'has_model_info'],
        actions: ['auto_reply', 'create_order', 'check_inventory']
      },
      'appointment_confirmation': {
        name: 'Appointment Confirmation',
        trigger: 'appointment_scheduled',
        conditions: ['has_appointment_details'],
        actions: ['send_confirmation', 'add_to_calendar', 'send_reminder']
      }
    };
  }

  /**
   * Process incoming email and trigger appropriate workflow
   */
  async processEmail(emailData) {
    try {
      console.log('🔄 Processing email for workflow automation...');
      
      // Analyze email content
      const analysis = await this.analyzeEmail(emailData);
      
      // Determine workflow type
      const workflowType = this.determineWorkflowType(analysis);
      
      if (!workflowType) {
        console.log('ℹ️ No specific workflow matched, using general response');
        return await this.executeGeneralResponse(emailData);
      }

      // Execute specific workflow
      return await this.executeWorkflow(workflowType, emailData, analysis);
      
    } catch (error) {
      console.error('❌ Workflow processing failed:', error);
      throw error;
    }
  }

  /**
   * Analyze email content for hot tub business context
   */
  async analyzeEmail(emailData) {
    const content = (emailData.subject + ' ' + emailData.body).toLowerCase();
    
    // Hot tub business specific keywords
    const keywords = {
      sales: ['spa', 'hot tub', 'jacuzzi', 'cold plunge', 'sauna', 'price', 'quote', 'cost', 'buy', 'purchase'],
      service: ['repair', 'fix', 'broken', 'not working', 'service', 'maintenance', 'troubleshoot'],
      warranty: ['warranty', 'defect', 'faulty', 'covered', 'guarantee', 'replacement'],
      parts: ['part', 'component', 'filter', 'pump', 'heater', 'cover', 'lid', 'replacement'],
      scheduling: ['appointment', 'schedule', 'visit', 'come by', 'availability', 'when can you']
    };

    const analysis = {
      urgency: this.detectUrgency(content),
      category: this.categorizeEmail(keywords, content),
      hasSerialNumber: this.extractSerialNumber(content),
      hasModelInfo: this.extractModelInfo(content),
      contactInfo: this.extractContactInfo(emailData),
      keywords: this.extractKeywords(keywords, content)
    };

    console.log('📊 Email analysis:', analysis);
    return analysis;
  }

  /**
   * Determine which workflow to execute
   */
  determineWorkflowType(analysis) {
    const { category, urgency } = analysis;
    
    if (urgency === 'high') {
      return 'service_request'; // Prioritize urgent requests
    }
    
    switch (category) {
      case 'sales': return 'sales_inquiry';
      case 'service': return 'service_request';
      case 'warranty': return 'warranty_claim';
      case 'parts': return 'parts_order';
      case 'scheduling': return 'appointment_confirmation';
      default: return null;
    }
  }

  /**
   * Execute specific workflow
   */
  async executeWorkflow(workflowType, emailData, analysis) {
    console.log(`🚀 Executing workflow: ${workflowType}`);
    
    const template = this.workflowTemplates[workflowType];
    if (!template) {
      throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    const results = {
      workflowType,
      executed: true,
      actions: []
    };

    // Execute workflow actions
    for (const action of template.actions) {
      try {
        const actionResult = await this.executeAction(action, emailData, analysis);
        results.actions.push({
          action,
          success: true,
          result: actionResult
        });
      } catch (error) {
        console.error(`❌ Action ${action} failed:`, error);
        results.actions.push({
          action,
          success: false,
          error: error.message
        });
      }
    }

    // Store workflow execution record
    await this.storeWorkflowExecution(results, emailData, analysis);

    return results;
  }

  /**
   * Execute individual workflow action
   */
  async executeAction(action, emailData, analysis) {
    switch (action) {
      case 'auto_reply':
        return await this.sendAutoReply(emailData, analysis);
      
      case 'create_lead':
        return await this.createSalesLead(emailData, analysis);
      
      case 'create_service_ticket':
        return await this.createServiceTicket(emailData, analysis);
      
      case 'create_warranty_ticket':
        return await this.createWarrantyTicket(emailData, analysis);
      
      case 'create_order':
        return await this.createPartsOrder(emailData, analysis);
      
      case 'schedule_followup':
        return await this.scheduleFollowUp(emailData, analysis);
      
      case 'notify_technician':
        return await this.notifyTechnician(emailData, analysis);
      
      case 'schedule_inspection':
        return await this.scheduleInspection(emailData, analysis);
      
      case 'check_inventory':
        return await this.checkInventory(emailData, analysis);
      
      default:
        console.log(`⚠️ Unknown action: ${action}`);
        return { message: 'Action not implemented' };
    }
  }

  /**
   * Send automated reply based on workflow type
   */
  async sendAutoReply(emailData, analysis) {
    const templates = {
      sales_inquiry: {
        subject: 'Thank you for your interest in our hot tubs and spas!',
        body: `Hi ${emailData.fromName || 'there'},

Thank you for reaching out about our hot tub and spa services! We're excited to help you find the perfect solution for your needs.

Our team will review your inquiry and get back to you within 24 hours with:
- Detailed product information
- Pricing and financing options
- Installation timeline
- Local service and support details

In the meantime, feel free to browse our current inventory at floworx-iq.com or call us at (403) 550-7680.

Best regards,
The FloWorx Team`
      },
      service_request: {
        subject: 'Service Request Received - We\'ll be in touch soon!',
        body: `Hi ${emailData.fromName || 'there'},

We've received your service request and understand how important it is to get your hot tub back up and running.

Our service team will:
- Review your request within 2 hours
- Contact you to schedule a convenient appointment
- Provide an estimated repair timeline
- Keep you updated throughout the process

For urgent issues, please call us directly at (403) 550-7680.

Thank you for choosing FloWorx for your hot tub service needs!

Best regards,
The FloWorx Service Team`
      },
      warranty_claim: {
        subject: 'Warranty Claim Received - Processing Started',
        body: `Hi ${emailData.fromName || 'there'},

Thank you for submitting your warranty claim. We're committed to resolving this quickly for you.

Our warranty team will:
- Review your claim within 24 hours
- Verify warranty coverage
- Schedule an inspection if needed
- Process any approved replacements

We'll keep you updated on the progress. For questions, call (403) 550-7680.

Best regards,
The FloWorx Warranty Team`
      }
    };

    const template = templates[analysis.workflowType] || templates.sales_inquiry;
    
    await this.emailTransporter.sendMail({
      from: process.env.SMTP_SENDER,
      to: emailData.from,
      subject: template.subject,
      text: template.body
    });

    return { message: 'Auto-reply sent successfully' };
  }

  /**
   * Create sales lead in database
   */
  async createSalesLead(emailData, analysis) {
    const { data, error } = await this.supabase
      .from('leads')
      .insert({
        email: emailData.from,
        name: emailData.fromName,
        source: 'email_automation',
        status: 'new',
        priority: analysis.urgency === 'high' ? 'high' : 'medium',
        notes: `Auto-generated from email: ${analysis.keywords.join(', ')}`,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return { leadId: data[0]?.id, message: 'Sales lead created' };
  }

  /**
   * Create service ticket
   */
  async createServiceTicket(emailData, analysis) {
    const { data, error } = await this.supabase
      .from('service_tickets')
      .insert({
        customer_email: emailData.from,
        customer_name: emailData.fromName,
        priority: analysis.urgency === 'high' ? 'urgent' : 'normal',
        issue_description: emailData.body,
        serial_number: analysis.hasSerialNumber,
        model_info: analysis.hasModelInfo,
        status: 'open',
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return { ticketId: data[0]?.id, message: 'Service ticket created' };
  }

  /**
   * Helper methods for email analysis
   */
  detectUrgency(content) {
    const urgentKeywords = ['urgent', 'emergency', 'broken', 'not working', 'asap', 'immediately'];
    return urgentKeywords.some(keyword => content.includes(keyword)) ? 'high' : 'normal';
  }

  categorizeEmail(keywords, content) {
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => content.includes(word))) {
        return category;
      }
    }
    return 'general';
  }

  extractSerialNumber(content) {
    const serialPattern = /\b[A-Z0-9]{8,12}\b/g;
    const matches = content.match(serialPattern);
    return matches ? matches[0] : null;
  }

  extractModelInfo(content) {
    const modelPattern = /\b(model|series|type)[\s:]+([A-Z0-9\-]+)/gi;
    const matches = content.match(modelPattern);
    return matches ? matches[0] : null;
  }

  extractContactInfo(emailData) {
    return {
      email: emailData.from,
      name: emailData.fromName,
      phone: this.extractPhone(emailData.body)
    };
  }

  extractPhone(text) {
    const phonePattern = /\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/;
    const match = text.match(phonePattern);
    return match ? match[0] : null;
  }

  extractKeywords(keywords, content) {
    const found = [];
    for (const [category, words] of Object.entries(keywords)) {
      words.forEach(word => {
        if (content.includes(word)) {
          found.push(word);
        }
      });
    }
    return found;
  }

  /**
   * Store workflow execution record
   */
  async storeWorkflowExecution(results, emailData, analysis) {
    const { error } = await this.supabase
      .from('workflow_executions')
      .insert({
        workflow_type: results.workflowType,
        email_id: emailData.id,
        customer_email: emailData.from,
        analysis_data: analysis,
        execution_results: results,
        executed_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to store workflow execution:', error);
    }
  }

  /**
   * Execute general response for unmatched emails
   */
  async executeGeneralResponse(emailData) {
    await this.emailTransporter.sendMail({
      from: process.env.SMTP_SENDER,
      to: emailData.from,
      subject: 'Thank you for contacting FloWorx!',
      text: `Hi ${emailData.fromName || 'there'},

Thank you for reaching out to FloWorx! We've received your message and will get back to you as soon as possible.

For immediate assistance, please call us at (403) 550-7680.

Best regards,
The FloWorx Team`
    });

    return { message: 'General response sent' };
  }
}

export default WorkflowEngine;

/**
 * Invoice Generator
 * Handles invoice generation and management
 */

import { supabase } from '../customSupabaseClient';

export class InvoiceGenerator {
  constructor(userId) {
    this.userId = userId;
  }

  async generateInvoice(invoiceData) {
    try {
      const invoice = {
        user_id: this.userId,
        invoice_number: await this.generateInvoiceNumber(),
        stripe_invoice_id: invoiceData.stripeInvoiceId,
        subscription_id: invoiceData.subscriptionId,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        tax: invoiceData.tax || 0,
        total: invoiceData.total || invoiceData.amount,
        status: invoiceData.status || 'pending',
        due_date: invoiceData.dueDate,
        paid_date: invoiceData.paidDate,
        billing_period_start: invoiceData.billingPeriodStart,
        billing_period_end: invoiceData.billingPeriodEnd,
        line_items: invoiceData.lineItems || [],
        customer_details: invoiceData.customerDetails || {},
        metadata: invoiceData.metadata || {}
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      throw error;
    }
  }

  async getInvoice(invoiceId) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', this.userId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get invoice:', error);
      throw error;
    }
  }

  async getAllInvoices() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get invoices:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(invoiceId, status, paidDate = null) {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString()
      };

      if (paidDate) {
        updates.paid_date = paidDate;
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      throw error;
    }
  }

  async generateInvoiceNumber() {
    try {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId);

      if (error) throw error;

      const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;
      return invoiceNumber;
    } catch (error) {
      console.error('Failed to generate invoice number:', error);
      throw error;
    }
  }

  async createInvoicePDF(invoiceId) {
    try {
      const invoice = await this.getInvoice(invoiceId);
      
      const pdfData = {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        user: invoice.customer_details,
        lineItems: invoice.line_items,
        subtotal: invoice.amount,
        tax: invoice.tax,
        total: invoice.total,
        dueDate: invoice.due_date,
        status: invoice.status
      };

      const response = await fetch('/api/billing/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Failed to create invoice PDF:', error);
      throw error;
    }
  }

  async downloadInvoice(invoiceId) {
    try {
      const pdfBlob = await this.createInvoicePDF(invoiceId);
      
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Failed to download invoice:', error);
      throw error;
    }
  }

  async sendInvoiceByEmail(invoiceId, email) {
    try {
      const invoice = await this.getInvoice(invoiceId);
      
      const response = await fetch('/api/billing/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          email,
          customerDetails: invoice.customer_details
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send invoice by email:', error);
      throw error;
    }
  }

  async getInvoiceStatistics() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('status, amount, currency, created_at')
        .eq('user_id', this.userId);

      if (error) throw error;

      const stats = {
        total: data.length,
        paid: data.filter(invoice => invoice.status === 'paid').length,
        pending: data.filter(invoice => invoice.status === 'pending').length,
        overdue: data.filter(invoice => 
          invoice.status === 'pending' && 
          new Date(invoice.due_date) < new Date()
        ).length,
        totalAmount: data.reduce((sum, invoice) => sum + invoice.amount, 0),
        paidAmount: data
          .filter(invoice => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + invoice.amount, 0)
      };

      return stats;
    } catch (error) {
      console.error('Failed to get invoice statistics:', error);
      throw error;
    }
  }

  async getOverdueInvoices() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', this.userId)
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get overdue invoices:', error);
      throw error;
    }
  }

  async createRecurringInvoiceTemplate(templateData) {
    try {
      const template = {
        user_id: this.userId,
        name: templateData.name,
        description: templateData.description,
        line_items: templateData.lineItems,
        tax_rate: templateData.taxRate || 0,
        billing_interval: templateData.billingInterval, // monthly, yearly
        billing_day: templateData.billingDay, // day of month
        active: true,
        metadata: templateData.metadata || {}
      };

      const { data, error } = await supabase
        .from('invoice_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to create invoice template:', error);
      throw error;
    }
  }

  async generateRecurringInvoices() {
    try {
      // Get active templates
      const { data: templates, error: templatesError } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('user_id', this.userId)
        .eq('active', true);

      if (templatesError) throw templatesError;

      const generatedInvoices = [];

      for (const template of templates) {
        const shouldGenerate = this.shouldGenerateInvoice(template);
        
        if (shouldGenerate) {
          const invoiceData = {
            subscriptionId: template.subscription_id,
            amount: this.calculateTemplateAmount(template),
            currency: template.currency || 'usd',
            billingPeriodStart: this.getBillingPeriodStart(template),
            billingPeriodEnd: this.getBillingPeriodEnd(template),
            dueDate: this.getDueDate(template),
            lineItems: template.line_items,
            customerDetails: template.customer_details,
            metadata: { templateId: template.id }
          };

          const invoice = await this.generateInvoice(invoiceData);
          generatedInvoices.push(invoice);
        }
      }

      return generatedInvoices;
    } catch (error) {
      console.error('Failed to generate recurring invoices:', error);
      throw error;
    }
  }

  shouldGenerateInvoice(template) {
    const now = new Date();
    const lastInvoice = this.getLastInvoiceForTemplate(template.id);
    
    if (!lastInvoice) return true;

    const lastInvoiceDate = new Date(lastInvoice.created_at);
    const daysSinceLastInvoice = (now - lastInvoiceDate) / (1000 * 60 * 60 * 24);

    switch (template.billing_interval) {
      case 'monthly':
        return daysSinceLastInvoice >= 30;
      case 'yearly':
        return daysSinceLastInvoice >= 365;
      default:
        return false;
    }
  }

  calculateTemplateAmount(template) {
    return template.line_items.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  }

  getBillingPeriodStart(template) {
    const now = new Date();
    const start = new Date(now);
    
    switch (template.billing_interval) {
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'yearly':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return start.toISOString();
  }

  getBillingPeriodEnd(template) {
    return new Date().toISOString();
  }

  getDueDate(template) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
    return dueDate.toISOString();
  }

  // Utility methods
  formatCurrency(amount, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getInvoiceStatusColor(status) {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'canceled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }
}

/**
 * Subscription Manager
 * Handles subscription lifecycle and management
 */

import { supabase } from '../customSupabaseClient';

export class SubscriptionManager {
  constructor(userId) {
    this.userId = userId;
  }

  async createSubscription(subscriptionData) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: this.userId,
          stripe_subscription_id: subscriptionData.stripeSubscriptionId,
          stripe_customer_id: subscriptionData.stripeCustomerId,
          price_id: subscriptionData.priceId,
          status: subscriptionData.status,
          current_period_start: subscriptionData.currentPeriodStart,
          current_period_end: subscriptionData.currentPeriodEnd,
          cancel_at_period_end: subscriptionData.cancelAtPeriodEnd,
          trial_start: subscriptionData.trialStart,
          trial_end: subscriptionData.trialEnd,
          metadata: subscriptionData.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, updates) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          status: updates.status,
          current_period_start: updates.currentPeriodStart,
          current_period_end: updates.currentPeriodEnd,
          cancel_at_period_end: updates.cancelAtPeriodEnd,
          metadata: updates.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: cancelAtPeriodEnd,
          status: cancelAtPeriodEnd ? 'active' : 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  async getActiveSubscription() {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', this.userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Failed to get active subscription:', error);
      throw error;
    }
  }

  async getAllSubscriptions() {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      throw error;
    }
  }

  async getSubscriptionHistory() {
    try {
      const { data, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get subscription history:', error);
      throw error;
    }
  }

  async logSubscriptionEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from('subscription_history')
        .insert({
          user_id: this.userId,
          subscription_id: eventData.subscriptionId,
          event_type: eventData.eventType,
          event_data: eventData.eventData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to log subscription event:', error);
      throw error;
    }
  }

  async getSubscriptionUsage(subscriptionId) {
    try {
      const { data, error } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .eq('user_id', this.userId)
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Failed to get subscription usage:', error);
      throw error;
    }
  }

  async updateUsage(subscriptionId, usageData) {
    try {
      const { data, error } = await supabase
        .from('subscription_usage')
        .upsert({
          user_id: this.userId,
          subscription_id: subscriptionId,
          period_start: usageData.periodStart,
          period_end: usageData.periodEnd,
          usage_count: usageData.usageCount,
          usage_limit: usageData.usageLimit,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to update usage:', error);
      throw error;
    }
  }

  async getBillingHistory() {
    try {
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get billing history:', error);
      throw error;
    }
  }

  async createBillingRecord(billingData) {
    try {
      const { data, error } = await supabase
        .from('billing_history')
        .insert({
          user_id: this.userId,
          subscription_id: billingData.subscriptionId,
          amount: billingData.amount,
          currency: billingData.currency,
          status: billingData.status,
          invoice_id: billingData.invoiceId,
          payment_intent_id: billingData.paymentIntentId,
          billing_period_start: billingData.billingPeriodStart,
          billing_period_end: billingData.billingPeriodEnd,
          metadata: billingData.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to create billing record:', error);
      throw error;
    }
  }

  async getSubscriptionPlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get subscription plans:', error);
      throw error;
    }
  }

  async getPlanById(planId) {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .eq('active', true)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get subscription plan:', error);
      throw error;
    }
  }

  // Utility methods
  isSubscriptionActive(subscription) {
    return subscription && subscription.status === 'active';
  }

  isSubscriptionInTrial(subscription) {
    if (!subscription) return false;
    
    const now = new Date();
    const trialEnd = new Date(subscription.trial_end);
    
    return subscription.trial_end && now < trialEnd;
  }

  getDaysUntilRenewal(subscription) {
    if (!subscription) return 0;
    
    const now = new Date();
    const renewalDate = new Date(subscription.current_period_end);
    const diffTime = renewalDate - now;
    
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getSubscriptionStatusMessage(subscription) {
    if (!subscription) return 'No active subscription';
    
    if (this.isSubscriptionInTrial(subscription)) {
      const trialDays = this.getDaysUntilRenewal(subscription);
      return `Trial ends in ${trialDays} days`;
    }
    
    if (subscription.cancel_at_period_end) {
      const renewalDays = this.getDaysUntilRenewal(subscription);
      return `Cancels in ${renewalDays} days`;
    }
    
    switch (subscription.status) {
      case 'active':
        return 'Active subscription';
      case 'canceled':
        return 'Subscription canceled';
      case 'past_due':
        return 'Payment past due';
      case 'unpaid':
        return 'Payment required';
      default:
        return 'Unknown status';
    }
  }

  formatCurrency(amount, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }
}

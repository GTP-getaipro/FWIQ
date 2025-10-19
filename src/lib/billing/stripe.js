/**
 * Stripe Payment Manager
 * Handles Stripe payment processing and subscription management
 */

export class StripeManager {
  constructor() {
    this.stripe = null;
    this.initializeStripe();
  }

  async initializeStripe() {
    try {
      // Dynamic import to avoid SSR issues
      const { loadStripe } = await import('@stripe/stripe-js');
      this.stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      
      if (!this.stripe) {
        throw new Error('Failed to initialize Stripe');
      }
      
      console.log('Stripe initialized successfully');
    } catch (error) {
      console.error('Stripe initialization failed:', error);
      throw error;
    }
  }

  async createSubscription(priceId, customerId) {
    try {
      if (!this.stripe) {
        await this.initializeStripe();
      }

      const response = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { clientSecret } = await response.json();

      const result = await this.stripe.confirmCardPayment(clientSecret);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.paymentIntent;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, newPriceId) {
    try {
      const response = await fetch('/api/billing/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          newPriceId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Subscription update failed:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      throw error;
    }
  }

  async createPaymentMethod(cardElement) {
    try {
      if (!this.stripe) {
        await this.initializeStripe();
      }

      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      return paymentMethod;
    } catch (error) {
      console.error('Payment method creation failed:', error);
      throw error;
    }
  }

  async confirmPayment(clientSecret, paymentMethod) {
    try {
      if (!this.stripe) {
        await this.initializeStripe();
      }

      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.paymentIntent;
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw error;
    }
  }

  async setupIntent(clientSecret) {
    try {
      if (!this.stripe) {
        await this.initializeStripe();
      }

      const result = await this.stripe.confirmCardSetup(clientSecret);

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.setupIntent;
    } catch (error) {
      console.error('Setup intent failed:', error);
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId) {
    try {
      if (!this.stripe) {
        await this.initializeStripe();
      }

      return await this.stripe.retrievePaymentIntent(paymentIntentId);
    } catch (error) {
      console.error('Payment intent retrieval failed:', error);
      throw error;
    }
  }

  async createCustomer(email, name) {
    try {
      const response = await fetch('/api/billing/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Customer creation failed:', error);
      throw error;
    }
  }

  async updateCustomer(customerId, updates) {
    try {
      const response = await fetch('/api/billing/update-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          ...updates
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Customer update failed:', error);
      throw error;
    }
  }

  async getCustomerPaymentMethods(customerId) {
    try {
      const response = await fetch(`/api/billing/customer-payment-methods/${customerId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment methods retrieval failed:', error);
      throw error;
    }
  }

  async deletePaymentMethod(paymentMethodId) {
    try {
      const response = await fetch('/api/billing/delete-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment method deletion failed:', error);
      throw error;
    }
  }

  // Utility method to format currency
  formatCurrency(amount, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  // Utility method to validate Stripe key
  validateStripeKey() {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      throw new Error('Stripe publishable key not found in environment variables');
    }
    
    if (!key.startsWith('pk_')) {
      throw new Error('Invalid Stripe publishable key format');
    }
    
    return true;
  }
}

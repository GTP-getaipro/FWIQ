import React, { useState, useEffect } from 'react';
import { SubscriptionManager } from '@/lib/billing/subscription';
import { StripeManager } from '@/lib/billing/stripe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SubscriptionPlans = ({ userId, onPlanSelected }) => {
  const [subscriptionManager] = useState(new SubscriptionManager(userId));
  const [stripeManager] = useState(new StripeManager());
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (userId) {
      loadPlans();
      loadCurrentSubscription();
    }
  }, [userId]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const availablePlans = await subscriptionManager.getSubscriptionPlans();
      setPlans(availablePlans);
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to load subscription plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSubscription = async () => {
    try {
      const subscription = await subscriptionManager.getActiveSubscription();
      setCurrentSubscription(subscription);
    } catch (err) {
      console.error('Failed to load current subscription:', err);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    if (onPlanSelected) {
      onPlanSelected(plan);
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setProcessing(true);
      setError(null);

      // Create or get customer
      const customer = await stripeManager.createCustomer(
        'user@example.com', // This would come from user profile
        'User Name'
      );

      // Create subscription
      const subscription = await stripeManager.createSubscription(
        plan.stripe_price_id,
        customer.id
      );

      // Save subscription to database
      await subscriptionManager.createSubscription({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        priceId: plan.stripe_price_id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.created * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        metadata: {
          price: plan.price,
          interval: plan.interval,
          name: plan.name
        }
      });

      alert('Subscription created successfully!');
      await loadCurrentSubscription();
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to create subscription:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      await stripeManager.cancelSubscription(currentSubscription.stripe_subscription_id);
      await subscriptionManager.cancelSubscription(currentSubscription.id);
      
      alert('Subscription canceled successfully');
      await loadCurrentSubscription();
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to cancel subscription:', err);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const isCurrentPlan = (plan) => {
    return currentSubscription && 
           currentSubscription.price_id === plan.stripe_price_id;
  };

  const isPopular = (plan) => {
    return plan.metadata?.popular || false;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">
          Select the perfect plan for your needs
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Current Plan</h3>
                <p className="text-sm text-gray-600">
                  {subscriptionManager.getSubscriptionStatusMessage(currentSubscription)}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancelSubscription}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Cancel Subscription'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${isCurrentPlan(plan) ? 'ring-2 ring-blue-500' : ''} ${isPopular(plan) ? 'ring-2 ring-green-500' : ''}`}
          >
            {isPopular(plan) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            {isCurrentPlan(plan) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {formatCurrency(plan.price, plan.currency)}
                </div>
                <div className="text-gray-500">
                  per {plan.interval}
                </div>
              </div>

              <div className="space-y-2">
                {plan.features && plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                {isCurrentPlan(plan) ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe(plan)}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : `Subscribe to ${plan.name}`}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Default Plans if none loaded */}
      {plans.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Starter</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold">$9</div>
                <div className="text-gray-500">per month</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">1,000 emails/month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">Basic support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">Standard templates</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => handleSubscribe({ id: 'starter', name: 'Starter', price: 900 })}>
                Subscribe to Starter
              </Button>
            </CardContent>
          </Card>

          <Card className="relative ring-2 ring-green-500">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Professional</CardTitle>
              <CardDescription>For growing businesses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold">$29</div>
                <div className="text-gray-500">per month</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">10,000 emails/month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">Priority support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">Advanced templates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">Analytics dashboard</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => handleSubscribe({ id: 'professional', name: 'Professional', price: 2900 })}>
                Subscribe to Professional
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Enterprise</CardTitle>
              <CardDescription>For large organizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold">$99</div>
                <div className="text-gray-500">per month</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">Unlimited emails</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">24/7 support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">Custom templates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">Advanced analytics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm">API access</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => handleSubscribe({ id: 'enterprise', name: 'Enterprise', price: 9900 })}>
                Subscribe to Enterprise
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Can I change my plan anytime?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated.
            </p>
          </div>
          <div>
            <h4 className="font-medium">What payment methods do you accept?</h4>
            <p className="text-sm text-gray-600 mt-1">
              We accept all major credit cards, debit cards, and bank transfers.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Is there a free trial?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Yes, all plans come with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Can I cancel anytime?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPlans;

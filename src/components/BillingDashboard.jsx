import React, { useState, useEffect } from 'react';
import { SubscriptionManager } from '@/lib/billing/subscription';
import { InvoiceGenerator } from '@/lib/billing/invoiceGenerator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BillingDashboard = ({ userId }) => {
  const [subscriptionManager] = useState(new SubscriptionManager(userId));
  const [invoiceGenerator] = useState(new InvoiceGenerator(userId));
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadBillingData();
    }
  }, [userId]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [activeSubscription, recentInvoices, invoiceStats] = await Promise.all([
        subscriptionManager.getActiveSubscription(),
        invoiceGenerator.getAllInvoices(),
        invoiceGenerator.getInvoiceStatistics()
      ]);
      
      setSubscription(activeSubscription);
      setInvoices(recentInvoices.slice(0, 5)); // Show only recent 5
      setStats(invoiceStats);
      
    } catch (err) {
      setError(err.message);
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      setError(null);
      await invoiceGenerator.downloadInvoice(invoiceId);
    } catch (err) {
      setError(err.message);
      console.error('Failed to download invoice:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    try {
      setError(null);
      await subscriptionManager.cancelSubscription(subscription.id);
      await loadBillingData(); // Refresh data
      alert('Subscription canceled successfully');
    } catch (err) {
      setError(err.message);
      console.error('Failed to cancel subscription:', err);
    }
  };

  const formatCurrency = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Billing Dashboard</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Billing Dashboard</h2>
        <Button onClick={loadBillingData} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>
            Your active subscription details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Active Plan</h3>
                  <p className="text-sm text-gray-600">
                    {subscriptionManager.getSubscriptionStatusMessage(subscription)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {formatCurrency(subscription.metadata?.price || 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {subscription.metadata?.interval || 'monthly'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Next billing:</span>
                  <span className="ml-2 font-medium">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Days until renewal:</span>
                  <span className="ml-2 font-medium">
                    {subscriptionManager.getDaysUntilRenewal(subscription)}
                  </span>
                </div>
              </div>

              {subscription.cancel_at_period_end && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Your subscription will be canceled at the end of the current billing period.
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Update Payment Method
                </Button>
                {!subscription.cancel_at_period_end && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelSubscription}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">No active subscription</div>
              <Button>
                Choose a Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Invoices</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📄</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Paid Invoices</p>
                  <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">⏳</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Paid</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.paidAmount)}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">💰</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>
            Your latest billing statements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No invoices found</div>
              <div className="text-sm text-gray-400">Your invoices will appear here</div>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium">{invoice.invoice_number}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(invoice.created_at)}
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</div>
                      {invoice.due_date && (
                        <div className="text-sm text-gray-500">
                          Due: {formatDate(invoice.due_date)}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadInvoice(invoice.id)}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-4">
                <Button variant="outline">
                  View All Invoices
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-12 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">****</span>
                </div>
                <div>
                  <div className="font-medium">**** **** **** 4242</div>
                  <div className="text-sm text-gray-500">Expires 12/25</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  Remove
                </Button>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;

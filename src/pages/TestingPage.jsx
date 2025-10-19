import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  BarChart3, 
  RefreshCw, 
  Database, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import Logo from '@/components/Logo';
import ProviderMigrationDashboard from '@/components/ProviderMigrationDashboard';
import OutlookAnalyticsDashboard from '@/components/OutlookAnalyticsDashboard';
import CalendarIntegrationDashboard from '@/components/CalendarIntegrationDashboard';

const TestingPage = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>FloWorx - Feature Testing Dashboard</title>
        <meta name="description" content="Test new migration, analytics, and calendar features" />
      </Helmet>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo className="h-8" />
              <span className="ml-3 text-xl font-semibold text-gray-900">
                Feature Testing Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Overview Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🧪 Manual Testing Dashboard
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Test the new migration, analytics, and calendar integration features implemented in Tickets #88-94.
            </p>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Database Schema</CardTitle>
                  <Database className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">✅ Ready</div>
                  <p className="text-xs text-muted-foreground">
                    All tables and columns created
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Migration Features</CardTitle>
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">✅ Ready</div>
                  <p className="text-xs text-muted-foreground">
                    Provider migration tools available
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">✅ Ready</div>
                  <p className="text-xs text-muted-foreground">
                    Outlook analytics dashboard ready
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calendar</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">✅ Ready</div>
                  <p className="text-xs text-muted-foreground">
                    Calendar integration available
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Testing Instructions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-600" />
                  Testing Instructions
                </CardTitle>
                <CardDescription>
                  Follow these steps to test the new features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">1. Provider Migration Testing</p>
                      <p className="text-sm text-gray-600">
                        Test Gmail to Outlook migration, dual provider mode, and data portability features.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">2. Analytics Dashboard</p>
                      <p className="text-sm text-gray-600">
                        Monitor Microsoft Graph API usage, performance metrics, and error rates.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">3. Calendar Integration</p>
                      <p className="text-sm text-gray-600">
                        Test Outlook calendar reading, event creation, and appointment scheduling.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium">4. Security Testing</p>
                      <p className="text-sm text-gray-600">
                        Verify RLS policies are working and user data is properly protected.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Testing Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="migration">Migration</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Overview</CardTitle>
                  <CardDescription>
                    Summary of all implemented features ready for testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">✅ Completed Features</h3>
                      <ul className="space-y-2 text-sm">
                        <li>• Database schema validation (Ticket #94)</li>
                        <li>• Provider migration management (Ticket #91)</li>
                        <li>• Outlook analytics and monitoring (Ticket #92)</li>
                        <li>• Data portability features (Ticket #93)</li>
                        <li>• Calendar integration (Ticket #88)</li>
                        <li>• Analytics dashboard (Ticket #89)</li>
                        <li>• Migration tools (Ticket #90)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-3">🔧 Technical Implementation</h3>
                      <ul className="space-y-2 text-sm">
                        <li>• Row Level Security (RLS) enabled</li>
                        <li>• Foreign key constraints active</li>
                        <li>• Performance indexes created</li>
                        <li>• User-scoped access policies</li>
                        <li>• Clean database state</li>
                        <li>• Production-ready security</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="migration" className="mt-6">
              <ProviderMigrationDashboard />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <OutlookAnalyticsDashboard />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <CalendarIntegrationDashboard />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default TestingPage;

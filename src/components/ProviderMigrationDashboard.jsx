import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings,
  Users,
  Mail,
  Calendar,
  Zap,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useProviderMigration } from '@/hooks/useProviderMigration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

/**
 * Provider Migration Dashboard Component
 * Provides comprehensive migration tools and dual provider support
 */
const ProviderMigrationDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const migration = useProviderMigration();
  const [selectedMigration, setSelectedMigration] = useState(null);
  const [migrationOptions, setMigrationOptions] = useState({
    cleanupOldIntegration: true,
    preserveOldIntegration: false,
    validateAfterMigration: true,
    createBackup: true
  });
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationStep, setMigrationStep] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

  // Available migration types
  const migrationTypes = [
    {
      id: 'gmail_to_outlook',
      name: 'Gmail to Outlook',
      description: 'Migrate from Gmail to Outlook with full data preservation',
      fromProvider: 'gmail',
      toProvider: 'outlook',
      icon: ArrowRight,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'outlook_to_gmail',
      name: 'Outlook to Gmail',
      description: 'Migrate from Outlook to Gmail with full data preservation',
      fromProvider: 'outlook',
      toProvider: 'gmail',
      icon: ArrowLeft,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  const handleMigration = async (migrationType) => {
    if (!migration.canMigrate(migrationType.fromProvider, migrationType.toProvider)) {
      toast({
        variant: 'destructive',
        title: 'Migration Not Available',
        description: `Cannot migrate from ${migrationType.fromProvider} to ${migrationType.toProvider}. Please check your integrations.`
      });
      return;
    }

    setIsMigrating(true);
    setSelectedMigration(migrationType);
    setMigrationProgress(0);
    setMigrationStep('Preparing migration...');

    try {
      // Simulate progress updates
      const progressSteps = [
        { step: 'Validating integrations...', progress: 20 },
        { step: 'Creating backup...', progress: 40 },
        { step: 'Migrating email labels...', progress: 60 },
        { step: 'Migrating business configuration...', progress: 80 },
        { step: 'Updating workflows...', progress: 90 },
        { step: 'Validating migration...', progress: 100 }
      ];

      for (const { step, progress } of progressSteps) {
        setMigrationStep(step);
        setMigrationProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Perform actual migration
      let result;
      if (migrationType.id === 'gmail_to_outlook') {
        result = await migration.migrateGmailToOutlook(migrationOptions);
      } else {
        result = await migration.migrateOutlookToGmail(migrationOptions);
      }

      toast({
        title: 'Migration Completed Successfully!',
        description: `Successfully migrated from ${migrationType.fromProvider} to ${migrationType.toProvider}`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      });

      setMigrationStep('Migration completed successfully!');
      setMigrationProgress(100);

    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        variant: 'destructive',
        title: 'Migration Failed',
        description: error.message
      });
      setMigrationStep('Migration failed');
    } finally {
      setIsMigrating(false);
      setTimeout(() => {
        setSelectedMigration(null);
        setMigrationProgress(0);
        setMigrationStep('');
      }, 3000);
    }
  };

  const handleDualProviderToggle = async (enabled) => {
    try {
      if (enabled) {
        await migration.enableDualProviderSupport({
          primaryProvider: migration.migrationStatus?.primaryProvider || 'gmail'
        });
        toast({
          title: 'Dual Provider Mode Enabled',
          description: 'You can now use both Gmail and Outlook simultaneously'
        });
      } else {
        await migration.disableDualProviderSupport({
          keepProvider: migration.migrationStatus?.primaryProvider || 'gmail'
        });
        toast({
          title: 'Dual Provider Mode Disabled',
          description: 'Switched back to single provider mode'
        });
      }
    } catch (error) {
      console.error('Failed to toggle dual provider mode:', error);
      toast({
        variant: 'destructive',
        title: 'Operation Failed',
        description: error.message
      });
    }
  };

  const getProviderIcon = (provider) => {
    return provider === 'gmail' ? (
      <Mail className="h-5 w-5" />
    ) : (
      <Calendar className="h-5 w-5" />
    );
  };

  const getProviderColor = (provider) => {
    return provider === 'gmail' ? 'text-red-600' : 'text-blue-600';
  };

  if (migration.loading && !migration.migrationStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Provider Migration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Provider Migration</h2>
          <p className="text-gray-600">Migrate between Gmail and Outlook with data preservation</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={migration.refreshStatus}
          disabled={migration.loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${migration.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getProviderIcon(migration.migrationStatus?.primaryProvider || 'gmail')}
              </div>
              <p className="text-sm text-gray-600">Primary Provider</p>
              <p className={`font-semibold ${getProviderColor(migration.migrationStatus?.primaryProvider || 'gmail')}`}>
                {migration.migrationStatus?.primaryProvider?.toUpperCase() || 'GMAIL'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Dual Provider Mode</p>
              <Badge variant={migration.migrationStatus?.dualProviderMode ? 'default' : 'secondary'}>
                {migration.migrationStatus?.dualProviderMode ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Active Integrations</p>
              <p className="font-semibold text-green-600">
                {migration.migrationStatus?.activeIntegrations?.length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dual Provider Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dual Provider Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Enable Dual Provider Mode</h3>
              <p className="text-sm text-gray-600">
                Use both Gmail and Outlook simultaneously for maximum flexibility
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={migration.migrationStatus?.dualProviderMode || false}
                onCheckedChange={handleDualProviderToggle}
                disabled={migration.loading || !migration.canEnableDualProvider()}
              />
              <Label>
                {migration.migrationStatus?.dualProviderMode ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          </div>
          
          {migration.migrationStatus?.dualProviderMode && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Dual provider mode is active. You can use both Gmail and Outlook features simultaneously.
                Primary provider: <strong>{migration.migrationStatus.primaryProvider?.toUpperCase()}</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Migration Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Migration Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Create Backup Before Migration</Label>
                <p className="text-sm text-gray-600">Automatically create a backup for rollback</p>
              </div>
              <Switch
                checked={migrationOptions.createBackup}
                onCheckedChange={(checked) => 
                  setMigrationOptions(prev => ({ ...prev, createBackup: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Validate After Migration</Label>
                <p className="text-sm text-gray-600">Test functionality after migration completes</p>
              </div>
              <Switch
                checked={migrationOptions.validateAfterMigration}
                onCheckedChange={(checked) => 
                  setMigrationOptions(prev => ({ ...prev, validateAfterMigration: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Clean Up Old Integration</Label>
                <p className="text-sm text-gray-600">Deactivate the old provider after successful migration</p>
              </div>
              <Switch
                checked={migrationOptions.cleanupOldIntegration}
                onCheckedChange={(checked) => 
                  setMigrationOptions(prev => ({ ...prev, cleanupOldIntegration: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Migration Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {migrationTypes.map((migrationType) => {
          const Icon = migrationType.icon;
          const canMigrate = migration.canMigrate(migrationType.fromProvider, migrationType.toProvider);
          
          return (
            <Card key={migrationType.id} className={`${migrationType.borderColor} ${migrationType.bgColor}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${migrationType.color}`} />
                  {migrationType.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{migrationType.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Email labels/folders</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Business configuration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Workflow credentials</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Data validation</span>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => handleMigration(migrationType)}
                  disabled={!canMigrate || isMigrating || migration.loading}
                >
                  {isMigrating && selectedMigration?.id === migrationType.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    <>
                      <Icon className="h-4 w-4 mr-2" />
                      Start Migration
                    </>
                  )}
                </Button>

                {!canMigrate && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {migrationType.fromProvider} integration not found or {migrationType.toProvider} not available
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Migration Progress */}
      {isMigrating && selectedMigration && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Migration in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Migrating from {selectedMigration.fromProvider} to {selectedMigration.toProvider}</span>
                  <span>{migrationProgress}%</span>
                </div>
                <Progress value={migrationProgress} className="w-full" />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">{migrationStep}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {migration.migrationStatus?.activeIntegrations?.map((integration) => (
              <div key={integration.provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getProviderIcon(integration.provider)}
                  <div>
                    <p className="font-medium">{integration.provider.toUpperCase()}</p>
                    <p className="text-sm text-gray-600">
                      Connected {new Date(integration.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant="default">
                  {integration.status}
                </Badge>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active integrations found</p>
                <p className="text-sm">Connect an email provider to enable migration</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderMigrationDashboard;

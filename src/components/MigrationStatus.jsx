import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { oauthMigrationService } from '@/lib/oauthMigrationService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Info, 
  Loader2,
  ExternalLink
} from 'lucide-react';

const MigrationStatus = ({ onMigrationComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (user) {
      checkMigrationStatus();
    }
  }, [user]);

  const checkMigrationStatus = async () => {
    try {
      setLoading(true);
      const status = await oauthMigrationService.getMigrationStatus(user.id);
      setMigrationStatus(status);
    } catch (error) {
      console.error('Failed to check migration status:', error);
      toast({
        variant: 'destructive',
        title: 'Migration Check Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    try {
      setMigrating(true);
      
      // Get business name from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .single();

      const businessName = profile?.business_name || 'Unknown Business';

      const result = await oauthMigrationService.migrateAllIntegrations(user.id, businessName);
      
      if (result.success) {
        toast({
          title: 'Migration Complete',
          description: `Successfully migrated ${result.migrated.length} integrations.`,
        });
        
        if (onMigrationComplete) {
          onMigrationComplete();
        }
        
        // Refresh status
        await checkMigrationStatus();
      } else {
        toast({
          variant: 'destructive',
          title: 'Migration Failed',
          description: 'Some integrations failed to migrate. Please try again.',
        });
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        variant: 'destructive',
        title: 'Migration Failed',
        description: error.message,
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleReauthorize = async (provider) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', user.id)
        .single();

      const businessName = profile?.business_name || 'Unknown Business';

      const result = await oauthMigrationService.forceReauthorization(user.id, provider, businessName);
      
      if (result.success) {
        // Store pending reauthorization
        sessionStorage.setItem('n8n_oauth_pending', JSON.stringify({
          provider,
          businessName,
          userId: user.id,
          timestamp: Date.now(),
          isReauthorization: true
        }));

        // Redirect to n8n OAuth
        window.location.href = result.redirectUrl;
      }
    } catch (error) {
      console.error('Reauthorization failed:', error);
      toast({
        variant: 'destructive',
        title: 'Reauthorization Failed',
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Checking migration status...</span>
      </div>
    );
  }

  if (!migrationStatus) {
    return null;
  }

  // No migration needed
  if (!migrationStatus.needsMigration) {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Your email integrations are up to date with the latest security improvements.
        </AlertDescription>
      </Alert>
    );
  }

  // Migration needed
  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription>
        <div className="text-amber-800">
          <p className="font-medium mb-2">Email Integration Update Available</p>
          <p className="text-sm mb-4">
            We've improved the security of your email integrations. 
            {migrationStatus.pendingCount > 0 && (
              <span> {migrationStatus.pendingCount} integration(s) need to be updated.</span>
            )}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleMigrate}
              disabled={migrating}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {migrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Automatically
                </>
              )}
            </Button>
            
            <Button
              onClick={() => handleReauthorize('gmail')}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Re-authorize Gmail
            </Button>
            
            <Button
              onClick={() => handleReauthorize('outlook')}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Re-authorize Outlook
            </Button>
          </div>
          
          <div className="mt-3 text-xs text-amber-700">
            <Info className="inline h-3 w-3 mr-1" />
            This is a one-time update to improve security. Your email access will continue working normally.
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default MigrationStatus;

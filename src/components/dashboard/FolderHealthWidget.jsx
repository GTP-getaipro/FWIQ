import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, RefreshCw, Folder, Info, Brain, AlertCircle, Plus } from 'lucide-react';
import { getFolderHealthSummary } from '@/lib/folderHealthCheck';
import { provisionLabelSchemaFor } from '@/lib/labelProvisionService';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const FolderHealthWidget = ({ userId, provider, onRefreshNeeded }) => {
  const [folderHealth, setFolderHealth] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  // Check folder health on mount
  useEffect(() => {
    if (userId) {
      checkFolderHealth();
    }
  }, [userId]);

  const checkFolderHealth = async () => {
    setIsChecking(true);
    console.log('🔍 Starting folder health check...', { userId, provider, timestamp: new Date().toISOString() });
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const health = await getFolderHealthSummary(userId, provider);
      console.log('✅ Health check result:', {
        healthy: health.healthy,
        healthPercentage: health.healthPercentage,
        totalFolders: health.totalFolders,
        missingCount: health.missingCount,
        provider: health.provider,
        error: health.error
      });
      
      setFolderHealth(health);
      
      if (health.error) {
        console.error('⚠️ Health check returned with error:', health.error);
        toast({
          variant: 'destructive',
          title: 'Health Check Issue',
          description: health.error,
          duration: 7000
        });
      } else if (!health.healthy && health.missingCount > 0) {
        console.warn(`⚠️ ${health.missingCount} folders are missing:`, health.missingFolders);
      }
    } catch (error) {
      console.error('❌ Failed to check folder health:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        userId,
        provider
      });
      
      // Set error state so widget can display something
      setFolderHealth({
        healthy: false,
        healthPercentage: 0,
        totalFolders: 0,
        missingCount: 0,
        missingFolders: [],
        provider: provider || 'unknown',
        error: error.message || 'Unknown error occurred'
      });
      
      toast({
        variant: 'destructive',
        title: 'Health Check Failed',
        description: `Could not check folder status: ${error.message}`,
        duration: 7000
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleRedeployClick = () => {
    if (onRefreshNeeded) {
      onRefreshNeeded();
    }
  };

  /**
   * Sync existing Gmail/Outlook folders to database
   * Handles case where folders exist in email provider but not in database
   */
  const handleSyncFolders = async () => {
    setIsProvisioning(true);
    console.log('🔄 Syncing folders from email provider to database...', { userId, provider });
    
    try {
      toast({
        title: 'Syncing Folders...',
        description: 'Reading folders from your email account...',
        duration: 3000
      });
      
      // Import sync function
      const { syncGmailLabelsWithDatabase } = await import('@/lib/gmailLabelSync');
      
      // Sync folders from Gmail/Outlook to database
      const result = await syncGmailLabelsWithDatabase(userId, provider, userId);
      
      if (result.success || result.totalLabels > 0) {
        const syncedCount = result.totalLabels || Object.keys(result.labelMap || {}).length;
        console.log('✅ Folders synced successfully:', syncedCount);
        
        toast({
          title: 'Folders Synced Successfully! ✅',
          description: `Found and synced ${syncedCount} folders from ${provider}. Refreshing status...`,
          duration: 5000
        });
        
        // Wait a moment then refresh health check
        setTimeout(() => {
          checkFolderHealth();
        }, 2000);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
      
    } catch (error) {
      console.error('❌ Folder sync failed:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Sync Folders',
        description: error.message || 'Please try again or contact support.',
        duration: 7000
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  /**
   * Handle "Create Missing Folders" button click
   * Creates only the specific folders that are missing (not a full rebuild)
   * This handles cases where user manually deleted folders or provisioning was incomplete
   */
  const handleCreateFoldersNow = async () => {
    setIsProvisioning(true);
    console.log('🚀 Creating missing folders...', { 
      userId, 
      provider,
      missingFolders: folderHealth?.missingFolders || [],
      missingCount: folderHealth?.missingCount || 0
    });
    
    try {
      // If NO folders exist at all, do full provisioning
      if (folderHealth.totalFolders === 0) {
        console.log('📋 No folders exist - running full provisioning');
        
        // Get user's business type from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('client_config, managers, suppliers')
          .eq('id', userId)
          .single();
        
        if (profileError || !profile) {
          throw new Error('Could not load profile configuration');
        }
        
        const businessType = profile.client_config?.business_type || 
                            profile.client_config?.business_types?.[0] ||
                            'Hot tub & Spa';
        
        toast({
          title: 'Creating All Folders...',
          description: 'Setting up complete folder structure. This may take 30-60 seconds.',
          duration: 3000
        });
        
        // Run full folder provisioning
        const result = await provisionLabelSchemaFor(userId, businessType, {
          skeletonOnly: false,
          injectTeamFolders: true
        });
        
        if (result.success) {
          const foldersCreated = Object.keys(result.labelMap || {}).length;
          console.log('✅ All folders created successfully:', foldersCreated);
          
          // Update profile with folder mapping
          await supabase
            .from('profiles')
            .update({
              email_labels: result.labelMap,
              label_provisioning_status: 'completed',
              label_provisioning_date: new Date().toISOString()
            })
            .eq('id', userId);
          
          toast({
            title: 'Folders Created Successfully! ✅',
            description: `Created ${foldersCreated} email folders for your business.`,
            duration: 5000
          });
        } else {
          throw new Error(result.error || 'Folder provisioning failed');
        }
        
      } else {
        // Some folders exist but some are missing - only create the missing ones
        console.log('📋 Creating missing folders only:', folderHealth.missingFolders);
        
        toast({
          title: 'Creating Missing Folders...',
          description: `Recreating ${folderHealth.missingCount} missing folder${folderHealth.missingCount > 1 ? 's' : ''}...`,
          duration: 3000
        });
        
        // Import the folder creation utilities
        const { createMissingFolders } = await import('@/lib/folderHealthCheck');
        
        // Create only the missing folders
        const result = await createMissingFolders(userId, provider, folderHealth.missingFolders);
        
        if (result.success) {
          console.log('✅ Missing folders created:', result.created);
          
          toast({
            title: 'Missing Folders Created! ✅',
            description: `Successfully created ${result.created.length} missing folder${result.created.length > 1 ? 's' : ''}.`,
            duration: 5000
          });
        } else {
          throw new Error(result.error || 'Failed to create missing folders');
        }
      }
      
      // Wait a moment then refresh health check
      setTimeout(() => {
        checkFolderHealth();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Folder creation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Folders',
        description: error.message || 'Please try again or contact support.',
        duration: 7000
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  if (!folderHealth || isChecking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Checking Folder Health...
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Validating all email folders
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const isHealthy = folderHealth.healthy;
  const healthPercentage = folderHealth.healthPercentage || 0;
  const noFoldersConfigured = folderHealth.totalFolders === 0;
  const needsSync = folderHealth.needsSync || false;
  const actualFoldersCount = folderHealth.actualFoldersCount || 0;

  // Special case: Folders exist in Gmail/Outlook but not synced to database
  if (needsSync && actualFoldersCount > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 shadow-lg p-4 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-100">
                Database Not Synced
              </h3>
              <p className="text-sm mt-1 text-amber-700 dark:text-amber-300">
                Found {actualFoldersCount} folders in {provider} but not in database
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={checkFolderHealth}
            disabled={isChecking}
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Warning Message */}
        <div className="mt-4 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Action Required:</strong> Your {provider} account has {actualFoldersCount} business folders, 
            but they're not synced to the dashboard database. Click "Sync Folders" below to enable the health monitoring 
            and n8n automation.
          </p>
        </div>

        {/* Sync Button */}
        <div className="mt-4">
          <Button
            onClick={handleSyncFolders}
            disabled={isProvisioning}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {isProvisioning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing {actualFoldersCount} Folders...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync {actualFoldersCount} Folders from {provider === 'gmail' ? 'Gmail' : 'Outlook'}
              </>
            )}
          </Button>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
            This will sync all {actualFoldersCount} folders to enable health monitoring
          </p>
        </div>

        {/* Provider Badge */}
        {folderHealth.provider && (
          <div className="mt-4">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {folderHealth.provider === 'gmail' ? '📧 Gmail' : '📬 Outlook'}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  // Special case: No folders configured at all (needs initial provisioning)
  if (noFoldersConfigured && !needsSync) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 shadow-lg p-4 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-red-900 dark:text-red-100">
                No Folders Configured
              </h3>
              <p className="text-sm mt-1 text-red-700 dark:text-red-300">
                Email folders need to be created for your business
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={checkFolderHealth}
            disabled={isChecking}
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Warning Message */}
        <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Action Required:</strong> Your business folders weren't created during onboarding. 
            Click the button below to create them now. This will set up all necessary email labels for automatic categorization.
          </p>
        </div>

        {/* Sync or Create Folders Buttons */}
        <div className="mt-4 space-y-2">
          <Button
            onClick={handleSyncFolders}
            disabled={isProvisioning}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
          >
            {isProvisioning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing Folders...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Folders from {provider === 'gmail' ? 'Gmail' : 'Outlook'}
              </>
            )}
          </Button>
          <p className="text-xs text-green-700 dark:text-green-300 text-center">
            If folders already exist in your email, sync them to the dashboard
          </p>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-red-50 dark:bg-red-900/20 text-gray-500 dark:text-gray-400">OR</span>
            </div>
          </div>
          
          <Button
            onClick={handleCreateFoldersNow}
            disabled={isProvisioning}
            variant="outline"
            className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            {isProvisioning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Folders... (30-60 seconds)
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create New Folders
              </>
            )}
          </Button>
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
            If folders don't exist, create them from your profile
          </p>
        </div>

        {/* Provider Badge */}
        {folderHealth.provider && (
          <div className="mt-4">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {folderHealth.provider === 'gmail' ? '📧 Gmail' : '📬 Outlook'}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-xl border shadow-lg p-4 sm:p-6 ${
        isHealthy
          ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
          : 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isHealthy
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            {isHealthy ? (
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <h3 className={`font-semibold text-lg ${
              isHealthy
                ? 'text-green-900 dark:text-green-100'
                : 'text-amber-900 dark:text-amber-100'
            }`}>
              {isHealthy ? 'All Folders Healthy' : 'Some Folders Missing'}
            </h3>
            <p className={`text-sm mt-1 ${
              isHealthy
                ? 'text-green-700 dark:text-green-300'
                : 'text-amber-700 dark:text-amber-300'
            }`}>
              {folderHealth.totalFolders - folderHealth.missingCount}/{folderHealth.totalFolders} folders found ({healthPercentage}%)
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={checkFolderHealth}
          disabled={isChecking}
          className="flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Health Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${healthPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              healthPercentage === 100
                ? 'bg-green-500'
                : healthPercentage >= 80
                ? 'bg-blue-500'
                : healthPercentage >= 50
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* Missing Folders Details */}
      {!isHealthy && folderHealth.missingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
          >
            <Info className="h-4 w-4" />
            <span>
              {showDetails ? 'Hide' : 'Show'} {folderHealth.missingCount} missing folder{folderHealth.missingCount > 1 ? 's' : ''}
            </span>
          </button>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-2"
            >
              {folderHealth.missingFolders.map((folderName, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded-lg px-3 py-2"
                >
                  <Folder className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{folderName}</span>
                </div>
              ))}
              {folderHealth.missingCount > folderHealth.missingFolders.length && (
                <p className="text-xs text-amber-600 dark:text-amber-400 italic px-3">
                  And {folderHealth.missingCount - folderHealth.missingFolders.length} more...
                </p>
              )}
            </motion.div>
          )}

          {/* Redeploy Button */}
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-700">
            <Button
              onClick={handleCreateFoldersNow}
              disabled={isProvisioning}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isProvisioning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Missing Folders...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Missing Folders
                </>
              )}
            </Button>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
              This will recreate only the {folderHealth.missingCount} missing folder{folderHealth.missingCount > 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>
      )}

      {/* Last Checked */}
      {folderHealth.lastChecked && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Last checked: {new Date(folderHealth.lastChecked).toLocaleString()}
        </p>
      )}

      {/* Classifier Coverage Section */}
      {folderHealth.classifierCoverage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`mt-4 p-3 rounded-lg border ${
            folderHealth.classifierCoverage.healthy
              ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
              : 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain className={`h-4 w-4 ${
              folderHealth.classifierCoverage.healthy
                ? 'text-green-600 dark:text-green-400'
                : 'text-orange-600 dark:text-orange-400'
            }`} />
            <h4 className={`text-sm font-medium ${
              folderHealth.classifierCoverage.healthy
                ? 'text-green-900 dark:text-green-100'
                : 'text-orange-900 dark:text-orange-100'
            }`}>
              AI Classifier Coverage
            </h4>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className={`${
              folderHealth.classifierCoverage.healthy
                ? 'text-green-700 dark:text-green-300'
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              {folderHealth.classifierCoverage.classifiableFolders}/{folderHealth.classifierCoverage.totalFolders} folders classifiable
            </span>
            <span className={`font-medium ${
              folderHealth.classifierCoverage.healthy
                ? 'text-green-800 dark:text-green-200'
                : 'text-orange-800 dark:text-orange-200'
            }`}>
              {folderHealth.classifierCoverage.coveragePercentage}%
            </span>
          </div>
          
          {/* Classifier Coverage Bar */}
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${folderHealth.classifierCoverage.coveragePercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
              className={`h-full rounded-full ${
                folderHealth.classifierCoverage.coveragePercentage >= 90
                  ? 'bg-green-500'
                  : folderHealth.classifierCoverage.coveragePercentage >= 70
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
            />
          </div>
          
          {/* Warnings */}
          {folderHealth.classifierCoverage.warnings && folderHealth.classifierCoverage.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {folderHealth.classifierCoverage.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Unclassifiable Folders */}
          {folderHealth.classifierCoverage.unclassifiableCount > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 transition-colors"
              >
                <Info className="h-3 w-3" />
                <span>
                  {showDetails ? 'Hide' : 'Show'} {folderHealth.classifierCoverage.unclassifiableCount} unclassifiable folder{folderHealth.classifierCoverage.unclassifiableCount > 1 ? 's' : ''}
                </span>
              </button>
              
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="mt-2 space-y-1"
                >
                  {folderHealth.classifierCoverage.unclassifiableFolders.map((folderName, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 rounded px-2 py-1"
                    >
                      <Folder className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{folderName}</span>
                    </div>
                  ))}
                  {folderHealth.classifierCoverage.unclassifiableCount > folderHealth.classifierCoverage.unclassifiableFolders.length && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 italic px-2">
                      And {folderHealth.classifierCoverage.unclassifiableCount - folderHealth.classifierCoverage.unclassifiableFolders.length} more...
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Provider Badge */}
      {folderHealth.provider && (
        <div className="mt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {folderHealth.provider === 'gmail' ? '📧 Gmail' : '📬 Outlook'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default FolderHealthWidget;


import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, RefreshCw, Folder, Info, Brain, AlertCircle } from 'lucide-react';
import { getFolderHealthSummary } from '@/lib/folderHealthCheck';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const FolderHealthWidget = ({ userId, provider, onRefreshNeeded }) => {
  const [folderHealth, setFolderHealth] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
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
    try {
      const health = await getFolderHealthSummary(userId, provider);
      setFolderHealth(health);
      
      if (!health.healthy && health.missingCount > 0) {
        console.warn(`⚠️ ${health.missingCount} folders are missing:`, health.missingFolders);
      }
    } catch (error) {
      console.error('❌ Failed to check folder health:', error);
      toast({
        variant: 'destructive',
        title: 'Health Check Failed',
        description: 'Could not check folder status. Please try again.',
        duration: 5000
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
              onClick={handleRedeployClick}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Redeploy to Recreate Folders
            </Button>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
              This will recreate all missing folders automatically
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


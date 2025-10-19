import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/contexts/DashboardContext';
import DashboardNewUser from './DashboardNewUser';
import DashboardDefault from './DashboardDefault';
import DashboardSkeleton from './DashboardSkeleton';

const DashboardContent = ({ user }) => {
  const { 
    profile, 
    integrations, 
    metrics, 
    recentEmails, 
    isNewUser, 
    hasSeenNewUserDashboard, 
    loading 
  } = useDashboard();

  const [timeFilter, setTimeFilter] = useState('7d');
  const [showFolderIds, setShowFolderIds] = useState(false); // Hide calculator by default

  // Show loading state with appropriate skeleton
  if (loading) {
    return <DashboardSkeleton isNewUser={isNewUser} />;
  }

  // Determine which dashboard to show
  const shouldShowNewUserExperience = isNewUser && 
                                    metrics.emailsProcessed === 0 && 
                                    !hasSeenNewUserDashboard;

  // Animation variants for smooth transitions
  const dashboardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <AnimatePresence mode="wait">
      {shouldShowNewUserExperience ? (
        <motion.div
          key="new-user-dashboard"
          variants={dashboardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.5 }}
        >
          <DashboardNewUser 
            profile={profile}
            integrations={integrations}
            metrics={metrics}
          />
        </motion.div>
      ) : (
        <motion.div
          key="default-dashboard"
          variants={dashboardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.5 }}
        >
          <DashboardDefault 
            profile={profile}
            integrations={integrations}
            metrics={metrics}
            recentEmails={recentEmails}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            setShowFolderIds={setShowFolderIds}
            showFolderIds={showFolderIds}
            workflowVersion={metrics.workflowVersion}
            workflowLastUpdated={metrics.workflowLastUpdated}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DashboardContent;

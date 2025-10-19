import React from 'react';

/**
 * Outlook Icon Component
 * Uses the official Microsoft Outlook logo from Wikimedia Commons
 * Same approach as GmailIcon - simple img tag with external URL
 */
const OutlookIcon = ({ className = "w-8 h-8" }) => {
  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/4/45/Microsoft_Office_Outlook_%282018%E2%80%932024%29.svg"
      alt="Microsoft Outlook"
      className={className}
    />
  );
};

export default OutlookIcon;
/**
 * Lucide React Mock for Testing
 * Mock implementation for Lucide React icons
 */

import React from 'react';

// Mock icon component
const MockIcon = ({ children, ...props }) => (
  <svg data-testid="lucide-icon" {...props}>
    {children}
  </svg>
);

// Export all icons as the same mock component
export const Mail = MockIcon;
export const User = MockIcon;
export const Settings = MockIcon;
export const Bell = MockIcon;
export const Activity = MockIcon;
export const TrendingUp = MockIcon;
export const Clock = MockIcon;
export const CheckCircle = MockIcon;
export const AlertTriangle = MockIcon;
export const Filter = MockIcon;
export const Calendar = MockIcon;
export const BarChart3 = MockIcon;
export const Zap = MockIcon;
export const Users = MockIcon;
export const MessageSquare = MockIcon;
export const LogOut = MockIcon;
export const ArrowRight = MockIcon;
export const Loader2 = MockIcon;
export const PowerOff = MockIcon;
export const RefreshCw = MockIcon;
export const Info = MockIcon;

export default MockIcon;

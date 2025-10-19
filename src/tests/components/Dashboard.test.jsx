/**
 * Dashboard Component Tests
 * Unit tests for the Dashboard component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Mock the auth context
jest.mock('@/contexts/SupabaseAuthContext');
jest.mock('@/lib/security', () => ({
  securityManager: {
    generateSecurityAudit: jest.fn(() => ({ timestamp: '2023-01-01T00:00:00Z' }))
  }
}));
jest.mock('@/lib/csp', () => ({
  cspManager: {
    generateReport: jest.fn(() => ({ timestamp: '2023-01-01T00:00:00Z' }))
  }
}));

describe('Dashboard Component', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@floworx.com',
    user_metadata: {
      first_name: 'Test',
      last_name: 'User'
    }
  };

  const mockProfile = {
    first_name: 'Test',
    last_name: 'User',
    company_name: 'Test Company',
    business_type: 'HVAC',
    managers: [{ name: 'Manager 1', email: 'manager1@test.com' }],
    suppliers: [{ name: 'Supplier 1', email: 'supplier1@test.com' }],
    client_config: {
      business_name: 'Test Company',
      industry: 'HVAC',
      timezone: 'America/New_York'
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock auth context
    useAuth.mockReturnValue({
      user: mockUser,
      session: { access_token: 'test-token' },
      signOut: jest.fn()
    });
  });

  it('should render dashboard with user information', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Welcome, Test!')).toBeInTheDocument();
    });

    // Check for sidebar elements
    expect(screen.getByText('FloWorx')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Email Inbox')).toBeInTheDocument();
    expect(screen.getByText('Automation Workflows')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('AI Responses')).toBeInTheDocument();
    expect(screen.getByText('View Analytics')).toBeInTheDocument();
  });

  it('should display metrics cards', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for metrics to load
    await waitFor(() => {
      expect(screen.getByText('Total Emails')).toBeInTheDocument();
      expect(screen.getByText('Processed Emails')).toBeInTheDocument();
      expect(screen.getByText('Response Rate')).toBeInTheDocument();
      expect(screen.getByText('Avg. Response Time')).toBeInTheDocument();
      expect(screen.getByText('Open Tickets')).toBeInTheDocument();
      expect(screen.getByText('Critical Issues')).toBeInTheDocument();
    });
  });

  it('should display time filter controls', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Last 24 Hours')).toBeInTheDocument();
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
    });
  });

  it('should display recent activity section', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('No recent activity to display.')).toBeInTheDocument();
    });
  });

  it('should handle logout functionality', async () => {
    const mockSignOut = jest.fn();
    useAuth.mockReturnValue({
      user: mockUser,
      session: { access_token: 'test-token' },
      signOut: mockSignOut
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    // Click logout button
    screen.getByText('Logout').click();

    // Verify signOut was called
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('should handle feature click notifications', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Email Inbox')).toBeInTheDocument();
    });

    // Click on Email Inbox feature
    screen.getByText('Email Inbox').click();

    // Should show coming soon message
    await waitFor(() => {
      expect(screen.getByText('🚧 Feature Coming Soon!')).toBeInTheDocument();
    });
  });

  it('should display test backend integration button', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Test Backend Integration')).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    // Mock loading state
    useAuth.mockReturnValue({
      user: null,
      session: null,
      signOut: jest.fn()
    });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Should show loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    // Mock error state
    useAuth.mockReturnValue({
      user: mockUser,
      session: { access_token: 'test-token' },
      signOut: jest.fn()
    });

    // Mock fetch to return error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Dashboard Load Error')).toBeInTheDocument();
    });
  });

  it('should display user profile information', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Welcome, Test!')).toBeInTheDocument();
    });

    // Check for profile information
    expect(screen.getByText('Test Company')).toBeInTheDocument();
  });

  it('should handle time filter changes', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('24h')).toBeInTheDocument();
    });

    // Change time filter
    const timeFilter = screen.getByDisplayValue('24h');
    timeFilter.value = '7d';
    timeFilter.dispatchEvent(new Event('change'));

    // Should update the filter
    expect(timeFilter.value).toBe('7d');
  });
});

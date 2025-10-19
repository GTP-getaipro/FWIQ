/**
 * Jest Test Setup
 * Global test configuration and utilities for FloWorx
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true
});

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto for Node.js
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: async (algorithm, data) => {
        // Simple hash implementation for testing
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data.toString());
        const hashArray = Array.from(new Uint8Array(dataBuffer));
        return new Uint8Array(hashArray.map(b => b * 2 % 256));
      }
    }
  }
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock scrollTo
global.scrollTo = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // Reset fetch mock
  fetch.mockClear();
  
  // Suppress console errors and warnings in tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clean up any timers
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Global test utilities
global.testUtils = {
  // Mock user data
  mockUser: {
    id: 'test-user-id',
    email: 'test@floworx.com',
    user_metadata: {
      first_name: 'Test',
      last_name: 'User'
    }
  },
  
  // Mock profile data
  mockProfile: {
    id: 'test-user-id',
    first_name: 'Test',
    last_name: 'User',
    company_name: 'Test Company',
    business_type: 'hvac',
    onboarding_step: 'completed',
    managers: [{ name: 'Manager 1', email: 'manager1@test.com' }],
    suppliers: [{ name: 'Supplier 1', email: 'supplier1@test.com' }],
    client_config: {
      business_name: 'Test Company',
      industry: 'hvac',
      timezone: 'America/New_York'
    }
  },
  
  // Mock integration data
  mockIntegration: {
    id: 'test-integration-id',
    user_id: 'test-user-id',
    provider: 'gmail',
    status: 'active',
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    expires_at: new Date(Date.now() + 3600000).toISOString()
  },
  
  // Mock workflow data
  mockWorkflow: {
    id: 'test-workflow-id',
    user_id: 'test-user-id',
    n8n_workflow_id: 'test-n8n-workflow-id',
    version: 1,
    status: 'active',
    deployment_status: 'deployed',
    workflow_data: {
      name: 'Test Workflow',
      nodes: [],
      connections: {}
    },
    webhook_url: 'https://test.webhook.url'
  },
  
  // Mock email log data
  mockEmailLog: {
    id: 'test-email-log-id',
    user_id: 'test-user-id',
    provider: 'gmail',
    provider_message_id: 'test-message-id',
    subject: 'Test Email Subject',
    sender: 'sender@example.com',
    received_at: new Date().toISOString(),
    status: 'new',
    raw_email_data: {
      body: 'Test email body',
      headers: {}
    }
  },
  
  // Mock metrics data
  mockMetrics: {
    totalEmails: 100,
    processedEmails: 85,
    responseRate: 85,
    averageResponseTime: 150,
    openTickets: 5,
    criticalIssues: 2
  },
  
  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock API responses
  mockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data)
  }),
  
  // Mock error response
  mockApiError: (message = 'Test error', status = 500) => ({
    ok: false,
    status,
    json: async () => ({ error: message }),
    text: async () => message
  }),
  
  // Create mock function with return value
  createMockFunction: (returnValue) => jest.fn().mockReturnValue(returnValue),
  
  // Create mock async function
  createMockAsyncFunction: (returnValue) => jest.fn().mockResolvedValue(returnValue),
  
  // Create mock function that throws error
  createMockErrorFunction: (error = new Error('Test error')) => jest.fn().mockRejectedValue(error),
  
  // Mock environment variables
  mockEnv: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_GMAIL_CLIENT_ID: 'test-gmail-client-id',
    VITE_GMAIL_CLIENT_SECRET: 'test-gmail-client-secret',
    VITE_OUTLOOK_CLIENT_ID: 'test-outlook-client-id',
    VITE_OUTLOOK_CLIENT_SECRET: 'test-outlook-client-secret'
  }
};

// Setup environment variables for tests
Object.assign(process.env, global.testUtils.mockEnv);

// Mock Vite environment variables
Object.defineProperty(import.meta, 'env', {
  value: global.testUtils.mockEnv,
  writable: true
});

// Custom matchers for testing
expect.extend({
  toBeInTheDocument: require('@testing-library/jest-dom/matchers').toBeInTheDocument,
  toHaveClass: require('@testing-library/jest-dom/matchers').toHaveClass,
  toHaveTextContent: require('@testing-library/jest-dom/matchers').toHaveTextContent,
  toHaveAttribute: require('@testing-library/jest-dom/matchers').toHaveAttribute,
  toHaveValue: require('@testing-library/jest-dom/matchers').toHaveValue,
  toBeVisible: require('@testing-library/jest-dom/matchers').toBeVisible,
  toBeDisabled: require('@testing-library/jest-dom/matchers').toBeDisabled,
  toBeEnabled: require('@testing-library/jest-dom/matchers').toBeEnabled,
  toBeRequired: require('@testing-library/jest-dom/matchers').toBeRequired,
  toBeInvalid: require('@testing-library/jest-dom/matchers').toBeInvalid,
  toBeValid: require('@testing-library/jest-dom/matchers').toBeValid
});

// Global test helpers
global.renderWithProviders = (ui, options = {}) => {
  const { 
    preloadedState = {},
    store = null,
    ...renderOptions 
  } = options;
  
  // If you have a Redux store, you can use it here
  // For now, we'll just render the component
  return render(ui, {
    wrapper: ({ children }) => (
      <div data-testid="test-wrapper">
        {children}
      </div>
    ),
    ...renderOptions
  });
};

// Mock router for testing
global.mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  block: jest.fn(),
  listen: jest.fn(),
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null
  }
};

// Mock navigation for testing
global.mockNavigate = jest.fn();

// Mock toast for testing
global.mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn()
};

console.log('🧪 Jest test setup completed successfully');

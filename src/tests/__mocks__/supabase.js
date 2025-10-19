/**
 * Supabase Mock for Testing
 * Comprehensive mock implementation for Supabase client
 */

// Mock Supabase client
const mockSupabaseClient = {
  // Auth methods
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
    updateUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    verifyOtp: jest.fn()
  },
  
  // Database methods
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  upsert: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  neq: jest.fn(() => mockSupabaseClient),
  gt: jest.fn(() => mockSupabaseClient),
  gte: jest.fn(() => mockSupabaseClient),
  lt: jest.fn(() => mockSupabaseClient),
  lte: jest.fn(() => mockSupabaseClient),
  like: jest.fn(() => mockSupabaseClient),
  ilike: jest.fn(() => mockSupabaseClient),
  is: jest.fn(() => mockSupabaseClient),
  in: jest.fn(() => mockSupabaseClient),
  contains: jest.fn(() => mockSupabaseClient),
  containedBy: jest.fn(() => mockSupabaseClient),
  rangeGt: jest.fn(() => mockSupabaseClient),
  rangeGte: jest.fn(() => mockSupabaseClient),
  rangeLt: jest.fn(() => mockSupabaseClient),
  rangeLte: jest.fn(() => mockSupabaseClient),
  rangeAdjacent: jest.fn(() => mockSupabaseClient),
  overlaps: jest.fn(() => mockSupabaseClient),
  textSearch: jest.fn(() => mockSupabaseClient),
  match: jest.fn(() => mockSupabaseClient),
  not: jest.fn(() => mockSupabaseClient),
  or: jest.fn(() => mockSupabaseClient),
  filter: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  limit: jest.fn(() => mockSupabaseClient),
  range: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => mockSupabaseClient),
  maybeSingle: jest.fn(() => mockSupabaseClient),
  csv: jest.fn(() => mockSupabaseClient),
  geojson: jest.fn(() => mockSupabaseClient),
  explain: jest.fn(() => mockSupabaseClient),
  rollback: jest.fn(() => mockSupabaseClient),
  returns: jest.fn(() => mockSupabaseClient),
  then: jest.fn((resolve) => resolve(mockSupabaseClient)),
  catch: jest.fn(),
  
  // Storage methods
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      move: jest.fn(),
      copy: jest.fn()
    }))
  },
  
  // Realtime methods
  channel: jest.fn(() => ({
    on: jest.fn(() => ({
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    })),
    send: jest.fn(),
    track: jest.fn(),
    untrack: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  })),
  
  // Functions methods
  functions: {
    invoke: jest.fn()
  }
};

// Mock data
const mockData = {
  // Mock user data
  user: {
    id: 'test-user-id',
    email: 'test@floworx.com',
    user_metadata: {
      first_name: 'Test',
      last_name: 'User'
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  
  // Mock session data
  session: {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: {
      id: 'test-user-id',
      email: 'test@floworx.com',
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    }
  },
  
  // Mock profile data
  profile: {
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
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  
  // Mock integration data
  integration: {
    id: 'test-integration-id',
    user_id: 'test-user-id',
    provider: 'gmail',
    status: 'active',
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  
  // Mock workflow data
  workflow: {
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
    webhook_url: 'https://test.webhook.url',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  
  // Mock email log data
  emailLog: {
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
    },
    created_at: '2023-01-01T00:00:00Z'
  }
};

// Setup default mock implementations
mockSupabaseClient.auth.getSession.mockResolvedValue({
  data: { session: mockData.session },
  error: null
});

mockSupabaseClient.auth.getUser.mockResolvedValue({
  data: { user: mockData.user },
  error: null
});

mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
  data: { user: mockData.user, session: mockData.session },
  error: null
});

mockSupabaseClient.auth.signUp.mockResolvedValue({
  data: { user: mockData.user, session: mockData.session },
  error: null
});

mockSupabaseClient.auth.signOut.mockResolvedValue({
  data: null,
  error: null
});

mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
  error: null
});

// Database query mocks
mockSupabaseClient.select.mockResolvedValue({
  data: [mockData.profile],
  error: null
});

mockSupabaseClient.insert.mockResolvedValue({
  data: [mockData.profile],
  error: null
});

mockSupabaseClient.update.mockResolvedValue({
  data: [mockData.profile],
  error: null
});

mockSupabaseClient.upsert.mockResolvedValue({
  data: [mockData.profile],
  error: null
});

mockSupabaseClient.delete.mockResolvedValue({
  data: null,
  error: null
});

mockSupabaseClient.single.mockResolvedValue({
  data: mockData.profile,
  error: null
});

mockSupabaseClient.maybeSingle.mockResolvedValue({
  data: mockData.profile,
  error: null
});

// Storage mocks
mockSupabaseClient.storage.from().upload.mockResolvedValue({
  data: { path: 'test-file-path' },
  error: null
});

mockSupabaseClient.storage.from().download.mockResolvedValue({
  data: new Blob(['test content']),
  error: null
});

mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
  data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-file' }
});

// Functions mocks
mockSupabaseClient.functions.invoke.mockResolvedValue({
  data: { result: 'success' },
  error: null
});

// Realtime mocks
mockSupabaseClient.channel().on().subscribe.mockResolvedValue({
  data: { subscription: { unsubscribe: jest.fn() } },
  error: null
});

// Export the mock
export const supabase = mockSupabaseClient;

// Export mock data for use in tests
export const mockSupabaseData = mockData;

// Helper functions for tests
export const mockSupabaseHelpers = {
  // Mock successful auth response
  mockAuthSuccess: (user = mockData.user, session = mockData.session) => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user },
      error: null
    });
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session },
      error: null
    });
  },
  
  // Mock auth error
  mockAuthError: (error = 'Authentication failed') => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: error }
    });
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: error }
    });
  },
  
  // Mock database success
  mockDbSuccess: (data = [mockData.profile]) => {
    mockSupabaseClient.select.mockResolvedValue({
      data,
      error: null
    });
    mockSupabaseClient.insert.mockResolvedValue({
      data,
      error: null
    });
    mockSupabaseClient.update.mockResolvedValue({
      data,
      error: null
    });
    mockSupabaseClient.upsert.mockResolvedValue({
      data,
      error: null
    });
    mockSupabaseClient.delete.mockResolvedValue({
      data: null,
      error: null
    });
  },
  
  // Mock database error
  mockDbError: (error = 'Database error') => {
    mockSupabaseClient.select.mockResolvedValue({
      data: null,
      error: { message: error }
    });
    mockSupabaseClient.insert.mockResolvedValue({
      data: null,
      error: { message: error }
    });
    mockSupabaseClient.update.mockResolvedValue({
      data: null,
      error: { message: error }
    });
    mockSupabaseClient.upsert.mockResolvedValue({
      data: null,
      error: { message: error }
    });
    mockSupabaseClient.delete.mockResolvedValue({
      data: null,
      error: { message: error }
    });
  },
  
  // Reset all mocks
  resetMocks: () => {
    Object.keys(mockSupabaseClient).forEach(key => {
      if (typeof mockSupabaseClient[key] === 'function') {
        mockSupabaseClient[key].mockClear();
      } else if (typeof mockSupabaseClient[key] === 'object') {
        Object.keys(mockSupabaseClient[key]).forEach(subKey => {
          if (typeof mockSupabaseClient[key][subKey] === 'function') {
            mockSupabaseClient[key][subKey].mockClear();
          }
        });
      }
    });
  }
};

export default supabase;

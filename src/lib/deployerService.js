import express from 'express';
import cors from 'cors';
import { deploymentHandler } from './deploymentHandler.js';
import { createN8nClient } from './n8nClient.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0'
  });
});

// Test n8n connection
app.get('/test-n8n', async (req, res) => {
  try {
    const n8nClient = createN8nClient({
      baseUrl: process.env.N8N_BASE_URL,
      apiKey: process.env.N8N_API_KEY
    });
    
    const isConnected = await n8nClient.testConnection();
    
    res.json({
      success: isConnected,
      message: isConnected ? 'N8N connection successful' : 'N8N connection failed',
      n8nUrl: process.env.N8N_BASE_URL
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mount deployment routes
app.use('/api', deploymentHandler);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FloWorx-iq Deployer Service running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 N8N test: http://localhost:${PORT}/test-n8n`);
  console.log(`🚀 Deploy endpoint: http://localhost:${PORT}/api/deploy/:profileId`);
});

export default app;

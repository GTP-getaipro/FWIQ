import express from 'express';
import cors from 'cors';
import { createN8nClient } from './n8nClient.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0'
  });
});

// N8N Proxy Routes - All n8n API calls go through here
const n8nClient = createN8nClient({
  baseUrl: process.env.N8N_BASE_URL || 'https://n8n.srv995290.hstgr.cloud',
  apiKey: process.env.N8N_API_KEY
});

// Test n8n connection
app.get('/api/n8n/test', async (req, res) => {
  try {
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

// Get workflow details
app.get('/api/n8n/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const workflow = await n8nClient.getWorkflow(workflowId);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List workflows
app.get('/api/n8n/workflows', async (req, res) => {
  try {
    const options = {
      active: req.query.active === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    };
    const workflows = await n8nClient.listWorkflows(options);
    res.json(workflows);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Activate workflow
app.post('/api/n8n/workflows/:workflowId/activate', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const result = await n8nClient.activateWorkflow(workflowId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deactivate workflow
app.post('/api/n8n/workflows/:workflowId/deactivate', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const result = await n8nClient.deactivateWorkflow(workflowId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute workflow
app.post('/api/n8n/workflows/:workflowId/execute', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const inputData = req.body.data || {};
    const result = await n8nClient.executeWorkflow(workflowId, inputData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get workflow executions
app.get('/api/n8n/workflows/:workflowId/executions', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      status: req.query.status,
      from: req.query.from,
      to: req.query.to
    };
    const executions = await n8nClient.getWorkflowExecutions(workflowId, options);
    res.json(executions);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete workflow
app.delete('/api/n8n/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const result = await n8nClient.deleteWorkflow(workflowId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deploy workflow (main endpoint)
app.post('/api/n8n/workflows', async (req, res) => {
  try {
    const workflow = req.body;
    const result = await n8nClient.deployWorkflow(workflow, {
      activate: req.query.activate !== 'false'
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update workflow
app.put('/api/n8n/workflows/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const workflow = req.body;
    const result = await n8nClient.updateWorkflow(workflowId, workflow);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check for n8n
app.get('/api/n8n/health', async (req, res) => {
  try {
    const isConnected = await n8nClient.testConnection();
    res.json({
      status: isConnected ? 'healthy' : 'unhealthy',
      n8nUrl: process.env.N8N_BASE_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

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
  console.log(`🚀 FloWorx-iq N8N Proxy Service running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 N8N test: http://localhost:${PORT}/api/n8n/test`);
  console.log(`🤖 N8N health: http://localhost:${PORT}/api/n8n/health`);
  console.log(`📡 CORS enabled for: http://localhost:5173, http://localhost:3000`);
});

export default app;

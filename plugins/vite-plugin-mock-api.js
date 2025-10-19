// Mock API plugin for Vite development server
export default function mockApiPlugin() {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use('/api', (req, res, next) => {
        // Debug logging
        console.log(`🔍 Mock API Plugin: ${req.method} ${req.url}`);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        // Mock analytics endpoints
        if (req.url.startsWith('/api/analytics/')) {
          res.setHeader('Content-Type', 'application/json');
          
          if (req.method === 'POST') {
            // Mock successful response for analytics events
            res.statusCode = 200;
            res.end(JSON.stringify({ 
              success: true, 
              message: 'Event tracked successfully',
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          if (req.method === 'GET') {
            // Mock dashboard data
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              data: {
                pageViews: Math.floor(Math.random() * 1000),
                sessions: Math.floor(Math.random() * 100),
                users: Math.floor(Math.random() * 50),
                bounceRate: Math.random() * 0.5,
                avgSessionDuration: Math.floor(Math.random() * 300)
              }
            }));
            return;
          }
        }

        // Mock CSP reports endpoint
        if (req.url === '/api/csp-reports') {
          res.setHeader('Content-Type', 'application/json');
          
          if (req.method === 'POST') {
            // Mock successful response for CSP violation reports
            res.statusCode = 200;
            res.end(JSON.stringify({ 
              success: true, 
              message: 'CSP violation report received',
              timestamp: new Date().toISOString()
            }));
            return;
          }
        }

        // Mock health endpoint
        if (req.url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          
          if (req.method === 'GET') {
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              status: 'healthy',
              timestamp: new Date().toISOString(),
              version: '1.0.0'
            }));
            return;
          }
        }

        // Mock AI business profile analysis endpoint
        if (req.url === '/ai/analyze-business-profile') {
          console.log(`✅ Mock API: Handling AI business profile analysis request`);
          res.setHeader('Content-Type', 'application/json');
          
          if (req.method === 'POST') {
            console.log(`✅ Mock API: Returning mock AI analysis response`);
            // Mock successful AI analysis response
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              response: `{
                "businessName": { "value": "Sample Business", "confidence": 0.9 },
                "industry": { "value": "Home Services", "confidence": 0.8 },
                "serviceArea": { "value": "Local Area", "confidence": 0.7 },
                "contactInfo": {
                  "phone": { "value": "(555) 123-4567", "confidence": 0.8 },
                  "website": { "value": "www.samplebusiness.com", "confidence": 0.6 },
                  "email": { "value": "info@samplebusiness.com", "confidence": 0.9 }
                },
                "businessDetails": {
                  "timezone": { "value": "America/New_York", "confidence": 0.7 },
                  "currency": { "value": "USD", "confidence": 0.9 },
                  "hours": { "value": "Mon-Fri 9AM-5PM", "confidence": 0.6 }
                },
                "socialLinks": {
                  "facebook": { "value": "facebook.com/samplebusiness", "confidence": 0.5 },
                  "instagram": { "value": "instagram.com/samplebusiness", "confidence": 0.5 }
                }
              }`,
              model: 'gpt-4o-mini',
              timestamp: new Date().toISOString()
            }));
            return;
          }
        }

        // Handle other API routes
        res.statusCode = 404;
        res.end(JSON.stringify({ 
          error: 'API endpoint not found',
          path: req.url 
        }));
      });
    }
  };
}

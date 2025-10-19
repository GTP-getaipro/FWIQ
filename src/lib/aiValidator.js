/**
 * AI Integration Validator
 * Validates AI integration functionality, response quality, and cost monitoring
 */

export class AIValidator {
  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.models = {
      gpt35turbo: 'gpt-3.5-turbo',
      gpt4: 'gpt-4',
      gpt4turbo: 'gpt-4-turbo-preview',
      gpt4o: 'gpt-4o',
      gpt4omini: 'gpt-4o-mini'
    };
    
    this.costRates = {
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
    };
  }

  /**
   * Validate OpenAI API connectivity
   * @returns {Promise<Object>} Validation result
   */
  async validateOpenAIConnectivity() {
    const result = {
      isConnected: false,
      error: null,
      model: null,
      responseTime: 0,
      tokensUsed: 0,
      cost: 0
    };

    try {
      if (!this.openaiApiKey || this.openaiApiKey.includes('your-openai-api-key')) {
        result.error = 'OpenAI API key not configured';
        return result;
      }

      const startTime = Date.now();
      
      // Test with a simple completion
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.models.gpt4omini,
          messages: [
            { role: 'user', content: 'Hello, this is a connectivity test. Respond with "OK".' }
          ],
          max_tokens: 10,
          temperature: 0
        })
      });

      result.responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        result.error = `API Error: ${errorData.error?.message || response.statusText}`;
        return result;
      }

      const data = await response.json();
      result.isConnected = true;
      result.model = data.model;
      result.tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
      result.cost = this.calculateCost(data.model, data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);

      return result;

    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  /**
   * Test AI response generation
   * @param {Object} testData - Test data for response generation
   * @returns {Promise<Object>} Response generation result
   */
  async testResponseGeneration(testData = null) {
    const defaultTestData = {
      businessName: 'Test Business',
      businessType: 'Service Business',
      emailSubject: 'Service Inquiry',
      emailBody: 'Hello, I need help with my service. Can you please assist me?',
      tone: 'professional',
      context: {
        services: ['Service A', 'Service B'],
        managers: ['John Doe', 'Jane Smith']
      }
    };

    const test = testData || defaultTestData;
    const result = {
      success: false,
      response: null,
      quality: {
        length: 0,
        relevance: 0,
        tone: 0,
        completeness: 0,
        overall: 0
      },
      tokensUsed: 0,
      cost: 0,
      responseTime: 0,
      error: null
    };

    try {
      if (!this.openaiApiKey || this.openaiApiKey.includes('your-openai-api-key')) {
        result.error = 'OpenAI API key not configured';
        return result;
      }

      const startTime = Date.now();
      
      const prompt = this.createTestPrompt(test);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.models.gpt4omini,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      result.responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        result.error = `API Error: ${errorData.error?.message || response.statusText}`;
        return result;
      }

      const data = await response.json();
      result.response = data.choices[0].message.content;
      result.tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
      result.cost = this.calculateCost(data.model, data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);
      
      // Analyze response quality
      result.quality = this.analyzeResponseQuality(result.response, test);
      result.success = result.quality.overall >= 0.7; // 70% quality threshold

      return result;

    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  /**
   * Test AI email classification
   * @param {Object} emailData - Email data to classify
   * @returns {Promise<Object>} Classification result
   */
  async testEmailClassification(emailData = null) {
    const defaultEmailData = {
      subject: 'URGENT: Service is down',
      body: 'Our service is completely down and we need immediate assistance. This is urgent!',
      from: 'customer@example.com'
    };

    const email = emailData || defaultEmailData;
    const result = {
      success: false,
      classification: null,
      confidence: 0,
      categories: [],
      urgency: 'normal',
      tokensUsed: 0,
      cost: 0,
      responseTime: 0,
      error: null
    };

    try {
      if (!this.openaiApiKey || this.openaiApiKey.includes('your-openai-api-key')) {
        result.error = 'OpenAI API key not configured';
        return result;
      }

      const startTime = Date.now();
      
      const prompt = `Classify this email into categories and determine urgency:

Subject: ${email.subject}
From: ${email.from}
Body: ${email.body}

Categories: Sales, Support, Billing, Recruitment, Spam, General
Urgency: Low, Normal, High, Urgent

Respond with JSON format:
{
  "primary_category": "category",
  "urgency": "level",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.models.gpt4omini,
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.3
        })
      });

      result.responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        result.error = `API Error: ${errorData.error?.message || response.statusText}`;
        return result;
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;
      
      try {
        const classification = JSON.parse(responseText);
        result.classification = classification.primary_category;
        result.confidence = classification.confidence || 0.8;
        result.urgency = classification.urgency || 'normal';
        result.success = true;
      } catch (parseError) {
        // Fallback parsing if JSON is malformed
        result.classification = this.extractCategoryFromText(responseText);
        result.confidence = 0.7;
        result.success = true;
      }

      result.tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
      result.cost = this.calculateCost(data.model, data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);

      return result;

    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  /**
   * Test AI model performance across different models
   * @param {Array} models - Array of models to test
   * @returns {Promise<Object>} Performance comparison result
   */
  async testModelPerformance(models = null) {
    const testModels = models || [this.models.gpt4omini, this.models.gpt35turbo];
    const results = {
      models: {},
      bestModel: null,
      averageResponseTime: 0,
      totalCost: 0,
      totalTokens: 0
    };

    const testPrompt = 'Generate a professional email response to a customer inquiry about service availability.';

    for (const model of testModels) {
      try {
        const startTime = Date.now();
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'user', content: testPrompt }
            ],
            max_tokens: 200,
            temperature: 0.7
          })
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          const data = await response.json();
          const tokens = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
          const cost = this.calculateCost(model, data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);

          results.models[model] = {
            success: true,
            responseTime,
            tokensUsed: tokens,
            cost,
            response: data.choices[0].message.content
          };

          results.totalCost += cost;
          results.totalTokens += tokens;
        } else {
          results.models[model] = {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }

      } catch (error) {
        results.models[model] = {
          success: false,
          error: error.message
        };
      }
    }

    // Calculate averages and find best model
    const successfulModels = Object.values(results.models).filter(m => m.success);
    if (successfulModels.length > 0) {
      results.averageResponseTime = successfulModels.reduce((sum, m) => sum + m.responseTime, 0) / successfulModels.length;
      
      // Best model is the one with best cost/performance ratio
      results.bestModel = successfulModels.reduce((best, current) => {
        const bestRatio = best.cost / best.responseTime;
        const currentRatio = current.cost / current.responseTime;
        return currentRatio < bestRatio ? current : best;
      });
    }

    return results;
  }

  /**
   * Validate AI error handling and fallbacks
   * @returns {Promise<Object>} Error handling validation result
   */
  async validateErrorHandling() {
    const result = {
      apiKeyValidation: false,
      rateLimitHandling: false,
      invalidModelHandling: false,
      networkErrorHandling: false,
      fallbackMechanisms: false,
      overall: false
    };

    // Test 1: Invalid API key
    try {
      const invalidResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.models.gpt4omini,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });

      if (!invalidResponse.ok && invalidResponse.status === 401) {
        result.apiKeyValidation = true;
      }
    } catch (error) {
      // Expected for invalid key
      result.apiKeyValidation = true;
    }

    // Test 2: Invalid model
    try {
      const invalidModelResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'invalid-model',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });

      if (!invalidModelResponse.ok && invalidModelResponse.status === 400) {
        result.invalidModelHandling = true;
      }
    } catch (error) {
      result.invalidModelHandling = true;
    }

    // Test 3: Network error simulation (using invalid endpoint)
    try {
      await fetch('https://invalid-endpoint.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.models.gpt4omini,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });
    } catch (error) {
      result.networkErrorHandling = true;
    }

    // Test 4: Fallback mechanisms (rule-based classification)
    const fallbackClassification = this.testRuleBasedClassification();
    result.fallbackMechanisms = fallbackClassification.success;

    // Overall assessment
    const passedTests = Object.values(result).filter(r => r === true).length;
    result.overall = passedTests >= 4; // At least 4/6 tests must pass

    return result;
  }

  /**
   * Test rule-based classification fallback
   * @returns {Object} Fallback test result
   */
  testRuleBasedClassification() {
    const testEmails = [
      { subject: 'URGENT: Service down', body: 'Emergency help needed', expected: 'Support' },
      { subject: 'Quote request', body: 'I need pricing information', expected: 'Sales' },
      { subject: 'Billing question', body: 'About my invoice', expected: 'Billing' }
    ];

    let correctClassifications = 0;

    for (const email of testEmails) {
      const classification = this.classifyWithRules(email);
      if (classification.category === email.expected) {
        correctClassifications++;
      }
    }

    return {
      success: correctClassifications >= 2, // At least 2/3 correct
      accuracy: correctClassifications / testEmails.length,
      correctClassifications,
      totalTests: testEmails.length
    };
  }

  /**
   * Classify email using rule-based approach
   * @param {Object} emailData - Email data
   * @returns {Object} Classification result
   */
  classifyWithRules(emailData) {
    const text = `${emailData.subject} ${emailData.body}`.toLowerCase();
    
    if (text.includes('urgent') || text.includes('emergency') || text.includes('broken')) {
      return { category: 'Support', urgency: 'high', confidence: 0.9 };
    }
    
    if (text.includes('quote') || text.includes('price') || text.includes('cost')) {
      return { category: 'Sales', urgency: 'normal', confidence: 0.8 };
    }
    
    if (text.includes('bill') || text.includes('invoice') || text.includes('payment')) {
      return { category: 'Billing', urgency: 'normal', confidence: 0.8 };
    }
    
    return { category: 'General', urgency: 'normal', confidence: 0.6 };
  }

  // Helper methods
  createTestPrompt(testData) {
    return {
      system: `You are a professional customer service representative for ${testData.businessName}, a ${testData.businessType}. 
      
Your task is to generate helpful, professional email responses that:
- Address the customer's needs directly
- Maintain a ${testData.tone} tone
- Provide relevant information about available services
- Include appropriate escalation if needed

Available services: ${testData.context.services.join(', ')}
Available managers: ${testData.context.managers.join(', ')}`,
      
      user: `Customer Email:
Subject: ${testData.emailSubject}
Body: ${testData.emailBody}

Please generate a professional response.`
    };
  }

  analyzeResponseQuality(response, testData) {
    const quality = {
      length: 0,
      relevance: 0,
      tone: 0,
      completeness: 0,
      overall: 0
    };

    // Length analysis (ideal: 50-200 words)
    const wordCount = response.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 200) {
      quality.length = 1.0;
    } else if (wordCount >= 30 && wordCount <= 300) {
      quality.length = 0.7;
    } else {
      quality.length = 0.3;
    }

    // Relevance analysis (contains relevant keywords)
    const relevantKeywords = ['service', 'help', 'assist', 'available', 'contact'];
    const foundKeywords = relevantKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword)
    );
    quality.relevance = foundKeywords.length / relevantKeywords.length;

    // Tone analysis (professional language)
    const professionalWords = ['thank', 'please', 'appreciate', 'welcome', 'glad'];
    const unprofessionalWords = ['hey', 'yeah', 'sure', 'ok', 'cool'];
    
    const professionalCount = professionalWords.filter(word => 
      response.toLowerCase().includes(word)
    ).length;
    const unprofessionalCount = unprofessionalWords.filter(word => 
      response.toLowerCase().includes(word)
    ).length;
    
    quality.tone = Math.max(0, 1 - (unprofessionalCount * 0.3)) + (professionalCount * 0.1);

    // Completeness analysis (addresses the request)
    const requestKeywords = testData.emailBody.toLowerCase().split(/\s+/);
    const addressedKeywords = requestKeywords.filter(keyword => 
      response.toLowerCase().includes(keyword) && keyword.length > 3
    );
    quality.completeness = Math.min(1, addressedKeywords.length / 5);

    // Overall quality score
    quality.overall = (quality.length + quality.relevance + quality.tone + quality.completeness) / 4;

    return quality;
  }

  calculateCost(model, inputTokens, outputTokens) {
    const rates = this.costRates[model];
    if (!rates) return 0;
    
    return (inputTokens / 1000 * rates.input) + (outputTokens / 1000 * rates.output);
  }

  extractCategoryFromText(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('support')) return 'Support';
    if (lowerText.includes('sales')) return 'Sales';
    if (lowerText.includes('billing')) return 'Billing';
    if (lowerText.includes('recruitment')) return 'Recruitment';
    if (lowerText.includes('spam')) return 'Spam';
    return 'General';
  }

  /**
   * Run comprehensive AI validation
   * @returns {Promise<Object>} Complete validation result
   */
  async runComprehensiveValidation() {
    console.log('🤖 Starting comprehensive AI validation...');

    const results = {
      connectivity: null,
      responseGeneration: null,
      classification: null,
      modelPerformance: null,
      errorHandling: null,
      overall: false,
      recommendations: []
    };

    try {
      // Test 1: Connectivity
      console.log('1️⃣ Testing OpenAI connectivity...');
      results.connectivity = await this.validateOpenAIConnectivity();

      // Test 2: Response Generation
      console.log('2️⃣ Testing response generation...');
      results.responseGeneration = await this.testResponseGeneration();

      // Test 3: Email Classification
      console.log('3️⃣ Testing email classification...');
      results.classification = await this.testEmailClassification();

      // Test 4: Model Performance
      console.log('4️⃣ Testing model performance...');
      results.modelPerformance = await this.testModelPerformance();

      // Test 5: Error Handling
      console.log('5️⃣ Testing error handling...');
      results.errorHandling = await this.validateErrorHandling();

      // Generate recommendations
      results.recommendations = this.generateRecommendations(results);

      // Overall assessment
      const passedTests = [
        results.connectivity?.isConnected,
        results.responseGeneration?.success,
        results.classification?.success,
        results.modelPerformance?.bestModel,
        results.errorHandling?.overall
      ].filter(Boolean).length;

      results.overall = passedTests >= 4; // At least 4/5 tests must pass

      console.log('✅ AI validation completed');
      return results;

    } catch (error) {
      console.error('❌ AI validation failed:', error);
      results.error = error.message;
      return results;
    }
  }

  generateRecommendations(results) {
    const recommendations = [];

    if (!results.connectivity?.isConnected) {
      recommendations.push('Fix OpenAI API connectivity - check API key and network');
    }

    if (!results.responseGeneration?.success) {
      recommendations.push('Improve response generation quality - check prompts and model settings');
    }

    if (!results.classification?.success) {
      recommendations.push('Enhance email classification accuracy - refine classification prompts');
    }

    if (results.modelPerformance?.totalCost > 0.01) {
      recommendations.push('Consider using cheaper models for non-critical tasks to reduce costs');
    }

    if (!results.errorHandling?.overall) {
      recommendations.push('Strengthen error handling and fallback mechanisms');
    }

    if (results.connectivity?.responseTime > 5000) {
      recommendations.push('High response times detected - consider using faster models');
    }

    return recommendations;
  }
}

// Export singleton instance
export const aiValidator = new AIValidator();

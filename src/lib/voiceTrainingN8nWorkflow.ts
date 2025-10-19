// Voice Training n8n Workflow Integration
// Complete n8n workflow for automatic voice training from sent emails

export const voiceTrainingN8nWorkflow = {
  "name": "Voice Training - Business Onboarding",
  "active": true,
  "nodes": [
    {
      "id": "voice-training-trigger",
      "name": "Voice Training Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "voice-training",
        "options": {}
      },
      "webhookId": "voice-training-webhook"
    },
    {
      "id": "detect-email-provider",
      "name": "Detect Email Provider",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300],
      "parameters": {
        "jsCode": `
          // Detect email provider from business profile
          const businessProfile = $json.businessProfile;
          const emailProvider = businessProfile.emailProvider || 'gmail';
          
          return {
            json: {
              emailProvider: emailProvider,
              businessId: businessProfile.businessId,
              businessDomain: businessProfile.emailDomain,
              managers: businessProfile.team?.managers || [],
              excludedDomains: [
                businessProfile.emailDomain,
                'company.com',
                'internal.com'
              ]
            }
          };
        `
      }
    },
    {
      "id": "gmail-sent-fetcher",
      "name": "Gmail Sent Fetcher",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [680, 200],
      "parameters": {
        "operation": "getAll",
        "returnAll": false,
        "limit": 30,
        "filters": {
          "q": "in:sent newer_than:90d"
        },
        "options": {
          "downloadAttachments": false,
          "format": "full"
        }
      },
      "credentials": {
        "gmailOAuth2Api": {
          "id": "gmail-oauth-credential",
          "name": "Gmail OAuth2 API"
        }
      },
      "continueOnFail": true
    },
    {
      "id": "outlook-sent-fetcher",
      "name": "Outlook Sent Fetcher",
      "type": "n8n-nodes-base.microsoftOutlook",
      "typeVersion": 2,
      "position": [680, 400],
      "parameters": {
        "operation": "getAll",
        "returnAll": false,
        "limit": 30,
        "filters": {
          "folderId": "sentitems",
          "dateTimeFilter": {
            "dateTime": "2024-07-01T00:00:00Z",
            "type": "after"
          }
        }
      },
      "credentials": {
        "microsoftOutlookOAuth2Api": {
          "id": "outlook-oauth-credential",
          "name": "Microsoft Outlook OAuth2 API"
        }
      },
      "continueOnFail": true
    },
    {
      "id": "email-provider-router",
      "name": "Email Provider Router",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [460, 300],
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.emailProvider }}",
              "operation": "equal",
              "value2": "gmail"
            }
          ]
        }
      }
    },
    {
      "id": "filter-customer-emails",
      "name": "Filter Customer Emails",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 300],
      "parameters": {
        "jsCode": `
          // Filter emails to customers only (exclude internal)
          const items = $input.all();
          const businessDomain = $('detect-email-provider').first().json.businessDomain;
          const excludedDomains = $('detect-email-provider').first().json.excludedDomains;
          
          const customerEmails = items.filter(item => {
            const email = item.json;
            const recipient = email.to || email.recipient || '';
            const sender = email.from || email.sender || '';
            
            // Must be from business domain
            if (!sender.includes('@' + businessDomain)) {
              return false;
            }
            
            // Must be to external customer (not internal)
            const isInternal = excludedDomains.some(domain => 
              recipient.includes('@' + domain)
            );
            
            return !isInternal && recipient.includes('@');
          });
          
          return customerEmails.map(item => ({
            json: {
              id: item.json.id,
              subject: item.json.subject,
              body: item.json.body || item.json.bodyPreview || '',
              sender: item.json.from || item.json.sender,
              recipient: item.json.to || item.json.recipient,
              date: item.json.date || item.json.receivedDateTime,
              threadId: item.json.threadId || item.json.conversationId,
              labels: item.json.labels || [],
              provider: $('detect-email-provider').first().json.emailProvider
            }
          }));
        `
      }
    },
    {
      "id": "email-content-cleaner",
      "name": "Email Content Cleaner",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 300],
      "parameters": {
        "jsCode": `
          // Clean email body by removing signatures, quotes, and HTML
          const items = $input.all();
          
          return items.map(item => {
            let body = item.json.body || '';
            
            // Remove HTML tags
            body = body.replace(/<[^>]*>/g, ' ');
            
            // Remove common signature patterns
            body = body.replace(/\\n--\\s*\\n.*$/s, '');
            body = body.replace(/\\nBest regards,.*$/s, '');
            body = body.replace(/\\nThanks,.*$/s, '');
            body = body.replace(/\\nSincerely,.*$/s, '');
            body = body.replace(/\\nRegards,.*$/s, '');
            body = body.replace(/\\nThe .* Team.*$/s, '');
            
            // Remove quoted text (lines starting with >)
            body = body.replace(/^>.*$/gm, '');
            
            // Remove forwarded message headers
            body = body.replace(/^From:.*$/gm, '');
            body = body.replace(/^Sent:.*$/gm, '');
            body = body.replace(/^To:.*$/gm, '');
            body = body.replace(/^Subject:.*$/gm, '');
            
            // Clean up whitespace
            body = body.replace(/\\s+/g, ' ');
            body = body.replace(/\\n{3,}/g, '\\n\\n');
            body = body.trim();
            
            // Extract intent based on subject and content
            let intent = 'general';
            const subject = (item.json.subject || '').toLowerCase();
            const bodyLower = body.toLowerCase();
            
            if (subject.includes('quote') || subject.includes('estimate') || bodyLower.includes('quote')) {
              intent = 'sales_response';
            } else if (subject.includes('confirm') || subject.includes('scheduled') || bodyLower.includes('appointment')) {
              intent = 'confirmation';
            } else if (subject.includes('sorry') || bodyLower.includes('apologize') || bodyLower.includes('sorry')) {
              intent = 'apology';
            } else if (subject.includes('follow') || bodyLower.includes('follow-up')) {
              intent = 'follow_up';
            } else if (bodyLower.includes('help') || bodyLower.includes('support')) {
              intent = 'support_response';
            }
            
            return {
              json: {
                ...item.json,
                cleanedBody: body,
                intent: intent,
                wordCount: body.split(' ').length,
                hasGreeting: /^(hi|hello|dear|good morning|good afternoon)/i.test(body),
                hasClosing: /(thanks|thank you|best|regards|sincerely)/i.test(body)
              }
            };
          });
        `
      }
    },
    {
      "id": "sample-representative-emails",
      "name": "Sample Representative Emails",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1340, 300],
      "parameters": {
        "jsCode": `
          // Sample representative emails for tone analysis
          const items = $input.all();
          
          // Group by intent
          const intentGroups = {};
          items.forEach(item => {
            const intent = item.json.intent;
            if (!intentGroups[intent]) {
              intentGroups[intent] = [];
            }
            intentGroups[intent].push(item);
          });
          
          // Sample up to 3 emails per intent, prioritizing recent and longer emails
          const sampledEmails = [];
          Object.entries(intentGroups).forEach(([intent, emails]) => {
            // Sort by date (newest first) and word count (longer first)
            const sorted = emails.sort((a, b) => {
              const dateA = new Date(a.json.date);
              const dateB = new Date(b.json.date);
              if (dateA.getTime() !== dateB.getTime()) {
                return dateB.getTime() - dateA.getTime();
              }
              return b.json.wordCount - a.json.wordCount;
            });
            
            // Take up to 3 emails per intent
            sampledEmails.push(...sorted.slice(0, 3));
          });
          
          // Limit total sample size to 15 emails
          const finalSample = sampledEmails.slice(0, 15);
          
          return finalSample.map(item => ({
            json: {
              ...item.json,
              sampleReason: \`Intent: \${item.json.intent}, Word Count: \${item.json.wordCount}\`
            }
          }));
        `
      }
    },
    {
      "id": "ai-tone-analyzer",
      "name": "AI Tone Analyzer",
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1,
      "position": [1560, 300],
      "parameters": {
        "model": "gpt-4o-mini",
        "options": {
          "temperature": 0.3,
          "maxTokens": 2000
        },
        "messages": {
          "values": [
            {
              "role": "system",
              "content": `
You are an expert linguistic tone analyzer. Analyze the provided business emails and return a JSON summary of the sender's writing style, tone, and phrasing patterns.

Focus on:
- Greeting patterns (Hi [Name], Hello, Dear, etc.)
- Closing patterns (Thanks, Best regards, etc.)
- Average email length (short/medium/long)
- Formality level (casual/friendly-professional/formal)
- Common vocabulary and phrases
- Empathy level (0-1 scale)
- Directness level (0-1 scale)
- Apology style
- Confirmation behavior
- Signature consistency

Return ONLY valid JSON in this exact format:
{
  "toneProfile": {
    "formality": "casual|friendly-professional|formal",
    "averageLength": "short|medium|long",
    "greetingStyle": "common greeting pattern",
    "closingStyle": "common closing pattern",
    "signatureConsistency": true|false,
    "vocabulary": ["phrase1", "phrase2", "phrase3"],
    "empathyLevel": 0.0-1.0,
    "directness": 0.0-1.0,
    "clarityStyle": "description of clarity approach"
  },
  "responsePatterns": {
    "apology": "pattern description",
    "confirmation": "pattern description",
    "sales": "pattern description",
    "support": "pattern description"
  },
  "examplePhrases": ["phrase1", "phrase2", "phrase3"],
  "voiceConfidence": 0.0-1.0
}
              `
            },
            {
              "role": "user",
              "content": "Analyze the tone and style of these business emails:\n\n{{ $json.cleanedBody }}"
            }
          ]
        }
      },
      "credentials": {
        "openAi": {
          "id": "openai-api-credential",
          "name": "OpenAI API"
        }
      }
    },
    {
      "id": "parse-tone-profile",
      "name": "Parse Tone Profile",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1780, 300],
      "parameters": {
        "jsCode": `
          // Parse AI response and validate tone profile
          const aiResponse = $json.choices[0].message.content;
          
          try {
            // Extract JSON from AI response
            const jsonMatch = aiResponse.match(/\\{[\\s\\S]*\\}/);
            if (!jsonMatch) {
              throw new Error('No JSON found in AI response');
            }
            
            const toneProfile = JSON.parse(jsonMatch[0]);
            
            // Validate required fields
            const requiredFields = ['toneProfile', 'examplePhrases', 'voiceConfidence'];
            for (const field of requiredFields) {
              if (!toneProfile[field]) {
                throw new Error(\`Missing required field: \${field}\`);
              }
            }
            
            // Validate tone profile structure
            const toneProfileFields = ['formality', 'averageLength', 'greetingStyle', 'closingStyle'];
            for (const field of toneProfileFields) {
              if (!toneProfile.toneProfile[field]) {
                throw new Error(\`Missing tone profile field: \${field}\`);
              }
            }
            
            // Add metadata
            toneProfile.meta = {
              analyzedAt: new Date().toISOString(),
              sampleSize: $('sample-representative-emails').all().length,
              businessId: $('detect-email-provider').first().json.businessId,
              emailProvider: $('detect-email-provider').first().json.emailProvider
            };
            
            return {
              json: {
                toneProfile: toneProfile,
                valid: true,
                confidence: toneProfile.voiceConfidence
              }
            };
            
          } catch (error) {
            console.error('Failed to parse tone profile:', error);
            
            // Fallback tone profile
            const fallbackProfile = {
              toneProfile: {
                formality: "friendly-professional",
                averageLength: "medium",
                greetingStyle: "Hi [FirstName],",
                closingStyle: "Thanks,\nThe Team",
                signatureConsistency: true,
                vocabulary: ["thank you", "appreciate", "help"],
                empathyLevel: 0.8,
                directness: 0.7,
                clarityStyle: "clear and helpful"
              },
              responsePatterns: {
                apology: "empathetic + explanation + solution",
                confirmation: "clear + timeline + friendly close",
                sales: "helpful + informative + clear next steps",
                support: "understanding + solution + follow-up"
              },
              examplePhrases: [
                "Thank you for reaching out",
                "We appreciate your business",
                "Let us know if you need anything else"
              ],
              voiceConfidence: 0.5
            };
            
            return {
              json: {
                toneProfile: fallbackProfile,
                valid: false,
                error: error.message,
                confidence: 0.5
              }
            };
          }
        `
      }
    },
    {
      "id": "merge-business-context",
      "name": "Merge Business Context",
      "type": "n8n-nodes-base.merge",
      "typeVersion": 2,
      "position": [2000, 300],
      "parameters": {
        "mode": "combine",
        "combineBy": "combineAll",
        "options": {}
      }
    },
    {
      "id": "store-voice-profile",
      "name": "Store Voice Profile",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2220, 300],
      "parameters": {
        "jsCode": `
          // Store voice profile in business behavior JSON
          const toneProfile = $json.toneProfile;
          const businessId = toneProfile.meta.businessId;
          
          // Load existing behavior JSON or create new one
          const behaviorPath = \`jsons/behavior/\${businessId}_behavior.json\`;
          let behaviorJson = {
            meta: {
              schemaVersion: "v2.0",
              businessId: businessId,
              generatedAt: new Date().toISOString(),
              source: "voice-training-workflow"
            }
          };
          
          try {
            // Try to load existing behavior JSON
            const existingData = $fs.readFileSync(behaviorPath, 'utf8');
            behaviorJson = JSON.parse(existingData);
          } catch (error) {
            console.log('Creating new behavior JSON for business:', businessId);
          }
          
          // Add voice profile to behavior JSON
          behaviorJson.voiceProfile = toneProfile.toneProfile;
          behaviorJson.responsePatterns = toneProfile.responsePatterns;
          behaviorJson.examplePhrases = toneProfile.examplePhrases;
          behaviorJson.meta = {
            ...behaviorJson.meta,
            voiceTrainedAt: new Date().toISOString(),
            voiceConfidence: toneProfile.voiceConfidence,
            voiceSampleSize: toneProfile.meta.sampleSize,
            voiceEmailProvider: toneProfile.meta.emailProvider
          };
          
          // Save updated behavior JSON
          $fs.writeFileSync(behaviorPath, JSON.stringify(behaviorJson, null, 2));
          
          console.log(\`Voice profile saved for business: \${businessId}\`);
          console.log(\`Confidence: \${toneProfile.voiceConfidence}\`);
          console.log(\`Sample size: \${toneProfile.meta.sampleSize}\`);
          
          return {
            json: {
              businessId: businessId,
              voiceProfile: toneProfile.toneProfile,
              confidence: toneProfile.voiceConfidence,
              sampleSize: toneProfile.meta.sampleSize,
              saved: true,
              filePath: behaviorPath,
              valid: toneProfile.valid
            }
          };
        `
      }
    },
    {
      "id": "generate-ai-prompt-template",
      "name": "Generate AI Prompt Template",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [2440, 300],
      "parameters": {
        "jsCode": `
          // Generate AI system prompt template with voice profile
          const voiceProfile = $json.voiceProfile;
          const businessId = $json.businessId;
          const confidence = $json.confidence;
          
          const aiSystemPrompt = \`
You are an AI assistant for {{businessName}}. Your responses should match the company's authentic communication style.

VOICE PROFILE (Confidence: \${confidence}):
- Formality Level: \${voiceProfile.formality}
- Average Length: \${voiceProfile.averageLength}
- Greeting Style: \${voiceProfile.greetingStyle}
- Closing Style: \${voiceProfile.closingStyle}
- Signature Consistency: \${voiceProfile.signatureConsistency}
- Empathy Level: \${voiceProfile.empathyLevel}/1.0
- Directness Level: \${voiceProfile.directness}/1.0
- Clarity Style: \${voiceProfile.clarityStyle}

COMMON VOCABULARY:
\${voiceProfile.vocabulary.map(phrase => \`- "\${phrase}"\`).join('\\n')}

RESPONSE PATTERNS:
\${Object.entries(voiceProfile.responsePatterns || {}).map(([intent, pattern]) => 
  \`- \${intent}: \${pattern}\`
).join('\\n')}

EXAMPLE PHRASES TO USE:
\${voiceProfile.examplePhrases.map(phrase => \`- "\${phrase}"\`).join('\\n')}

Write responses that sound authentic to {{businessName}}'s voice. Use their common phrases and maintain their signature style. Be helpful, professional, and match their tone exactly.
          \`.trim();
          
          return {
            json: {
              businessId: businessId,
              aiSystemPrompt: aiSystemPrompt,
              voiceProfile: voiceProfile,
              confidence: confidence,
              promptGenerated: true
            }
          };
        `
      }
    },
    {
      "id": "voice-training-complete",
      "name": "Voice Training Complete",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [2660, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify($json) }}",
        "options": {}
      }
    }
  ],
  "connections": {
    "voice-training-trigger": {
      "main": [
        [
          {
            "node": "detect-email-provider",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "detect-email-provider": {
      "main": [
        [
          {
            "node": "email-provider-router",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "email-provider-router": {
      "main": [
        [
          {
            "node": "gmail-sent-fetcher",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "outlook-sent-fetcher",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "gmail-sent-fetcher": {
      "main": [
        [
          {
            "node": "filter-customer-emails",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "outlook-sent-fetcher": {
      "main": [
        [
          {
            "node": "filter-customer-emails",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "filter-customer-emails": {
      "main": [
        [
          {
            "node": "email-content-cleaner",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "email-content-cleaner": {
      "main": [
        [
          {
            "node": "sample-representative-emails",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "sample-representative-emails": {
      "main": [
        [
          {
            "node": "ai-tone-analyzer",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "ai-tone-analyzer": {
      "main": [
        [
          {
            "node": "parse-tone-profile",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "parse-tone-profile": {
      "main": [
        [
          {
            "node": "merge-business-context",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "merge-business-context": {
      "main": [
        [
          {
            "node": "store-voice-profile",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "store-voice-profile": {
      "main": [
        [
          {
            "node": "generate-ai-prompt-template",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "generate-ai-prompt-template": {
      "main": [
        [
          {
            "node": "voice-training-complete",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": [
    {
      "id": "voice-training",
      "name": "Voice Training"
    },
    {
      "id": "onboarding",
      "name": "Onboarding"
    },
    {
      "id": "ai-analysis",
      "name": "AI Analysis"
    }
  ],
  "triggerCount": 1,
  "updatedAt": "2025-01-05T00:00:00.000Z",
  "versionId": "1"
};

export default voiceTrainingN8nWorkflow;

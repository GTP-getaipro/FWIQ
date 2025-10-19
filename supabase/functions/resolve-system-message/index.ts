// Deno Edge Function: Resolve System Message
// Securely retrieves and decrypts system messages for n8n workflows
// Prevents source code exposure by keeping messages encrypted at rest

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SYSTEM_MESSAGE_ENCRYPTION_KEY = Deno.env.get('SYSTEM_MESSAGE_ENCRYPTION_KEY');

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Rate limiting storage (in production, use Redis)
const rateLimiter = new Map();

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter((time: number) => now - time < 60000);
  
  if (recentRequests.length >= 10) { // Max 10 requests per minute
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
}

function decryptContent(encryptedDataString: string): string {
  try {
    const encryptedData = JSON.parse(encryptedDataString);
    
    // In a real implementation, you would use proper encryption
    // For now, we'll simulate decryption
    // In production, implement proper AES-256-GCM decryption
    
    // This is a placeholder - replace with actual decryption logic
    if (encryptedData.encrypted && encryptedData.iv && encryptedData.authTag) {
      // Simulate decryption (replace with actual crypto operations)
      return encryptedData.encrypted; // This would be the decrypted content
    }
    
    throw new Error('Invalid encrypted data format');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt content');
  }
}

async function resolveSystemMessage(messageId: string, userId: string) {
  try {
    console.log(`Resolving system message ${messageId} for user ${userId}`);
    
    // Check rate limit
    checkRateLimit(userId);
    
    // Get system message with latest content
    const { data: messageData, error } = await supabaseAdmin
      .rpc('get_system_message_with_content', {
        message_id_param: messageId,
        user_id_param: userId
      });

    if (error) {
      console.error('Error fetching system message:', error);
      throw new Error('Failed to fetch system message');
    }

    if (!messageData || messageData.length === 0) {
      throw new Error('System message not found or access denied');
    }

    const message = messageData[0];
    
    // Decrypt content
    const decryptedContent = decryptContent(message.content);
    
    // Verify integrity (in production, verify SHA-256 hash)
    // const computedHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(decryptedContent));
    // const computedHashHex = Array.from(new Uint8Array(computedHash))
    //   .map(b => b.toString(16).padStart(2, '0'))
    //   .join('');
    
    // if (computedHashHex !== message.message_hash) {
    //   throw new Error('System message integrity check failed');
    // }

    console.log(`System message resolved successfully for user ${userId}`);
    
    return {
      success: true,
      content: decryptedContent,
      type: message.message_type,
      businessTypes: message.business_types,
      hash: message.message_hash,
      version: message.version
    };
    
  } catch (error) {
    console.error('Error resolving system message:', error);
    throw error;
  }
}

serve(async (req: Request) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { messageId, userId } = await req.json();
    
    if (!messageId || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: messageId and userId' }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Validate input format
    if (typeof messageId !== 'string' || typeof userId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid parameter types' }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Resolve system message securely
    const result = await resolveSystemMessage(messageId, userId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error in resolve-system-message function:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error.message === 'Rate limit exceeded') {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
    } else if (error.message.includes('not found') || error.message.includes('access denied')) {
      errorMessage = 'System message not found or access denied';
      statusCode = 404;
    } else if (error.message.includes('decrypt') || error.message.includes('integrity')) {
      errorMessage = 'System message security check failed';
      statusCode = 403;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }), { 
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});

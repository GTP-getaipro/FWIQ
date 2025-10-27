#!/usr/bin/env node

/**
 * SendGrid Email Configuration Test Script
 * 
 * Tests SendGrid connection and sends a test email
 * 
 * Usage:
 *   node scripts/test-sendgrid.js your-email@example.com
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.production') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSendGridConfiguration() {
  log('\n🔍 Testing SendGrid Configuration...', 'cyan');
  log('═'.repeat(60), 'blue');

  // Check environment variables
  log('\n📋 Checking Environment Variables:', 'yellow');
  
  const requiredVars = {
    'SMTP_HOST': process.env.SMTP_HOST,
    'SMTP_PORT': process.env.SMTP_PORT,
    'SMTP_USER': process.env.SMTP_USER,
    'SMTP_PASS': process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-8) : undefined,
    'SENDGRID_FROM_EMAIL': process.env.SENDGRID_FROM_EMAIL,
    'SENDGRID_FROM_NAME': process.env.SENDGRID_FROM_NAME,
  };

  let allVarsPresent = true;
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value || value === 'undefined') {
      log(`   ❌ ${key}: Missing`, 'red');
      allVarsPresent = false;
    } else {
      log(`   ✅ ${key}: ${value}`, 'green');
    }
  }

  if (!allVarsPresent) {
    log('\n❌ Some environment variables are missing. Please configure them.', 'red');
    log('   See SENDGRID_EMAIL_SETUP.md for configuration instructions.', 'yellow');
    process.exit(1);
  }

  // Get recipient email from command line or use default
  const recipientEmail = process.argv[2] || process.env.SENDGRID_FROM_EMAIL;
  
  if (!recipientEmail) {
    log('\n❌ No recipient email provided.', 'red');
    log('   Usage: node scripts/test-sendgrid.js your-email@example.com', 'yellow');
    process.exit(1);
  }

  log(`\n📧 Test email will be sent to: ${recipientEmail}`, 'cyan');

  // Create nodemailer transporter
  log('\n🔌 Creating SMTP connection...', 'yellow');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: true, // Enable debug output
  });

  // Verify connection
  try {
    log('   Testing SMTP connection...', 'yellow');
    await transporter.verify();
    log('   ✅ SMTP connection successful!', 'green');
  } catch (error) {
    log('   ❌ SMTP connection failed:', 'red');
    log(`   Error: ${error.message}`, 'red');
    process.exit(1);
  }

  // Send test email
  log('\n📤 Sending test email...', 'yellow');
  
  const mailOptions = {
    from: {
      name: process.env.SENDGRID_FROM_NAME,
      address: process.env.SENDGRID_FROM_EMAIL,
    },
    to: recipientEmail,
    subject: '✅ SendGrid Test Email - FloWorx',
    text: `This is a test email from FloWorx to verify SendGrid configuration.

If you received this email, your SendGrid SMTP configuration is working correctly!

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- From Email: ${process.env.SENDGRID_FROM_EMAIL}
- From Name: ${process.env.SENDGRID_FROM_NAME}

Time: ${new Date().toISOString()}

This is an automated test email. Please do not reply.`,
    html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 8px 8px;
        }
        .success {
            background: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .details {
            background: #f3f4f6;
            padding: 16px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 13px;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ SendGrid Test Successful!</h1>
    </div>
    <div class="content">
        <div class="success">
            <strong>🎉 Congratulations!</strong> Your SendGrid SMTP configuration is working correctly.
        </div>
        
        <p>This is a test email from <strong>FloWorx</strong> to verify your SendGrid email configuration.</p>
        
        <h3>Configuration Details:</h3>
        <div class="details">
            SMTP Host: ${process.env.SMTP_HOST}<br>
            SMTP Port: ${process.env.SMTP_PORT}<br>
            From Email: ${process.env.SENDGRID_FROM_EMAIL}<br>
            From Name: ${process.env.SENDGRID_FROM_NAME}<br>
            Test Time: ${new Date().toISOString()}
        </div>
        
        <h3>✅ What's Working:</h3>
        <ul>
            <li>SMTP connection established</li>
            <li>Authentication successful</li>
            <li>Email delivery working</li>
            <li>Sender identity configured</li>
        </ul>
        
        <h3>🚀 Next Steps:</h3>
        <ul>
            <li>Configure Supabase to use SendGrid SMTP</li>
            <li>Update email templates in Supabase</li>
            <li>Test authentication emails (signup, password reset)</li>
            <li>Verify domain in SendGrid for better deliverability</li>
        </ul>
        
        <div class="footer">
            <p>This is an automated test email from FloWorx.<br>
            Please do not reply to this message.</p>
            <p>© 2024 FloWorx. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    log('   ✅ Test email sent successfully!', 'green');
    log(`   Message ID: ${info.messageId}`, 'cyan');
    log(`   Response: ${info.response}`, 'cyan');
    
    log('\n═'.repeat(60), 'blue');
    log('✅ SendGrid Configuration Test PASSED!', 'green');
    log('\n📋 Next Steps:', 'yellow');
    log('   1. Check your email inbox for the test email', 'cyan');
    log('   2. Configure Supabase to use these SMTP settings', 'cyan');
    log('   3. Update email templates in Supabase dashboard', 'cyan');
    log('   4. Test authentication flows (signup, password reset)', 'cyan');
    log('\n📖 See SENDGRID_EMAIL_SETUP.md for detailed instructions', 'yellow');
    log('═'.repeat(60), 'blue');
    
  } catch (error) {
    log('   ❌ Failed to send test email:', 'red');
    log(`   Error: ${error.message}`, 'red');
    
    if (error.code === 'EAUTH') {
      log('\n💡 Troubleshooting Tips:', 'yellow');
      log('   - Verify your SendGrid API key is correct', 'cyan');
      log('   - Make sure SMTP_USER is exactly "apikey"', 'cyan');
      log('   - Check that your API key has "Mail Send" permissions', 'cyan');
    }
    
    process.exit(1);
  }
}

// Run the test
testSendGridConfiguration().catch((error) => {
  log('\n❌ Unexpected error:', 'red');
  log(error.stack, 'red');
  process.exit(1);
});


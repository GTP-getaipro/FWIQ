# Environment Setup Guide

## Quick Start

### For Local Development

1. **Copy the example file**
   ```bash
   cp .env.example .env.development
   ```

2. **Get credentials from the team**
   - Supabase URL and keys
   - Google OAuth credentials
   - Microsoft OAuth credentials
   - OpenAI API key
   - Stripe test keys

3. **Update `.env.development` with your credentials**

4. **Start the development server**
   ```bash
   npm run dev
   ```

### For Production Deployment

1. **Copy the example file**
   ```bash
   cp .env.example .env.production
   ```

2. **Update ALL values for production**
   - Change all `localhost` to `https://app.floworx-iq.com`
   - Use LIVE Stripe keys (not test keys)
   - Set `NODE_ENV=production`
   - Set `ENFORCE_SUBSCRIPTIONS=true`
   - Set `LOG_LEVEL=info`

3. **Deploy with production config**
   ```bash
   npm run start:prod
   ```

## Available Scripts

```bash
npm run dev          # Development with nodemon (auto-restart)
npm run start:dev    # Development without nodemon
npm run start:prod   # Production mode
npm start            # Uses default .env (not recommended)
```

## Environment Files

| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `.env.example` | Template with placeholders | ✅ YES |
| `.env.development` | Local development config | ❌ NO |
| `.env.production` | Production deployment config | ❌ NO |
| `.env` | Legacy (not used) | ❌ NO |

## Key Differences

### Development (.env.development)
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:5173`
- `LOG_LEVEL=debug` (verbose)
- `ENFORCE_SUBSCRIPTIONS=false`
- Stripe test keys (`sk_test_...`)

### Production (.env.production)
- `NODE_ENV=production`
- `FRONTEND_URL=https://app.floworx-iq.com`
- `LOG_LEVEL=info` (concise)
- `ENFORCE_SUBSCRIPTIONS=true`
- Stripe live keys (`sk_live_...`)

## Security Reminders

⚠️ **NEVER commit `.env.development` or `.env.production` to git!**

⚠️ **NEVER share .env files via email or Slack!**

⚠️ **NEVER use production secrets in development!**

✅ **DO use Coolify's environment variable management for deployment**

✅ **DO rotate secrets regularly**

✅ **DO use different secrets for dev and prod**

## Troubleshooting

### Server won't start
- Check that `.env.development` exists
- Verify all required variables are set
- Check for syntax errors in .env file

### OAuth not working
- Verify redirect URIs match your environment
- Development: `http://localhost:5173/oauth-callback-n8n`
- Production: `https://app.floworx-iq.com/oauth-callback-n8n`

### CORS errors
- Check `FRONTEND_URL` matches your frontend
- Development: `http://localhost:5173`
- Production: `https://app.floworx-iq.com`

## Need Help?

Contact the team lead or check the main documentation in `ENV_CONFIGURATION_FIXED.md`


# Deploy Supabase Edge Functions

## Prerequisites
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Login to Supabase CLI: `supabase login`
3. Link your project: `supabase link --project-ref oinxzvqszingwstrbdro`

## Required Secrets

Configure these secrets in Supabase Dashboard (Settings > Edge Functions > Secrets):

### Core N8N Configuration
- `N8N_BASE_URL` = `https://n8n.srv995290.hstgr.cloud`
- `N8N_API_KEY` = `YOUR_N8N_API_KEY_HERE`

### Supabase Configuration
- `SUPABASE_URL` = `https://oinxzvqszingwstrbdro.supabase.co`
- `SERVICE_ROLE_KEY` = `YOUR_SERVICE_ROLE_KEY_HERE`
- `ANON_KEY` = `YOUR_ANON_KEY_HERE`

**Note**: Use `SERVICE_ROLE_KEY` and `ANON_KEY` (without `SUPABASE_` prefix) to avoid conflicts with Supabase's reserved environment variable prefixes.

### OAuth Credentials
- `GMAIL_CLIENT_ID` = `YOUR_GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET` = `YOUR_GMAIL_CLIENT_SECRET`

### OpenAI Keys (for rotation)
- `OPENAI_KEY_1` = `YOUR_OPENAI_KEY_1`
- `OPENAI_KEY_2` = `YOUR_OPENAI_KEY_2` (optional)
- `OPENAI_KEY_3` = `YOUR_OPENAI_KEY_3` (optional)
- `OPENAI_KEY_4` = `YOUR_OPENAI_KEY_4` (optional)
- `OPENAI_KEY_5` = `YOUR_OPENAI_KEY_5` (optional)

## Deployment Commands

### Option 1: Deploy All Functions
```bash
cd supabase
supabase functions deploy
```

### Option 2: Deploy Specific Functions
```bash
# Deploy n8n-proxy (for API proxying)
supabase functions deploy n8n-proxy

# Deploy deploy-n8n (for workflow deployment)
supabase functions deploy deploy-n8n
```

## Alternative: Set Secrets via CLI

You can also set secrets via CLI:

```bash
# N8N Configuration
supabase secrets set N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
supabase secrets set N8N_API_KEY=your_n8n_api_key_here

# Supabase Configuration
supabase secrets set SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
supabase secrets set SERVICE_ROLE_KEY=your_service_role_key_here
supabase secrets set ANON_KEY=your_anon_key_here

# OAuth Credentials
supabase secrets set GMAIL_CLIENT_ID=your_gmail_client_id
supabase secrets set GMAIL_CLIENT_SECRET=your_gmail_client_secret

# OpenAI Keys
supabase secrets set OPENAI_KEY_1=your_openai_key_1
supabase secrets set OPENAI_KEY_2=your_openai_key_2
# ... etc
```

## Verification

After deployment, verify the functions are working:

1. Check function logs in Supabase Dashboard
2. Test n8n-proxy: `https://oinxzvqszingwstrbdro.supabase.co/functions/v1/n8n-proxy`
3. Test deploy-n8n: `https://oinxzvqszingwstrbdro.supabase.co/functions/v1/deploy-n8n`

## Troubleshooting

### 404 Not Found
- Edge Function is not deployed
- Run deployment commands above

### 500 Internal Server Error
- Missing environment variables/secrets
- Check function logs in Supabase Dashboard
- Ensure all required secrets are configured

### CORS Errors
- Check CORS headers in Edge Function code
- Verify `Access-Control-Allow-Origin` is set correctly

## Important Notes

1. **Secrets vs Environment Variables**: In Supabase Edge Functions, secrets are accessed via `Deno.env.get()` but must be configured in the Supabase Dashboard or via CLI
2. **Deployment Time**: Functions typically deploy within 30-60 seconds
3. **Cold Start**: First request after deployment may be slower (cold start)
4. **Logs**: Monitor function logs in Supabase Dashboard for debugging

## Reference Links

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli/introduction)
- [Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets)


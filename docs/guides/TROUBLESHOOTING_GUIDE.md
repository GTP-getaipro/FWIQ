# Floworx Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **1. Port Conflicts**

#### **Problem**: `EADDRINUSE: address already in use :::3001`

#### **Solution**:
```bash
# Check what's using the port
netstat -ano | findstr :3001

# Kill the process
taskkill /F /PID [process_id]

# Or kill all Node.js processes
taskkill /F /IM node.exe
```

#### **Prevention**:
- Always check if servers are already running before starting new ones
- Use different terminals for each server
- Use `Ctrl+C` to gracefully stop servers

---

### **2. Module Not Found Errors**

#### **Problem**: `Cannot find module 'C:\FloworxV2\src\server.js'`

#### **Solution**:
```bash
# Make sure you're in the correct directory
cd C:\FloworxV2                    # For main server
cd C:\FloworxV2\backend           # For backend server

# Verify file exists
dir server.js                     # Should exist in root
dir src\server.js                 # Should exist in backend folder
```

#### **Correct Commands**:
```bash
# Main API Server (server.js is in root, NOT in src folder)
cd C:\FloworxV2
node server.js

# Backend Server (src/server.js is in backend folder)
cd C:\FloworxV2\backend
node src/server.js

# Frontend Server
cd C:\FloworxV2
npm run dev
```

#### **File Locations**:
- ✅ `C:\FloworxV2\server.js` - Main API server (EXISTS)
- ✅ `C:\FloworxV2\backend\src\server.js` - Backend server (EXISTS)
- ❌ `C:\FloworxV2\src\server.js` - This file does NOT exist

---

### **3. Database Connection Issues**

#### **Problem**: Supabase connection errors

#### **Solution**:
1. **Check Environment Variables**:
   ```bash
   # Verify .env file exists and has correct values
   type .env
   ```

2. **Verify Supabase Credentials**:
   - `VITE_SUPABASE_URL` should be your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` should be your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` should be your service role key

3. **Test Database Connection**:
   ```bash
   # Check if Supabase is accessible
   curl https://your-project.supabase.co/rest/v1/
   ```

---

### **4. Email Monitoring Not Working**

#### **Problem**: No email logs appearing in dashboard

#### **Solution**:
1. **Check API Endpoint**:
   ```bash
   # Test the email logs endpoint
   curl -X POST http://localhost:3000/api/email-logs \
     -H "Content-Type: application/json" \
     -d '{"user_id":"test","provider":"gmail","status":"new"}'
   ```

2. **Verify Database Permissions**:
   - Check if `email_logs` table exists
   - Verify RLS policies allow inserts
   - Test direct database connection

3. **Check Email Integration**:
   - Verify OAuth tokens are valid
   - Check Gmail/Outlook API access
   - Review integration status in Supabase

---

### **5. Frontend Not Loading**

#### **Problem**: Dashboard shows errors or blank page

#### **Solution**:
1. **Check Console Errors**:
   - Open browser DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

2. **Verify Proxy Configuration**:
   ```javascript
   // In vite.config.js, ensure proxy is correct
   proxy: {
     '/api': {
       target: 'http://localhost:3000',  // Should match main API server
       changeOrigin: true,
       secure: false,
     },
   }
   ```

3. **Check Server Status**:
   ```bash
   # All servers should be running
   netstat -ano | findstr "3000\|3001\|5173"
   ```

---

### **6. Performance Dashboard Issues**

#### **Problem**: Dashboard shows "No data found" or incorrect metrics

#### **Solution**:
1. **Check Data in Database**:
   ```sql
   -- Query email_logs table directly
   SELECT * FROM email_logs 
   WHERE user_id = 'your-user-id' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

2. **Verify Time Range**:
   - Check if data exists for selected time range
   - Try different time ranges (7d, 30d, 90d)
   - Verify `created_at` timestamps are correct

3. **Check Component State**:
   - Open browser DevTools
   - Check React component state
   - Look for API call errors in Network tab

---

### **7. N8N Integration Issues**

#### **Problem**: Workflow deployment fails

#### **Solution**:
1. **Check Backend Server**:
   ```bash
   # Ensure backend server is running
   curl http://localhost:3001/health
   ```

2. **Verify N8N Credentials**:
   - Check N8N URL and API key
   - Test N8N API connectivity
   - Verify credential permissions

3. **Check VPS Connection**:
   - Verify VPS server is accessible
   - Check SSH keys and permissions
   - Review deployment logs

---

## 🔍 **Diagnostic Commands**

### **Check All Servers**
```bash
# Check if all required ports are listening
netstat -ano | findstr "3000\|3001\|5173"

# Expected output:
# TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    [PID]
# TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    [PID]
# TCP    0.0.0.0:5173    0.0.0.0:0    LISTENING    [PID]
```

### **Test API Endpoints**
```bash
# Test main API server
curl http://localhost:3000/health

# Test backend server
curl http://localhost:3001/health

# Test email logs endpoint
curl -X POST http://localhost:3000/api/email-logs \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-user","provider":"gmail","status":"new"}'
```

### **Check Node.js Processes**
```bash
# List all Node.js processes
tasklist | findstr node

# Kill specific process
taskkill /F /PID [process_id]

# Kill all Node.js processes
taskkill /F /IM node.exe
```

### **Verify File Structure**
```bash
# Check main server file
dir C:\FloworxV2\server.js

# Check backend server file
dir C:\FloworxV2\backend\src\server.js

# Check package.json
dir C:\FloworxV2\package.json
```

---

## 🚀 **Quick Recovery Steps**

### **Complete Restart**
1. **Stop All Servers**:
   ```bash
   taskkill /F /IM node.exe
   ```

2. **Start Fresh**:
   ```bash
   # Terminal 1 - Frontend
   cd C:\FloworxV2
   npm run dev

   # Terminal 2 - Main API
   cd C:\FloworxV2
   node server.js

   # Terminal 3 - Backend
   cd C:\FloworxV2\backend
   node src/server.js
   ```

3. **Verify Status**:
   ```bash
   netstat -ano | findstr "3000\|3001\|5173"
   ```

### **Database Reset** (if needed)
```sql
-- Clear email logs (be careful!)
DELETE FROM email_logs WHERE user_id = 'your-user-id';

-- Reset integrations
UPDATE integrations SET status = 'inactive' WHERE user_id = 'your-user-id';
```

---

## 📞 **Getting Help**

### **Before Asking for Help**
1. ✅ Check this troubleshooting guide
2. ✅ Verify all servers are running
3. ✅ Check browser console for errors
4. ✅ Test API endpoints manually
5. ✅ Review server logs for errors

### **Information to Provide**
- Error messages (exact text)
- Server status (`netstat` output)
- Browser console errors
- Steps to reproduce the issue
- Environment details (OS, Node.js version)

### **Log Locations**
- **Frontend**: Browser DevTools Console
- **Main API**: Terminal output
- **Backend**: Terminal output
- **Database**: Supabase Dashboard → Logs

---

## ✅ **Success Indicators**

### **Everything Working Correctly**
- ✅ All 3 servers running on correct ports
- ✅ Dashboard loads without errors
- ✅ Email performance metrics display
- ✅ Real-time updates working
- ✅ Export functionality works
- ✅ No console errors in browser

### **Health Check URLs**
- Frontend: http://localhost:5173
- Main API: http://localhost:3000/health
- Backend: http://localhost:3001/health
- Dashboard: http://localhost:5173/dashboard

**Remember**: Always start servers in the correct directories and check port availability before starting new instances!

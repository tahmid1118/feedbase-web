# Troubleshooting Guide

## Common Issues and Solutions

### 1. Network Error / Cannot Connect to API

**Error Message**: 
```
Unable to connect to the API. Please ensure the backend is running on port 4560.
```

**Symptoms**:
- Red alert on dashboard showing "Backend API Not Available"
- Login fails with network error
- Posts don't load
- 503 Service Unavailable errors

**Solutions**:

#### Check if Backend API is Running
```bash
# Try to access the API directly
curl http://localhost:4560/health

# Or in browser, navigate to:
http://localhost:4560
```

#### Start the Backend API
If the backend isn't running, start it:
```bash
# Navigate to your backend directory
cd /path/to/backend

# Start the server (adjust command based on your backend)
npm start
# or
node server.js
# or
python app.py
```

#### Verify Port 4560 is Available
```bash
# Check if port 4560 is in use (Windows)
netstat -ano | findstr :4560

# Check if port 4560 is in use (Mac/Linux)
lsof -i :4560
```

#### Check Environment Variables
Verify `.env.local` has correct API URL:
```env
FEEDBASE_API_BASE_URL=http://localhost:4560
NEXT_PUBLIC_FEEDBASE_API_BASE_URL=http://localhost:4560
```

#### Firewall/Antivirus
- Check if firewall is blocking port 4560
- Temporarily disable antivirus to test
- Add exception for localhost:4560

---

### 2. Login Failed / Invalid Credentials

**Error Message**: 
```
Invalid email or password.
```

**Solutions**:

#### First Time User
- You need to sign up first
- Click "Create your account" link
- Fill in all required fields

#### Existing User
- Double-check email and password
- Passwords are case-sensitive
- Ensure backend API is running

#### Rate Limiting
If you see "Too many attempts":
- Wait 1 minute before trying again
- Rate limit: 5 attempts per minute

#### Backend Database
- Ensure backend database is initialized
- Check backend logs for errors
- Verify user exists in database

---

### 3. Posts Not Loading

**Error Message**: 
```
Failed to load posts
```

**Solutions**:

#### Check Authentication
- Ensure you're logged in
- Check if session is valid
- Try logging out and back in

#### Backend API
- Verify backend is running
- Check backend logs for errors
- Test API endpoint directly:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4560/posts/list
```

#### Browser Console
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

---

### 4. Cannot Create Post

**Error Message**: 
```
Failed to create post
```

**Solutions**:

#### Form Validation
- Title: minimum 5 characters
- Description: minimum 10 characters
- All fields are required

#### Authentication
- Ensure you're logged in
- Check if token is valid
- Try refreshing the page

#### Backend API
- Check backend logs
- Verify POST /posts/create endpoint works
- Test with curl:
```bash
curl -X POST http://localhost:4560/posts/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"lg":"en","postData":{"title":"Test","description":"Test description","postType":"feedback"}}'
```

---

### 5. Voting Not Working

**Error Message**: 
```
Failed to vote
```

**Solutions**:

#### Authentication Required
- You must be logged in to vote
- Check if session is active

#### Already Voted
- You may have already voted on this post
- Try removing your vote first

#### Backend API
- Check if POST /votes/add endpoint works
- Verify authentication token

---

### 6. Comments Not Posting

**Error Message**: 
```
Failed to add comment
```

**Solutions**:

#### Comment Content
- Comment cannot be empty
- Minimum length may be required

#### Authentication
- Ensure you're logged in
- Check token validity

#### Post ID
- Verify post exists
- Check if post ID is valid

---

### 7. Page Not Found (404)

**Solutions**:

#### Check URL
- Ensure URL is correct
- Dashboard routes start with `/dashboard`

#### Post ID
- Verify post ID exists
- Check if post was deleted

#### Navigation
- Use sidebar navigation
- Don't manually edit URLs

---

### 8. Slow Performance

**Solutions**:

#### Backend Response Time
- Check backend server performance
- Monitor backend logs
- Optimize database queries

#### Network
- Check internet connection
- Test API response time
- Use browser DevTools Network tab

#### Browser
- Clear browser cache
- Disable browser extensions
- Try incognito mode

---

## Debugging Steps

### 1. Check Browser Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Note the error details
```

### 2. Check Network Requests
```
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for failed requests (red)
5. Click on failed request
6. Check Response tab
```

### 3. Verify Backend API
```bash
# Health check
curl http://localhost:4560/health

# Test login
curl -X POST http://localhost:4560/users/login \
  -H "Content-Type: application/json" \
  -d '{"lg":"en","userData":{"email":"test@example.com","password":"password"}}'

# Test posts list
curl -X POST http://localhost:4560/posts/list \
  -H "Content-Type: application/json" \
  -d '{"lg":"en","paginationData":{"itemsPerPage":10,"currentPageNumber":0,"sortOrder":"desc","filterBy":""}}'
```

### 4. Check Environment Variables
```bash
# Print environment variables
cat .env.local

# Verify they're loaded
npm run dev
# Check console output for API URL
```

### 5. Test Backend Directly
```bash
# Navigate to backend directory
cd /path/to/backend

# Check if it starts
npm start

# Check logs for errors
```

---

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request payload |
| 401 | Unauthorized | Login required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 408 | Timeout | Request took too long |
| 429 | Too Many Requests | Rate limited, wait |
| 500 | Server Error | Backend issue |
| 503 | Service Unavailable | Backend not running |

---

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Review browser console errors
3. ✅ Check backend API logs
4. ✅ Verify environment variables
5. ✅ Test backend API directly
6. ✅ Try in incognito mode

### Information to Provide

When reporting issues, include:
- Error message (exact text)
- Browser console errors
- Network request details
- Backend logs
- Steps to reproduce
- Environment (OS, Node version, browser)

### Resources

- **Implementation Guide**: `IMPLEMENTATION.md`
- **API Documentation**: `API_FULL_LIST.md`
- **Quick Start**: `QUICKSTART.md`
- **Requirements**: `feedbase_srs.txt`

---

## Prevention Tips

### Development Best Practices

1. **Always start backend first**
   ```bash
   # Terminal 1: Backend
   cd backend && npm start
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Check API status on dashboard**
   - Green alert = API connected
   - Red alert = API not available

3. **Monitor browser console**
   - Keep DevTools open during development
   - Watch for errors and warnings

4. **Use proper error handling**
   - Check API responses
   - Handle errors gracefully
   - Show user-friendly messages

5. **Keep dependencies updated**
   ```bash
   npm update
   ```

---

## Still Having Issues?

If you've tried everything above and still have issues:

1. Check if backend API is properly configured
2. Verify database connection
3. Review backend API documentation
4. Check for CORS issues
5. Test with Postman or curl
6. Review backend logs in detail

---

**Last Updated**: 2026-04-14

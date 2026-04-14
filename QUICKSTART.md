# Feedbase Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Prerequisites Check
Ensure you have:
- ✅ Node.js 18+ installed
- ✅ Backend API running on `http://localhost:4560`
- ✅ npm, pnpm, or yarn installed

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Verify Environment
The `.env.local` file is already configured:
```env
AUTH_SECRET=4oQtbMxfAeYQU9d4h7uYeMWwLG9xgGL9PzyXuIjLM9U=
FEEDBASE_API_BASE_URL=http://localhost:4560
NEXT_PUBLIC_FEEDBASE_API_BASE_URL=http://localhost:4560
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Open Browser
Navigate to: `http://localhost:3000`

---

## 🎯 First Actions

### 1. Create Account
- Click "Get Started" or "Sign up"
- Fill in your details:
  - Full name
  - Email address
  - Contact number
  - Password (min 8 chars, uppercase, lowercase, number, symbol)
- Click "Create account"

### 2. Explore Dashboard
After login, you'll see:
- **Dashboard**: Overview with stats
- **Feedback**: All feedback posts
- **Roadmap**: Product roadmap board
- **Changelog**: Release notes
- **Notifications**: User notifications
- **Settings**: Workspace settings

### 3. Create Your First Post
1. Click "Feedback" in sidebar
2. Click "New Post" button
3. Fill in:
   - Title: "Add dark mode"
   - Description: "Please add dark mode support"
   - Type: Feature Request
   - Priority: 2 - Medium
4. Click "Create Post"

### 4. Interact with Posts
- Click on a post to view details
- Click the upvote button to vote
- Add comments in the comment section
- View post metadata (author, date, status)

---

## 📁 Project Structure

```
feedbase/
├── app/
│   ├── (auth)/           # Login & Signup pages
│   ├── dashboard/        # Protected dashboard area
│   │   ├── feedback/     # Feedback board
│   │   ├── roadmap/      # Product roadmap
│   │   ├── changelog/    # Release notes
│   │   └── notifications/# Notifications
│   └── page.tsx          # Landing page
├── components/
│   ├── dashboard/        # Layout components
│   ├── feedback/         # Feedback components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── api/              # API client & services
│   └── auth/             # Auth utilities
└── .env.local            # Environment variables
```

---

## 🔧 Common Tasks

### View All Feedback
```
Dashboard → Feedback → View list of all posts
```

### Filter by Status
```
Feedback page → Click tabs: All, Open, Planned, In Progress, Completed
```

### Create Feature Request
```
Feedback → New Post → Select "Feature Request" → Fill form → Create
```

### Vote on Post
```
Click any post → Click upvote button (thumbs up icon)
```

### Add Comment
```
Click post → Scroll to comments → Type comment → Post Comment
```

### View Roadmap
```
Dashboard → Roadmap → See Kanban board with columns
```

### Check Notifications
```
Click bell icon in header → View all notifications
```

---

## 🎨 Key Features

### Feedback Board
- Create posts (Feedback, Feature Request, Bug Report)
- Vote on posts
- Comment on posts
- Filter by status
- View post details

### Roadmap
- Kanban-style board
- Multiple columns (Planned, In Progress, etc.)
- Target release dates
- Linked to feedback posts

### Changelog
- Published release notes
- Markdown content support
- Author and date tracking

### Notifications
- Real-time updates
- Unread count badge
- Mark as read functionality

---

## 🔐 Security Features

- JWT-based authentication
- httpOnly cookies
- Rate limiting on auth endpoints
- Password strength validation
- Protected routes
- Bearer token API authentication

---

## 🐛 Troubleshooting

### Backend API Not Running
**Error**: Network error or "Unable to connect to API"

**Solution**: 
1. Check if backend is running: `curl http://localhost:4560/health`
2. Start the backend API on port 4560
3. Verify `.env.local` has correct API URL
4. Check dashboard for API status indicator (green = connected, red = disconnected)

### Login Failed
**Error**: Invalid email or password

**Solution**: 
- Check credentials
- Ensure backend API is running
- Check rate limiting (wait 1 minute if too many attempts)
- Sign up first if you're a new user

### Posts Not Loading
**Error**: Failed to load posts

**Solution**:
- Check backend API connection (look for red alert on dashboard)
- Verify authentication token
- Check browser console for errors (F12)
- Ensure you're logged in

### Can't Create Post
**Error**: Failed to create post

**Solution**:
- Ensure you're logged in
- Check all required fields (title min 5 chars, description min 10 chars)
- Verify backend API is accessible
- Check browser console for detailed error

### API Connection Status
The dashboard shows a status indicator:
- 🟢 **Green Alert**: API is connected and healthy
- 🔴 **Red Alert**: Cannot connect to API - start backend on port 4560
- 🔵 **Blue Alert**: Checking connection...

For detailed troubleshooting, see `TROUBLESHOOTING.md`

---

## 📚 Additional Resources

- **Troubleshooting Guide**: See `TROUBLESHOOTING.md` for detailed solutions
- **Full Documentation**: See `IMPLEMENTATION.md`
- **API Reference**: See `API_FULL_LIST.md`
- **Requirements**: See `feedbase_srs.txt`
- **Next.js Docs**: `node_modules/next/dist/docs/`

---

## 🎯 Next Steps

1. ✅ Create your first feedback post
2. ✅ Vote on posts
3. ✅ Add comments
4. ✅ Explore the roadmap
5. ✅ Check notifications
6. 🔜 Customize settings
7. 🔜 Invite team members
8. 🔜 Configure integrations

---

## 💡 Tips

- Use keyboard shortcuts for faster navigation
- Filter posts by status to focus on specific items
- Vote on posts to help prioritize features
- Add detailed comments to provide context
- Check notifications regularly for updates

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review `IMPLEMENTATION.md` for detailed docs
3. Check `API_FULL_LIST.md` for API reference
4. Review browser console for error messages
5. Ensure backend API is running and accessible

---

**Happy Feedback Managing! 🎉**

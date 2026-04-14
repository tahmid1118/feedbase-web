# Feedbase

A modern, multi-tenant SaaS platform for collecting, managing, and prioritizing product feedback. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Feedback Collection** - Gather feature requests, bug reports, and ideas from your users
- **Smart Voting System** - Let users upvote features to help prioritize your roadmap
- **Visual Roadmap** - Share your product roadmap publicly with Kanban-style boards
- **Changelog Publishing** - Keep customers informed about new features and updates
- **Multi-Tenant Architecture** - Support multiple workspaces with custom domains and branding
- **Analytics Dashboard** - Track trends, measure engagement, and make data-driven decisions
- **Smart Notifications** - Email and in-app notifications to keep users engaged
- **Secure Authentication** - JWT-based auth with httpOnly cookies

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js
- **UI Components:** Radix UI + shadcn/ui
- **Form Handling:** React Hook Form + Zod
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:4560`
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/feedbase.git
cd feedbase
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Environment variables are already configured in `.env.local`:
```env
AUTH_SECRET=4oQtbMxfAeYQU9d4h7uYeMWwLG9xgGL9PzyXuIjLM9U=
FEEDBASE_API_BASE_URL=http://localhost:4560
NEXT_PUBLIC_FEEDBASE_API_BASE_URL=http://localhost:4560
```

4. Ensure the backend API is running on port 4560

5. Run the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

7. Sign up for a new account and start exploring!

## Project Structure

```
feedbase/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes (login, signup)
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── ui/               # UI components (shadcn/ui)
│   └── providers/        # Context providers
├── lib/                   # Utility functions and configurations
│   └── auth/             # Authentication utilities
├── types/                 # TypeScript type definitions
├── public/               # Static assets
└── tailwind.config.ts    # Tailwind CSS configuration
```

## Implemented Features

### ✅ Authentication System
- Secure JWT-based sessions with httpOnly cookies
- Email/password authentication with validation
- Protected routes with server-side checks
- Rate limiting on auth endpoints
- Password strength requirements

### ✅ Dashboard
- Fixed sidebar navigation
- Header with user menu and notifications bell
- Overview page with stats cards
- Responsive design

### ✅ Feedback Board
- List all feedback posts with filtering (All, Open, Planned, In Progress, Completed)
- Create new posts (Feedback, Feature Request, Bug Report)
- View post details with full information
- Upvote/downvote functionality
- Comment system with real-time updates
- Status badges and metadata display

### ✅ Roadmap
- Kanban-style board with columns
- Roadmap items linked to posts
- Target release date tracking
- Column-based organization

### ✅ Changelog
- List published changelogs
- View changelog details
- Author and date information
- Published/draft status

### ✅ Notifications
- Notification list with unread count
- Mark as read (individual and bulk)
- Notification types: post status, comments, mentions, system
- Bell icon with badge in header

### ✅ API Integration
- Type-safe API client with full TypeScript support
- Comprehensive error handling
- Bearer token authentication
- Request timeout protection
- Services for: Posts, Votes, Comments, Roadmap, Changelog, Notifications

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

Required environment variables (already configured in `.env.local`):

- `AUTH_SECRET` - Secret key for authentication (pre-configured)
- `FEEDBASE_API_BASE_URL` - Backend API URL (http://localhost:4560)
- `NEXT_PUBLIC_FEEDBASE_API_BASE_URL` - Public API URL for client-side calls

## API Documentation

See `API_FULL_LIST.md` for complete API endpoint documentation.
See `IMPLEMENTATION.md` for detailed implementation guide.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## Support

For support, email support@feedbase.com or open an issue in the GitHub repository.

---

Made with ❤️ by the Feedbase team

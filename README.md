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

- Node.js 18+ or Bun
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

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:
```env
# Authentication
AUTH_SECRET=your-secret-key-here
AUTH_URL=http://localhost:3000

# Database (add your database URL)
DATABASE_URL=your-database-url

# Add other required environment variables
```

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## Key Features Implementation

### Multi-Tenant System
- Subdomain-based tenant isolation (e.g., `tenant.feedbase.com`)
- Custom domain support
- Tenant-specific branding and configuration

### Authentication
- Secure JWT-based sessions
- Email/password authentication
- Protected routes and API endpoints
- Role-based access control (Visitor, User, Moderator, Admin, Owner)

### Feedback Management
- Create, read, update, delete feedback posts
- Voting system with upvotes
- Comment threads with nested replies
- Tag and categorize feedback
- Duplicate detection

### Roadmap & Changelog
- Kanban-style roadmap boards
- Status tracking (Planned, In Progress, Completed)
- Public changelog publishing
- Release notes and version management

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

Required environment variables:

- `AUTH_SECRET` - Secret key for authentication
- `AUTH_URL` - Base URL for authentication callbacks
- `DATABASE_URL` - Database connection string

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

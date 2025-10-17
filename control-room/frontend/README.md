# Control Room Frontend

The Control Room Dashboard is a Next.js 15 application that provides a centralized interface for managing multiple databases and services across The Fixer Initiative ecosystem.

## Features

- **Multi-Database Management**: Connect and manage Supabase and Neon databases
- **Real-time Metrics**: Monitor performance, users, revenue, and health status
- **Secure Authentication**: Supabase Auth integration
- **Responsive Design**: Works on desktop and mobile
- **Modern Stack**: Next.js 15, React 19, TypeScript, Tailwind CSS 4

## Quick Start

### From Project Root

```bash
# Install dependencies
npm run install:frontend

# Start development server
npm run dev
```

### From Frontend Directory

```bash
cd control-room/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Environment Setup

A `.env.local` file has been created with Supabase credentials. Verify it contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://hjplkyeuycajchayuylw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Authentication

The dashboard uses Supabase Authentication. Create a test user in Supabase dashboard:

- Navigate to Authentication > Users > Add User
- Or sign up through the `/login` page

## Available Routes

- `/` - Dashboard home
- `/login` - Sign in page
- `/databases/supabase` - Supabase management
- `/databases/neon` - Neon management
- `/transactions` - Transaction monitoring
- `/services` - Service management
- `/usage` - Usage analytics
- `/client` - Client management

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase for auth & database
- Lucide React icons
- Recharts for data viz

## Troubleshooting

**"next: command not found"**
```bash
cd control-room/frontend && npm install
```

**Database connection errors**
- Check `.env.local` credentials
- Verify Supabase project is active
- Confirm IP allowlist in Supabase settings

**Build issues**
```bash
rm -rf .next
npm run build
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PROJECT_DISRUPTOR_EXECUTION_STATUS.md](../../PROJECT_DISRUPTOR_EXECUTION_STATUS.md)
- [DATABASE_ONBOARDING_GUIDE.md](../../DATABASE_ONBOARDING_GUIDE.md)

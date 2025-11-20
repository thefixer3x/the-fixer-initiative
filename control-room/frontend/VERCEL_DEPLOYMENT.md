# Vercel Deployment Configuration for Supabase Management Dashboard

## Environment Variables Setup

For your Supabase Management Dashboard to work properly on Vercel, you need to configure these environment variables:

### Required Variables:
```
# Supabase Configuration
SUPABASE_URL=your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub Token (for GitHub project integration)
GITHUB_TOKEN=your-github-personal-access-token

# For internal API calls
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database connection (if using Neon for additional storage)
NEON_DATABASE_URL=your-neon-database-url
```

### Optional Variables:
```
# For enhanced security
NEXT_PUBLIC_USE_MOCK_AUTH=false  # Set to true only for development
NODE_ENV=production

# Monitoring and analytics (if applicable)
NEXT_PUBLIC_GA_MEASUREMENT_ID=your-google-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Deployment Steps

### 1. Using Vercel CLI:
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Navigate to your frontend directory
cd /Users/seyederick/DevOps/_project_folders/the-fixer-initiative/control-room/frontend

# Deploy to Vercel
vercel --prod
```

### 2. Using Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Create a new project
3. Import your GitHub repository
4. Set build command to `next build`
5. Set output directory to `.next`
6. Set development command to `next dev`
7. Add the required environment variables in the project settings
8. Deploy

## Build Configuration

The project uses the standard Next.js 14+ configuration with App Router. The `vercel.json` file should be properly configured:

```json
{
  "version": 2,
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Post-Deployment Steps

1. **Verify API Endpoints**:
   - Test `/api/supabase/projects` 
   - Test `/api/supabase/billing-config`
   - Test `/api/supabase/troubleshoot`

2. **Set up Custom Domain** (optional):
   - Go to Vercel project settings
   - Navigate to Domains
   - Add your custom domain

3. **Configure Automatic Deploys**:
   - Connect to your GitHub repository
   - Enable automatic deploys for the main branch

4. **Monitor Performance**:
   - Check the Vercel Analytics dashboard
   - Verify all API routes are responding correctly
   - Test dashboard functionality

## Troubleshooting

### Common Deployment Issues:

1. **Build Errors**: Ensure all dependencies are properly defined in `package.json`
2. **API Route Issues**: Check that the API routes are using server-side only features properly with `'server-only'` imports
3. **Environment Variable Errors**: Verify all required variables are set in Vercel dashboard
4. **CORS Issues**: The configuration should handle CORS properly for Supabase integration

### Verification Checklist:
- [ ] Dashboard homepage loads without errors
- [ ] Supabase project management features work
- [ ] GitHub project integration works
- [ ] Billing configuration management works
- [ ] Troubleshooting tools function properly
- [ ] All API routes return expected data
- [ ] Authentication works as expected

## Security Considerations

- The `SUPABASE_SERVICE_ROLE_KEY` provides full admin access to your Supabase project
- This key is only used server-side and never exposed to the client
- The application follows Next.js best practices for security
- All sensitive operations occur in server-side API routes
- Environment variables are properly configured to keep sensitive data secure
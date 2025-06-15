# Deployment Guide

This guide explains how to deploy Kepler Chat to Vercel with all required services.

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository** - Your code should be pushed to GitHub
2. **Neon Database** - PostgreSQL database set up
3. **Cloudflare R2** - Object storage bucket configured
4. **Vercel Account** - Free tier is sufficient for development

## 1. Database Setup (Neon)

### Create Database
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project: "kepler-chat"
3. Copy the connection string

### Run Migrations
```bash
# Set DATABASE_URL in your .env file
npm run db:push
```

## 2. Cloudflare R2 Setup

### Create Bucket
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create bucket: "kepler-chat-files"
4. Generate API tokens with R2 permissions

### Configure Public Access (Optional)
1. Set up custom domain for R2 bucket
2. Or use the default R2.dev subdomain

## 3. Vercel Deployment

### Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select "Next.js" framework (auto-detected)

### Environment Variables

Set these environment variables in Vercel:

#### Database
```
DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-1.aws.neon.tech/kepler_chat?sslmode=require"
```

#### Authentication
```
BETTER_AUTH_SECRET="your-32-character-secret-key"
BETTER_AUTH_URL="https://your-app.vercel.app"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-app.vercel.app"
```

#### File Storage
```
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="kepler-chat-files"
R2_PUBLIC_URL="https://your-custom-domain.com"
```

### Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Visit your app URL

## 4. Post-Deployment

### Verify Deployment
1. **Authentication** - Test sign up/sign in
2. **Database** - Check user creation
3. **File Upload** - Test file upload functionality
4. **API Routes** - Verify all endpoints work

### Set Up Custom Domain (Optional)
1. Go to Vercel project settings
2. Add custom domain
3. Configure DNS records
4. Update BETTER_AUTH_URL and NEXT_PUBLIC_BETTER_AUTH_URL

## 5. Environment-Specific Configuration

### Preview Deployments
- Automatic for all pull requests
- Uses same environment variables
- Safe for testing new features

### Production
- Deploys from main branch
- Use production database
- Configure monitoring

## 6. Monitoring & Maintenance

### Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor performance and usage

### Database Monitoring
1. Use Neon dashboard for query monitoring
2. Set up connection limits
3. Monitor storage usage

### Error Tracking
- Vercel provides basic error logging
- Consider adding Sentry for detailed error tracking

## 7. Scaling Considerations

### Database
- Neon auto-scales for most use cases
- Monitor connection pool usage
- Consider read replicas for high traffic

### File Storage
- R2 scales automatically
- Monitor bandwidth usage
- Implement CDN if needed

### Compute
- Vercel Edge Functions scale automatically
- Monitor function execution time
- Optimize cold starts

## Common Issues

### Build Failures
- Check environment variables are set
- Verify all dependencies are in package.json
- Check TypeScript errors

### Authentication Issues
- Verify BETTER_AUTH_URL matches deployment URL
- Check database connection
- Ensure session cookies are configured correctly

### File Upload Issues
- Verify R2 credentials and permissions
- Check CORS configuration
- Validate file size limits

## Performance Optimization

### Build Optimization
```json
// next.config.ts
export default {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-r2-domain.com'
      }
    ]
  }
}
```

### Database Optimization
- Use connection pooling
- Implement query optimization
- Add database indexes for performance

### CDN Configuration
- Enable Vercel Edge Network
- Configure caching headers
- Optimize static assets

## Security Checklist

- [ ] Environment variables are secure
- [ ] Database uses SSL connections
- [ ] File uploads are validated
- [ ] Authentication secrets are rotated regularly
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled

## Backup & Recovery

### Database Backup
- Neon provides automatic backups
- Set up point-in-time recovery
- Test backup restoration

### File Storage Backup
- R2 provides durability guarantees
- Consider cross-region replication for critical files
- Implement file versioning if needed

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Neon database logs
3. Verify Cloudflare R2 access logs
4. Consult service documentation
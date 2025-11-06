# Production Setup Guide

Quick reference for setting up the Daily Update App in production.

## 🚀 Quick Start (5 minutes)

### 1. MongoDB Atlas (2 minutes)
```bash
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Create database user
4. Allow network access (0.0.0.0/0)
5. Copy connection string
```

### 2. Railway Backend (2 minutes)
```bash
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select repository, set root to /backend
4. Add environment variables (see below)
5. Deploy automatically
```

### 3. Vercel Frontend (1 minute)
```bash
1. Go to https://vercel.com
2. New Project → Import GitHub repo
3. Set root to /frontend
4. Add VITE_API_URL environment variable
5. Deploy automatically
```

## 📋 Environment Variables

### Backend (Railway)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/daily-update-app
JWT_SECRET=<generate-with: openssl rand -base64 32>
ANTHROPIC_API_KEY=sk-ant-api03-...
CLIENT_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```env
VITE_API_URL=https://your-app.railway.app/api
```

## 🔐 Generate Secrets

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## ✅ Verification Steps

After deployment:

1. **Backend Health Check**
   ```bash
   curl https://your-app.railway.app/api/health
   # Should return: {"success":true,"message":"Daily Update API is running"}
   ```

2. **Frontend Access**
   - Visit https://your-app.vercel.app
   - Should load without errors
   - Check browser console for API connection

3. **Full Feature Test**
   - Register new user
   - Create daily update
   - Verify AI formatting works
   - Test all CRUD operations

## 🛠 Troubleshooting

### CORS Error
```
Solution: Update CLIENT_URL in Railway to match Vercel URL exactly
```

### Database Connection Failed
```
Solution:
1. Check MongoDB Atlas network access (allow 0.0.0.0/0)
2. Verify connection string includes username/password
3. Ensure database user has read/write permissions
```

### AI Features Not Working
```
Solution:
1. Verify ANTHROPIC_API_KEY is set in Railway
2. Check API key has credits at console.anthropic.com
3. Review Railway logs for API errors
```

### Frontend Can't Reach Backend
```
Solution:
1. Ensure VITE_API_URL ends with /api
2. Check Railway backend is deployed and running
3. Verify no trailing slashes in URLs
```

## 📊 Post-Deployment

### Monitoring Setup
1. **Sentry (Optional)**
   - Sign up at https://sentry.io
   - Add SENTRY_DSN to both backend and frontend
   - Test error tracking

2. **Uptime Monitoring (Optional)**
   - Use UptimeRobot or similar
   - Monitor /api/health endpoint
   - Set up email alerts

### Cost Monitoring
- Railway: Check usage dashboard ($5-10/month typical)
- MongoDB Atlas: Should stay within free tier (M0)
- Anthropic API: Monitor token usage (~$0.003 per 1K tokens)
- Vercel: Free for most use cases

### Security Checklist
- [ ] HTTPS enabled on both URLs
- [ ] Strong JWT_SECRET (32+ chars)
- [ ] MongoDB network access configured
- [ ] Rate limiting active (default config)
- [ ] CORS restricted to frontend domain
- [ ] No secrets in frontend code

## 🔄 Updates and Maintenance

### Deploying Updates
Both platforms auto-deploy on git push to main:
```bash
git add .
git commit -m "Your changes"
git push origin main
# Railway and Vercel will auto-deploy
```

### Rolling Back
Both platforms support rollback:
- **Railway**: Dashboard → Deployments → "Rollback"
- **Vercel**: Dashboard → Deployments → "..." → "Rollback"

### Database Backups
- MongoDB Atlas: Automatic daily backups (enabled by default)
- Access backups: Atlas Dashboard → Backups

## 📚 Additional Resources

- **Full Deployment Guide**: See `DEPLOYMENT.md`
- **Deployment Checklist**: See `DEPLOYMENT_CHECKLIST.md`
- **Quick Deploy Script**: Run `./scripts/deploy.sh`

## 🆘 Support

If you encounter issues:
1. Check platform status pages (status.railway.app, vercel-status.com)
2. Review deployment logs in platform dashboards
3. Test API endpoints with curl/Postman
4. Check browser console for frontend errors

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Both frontend and backend URLs are accessible
- ✅ User registration and login work
- ✅ Daily updates can be created with AI formatting
- ✅ All CRUD operations function correctly
- ✅ No console errors in browser
- ✅ API health check returns success

---

**Estimated Setup Time**: 5-10 minutes
**Monthly Cost**: ~$5-15 (Railway backend + API usage)
**Difficulty**: ⭐⭐☆☆☆ (Easy)

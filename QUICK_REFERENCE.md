# Quick Reference Card

Essential commands and URLs for deploying and managing the Daily Update App.

## 🚀 Pre-Deployment

```bash
# Run pre-deployment checks
./scripts/deploy.sh

# Validate environment variables
./scripts/validate-env.sh backend
./scripts/validate-env.sh frontend

# Generate JWT secret
openssl rand -base64 32

# Run tests
cd backend && npm test
cd frontend && npm test
```

## 🔧 Environment Setup

### Backend (.env.production)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/daily-update-app
JWT_SECRET=<32+ character random string>
ANTHROPIC_API_KEY=sk-ant-api03-...
CLIENT_URL=https://your-app.vercel.app
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-app.railway.app/api
```

## 🌐 Platform URLs

| Service | URL | Purpose |
|---------|-----|---------|
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas | Database |
| Railway | https://railway.app | Backend hosting |
| Vercel | https://vercel.com | Frontend hosting |
| Anthropic | https://console.anthropic.com | AI API keys |
| Sentry | https://sentry.io | Error tracking |

## 📋 Deployment Steps

### 1. MongoDB Atlas (2 min)
```
1. Create cluster (M0 free)
2. Create database user
3. Network Access → Add 0.0.0.0/0
4. Copy connection string
```

### 2. Railway Backend (2 min)
```
1. New Project → GitHub repo
2. Root directory: /backend
3. Add environment variables
4. Auto-deploys on push
```

### 3. Vercel Frontend (1 min)
```
1. New Project → GitHub repo
2. Root directory: /frontend
3. Add VITE_API_URL
4. Auto-deploys on push
```

### 4. Update CORS (1 min)
```
1. Railway → Environment Variables
2. Update CLIENT_URL to Vercel URL
3. Save (auto-redeploys)
```

## ✅ Testing Deployment

```bash
# Automated tests
./scripts/test-deployment.sh \
  https://your-app.railway.app \
  https://your-app.vercel.app

# Manual health check
curl https://your-app.railway.app/api/health

# Should return:
# {"success":true,"message":"Daily Update API is running"}
```

## 🔍 Monitoring

### Check Backend Logs
```bash
# Railway Dashboard → Deployments → View Logs
```

### Check Frontend Logs
```bash
# Vercel Dashboard → Deployments → Function Logs
```

### Database Monitoring
```bash
# MongoDB Atlas → Metrics tab
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS Error | Update CLIENT_URL in Railway to match Vercel URL exactly |
| Database Connection Failed | Check MongoDB Atlas IP whitelist (0.0.0.0/0) |
| AI Not Working | Verify ANTHROPIC_API_KEY in Railway |
| Frontend 500 | Check VITE_API_URL ends with `/api` |
| Rate Limited | Wait 15 minutes or increase limits in code |

## 🔐 Security Checklist

- [ ] JWT_SECRET is 32+ characters
- [ ] MongoDB has authentication enabled
- [ ] HTTPS enabled on both URLs
- [ ] CORS restricted to frontend domain
- [ ] Secrets not in frontend code
- [ ] Rate limiting active
- [ ] .env files not committed to Git

## 💰 Cost Estimate

| Service | Cost |
|---------|------|
| MongoDB Atlas (M0) | Free |
| Railway (starter) | ~$5-10/month |
| Vercel (hobby) | Free |
| Anthropic API | ~$0.003 per 1K tokens |
| **Total** | **~$5-15/month** |

## 📊 Key Metrics to Monitor

- API response times (should be < 1s)
- Error rate (should be < 1%)
- Database connections (watch for leaks)
- AI API costs (track token usage)
- Storage usage (MongoDB free tier = 512MB)

## 🔄 Deployment Updates

```bash
# Both platforms auto-deploy on git push to main
git add .
git commit -m "Your changes"
git push origin main

# Railway and Vercel detect and deploy automatically
```

## 🔙 Rollback

### Railway
```
Dashboard → Deployments → Select previous → Rollback
```

### Vercel
```
Dashboard → Deployments → ... → Rollback to this deployment
```

## 📞 Support Links

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Anthropic API Docs: https://docs.anthropic.com

## 🎯 Success Criteria

✅ Backend health check returns success
✅ Frontend loads without errors
✅ User can register and login
✅ AI formatting works for daily updates
✅ All export formats work (CSV, JSON, Markdown, PDF)
✅ Templates can be created and used
✅ Dark mode toggles successfully
✅ No console errors in browser

---

**Total deployment time: ~15 minutes**
**Estimated monthly cost: $5-15**
**Difficulty: ⭐⭐☆☆☆ (Easy)**

# GitHub Actions CI/CD Workflows

Comprehensive CI/CD pipeline for automated testing and deployment of the Daily Update App.

## 📋 Workflows Overview

### 1. **CI** (`ci.yml`) - Main CI Pipeline
Runs on every push and PR. Orchestrates all checks:
- ✅ Backend tests
- ✅ Frontend tests
- ✅ Docker build validation
- ✅ E2E tests (on PR and main branch)

**Status:** Automatic on push/PR

### 2. **Backend Tests** (`backend-tests.yml`)
Comprehensive backend testing with coverage:
- Unit tests
- Integration tests
- Coverage reporting (80% threshold)
- MongoDB service container
- Coverage comments on PRs

**Triggers:** Changes to `backend/**`

### 3. **Frontend Tests** (`frontend-tests.yml`)
Frontend testing and build validation:
- Unit tests with Vitest
- Build verification
- Coverage reporting
- Build artifact upload

**Triggers:** Changes to `frontend/**`

### 4. **E2E Tests** (`e2e-tests.yml`)
End-to-end testing with Playwright:
- Full user workflow testing
- Backend + Frontend integration
- Playwright report generation
- Test result artifacts

**Triggers:** PR to main, manual dispatch

### 5. **Docker Build** (`docker-build.yml`)
Docker image validation:
- Build backend and frontend images
- Test image functionality
- Docker Compose orchestration test
- Health check validation

**Triggers:** Changes to Dockerfiles or docker-compose.yml

### 6. **Deploy** (`deploy.yml`)
Production deployment workflow:
- Deploy backend (Railway/Render/Heroku)
- Deploy frontend (Vercel/Netlify/Cloudflare)
- Docker Hub push support
- Deployment notifications

**Triggers:** Manual dispatch, push to main

---

## 🔧 Setup Instructions

### Required Secrets

Add these secrets to your GitHub repository settings:

#### Required for Testing
```
ANTHROPIC_API_KEY          # Anthropic Claude API key
```

#### Required for Deployment (choose your platform)

**Backend Deployment:**
```
# Railway
RAILWAY_TOKEN              # Railway API token

# Render
RENDER_DEPLOY_HOOK_BACKEND # Render deploy hook URL

# Heroku
HEROKU_API_KEY             # Heroku API key
HEROKU_APP_NAME_BACKEND    # Heroku app name
HEROKU_EMAIL               # Heroku account email

# Docker Hub
DOCKER_USERNAME            # Docker Hub username
DOCKER_PASSWORD            # Docker Hub password/token
```

**Frontend Deployment:**
```
# Vercel
VERCEL_TOKEN               # Vercel API token
VERCEL_ORG_ID              # Vercel organization ID
VERCEL_PROJECT_ID          # Vercel project ID

# Netlify
NETLIFY_AUTH_TOKEN         # Netlify auth token
NETLIFY_SITE_ID            # Netlify site ID

# Cloudflare Pages
CLOUDFLARE_API_TOKEN       # Cloudflare API token
CLOUDFLARE_ACCOUNT_ID      # Cloudflare account ID
```

**Production Environment:**
```
MONGODB_URI_TEST           # MongoDB URI for CI tests
JWT_SECRET                 # JWT signing secret
VITE_API_URL               # Production backend API URL
```

**Optional Notifications:**
```
SLACK_WEBHOOK_URL          # Slack webhook for notifications
```

### Required Variables

Set these in repository settings → Variables:

```
DEPLOY_PLATFORM            # Backend: 'railway', 'render', 'heroku', 'docker'
DEPLOY_PLATFORM_FRONTEND   # Frontend: 'vercel', 'netlify', 'cloudflare'
```

---

## 🚀 Usage

### Running Workflows

#### Automatic (on push/PR)
All tests run automatically on push to any branch and on pull requests.

#### Manual Deployment
1. Go to **Actions** tab
2. Select **Deploy to Production**
3. Click **Run workflow**
4. Choose environment (staging/production)
5. Click **Run workflow**

### Workflow Triggers

| Workflow | Push | PR | Manual | Schedule |
|----------|------|----|----|----------|
| CI | ✅ | ✅ | ❌ | ❌ |
| Backend Tests | ✅ | ✅ | ❌ | ❌ |
| Frontend Tests | ✅ | ✅ | ❌ | ❌ |
| E2E Tests | main | ✅ | ✅ | ❌ |
| Docker Build | ✅ | ✅ | ✅ | ❌ |
| Deploy | main | ❌ | ✅ | ❌ |

---

## 📊 Coverage Requirements

### Backend
- **Minimum:** 80% coverage
- **Target:** 95%+
- **Current:** 95.63%

### Frontend
- **Minimum:** No strict requirement
- **Target:** 80%+

---

## 🎯 Status Badges

Add these to your README.md:

```markdown
![CI](https://github.com/YOUR_USERNAME/daily-update/workflows/CI/badge.svg)
![Backend Tests](https://github.com/YOUR_USERNAME/daily-update/workflows/Backend%20Tests/badge.svg)
![Frontend Tests](https://github.com/YOUR_USERNAME/daily-update/workflows/Frontend%20Tests/badge.svg)
![Docker Build](https://github.com/YOUR_USERNAME/daily-update/workflows/Docker%20Build/badge.svg)
```

---

## 🔍 Workflow Details

### Backend Tests Workflow

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linter
5. Run unit tests
6. Run integration tests
7. Generate coverage report
8. Upload coverage to Codecov
9. Check coverage threshold
10. Comment results on PR

**Duration:** ~3-5 minutes

### Frontend Tests Workflow

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run linter
5. Run unit tests
6. Generate coverage
7. Build application
8. Upload build artifacts
9. Comment results on PR

**Duration:** ~2-3 minutes

### E2E Tests Workflow

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies (backend + frontend)
4. Install Playwright browsers
5. Start backend server
6. Run Playwright tests
7. Upload test reports
8. Stop backend server

**Duration:** ~5-10 minutes

### Docker Build Workflow

**Steps:**
1. Checkout code
2. Setup Docker Buildx
3. Build backend image
4. Build frontend image
5. Test images
6. Test Docker Compose
7. Check service health

**Duration:** ~5-8 minutes

---

## 🐛 Troubleshooting

### Tests Failing in CI but Passing Locally

**MongoDB Connection Issues:**
```yaml
# Ensure MongoDB service is defined:
services:
  mongodb:
    image: mongo:7
```

**Environment Variables:**
```yaml
env:
  MONGODB_URI: mongodb://localhost:27017/test
  JWT_SECRET: test-secret
```

### Docker Build Failures

**Cache Issues:**
```bash
# Clear workflow caches in GitHub Actions settings
```

**Build Context:**
```dockerfile
# Ensure .dockerignore is properly configured
```

### E2E Tests Timing Out

**Increase Timeout:**
```yaml
timeout-minutes: 20  # Increase if needed
```

**Backend Startup:**
```bash
# Increase wait time for backend
timeout 120 bash -c 'until curl ...'
```

---

## 📈 Performance Optimization

### Caching
- ✅ npm dependencies cached
- ✅ Docker layers cached
- ✅ Playwright browsers cached

### Parallelization
- ✅ Backend and frontend tests run in parallel
- ✅ Docker images build in parallel
- ✅ E2E tests run separately to avoid conflicts

---

## 🔐 Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Use minimal permissions** - Set appropriate workflow permissions
3. **Scan dependencies** - Consider adding Dependabot
4. **Review Docker images** - Use security scanning
5. **Rotate secrets regularly** - Update API keys periodically

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Action](https://github.com/docker/build-push-action)
- [Playwright CI](https://playwright.dev/docs/ci)
- [Codecov Integration](https://about.codecov.io/blog/getting-started-with-code-coverage/)

---

## 🆘 Support

For workflow issues:
1. Check workflow logs in Actions tab
2. Review secret configuration
3. Verify environment variables
4. Check service health

For deployment issues, see `DEPLOYMENT.md` in the root directory.

# 🚂 Railway Docker Deployment Guide

> **Updated**: Migrated from Nixpacks to Docker for Railway deployments

## 📋 Overview

This project now uses **Docker** instead of the deprecated Nixpacks for Railway deployments. Each service has its own optimized multi-stage Dockerfile.

## 🏗️ Docker Architecture

### Service Dockerfiles

Each service has a dedicated Dockerfile optimized for production:

- **`packages/api/Dockerfile`** - Backend API service
- **`packages/control-app/Dockerfile`** - Streamer control panel (static)
- **`packages/overlay-app/Dockerfile`** - Public overlay (static)

### Multi-Stage Build Process

All Dockerfiles follow this pattern:

1. **Base Stage**: Node.js 20 Alpine + pnpm
2. **Deps Stage**: Install all monorepo dependencies
3. **Shared Builder Stage**: Build shared package first
4. **Service Builder Stage**: Build specific service
5. **Runner Stage**: Production image with only necessary files

## 🚀 Deploying to Railway

### Prerequisites

1. Railway account
2. Railway CLI installed: `npm i -g @railway/cli`
3. Git repository connected to Railway

### Deploy Individual Services

#### 1. Deploy API Service

```bash
# In project root
railway up --service api --dockerfile packages/api/Dockerfile
```

**Environment Variables Needed:**

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
TWITCH_CLIENT_ID=<your-twitch-client-id>
TWITCH_CLIENT_SECRET=<your-twitch-client-secret>
TWITCH_REDIRECT_URI=<your-control-app-url>/auth/callback
CORS_ORIGIN=<control-app-url>,<overlay-app-url>
```

**Port Configuration:**

- Service Port: `3001`
- Health Check: `/health`

#### 2. Deploy Control App

```bash
# In project root
railway up --service control-app --dockerfile packages/control-app/Dockerfile
```

**Build-time Environment Variables:**

```env
VITE_API_URL=<your-api-url>
VITE_WS_URL=<your-api-ws-url>
VITE_TWITCH_CLIENT_ID=<your-twitch-client-id>
VITE_TWITCH_REDIRECT_URI=<your-control-app-url>/auth/callback
```

**Runtime:**

- Service Port: `3000`
- Serves static files via `serve`

#### 3. Deploy Overlay App

```bash
# In project root
railway up --service overlay-app --dockerfile packages/overlay-app/Dockerfile
```

**Build-time Environment Variables:**

```env
VITE_API_URL=<your-api-url>
VITE_WS_URL=<your-api-ws-url>
VITE_TWITCH_CLIENT_ID=<your-twitch-client-id>
VITE_TWITCH_REDIRECT_URI=<your-overlay-app-url>/auth/callback
```

**Runtime:**

- Service Port: `3000`
- Serves static files via `serve`

### Railway Service Configuration

#### Creating Services in Railway Dashboard

1. **Create API Service:**
   - Name: `paintwithchat-api`
   - Root Directory: `/`
   - Dockerfile Path: `packages/api/Dockerfile`
   - Port: `3001`
   - Health Check: `/health`

2. **Create Control App Service:**
   - Name: `paintwithchat-control`
   - Root Directory: `/`
   - Dockerfile Path: `packages/control-app/Dockerfile`
   - Port: `3000`

3. **Create Overlay App Service:**
   - Name: `paintwithchat-overlay`
   - Root Directory: `/`
   - Dockerfile Path: `packages/overlay-app/Dockerfile`
   - Port: `3000`

#### Setting Environment Variables

**Via Railway Dashboard:**

1. Go to your service
2. Click "Variables" tab
3. Add variables listed above
4. Click "Deploy"

**Via Railway CLI:**

```bash
# Set API variables
railway variables set MONGODB_URI="mongodb+srv://..." --service api
railway variables set JWT_SECRET="your-secret" --service api
railway variables set TWITCH_CLIENT_ID="..." --service api
railway variables set TWITCH_CLIENT_SECRET="..." --service api

# Set Control App variables (build-time)
railway variables set VITE_API_URL="https://api.railway.app" --service control-app
railway variables set VITE_WS_URL="wss://api.railway.app" --service control-app

# Set Overlay App variables (build-time)
railway variables set VITE_API_URL="https://api.railway.app" --service overlay-app
railway variables set VITE_WS_URL="wss://api.railway.app" --service overlay-app
```

## 🔧 Local Docker Testing

### Build and Test Locally

**API Service:**

```bash
# Build from project root
docker build -f packages/api/Dockerfile -t paintwithchat-api .

# Run
docker run -p 3001:3001 \
  -e MONGODB_URI="mongodb://localhost:27017/paintwithchat" \
  -e JWT_SECRET="test-secret" \
  paintwithchat-api
```

**Control App:**

```bash
# Build from project root
docker build -f packages/control-app/Dockerfile -t paintwithchat-control .

# Run
docker run -p 3000:3000 paintwithchat-control
```

**Overlay App:**

```bash
# Build from project root
docker build -f packages/overlay-app/Dockerfile -t paintwithchat-overlay .

# Run
docker run -p 3001:3000 paintwithchat-overlay
```

### Using Docker Compose (Development)

The existing `docker-compose.yml` is for MongoDB only. For full-stack local Docker testing, you can extend it:

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:8.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  api:
    build:
      context: .
      dockerfile: packages/api/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/paintwithchat
      - JWT_SECRET=dev-secret
      - NODE_ENV=development
    depends_on:
      - mongodb

  control-app:
    build:
      context: .
      dockerfile: packages/control-app/Dockerfile
    ports:
      - "5173:3000"
    depends_on:
      - api

  overlay-app:
    build:
      context: .
      dockerfile: packages/overlay-app/Dockerfile
    ports:
      - "5174:3000"
    depends_on:
      - api

volumes:
  mongo-data:
```

## 🐛 Troubleshooting

### Build Fails with "Cannot find module"

**Issue**: Shared package not built or not copied correctly

**Solution**:

- Ensure build stages are in correct order
- Verify `COPY --from=shared-builder` paths are correct
- Check that shared package builds successfully

### Frontend Apps Don't Connect to API

**Issue**: VITE environment variables not set during build

**Solution**:

- Frontend environment variables must be set at **build time**
- In Railway, set variables before deployment
- Rebuild after changing VITE\_\* variables

### Health Check Failing for API

**Issue**: API not responding on health check endpoint

**Solution**:

- Verify `/health` endpoint exists in API
- Check `PORT` environment variable is set to `3001`
- Ensure MongoDB connection is successful
- Check logs: `railway logs --service api`

### Static Apps Return 404 on Refresh

**Issue**: SPA routing not configured in serve

**Solution**:

- Dockerfiles already use `serve -s` flag (single-page app mode)
- This handles client-side routing correctly

## 📊 Build Optimization

### Current Build Times (Approximate)

- **API**: ~3-4 minutes
- **Control App**: ~3-4 minutes
- **Overlay App**: ~3-4 minutes

### Optimization Tips

1. **Use Railway's Build Cache**: Railway caches Docker layers automatically
2. **Minimize Layer Changes**: Order Dockerfile commands from least to most frequently changed
3. **Multi-stage Builds**: Already implemented to keep production images small
4. **Production Dependencies**: API uses `--prod` flag to install only runtime dependencies

### Image Sizes

- **API**: ~200MB (Node.js Alpine + production deps)
- **Control App**: ~50MB (Static files + serve)
- **Overlay App**: ~50MB (Static files + serve)

## 🔐 Security Best Practices

1. **Secrets Management**: Use Railway's secret variables, never commit secrets
2. **Alpine Base**: Using `node:20-alpine` for smaller attack surface
3. **Production Deps**: Only install necessary dependencies in final image
4. **Health Checks**: Configured for all services
5. **Environment Isolation**: Separate services with minimal access

## 📝 Migration Checklist

- [x] Create Dockerfiles for each service
- [x] Update railway.json to use Dockerfile builder
- [x] Update railway.toml configuration
- [x] Add .dockerignore file
- [x] Document deployment process
- [ ] Remove old nixpacks.toml files (optional, won't interfere)
- [ ] Test deployments on Railway
- [ ] Update team documentation

## 🔄 Continuous Deployment

Railway automatically deploys when:

- Code is pushed to connected Git branch
- Environment variables are changed
- Manual deployment is triggered

### Auto-Deploy Configuration

Each service can have automatic deployments:

1. Go to service settings in Railway
2. Enable "Auto Deploy"
3. Select branch (usually `main`)
4. Save

## 📚 Additional Resources

- [Railway Docker Documentation](https://docs.railway.app/deploy/dockerfiles)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**Last Updated**: 2024-11-25  
**Migration From**: Nixpacks  
**Migration To**: Docker

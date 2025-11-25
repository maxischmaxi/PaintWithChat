# Dockerfile for API Service
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Install dependencies for entire monorepo
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
COPY packages/control-app/package.json ./packages/control-app/
COPY packages/overlay-app/package.json ./packages/overlay-app/
RUN pnpm install --frozen-lockfile

# Build shared package
FROM deps AS shared-builder
COPY packages/shared ./packages/shared
RUN cd packages/shared && pnpm build
RUN echo "✅ Shared package built:" && ls -la /app/packages/shared/dist

# Build API
FROM shared-builder AS api-builder
COPY packages/api ./packages/api
RUN cd packages/api && pnpm build
RUN echo "✅ API built:" && ls -la /app/packages/api/dist

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm and Node.js production dependencies
RUN npm install -g pnpm

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json for all packages (needed for workspace resolution)
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/api/package.json ./packages/api/package.json

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder stages
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=api-builder /app/packages/api/dist ./packages/api/dist

# Debug: List files to verify
RUN echo "📦 Checking built files:" && \
    ls -la /app/packages/shared/ && \
    ls -la /app/packages/api/ && \
    ls -la /app/packages/api/dist/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "packages/api/dist/index.js"]

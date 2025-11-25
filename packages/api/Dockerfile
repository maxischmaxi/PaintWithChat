# Dockerfile for API Service
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Install dependencies for entire monorepo
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --frozen-lockfile

# Build shared package
FROM deps AS shared-builder
COPY packages/shared ./packages/shared
RUN cd packages/shared && pnpm build

# Build API
FROM shared-builder AS api-builder
COPY packages/api ./packages/api
RUN cd packages/api && pnpm build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=api-builder /app/packages/api/dist ./packages/api/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "packages/api/dist/index.js"]

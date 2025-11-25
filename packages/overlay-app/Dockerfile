# Dockerfile for Overlay App
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Install dependencies for entire monorepo
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/overlay-app/package.json ./packages/overlay-app/
RUN pnpm install --frozen-lockfile

# Build shared package
FROM deps AS shared-builder
COPY packages/shared ./packages/shared
RUN cd packages/shared && pnpm build

# Build Overlay App
FROM shared-builder AS overlay-app-builder
COPY packages/overlay-app ./packages/overlay-app
RUN cd packages/overlay-app && pnpm build

# Production image with static file server
FROM node:20-alpine AS runner
WORKDIR /app

# Install serve for static file serving
RUN npm install -g serve

# Copy built static files
COPY --from=overlay-app-builder /app/packages/overlay-app/dist ./dist

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start static file server
CMD ["serve", "-s", "dist", "-l", "3000"]

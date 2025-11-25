# Multi-stage Dockerfile for PaintWithChat Monorepo
# This is the root Dockerfile - use service-specific Dockerfiles for individual deployments

FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# Install dependencies
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

# This is a base image - deploy individual services using service-specific Dockerfiles
FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
CMD ["echo", "This is a monorepo. Deploy individual services using their specific Dockerfiles."]

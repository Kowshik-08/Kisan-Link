# ====================================================================
# KisanLink Production Dockerfile
# Multi-stage build for minimal image size and secure runtime
# ====================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies required for native modules and Prisma
RUN apk add --no-cache openssl

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm ci
RUN npx prisma generate

# --------------------------------------------------------------------
# Production Runtime Stage
# --------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV PORT=5000

# Copy installed node_modules with generated Prisma client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Copy application source code
COPY src ./src

# Create non-root system user for security
RUN addgroup -g 1001 -S kisanlink && \
    adduser -S kisanlink -u 1001 -G kisanlink && \
    chown -R kisanlink:kisanlink /app

USER kisanlink

EXPOSE 5000

# Use dumb-init for proper signal handling (SIGTERM, SIGINT)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]

# Multi-stage Dockerfile for Next.js app (Unearth Agent)
# Build stage
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy rest of the code
COPY . .

# Build the browser extension assets if any
# This step is allowed to fail gracefully if webpack is not present in some environments.
RUN npm run build:extension || true

# Build Next.js for production
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Only copy production artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/tsconfig.json ./

ENV NODE_ENV production
ENV PORT 9002

EXPOSE 9002

# Use a non-root user for security
RUN addgroup -S app && adduser -S app -G app
USER app

# Start the Next.js server
CMD ["npm", "start"]

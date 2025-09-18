# syntax=docker/dockerfile:1.6

FROM oven/bun:1 AS base

WORKDIR /app

# Install dependencies (cached)
COPY bun.lock package.json ./
RUN bun install --ci

# Copy application source
COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run as non-root when available in the base image
USER bun

# Start the server (Bun runs TypeScript directly)
CMD ["bun", "run", "index.ts"]



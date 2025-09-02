# Use the official Bun image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code and config
COPY . .

# Build TypeScript (if needed for production)
RUN bun run build

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunuser
USER bunuser

# Expose the port (configurable via PORT env var, defaults to 3000)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Start the server in production mode
CMD ["bun", "run", "index.ts"]

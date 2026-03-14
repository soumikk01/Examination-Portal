# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files and Prisma schema (needed for postinstall prisma generate)
COPY package*.json ./
COPY prisma ./prisma
RUN npm install

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Final stage
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies and built assets from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 8787

# Use environment variable for production
ENV NODE_ENV=production

# Start command
CMD ["npm", "start"]

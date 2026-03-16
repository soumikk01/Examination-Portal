# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and Prisma schema (needed for postinstall prisma generate)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Final stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 8787

ENV NODE_ENV=production

CMD ["npm", "start"]

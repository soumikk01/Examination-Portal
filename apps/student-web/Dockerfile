# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy root configurations for global NPM workspaces
COPY package*.json ./

# Copy packages and the app workspace source code
COPY packages/ ./packages/
COPY apps/student-web/ ./apps/student-web/

# Install dependencies using the root workspace context
RUN npm install

# Build the specific workspace
RUN npm run build -w apps/student-web

# Production stage
FROM nginx:alpine

# The build output is now located inside the nested workspace folder
COPY --from=build /app/apps/student-web/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/student-web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

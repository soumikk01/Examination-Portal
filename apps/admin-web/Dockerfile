FROM node:20-alpine AS build

WORKDIR /app

# Copy root configs for workspace resolution
COPY package*.json ./

# Copy packages and the app workspace source code
COPY packages/ ./packages/
COPY apps/admin-web/ ./apps/admin-web/

# Install dependencies using the root workspace context
RUN npm install

# Build the specific workspace
RUN npm run build -w apps/admin-web

FROM nginx:alpine

# The build output is now located inside the nested workspace folder
COPY --from=build /app/apps/admin-web/dist /usr/share/nginx/html
COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_BACKEND_URL=http://localhost:8000
ARG VITE_COMPANY_NAME=CDDM

# Build the application with environment variables
RUN VITE_BACKEND_URL=$VITE_BACKEND_URL VITE_COMPANY_NAME=$VITE_COMPANY_NAME npm run build

# Stage 2: Serve stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

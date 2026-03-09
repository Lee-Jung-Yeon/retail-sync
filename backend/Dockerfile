# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy full source
COPY . .

# Build the project
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# the app binds to PORT from env by default
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main"]

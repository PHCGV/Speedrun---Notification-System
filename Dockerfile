# Use Node.js LTS Alpine (lightweight)
FROM node:18-alpine

# Define working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy package files
COPY backend/package*.json ./

# Install dependencies (use `npm install` because package-lock may not exist in build context)
RUN npm install --only=production

# Copy application files
COPY backend/ .

# Copy database schema
COPY database/ ./database

# Copy frontend to serve statically
COPY frontend/ ../frontend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server.js"]

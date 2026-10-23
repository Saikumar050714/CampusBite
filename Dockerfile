FROM node:20-slim

WORKDIR /app

# Install build dependencies for better-sqlite3 native build if needed
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install root dependencies
COPY package*.json ./
RUN npm install

# Install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm install

# Copy application source
COPY . .

# Build frontend production bundle
RUN npm run build

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server/index.js"]

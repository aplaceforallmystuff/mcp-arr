FROM node:20-slim as builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Compile app
RUN npx tsc

# Production image
FROM node:20-slim

# Create user with home directory
RUN groupadd -r app && useradd -m -r -g app app
WORKDIR /home/app
USER app

# Copy compiled app and package files
COPY --chown=app:app --from=builder /app/dist ./dist
COPY --chown=app:app package.json package-lock.json ./

RUN npm install --production

CMD [ "npx", "mcp-arr" ]
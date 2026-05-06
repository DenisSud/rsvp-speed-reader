# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:22-alpine
WORKDIR /app

# Copy only what's needed at runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.cjs ./
COPY --from=build /app/package.json /app/package-lock.json ./

# Install production deps (express only — ~2 MB)
RUN npm ci --omit=dev && npm cache clean --force

EXPOSE 3000
CMD ["node", "server.cjs"]

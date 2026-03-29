# Stage 1: Build the Vue 3 app using Vite and compile TypeScript for the server
FROM node:22 AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

ARG VITE_IS_DEV_BUILD
ENV VITE_IS_DEV_BUILD=${VITE_IS_DEV_BUILD}

WORKDIR /app

# Copy workspace config and lockfile first for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY client/package.json client/
COPY server/package.json server/

RUN pnpm install --frozen-lockfile

# Build client
COPY client/ client/
RUN pnpm --filter swiftcpq_client run build

# Build server
COPY server/ server/
RUN pnpm --filter swiftcpq_server run build

# Stage 2: Production image with only built output
FROM node:22-slim AS production

WORKDIR /server

COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/package.json ./
COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/client/dist ./dist/public

EXPOSE 5000

CMD ["node", "dist/index.js"]

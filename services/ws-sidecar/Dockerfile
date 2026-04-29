FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

FROM base AS deps
COPY services/ws-sidecar/package.json ./
RUN pnpm install --prod=false --no-frozen-lockfile

FROM deps AS build
COPY services/ws-sidecar/tsconfig.json ./
COPY services/ws-sidecar/src ./src
RUN pnpm exec tsc -p tsconfig.json

FROM base AS runner
COPY services/ws-sidecar/package.json ./
RUN pnpm install --prod --no-frozen-lockfile && pnpm store prune
COPY --from=build /app/dist ./dist
EXPOSE 4001
USER node
CMD ["node", "dist/index.js"]

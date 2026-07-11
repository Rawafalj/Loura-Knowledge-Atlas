FROM node:24.14.0-slim AS dependencies

WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages packages
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY apps/web apps/web
RUN pnpm --filter @loura/web build

FROM node:24.14.0-slim AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

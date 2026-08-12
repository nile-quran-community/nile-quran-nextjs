FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.14.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --prod --frozen-lockfile

FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.14.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# --- runner: no node_modules install at all ---
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]

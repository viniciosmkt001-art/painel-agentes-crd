# Painel de Agentes de IA — imagem de produção
# Build multi-stage: deps -> build -> runner (standalone)

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── deps ─────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ── build ────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# valores falsos só para o Next conseguir coletar as rotas de API durante o build;
# em runtime o EasyPanel injeta os valores reais, que sobrescrevem estes.
ENV SUPABASE_URL="https://build-placeholder.supabase.co"
ENV SUPABASE_SERVICE_ROLE_KEY="build-placeholder"
ENV AUTH_JWT_SECRET="build-placeholder"
RUN npm run build

# ── runner ───────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# pasta persistente de uploads (montar volume aqui)
RUN mkdir -p public/uploads/documentos public/uploads/audios && chown -R nextjs:nodejs public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

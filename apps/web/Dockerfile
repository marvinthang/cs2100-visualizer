FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY . .
RUN bun install --no-frozen-lockfile
WORKDIR /app/apps/web
RUN bun run build
FROM oven/bun:1.3 AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app /app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["bun", "run", "next", "start", "-p", "3000", "-H", "0.0.0.0"]

# Ứng dụng là SPA React (Vite) + server Express (server.ts) chạy trên Node,
# không còn là static site nginx. Build 2 giai đoạn để image gọn:
#   - builder: cài full dependencies, chạy `npm run build` (vite build + esbuild server).
#   - runner: chỉ cài dependencies production, copy artifact đã build.

# ---- Giai đoạn 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Cài dependencies theo lockfile để build ổn định.
COPY package.json package-lock.json ./
RUN npm ci

# Copy mã nguồn và build ra dist/ (client) + dist/server.cjs (server).
COPY . .
RUN npm run build

# ---- Giai đoạn 2: Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run tiêm PORT (mặc định 8080). server.ts đọc process.env.PORT.
ENV PORT=8080

# Chỉ cài dependencies production (bỏ devDependencies như vite/esbuild/tsx).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy artifact đã build từ giai đoạn builder.
COPY --from=builder /app/dist ./dist

EXPOSE 8080

# server.cjs tự phục vụ SPA từ dist/ khi NODE_ENV=production.
CMD ["node", "dist/server.cjs"]

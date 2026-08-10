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

# VITE_API_BASE_URL được Vite "nướng" vào bundle client lúc build, nên phải truyền
# qua build-arg (không phải env runtime) — xem .github/workflows/deploy.yml.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Không bắt buộc: email điền sẵn ở ô "Đăng nhập Quản trị viên". Bỏ trống thì dùng
# mặc định admin@gimasys.com. Phải khớp BOOTSTRAP_ADMIN_EMAIL của backend.
ARG VITE_ADMIN_LOGIN_EMAIL
ENV VITE_ADMIN_LOGIN_EMAIL=$VITE_ADMIN_LOGIN_EMAIL

# Chặn build "im lặng lỗi": thiếu build-arg thì api.ts rơi về fallback same-origin
# "/api/v1", tức client gọi vào chính server này và nhận index.html thay vì JSON.
RUN test -n "$VITE_API_BASE_URL" || { \
      echo "ERROR: build-arg VITE_API_BASE_URL is empty."; \
      echo "       Build with: docker build --build-arg VITE_API_BASE_URL=https://<backend-host>/api/v1 ."; \
      exit 1; \
    }

# Đăng nhập bằng Google giờ là đường vào DUY NHẤT: thiếu client id thì trang đăng
# nhập không có nút nào bấm được, tức là toàn bộ hệ thống không dùng được.
RUN test -n "$VITE_GOOGLE_CLIENT_ID" || { \
      echo "ERROR: build-arg VITE_GOOGLE_CLIENT_ID is empty."; \
      echo "       Google Sign-In is the only way to log in, so the app would be unusable."; \
      echo "       Build with: docker build --build-arg VITE_GOOGLE_CLIENT_ID=<oauth-client-id>.apps.googleusercontent.com ."; \
      exit 1; \
    }

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

# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build Frontend Assets
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /build

# تثبيت متطلبات البناء
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# نسخ كود الواجهة الأمامية وإعدادات البناء
COPY tsconfig*.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/

# بناء حزم الإنتاج للواجهة الأمامية
RUN npm run build

# ==============================================================================
# Stage 2: Production Container Image (Minimal Attack Surface & Non-Root)
# ==============================================================================
FROM node:22-alpine AS runner

# تثبيت مشغل العمليات tini لضمان التقاط إشارات SIGTERM / SIGINT وتجنب Zombie Processes
RUN apk add --no-cache tini

WORKDIR /app

# تحديد بيئة التشغيل للإنتاج
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# تثبيت الاعتماديات الخاصة بالإنتاج فقط
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# نسخ الأصول المبنية من مرحلة البناء
COPY --from=builder /build/dist ./dist

# نسخ كود الخادم الخلفي فقط (دون أي ملفات سرية أو بيئية)
COPY server/ ./server/

# تشغيل الحاوية بمستخدم غير مميز (Non-Root User) لتقليل الامتيازات
USER node

# المنفذ الرسمي المعتمد في Google Cloud Run
EXPOSE 8080

# فحص صحة الحاوية التلقائي (Liveness Probe)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# تشغيل الخادم بواسطة tini لضمان الإغلاق الآمن Graceful Shutdown
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/index.mjs"]

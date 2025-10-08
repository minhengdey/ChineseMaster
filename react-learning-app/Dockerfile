# --- Build stage ---
FROM node:18-alpine AS frontend-build
WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# Copy package.json và package-lock.json rồi cài dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ source
COPY . .

# Chỉ build bằng Vite, không dùng tsc
RUN npm run build

# --- Serve stage ---
FROM nginx:1.29.2-alpine
# Copy thư mục build của Vite sang nginx
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy cấu hình nginx nếu có
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

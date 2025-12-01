# --- Build stage ---
FROM node:20-alpine AS frontend-build
WORKDIR /app

# Copy package.json & package-lock.json trước để optimize caching
COPY package*.json ./
RUN npm install

# Copy toàn bộ source
COPY . .

# Build Vite
RUN npm run build

# --- Serve stage ---
FROM nginx:1.25-alpine

# Copy build output của Vite
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

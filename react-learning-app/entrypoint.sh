#!/bin/sh
# entrypoint.sh

# Tạo lại file env-config.js với các biến môi trường được truyền vào lúc runtime
echo "window._env_ = {" > /usr/share/nginx/html/env-config.js
echo "  VITE_API_BASE_URL: \"$VITE_API_BASE_URL\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_CLOUDINARY_PINYIN_AUDIO_BASE_URL: \"$VITE_CLOUDINARY_PINYIN_AUDIO_BASE_URL\"," >> /usr/share/nginx/html/env-config.js
# Thêm các biến khác nếu cần
echo "};" >> /usr/share/nginx/html/env-config.js

# Thực thi lệnh mặc định của container (chạy Nginx)
exec "$@"
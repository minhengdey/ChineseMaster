# Kiến trúc Frontend - Chinese Master

## Cấu trúc thư mục `src/`

```
src/
├── assets/           # Hình ảnh, font, static files
├── components/       # Component dùng chung toàn app
│   ├── layout/      # PageLayout, layout wrappers
│   └── ui/          # Button, Badge, ... (dùng chung nhiều trang)
├── constants/       # Hằng số: routes, config
├── pages/           # Mỗi route = 1 page, mỗi page có components/ riêng
├── services/        # API client, gọi backend (api.js)
├── store/           # Zustand stores (UserStore, ...)
├── utils/           # Hàm tiện ích (audioUtils, textUtils, ...)
├── App.jsx
├── main.jsx
└── index.css
```

## Quy ước

### 1. Path alias `@`
- Import từ `@/` = bắt đầu từ `src/`.
- Ví dụ: `import { Button } from "@/components/ui"` → `src/components/ui/index.js`.

### 2. Components
- **Shared (dùng nhiều page)**: đặt trong `src/components/`.
  - `layout/`: PageLayout.
  - `ui/`: Button, Badge (và các component UI tái sử dụng).
- **Chỉ dùng trong 1 page**: đặt trong `pages/<PageName>/components/`.
- Mỗi thư mục component nên có `index.js` barrel export.

### 3. Pages
- Mỗi page có thư mục riêng: `pages/<PageName>/`.
- File entry: `index.jsx` (hoặc `index.js`).
- Component riêng của page: `pages/<PageName>/components/`.
- Trang nên bọc nội dung bằng `PageLayout` (trừ Login hoặc layout đặc biệt).

### 4. API & data
- Tất cả gọi backend qua `src/services/api.js`.
- Cache và in-flight dedupe nằm trong `api.js`; không clear storage tùy tiện khi đổi trang.

### 5. Constants
- Đường dẫn route: dùng `src/constants/routes.js` (ROUTES).
- Có thể mở rộng: config app, text dùng chung.

### 6. Store
- Global state (user, ...): `src/store/UserStore.js` (Zustand).

### 7. Utils
- Hàm thuần, không React: đặt trong `src/utils/`.
- Ví dụ: `audioUtils.js`, `textUtils.js`.

## Luồng điển hình

- **Routing**: `App.jsx` định nghĩa Routes; route path nên tham chiếu `constants/routes.js` khi cần.
- **Auth**: ProtectedRoute kiểm tra đăng nhập; profile lấy từ API và lưu UserStore.
- **Trang**: Page → PageLayout → các component con (có thể import từ `@/components/ui` hoặc `./components/`).

## Mở rộng sau này

- **hooks/**: Custom hooks (useAuth, useCurriculum, ...) nếu tách logic dùng lại.
- **services/api/**: Tách api.js thành nhiều module (auth, content, assessment, ...) nếu file quá lớn.
- **contexts/**: React Context nếu cần state chia sẻ phức tạp hơn store hiện tại.

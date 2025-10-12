import { create } from "zustand";

// Định nghĩa state ban đầu
const initialState = {
   user: null,
};

// Tạo store bằng hàm create()
export const useUserStore = create((set) => ({
   ...initialState,
   setUser: (user) => set({ user }),
}));

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

export interface CustomerCartItem {
  id: string; // unique ID for cart item (e.g. spId-mau-size)
  spId: string;
  spTen: string;
  hinhAnh?: string;
  mauCode: string;
  mauTen: string;
  size: string;
  soLuong: number;
  donGia: number;
}

interface CustomerCartState {
  items: CustomerCartItem[];
  addItem: (item: Omit<CustomerCartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, soLuong: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCustomerCart = create<CustomerCartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const id = `${newItem.spId}-${newItem.mauCode}-${newItem.size}`;
        set((state) => {
          const existingItem = state.items.find((i) => i.id === id);
          if (existingItem) {
            toast.success(`Đã cập nhật số lượng ${newItem.spTen} trong giỏ`);
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, soLuong: i.soLuong + newItem.soLuong } : i
              ),
            };
          }
          toast.success(`Đã thêm ${newItem.spTen} vào giỏ hàng`);
          return { items: [...state.items, { ...newItem, id }] };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, soLuong) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, soLuong: Math.max(1, soLuong) } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.soLuong, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.donGia * item.soLuong,
          0
        );
      },
    }),
    {
      name: "mimin-customer-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

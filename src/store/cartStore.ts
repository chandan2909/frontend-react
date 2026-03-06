import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/apiClient';

export interface CartItem {
  id: number;
  title: string;
  price: number;
  originalPrice: number;
  gradient: string;
  thumbnail_url?: string;
}

interface CartState {
  items: CartItem[];
  purchased: number[]; // subject IDs that have been "purchased" (local cache)
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  clearAll: () => void; // clears items AND purchased (called on logout)
  isInCart: (id: number) => boolean;
  isPurchased: (id: number) => boolean;
  purchaseAll: () => Promise<void>;
  purchaseSingle: (id: number) => Promise<void>;
  getTotal: () => number;
  getOriginalTotal: () => number;
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      purchased: [],

      addItem: (item) => {
        const { items } = get();
        if (!items.find((i) => i.id === item.id)) {
          set({ items: [...items, item] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      clearCart: () => set({ items: [] }),

      clearAll: () => set({ items: [], purchased: [] }),

      isInCart: (id) => get().items.some((i) => i.id === id),

      isPurchased: (id) => get().purchased.includes(id),

      purchaseAll: async () => {
        const { items, purchased } = get();
        if (items.length === 0) return;

        const subjectIds = items.map((i) => i.id);
        
        try {
          // Notify backend
          await apiClient.post('/subjects/enroll', { subjectIds });
          
          const newPurchased = [...purchased, ...subjectIds];
          set({ purchased: [...new Set(newPurchased)], items: [] });
        } catch (error) {
          console.error('Failed to persist enrollment:', error);
          throw error;
        }
      },

      purchaseSingle: async (id) => {
        const { purchased, items } = get();
        if (purchased.includes(id)) return;

        try {
          await apiClient.post('/subjects/enroll', { subjectIds: [id] });
          
          set({
            purchased: [...new Set([...purchased, id])],
            items: items.filter((i) => i.id !== id),
          });
        } catch (error) {
          console.error('Failed to persist single enrollment:', error);
          throw error;
        }
      },

      getTotal: () => get().items.reduce((sum, i) => sum + i.price, 0),

      getOriginalTotal: () => get().items.reduce((sum, i) => sum + i.originalPrice, 0),
    }),
    { name: 'kodemy-cart' }
  )
);

export default useCartStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  /** Tope de disponibilidad conocido al agregar; se revalida en checkout vía Realtime/RPC. */
  availableQuantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            const nextQty = Math.min(existing.quantity + item.quantity, existing.availableQuantity);
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId ? { ...i, quantity: nextQty } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.availableQuantity)) }
              : i
          ),
        })),

      clear: () => set({ items: [] }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    }),
    { name: 'kikids-cart' } // localStorage — persistencia local del carrito
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  productName: string;
  size: string;
  color: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  /** Tope de disponibilidad conocido al agregar; se revalida en checkout vía Realtime/RPC. */
  availableQuantity: number;
}

export interface VariantFreshData {
  variantId: string;
  unitPrice: number;
  availableQuantity: number;
  /** false si la variante fue desactivada o el producto ya no existe/está inactivo. */
  stillAvailable: boolean;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  /**
   * El carrito persiste en localStorage con el precio "congelado" al
   * momento de agregar el producto. Si el admin cambia el precio (o el
   * precio estaba mal calculado en una sesión anterior), el carrito
   * seguiría mostrando el valor viejo hasta que se sincroniza contra la
   * base real — ver useSyncCartPrices, llamado en checkout/carrito.
   */
  syncFromCatalog: (fresh: VariantFreshData[]) => void;
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

      syncFromCatalog: (fresh) =>
        set((state) => {
          const byId = new Map(fresh.map((f) => [f.variantId, f]));
          const items: CartItem[] = [];
          for (const item of state.items) {
            const current = byId.get(item.variantId);
            if (!current || !current.stillAvailable) continue; // producto/variante eliminado o desactivado
            items.push({
              ...item,
              unitPrice: current.unitPrice,
              availableQuantity: current.availableQuantity,
              quantity: Math.max(1, Math.min(item.quantity, current.availableQuantity)),
            });
          }
          return { items };
        }),
    }),
    { name: 'kikids-cart' } // localStorage — persistencia local del carrito
  )
);

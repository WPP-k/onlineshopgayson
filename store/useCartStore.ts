import { create } from 'zustand';

export interface PromotionInfo {
  id?: string;
  type: "BUY_1_GET_1" | "BUY_2_GET_1" | "DISCOUNT" | string;
  discountPrice?: number | null;
  discountPercent?: number | null;
  badgeText?: string | null;
  name?: string | null;
  isActive?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  promotion?: PromotionInfo | null;
}

export interface CartItem extends Product {
  quantity: number;
}

export function calculateItemDiscount(item: CartItem): number {
  if (!item.promotion || item.promotion.isActive === false) return 0;

  if (item.promotion.type === "BUY_1_GET_1") {
    const freeUnits = Math.floor(item.quantity / 2);
    return freeUnits * item.price;
  }

  if (item.promotion.type === "BUY_2_GET_1") {
    const freeUnits = Math.floor(item.quantity / 3);
    return freeUnits * item.price;
  }

  if (item.promotion.type === "DISCOUNT" && typeof item.promotion.discountPrice === "number") {
    const discountPerUnit = Math.max(0, item.price - item.promotion.discountPrice);
    return discountPerUnit * item.quantity;
  }

  return 0;
}

export function calculateCartDiscount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
}

export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateCartTotal(items: CartItem[]): number {
  const subtotal = calculateCartSubtotal(items);
  const discount = calculateCartDiscount(items);
  return Math.max(0, subtotal - discount);
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  decreaseItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product, quantity = 1) => {
    const qty = quantity > 0 ? quantity : 1;
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.id === product.id);

    if (existingItem) {
      set({
        items: currentItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                promotion: product.promotion !== undefined ? product.promotion : item.promotion,
              }
            : item
        ),
      });
    } else {
      set({ items: [...currentItems, { ...product, quantity: qty }] });
    }
  },
  decreaseItem: (productId) => {
    const currentItems = get().items;
    const existingItem = currentItems.find((item) => item.id === productId);

    if (existingItem && existingItem.quantity > 1) {
      set({
        items: currentItems.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        ),
      });
    } else if (existingItem && existingItem.quantity === 1) {
      set({ items: currentItems.filter((item) => item.id !== productId) });
    }
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((item) => item.id !== productId) });
      return;
    }
    set({
      items: get().items.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ),
    });
  },
  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.id !== productId) });
  },
  clearCart: () => set({ items: [] }),
  getSubtotal: () => calculateCartSubtotal(get().items),
  getDiscount: () => calculateCartDiscount(get().items),
  getTotal: () => calculateCartTotal(get().items),
}));

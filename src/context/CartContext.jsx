"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import apiClient from "@/lib/api";
import { useAuth } from "./AuthContext";
import { ROLES } from "@/lib/constants";

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const { isAuthenticated, user } = useAuth();

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || user?.role !== ROLES.STUDENT) return;
    try {
      const { data } = await apiClient.get("/orders/cart/");
      // Map backend CartItem to frontend CartItem type
      const mapped = data.items.map((i) => ({
        inventoryId: i.inventory,
        productId: i.product_id, // Note: backend doesn't return product_id directly, we may need to adapt this if shop uses it.
        productName: i.product_name,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        unitPrice: parseFloat(i.unit_price),
        schoolId: i.school_id, // Same here, may need adaptation depending on how it's used.
      }));
      setItems(mapped);
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(
    async (newItem) => {
      if (!isAuthenticated || user?.role !== ROLES.STUDENT) return;
      try {
        const existing = items.find(
          (i) => i.inventoryId === newItem.inventoryId,
        );
        const newQty = existing
          ? existing.quantity + newItem.quantity
          : newItem.quantity;

        await apiClient.post("/orders/cart/items/", {
          inventory_id: newItem.inventoryId,
          quantity: newQty,
        });
        await fetchCart();
      } catch (err) {
        console.error("Failed to add item to cart", err);
      }
    },
    [isAuthenticated, items, fetchCart, user],
  );

  const removeItem = useCallback(
    async (inventoryId) => {
      if (!isAuthenticated || user?.role !== ROLES.STUDENT) return;
      try {
        await apiClient.delete("/orders/cart/items/", {
          data: { inventory_id: inventoryId },
        });
        await fetchCart();
      } catch (err) {
        console.error("Failed to remove item", err);
      }
    },
    [isAuthenticated, fetchCart, user],
  );

  const updateQuantity = useCallback(
    async (inventoryId, qty) => {
      if (!isAuthenticated || user?.role !== ROLES.STUDENT) return;
      try {
        await apiClient.post("/orders/cart/items/", {
          inventory_id: inventoryId,
          quantity: qty,
        });
        await fetchCart();
      } catch (err) {
        console.error("Failed to update quantity", err);
      }
    },
    [isAuthenticated, fetchCart, user],
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated || user?.role !== ROLES.STUDENT) return;
    try {
      // Loop and delete or we could add a clear endpoint
      for (const item of items) {
        await apiClient.delete("/orders/cart/items/", {
          data: { inventory_id: item.inventoryId },
        });
      }
      setItems([]);
    } catch (err) {
      console.error("Failed to clear cart", err);
    }
  }, [isAuthenticated, items, user]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

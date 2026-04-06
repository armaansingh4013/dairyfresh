import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dairy-cart";
const CartContext = createContext(null);

function readStoredCart() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStoredCart());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product._id);
      if (existing) {
        return current.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...current,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          description: product.description || "",
          quantity
        }
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId) {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      subtotal: items.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
        0
      )
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

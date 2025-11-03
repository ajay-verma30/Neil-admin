import React, { createContext, useEffect, useState } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setInitialized(true);
  }, []);
  useEffect(() => {
    if (initialized) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, initialized]);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (i) =>
          i.product_id === item.product_id &&
          JSON.stringify(i.sizes) === JSON.stringify(item.sizes)
      );

      if (existingIndex !== -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
          total_price: (
            parseFloat(updated[existingIndex].total_price) +
            parseFloat(item.total_price)
          ).toFixed(2),
        };
        return updated;
      }
      return [...prevCart, item];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

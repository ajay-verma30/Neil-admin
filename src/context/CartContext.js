import React, { createContext, useEffect, useState, useMemo } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
        setCart([]);
      }
    }
    setInitialized(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (initialized) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, initialized]);

  // Derived State: Total count of items in cart
  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  }, [cart]);

  const addToCart = (item) => {
    setCart((prevCart) => {
      // Check if product with same ID and same sizes already exists
      const existingIndex = prevCart.findIndex(
        (i) =>
          i.product_id === item.product_id &&
          JSON.stringify(i.sizes) === JSON.stringify(item.sizes)
      );

      if (existingIndex !== -1) {
        const updated = [...prevCart];
        const existingItem = updated[existingIndex];
        
        updated[existingIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + item.quantity,
          total_price: (
            parseFloat(existingItem.total_price) + parseFloat(item.total_price)
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
    <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
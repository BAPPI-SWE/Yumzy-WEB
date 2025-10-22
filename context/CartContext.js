import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Initialize cart state from localStorage or empty object
  const [cart, setCart] = useState({});

  // --- Load cart from localStorage when the app starts ---
  useEffect(() => {
    const savedCart = localStorage.getItem('yumzyCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
        localStorage.removeItem('yumzyCart'); // Clear corrupted data
        setCart({});
      }
    }
  }, []);

  // --- Save cart to localStorage whenever it changes ---
  useEffect(() => {
    // Only save if cart is not empty, otherwise remove the item
    if (Object.keys(cart).length > 0) {
      localStorage.setItem('yumzyCart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('yumzyCart');
    }
  }, [cart]);

  // --- Cart Manipulation Functions (Similar to CartViewModel) ---

  // Adds a new item or sets quantity to 1 if it doesn't exist
  // menuItem needs: { id, name, price }
  // restaurant details needed: { restaurantId, restaurantName }
  const addToCart = (menuItem, restaurantDetails) => {
    setCart((prevCart) => {
      const itemId = menuItem.id;
      // Check if any item from a *different* restaurant exists
      const existingRestaurantId = Object.values(prevCart)[0]?.restaurantId;
      if (
        existingRestaurantId &&
        existingRestaurantId !== restaurantDetails.restaurantId
      ) {
        // !! IMPORTANT: You cannot mix items from different restaurants !!
        // In a real app, you'd show a confirmation dialog here.
        // For now, we'll just alert and prevent adding.
        alert(
          'You can only order from one restaurant at a time. Please clear your cart first.'
        );
        return prevCart; // Return the unchanged cart
      }

      const newItem = {
        menuItem: menuItem,
        quantity: 1,
        restaurantId: restaurantDetails.restaurantId,
        restaurantName: restaurantDetails.restaurantName,
      };
      return { ...prevCart, [itemId]: newItem };
    });
  };

  // Increments quantity of an existing item
  const incrementItem = (itemId) => {
    setCart((prevCart) => {
      const existingItem = prevCart[itemId];
      if (existingItem) {
        return {
          ...prevCart,
          [itemId]: { ...existingItem, quantity: existingItem.quantity + 1 },
        };
      }
      return prevCart; // Should not happen if called correctly
    });
  };

  // Decrements quantity or removes item if quantity becomes 0
  const decrementItem = (itemId) => {
    setCart((prevCart) => {
      const existingItem = prevCart[itemId];
      if (existingItem) {
        if (existingItem.quantity > 1) {
          return {
            ...prevCart,
            [itemId]: {
              ...existingItem,
              quantity: existingItem.quantity - 1,
            },
          };
        } else {
          // Remove the item completely
          const newCart = { ...prevCart };
          delete newCart[itemId];
          return newCart;
        }
      }
      return prevCart;
    });
  };

  // Clears all items for a specific restaurant (or the whole cart if only one restaurant)
  const clearCartForRestaurant = (restaurantId) => {
    setCart((prevCart) => {
      const newCart = {};
      for (const itemId in prevCart) {
        if (prevCart[itemId].restaurantId !== restaurantId) {
          newCart[itemId] = prevCart[itemId];
        }
      }
      // If clearing the cart results in an empty cart, update localStorage
      if (Object.keys(newCart).length === 0) {
          localStorage.removeItem('yumzyCart');
      }
      return newCart;
    });
  };

  // Clears the entire cart
  const clearCart = () => {
      setCart({});
      localStorage.removeItem('yumzyCart'); // Ensure localStorage is cleared
  };

  // Calculate total number of items in the cart
  const totalItems = Object.values(cart).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Calculate total price
  const totalPrice = Object.values(cart).reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
  );

  const value = {
    cart, // The cart object { itemId: { menuItem, quantity, restaurantId, restaurantName } }
    addToCart,
    incrementItem,
    decrementItem,
    clearCartForRestaurant,
    clearCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use the cart context easily
export const useCart = () => {
  return useContext(CartContext);
};
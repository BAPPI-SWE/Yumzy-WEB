import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Initialize cart state from localStorage or empty object
  const [cart, setCart] = useState({});
  
  // Maximum items limit
  const MAX_ITEMS = 5;

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

  // --- Helper function to get total item count ---
  const getTotalItemCount = (cartState = cart) => {
    return Object.values(cartState).reduce((sum, item) => sum + item.quantity, 0);
  };

  // --- Helper function to show toast notification ---
  const showToast = (message) => {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    `;
    
    // Add animation keyframes if not already added
    if (!document.getElementById('toast-animation-style')) {
      const style = document.createElement('style');
      style.id = 'toast-animation-style';
      style.textContent = `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  // --- Cart Manipulation Functions (Similar to CartViewModel) ---

  // Adds a new item or sets quantity to 1 if it doesn't exist
  // menuItem needs: { id, name, price }
  // restaurant details needed: { restaurantId, restaurantName }
  const addToCart = (menuItem, restaurantDetails) => {
    setCart((prevCart) => {
      const itemId = menuItem.id;
      
      // Check current total items
      const currentTotal = getTotalItemCount(prevCart);
      
      // If item doesn't exist and we're at limit, prevent adding
      if (!prevCart[itemId] && currentTotal >= MAX_ITEMS) {
        showToast(`You can order maximum ${MAX_ITEMS} items at a time`);
        return prevCart;
      }
      
      // Check if any item from a *different* restaurant exists
      const existingRestaurantId = Object.values(prevCart)[0]?.restaurantId;
      if (
        existingRestaurantId &&
        existingRestaurantId !== restaurantDetails.restaurantId
      ) {
        // !! IMPORTANT: You cannot mix items from different restaurants !!
        // In a real app, you'd show a confirmation dialog here.
        // For now, we'll just alert and prevent adding.
        showToast('You can only order from one restaurant at a time. Please clear your cart first.');
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
        // Check current total items
        const currentTotal = getTotalItemCount(prevCart);
        
        // If at limit, prevent incrementing
        if (currentTotal >= MAX_ITEMS) {
          showToast(`You can order maximum ${MAX_ITEMS} items at a time`);
          return prevCart;
        }
        
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
  const totalItems = getTotalItemCount();

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
    maxItems: MAX_ITEMS, // Expose max items limit
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use the cart context easily
export const useCart = () => {
  return useContext(CartContext);
};
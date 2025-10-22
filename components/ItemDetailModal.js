import { useCart } from '../context/CartContext'; // Adjust path
import { XMarkIcon, PlusIcon, MinusIcon, ShoppingCartIcon, BuildingStorefrontIcon, TagIcon } from '@heroicons/react/24/solid';

import { useState, useEffect, useMemo } from 'react';


// Quantity Selector (copied and adapted from previous steps)
const QuantitySelector = ({ quantity, onAdd, onIncrement, onDecrement, isEnabled }) => {
  // Use slightly larger buttons in the modal
  if (quantity === 0) {
    return (
      <button
        onClick={onAdd}
        disabled={!isEnabled}
        className="w-10 h-10 flex items-center justify-center bg-brandPink text-white rounded-full disabled:bg-gray-300 transition hover:bg-opacity-90 shadow"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
    );
  } else {
    return (
      <div className="flex items-center space-x-3">
        <button
          onClick={onDecrement}
          disabled={!isEnabled}
          className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full disabled:bg-gray-300 transition hover:bg-gray-300 shadow-sm"
        >
          <MinusIcon className="w-5 h-5" />
        </button>
        <span className="text-lg font-bold min-w-[24px] text-center">{quantity}</span>
        <button
          onClick={onIncrement}
          disabled={!isEnabled}
          className="w-8 h-8 flex items-center justify-center bg-brandPink text-white rounded-full disabled:bg-gray-300 transition hover:bg-opacity-90 shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }
};


export default function ItemDetailModal({ item, onClose }) {
  if (!item) return null;

  const { cart, addToCart, incrementItem, decrementItem } = useCart();
  const isMultiVariant = item.variants && item.variants.length > 0;
  const isEnabled = item.isEnabled; // Use the combined status passed in

  // Calculate total quantity for this item (across variants if multi)
  const totalQuantity = useMemo(() => {
      if (!isMultiVariant) {
          return cart[item.id]?.quantity || 0;
      } else {
          return item.variants.reduce((sum, variant) => {
              const variantId = `${item.id}_${variant.name}`;
              return sum + (cart[variantId]?.quantity || 0);
          }, 0);
      }
  }, [cart, item, isMultiVariant]);


  // Helper to create the generic MenuItem structure for cart functions
  const createCartMenuItem = (variant = null) => {
      const id = variant ? `${item.id}_${variant.name}` : item.id;
      const name = variant ? `${item.name} (${variant.name})` : item.name;
      const price = variant ? variant.price : item.price;
      return { id, name, price, category: 'Store Item' }; // Add category
  };

  // Helper for restaurant details
  const restaurantDetails = { restaurantId: 'yumzy_store', restaurantName: item.miniResName || 'Yumzy Store' };


  return (
    // Modal Backdrop & Container
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      {/* Modal Content (stop propagation to prevent closing when clicking inside) */}
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Section */}
        <div className="relative h-48 w-full bg-gray-200 flex-shrink-0">
          <img
            src={item.imageUrl || '/placeholder-image.png'}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
           {/* Close Button */}
           <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition z-10"
           >
              <XMarkIcon className="w-5 h-5" />
           </button>
           {/* Total Quantity Badge (optional) */}
           {totalQuantity > 0 && (
               <span className="absolute top-3 left-3 flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-brandPink rounded-full shadow">
                   {totalQuantity}
               </span>
           )}
        </div>

        {/* Scrollable Details Section */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-800">{item.name}</h2>

          {/* Mini Restaurant Name (if available) */}
          {item.miniResName && (
            <div className="flex items-center space-x-1.5 text-xs text-brandPink font-medium">
              <BuildingStorefrontIcon className="w-4 h-4" />
              <span>{item.miniResName}</span>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-gray-600">{item.itemDescription || 'No description available.'}</p>

          {/* Availability Message */}
          {!isEnabled && (
            <p className="text-sm text-red-600 font-semibold text-center py-2 bg-red-50 rounded">
              {item.stock !== 'yes' ? 'Currently Out of Stock' : 'Shop is Closed'}
            </p>
          )}

          {/* Variant Selection or Single Item Price/Controls */}
          {isMultiVariant ? (
            // --- Multi-Variant Display ---
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-semibold text-gray-700">Choose Variant:</h3>
              {item.variants.map((variant) => {
                const variantId = `${item.id}_${variant.name}`;
                const quantity = cart[variantId]?.quantity || 0;
                const cartMenuItem = createCartMenuItem(variant);

                return (
                  <div key={variant.name} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{variant.name}</p>
                      <p className="text-sm font-bold text-brandPink">৳{variant.price.toFixed(0)}</p>
                    </div>
                    <QuantitySelector
                      quantity={quantity}
                      onAdd={() => addToCart(cartMenuItem, restaurantDetails)}
                      onIncrement={() => incrementItem(variantId)}
                      onDecrement={() => decrementItem(variantId)}
                      isEnabled={isEnabled}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // --- Single Item Display ---
            <div className="flex justify-between items-center pt-3">
               <div>
                   <p className="text-xs text-gray-500">Price</p>
                   <p className="text-xl font-bold text-brandPink">৳{item.price.toFixed(0)}</p>
               </div>
              <QuantitySelector
                quantity={cart[item.id]?.quantity || 0}
                onAdd={() => addToCart(createCartMenuItem(), restaurantDetails)}
                onIncrement={() => incrementItem(item.id)}
                onDecrement={() => decrementItem(item.id)}
                isEnabled={isEnabled}
              />
            </div>
          )}
        </div>

         {/* Optional Footer/Action Button */}
         <div className="p-4 border-t border-gray-200 mt-auto flex-shrink-0">
             <button
                onClick={onClose} // Simply closes the modal
                className="w-full h-[45px] flex items-center justify-center bg-darkPink text-white rounded-lg text-sm font-semibold transition hover:bg-opacity-90"
             >
                {totalQuantity > 0 ? `Done (${totalQuantity} item${totalQuantity > 1 ? 's' : ''})` : 'Close'}
             </button>
         </div>
      </div>
    </div>
  );
}
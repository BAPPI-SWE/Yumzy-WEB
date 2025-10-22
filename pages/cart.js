import ProtectedRoute from '../components/ProtectedRoute'; // Adjust path if needed
import { useCart } from '../context/CartContext'; // Adjust path if needed
import { useRouter } from 'next/router';
import { ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid';

// --- Reusable Components (Similar to CartScreen.kt) ---

// Quantity Selector (copied and slightly adapted)
const QuantitySelector = ({ quantity, onIncrement, onDecrement }) => {
  return (
    <div className="flex items-center space-x-2.5">
      <button
        onClick={onDecrement}
        className="w-7 h-7 flex items-center justify-center bg-red-100 text-brandPink rounded-full transition hover:bg-red-200"
      >
        <MinusIcon className="w-4 h-4" />
      </button>
      <span className="text-base font-bold min-w-[20px] text-center">{quantity}</span>
      <button
        onClick={onIncrement}
        className="w-7 h-7 flex items-center justify-center bg-brandPink text-white rounded-full transition hover:bg-opacity-90"
      >
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// Cart Item Row (similar to CartItemRow)
const CartItemRow = ({ item, onIncrement, onDecrement }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 mr-4">
        <p className="text-sm font-semibold text-gray-800">{item.menuItem.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">৳{item.menuItem.price.toFixed(0)}</p>
      </div>
      <QuantitySelector
        quantity={item.quantity}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />
    </div>
  );
};

// Restaurant Cart Card (similar to RestaurantCartCard)
const RestaurantCartCard = ({ restaurantName, restaurantId, items, onIncrement, onDecrement, onClearRestaurant, onPlaceOrder }) => {
  const subTotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
         <div className="flex items-center space-x-2">
             <BuildingStorefrontIcon className="w-5 h-5 text-deepPink"/>
            <h3 className="text-base font-bold text-gray-800">{restaurantName}</h3>
         </div>
         {/* Optional: Clear button for this restaurant */}
         <button
            onClick={() => onClearRestaurant(restaurantId)}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
            title={`Clear all items from ${restaurantName}`}
         >
            Clear
         </button>
      </div>

      {/* Items */}
      <div className="p-4 divide-y divide-gray-100">
        {items.map((item) => (
          <CartItemRow
            key={item.menuItem.id} // Use unique item ID as key
            item={item}
            onIncrement={() => onIncrement(item.menuItem.id)}
            onDecrement={() => onDecrement(item.menuItem.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Subtotal:</span>
          <span className="text-lg font-bold text-deepPink">৳{subTotal.toFixed(0)}</span>
        </div>
        <button
          onClick={() => onPlaceOrder(restaurantId)}
          className="w-full h-[45px] flex items-center justify-center bg-darkPink text-white rounded-lg text-sm font-semibold transition hover:bg-opacity-90"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

// --- Main Cart Page Component ---
function CartPage() {
  const { cart, incrementItem, decrementItem, clearCartForRestaurant } = useCart();
  const router = useRouter();

  // --- Group items by restaurant ---
  const groupedItems = Object.values(cart).reduce((acc, item) => {
    const { restaurantId } = item;
    if (!acc[restaurantId]) {
      acc[restaurantId] = {
        restaurantName: item.restaurantName,
        items: [],
      };
    }
    acc[restaurantId].items.push(item);
    return acc;
  }, {}); // Result: { restaurantId1: { restaurantName: 'Name', items: [...] }, ... }

  const restaurantIds = Object.keys(groupedItems);

  const handlePlaceOrder = (restaurantId) => {
      router.push(`/checkout/${restaurantId}`);
  };

  return (
    <div className="min-h-screen bg-lightGray pb-10"> {/* Ensure content clears bottom nav */}
       {/* Custom Top Bar */}
       <div className="bg-darkPink text-white pt-10 pb-5 px-4 rounded-b-[20px] shadow-md sticky top-0 z-10">
            <h1 className="text-xl font-bold text-center">My Cart</h1>
       </div>

       {/* Cart Content */}
       <div className="p-4 space-y-4">
        {restaurantIds.length === 0 ? (
          // Empty Cart View
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <ShoppingCartIcon className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">Your cart is empty.</p>
            <p className="text-sm text-gray-400 mt-1">Add items from restaurants or stores!</p>
            <button
                onClick={() => router.push('/home')}
                className="mt-6 px-5 py-2 bg-brandPink text-white rounded-lg font-semibold text-sm"
            >
                Browse Items
            </button>
          </div>
        ) : (
          // List of Restaurant Carts
          restaurantIds.map((resId) => (
            <RestaurantCartCard
              key={resId}
              restaurantId={resId}
              restaurantName={groupedItems[resId].restaurantName}
              items={groupedItems[resId].items}
              onIncrement={incrementItem}
              onDecrement={decrementItem}
              onClearRestaurant={clearCartForRestaurant} // Pass clear function
              onPlaceOrder={handlePlaceOrder}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Wrap the page with ProtectedRoute
export default function Cart() {
  return (
    <ProtectedRoute>
      <CartPage />
    </ProtectedRoute>
  );
}
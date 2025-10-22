import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase/config'; // Adjust path based on file location
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useCart } from '../../../context/CartContext'; // Adjust path
import LoadingSpinner from '../../../components/LoadingSpinner'; // Adjust path
import { ArrowLeftIcon, PlusIcon, MinusIcon, ShoppingCartIcon, CheckCircleIcon, ClockIcon, BuildingStorefrontIcon, ArrowRightIcon, ChevronRightIcon, BanknotesIcon } from '@heroicons/react/24/solid'; // Use solid icons for consistency
import { SparklesIcon, FireIcon } from '@heroicons/react/24/outline'; // Outline for Blinking

// --- Reusable Components (from RestaurantMenuScreen.kt) ---

// Simple Card for Menu Item (similar to MenuItemRow)
const MenuItemCard = ({ menuItem, quantity, onAdd, onIncrement, onDecrement, isEnabled }) => {
    return (
        <div className={`bg-white rounded-xl shadow p-4 flex items-center space-x-4 ${!isEnabled ? 'opacity-60' : ''}`}>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{menuItem.name}</p>
                <p className="text-sm font-bold text-brandPink mt-1">
                   ৳{menuItem.price.toFixed(0)} {/* Display price */}
                </p>
            </div>
            {/* Quantity Selector */}
            <QuantitySelector
                quantity={quantity}
                onAdd={onAdd}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                isEnabled={isEnabled}
            />
        </div>
    );
};

// Quantity Selector (similar to RestaurantMenuScreen.kt)
const QuantitySelector = ({ quantity, onAdd, onIncrement, onDecrement, isEnabled }) => {
  if (quantity === 0) {
    return (
      <button
        onClick={onAdd}
        disabled={!isEnabled}
        className="w-9 h-9 flex items-center justify-center bg-brandPink text-white rounded-full disabled:bg-gray-300 transition hover:bg-opacity-90"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    );
  } else {
    return (
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onDecrement}
          disabled={!isEnabled}
          className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full disabled:bg-gray-300 transition hover:bg-gray-300"
        >
          <MinusIcon className="w-4 h-4" />
        </button>
        <span className="text-base font-bold min-w-[20px] text-center">{quantity}</span>
        <button
          onClick={onIncrement}
          disabled={!isEnabled}
          className="w-7 h-7 flex items-center justify-center bg-brandPink text-white rounded-full disabled:bg-gray-300 transition hover:bg-opacity-90"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }
};


// Card for PreOrder Category (similar to PreOrderHeader)
const PreOrderCategoryCard = ({ category, onClick }) => {
  // Define colors or get dynamically if needed
  const cardColor = 'bg-indigo-500'; // Example color
  const textColor = 'text-indigo-700';
  const bgColorLight = 'bg-indigo-50';

  return (
    <div
        onClick={onClick}
        className={`rounded-xl shadow overflow-hidden cursor-pointer ${bgColorLight}`}
    >
        <div className="p-4 flex justify-between items-center">
            <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                     <div className={`w-8 h-8 rounded-full ${cardColor} flex items-center justify-center`}>
                        <BuildingStorefrontIcon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-bold text-gray-800">{category.name}</h3>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-gray-600 pl-1">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>Order: {category.startTime} - {category.endTime}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs font-semibold pl-1 ${textColor}">
                    <BanknotesIcon className="w-3.5 h-3.5"/> {/* Use Banknotes for delivery time */}
                    <span>Delivery: {category.deliveryTime}</span>
                </div>
            </div>
             <div className={`w-10 h-10 rounded-full ${cardColor} flex items-center justify-center flex-shrink-0 ml-3`}>
                <ChevronRightIcon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
  );
};

// Blinking Text Component (for "Available Now")
const BlinkingText = ({ text }) => {
    // Simple implementation using CSS animation via Tailwind classes
    return (
        <span className="animate-pulse font-semibold">
            {text} <FireIcon className="w-4 h-4 inline-block mb-0.5 text-red-500"/> {/* Added Fire icon */}
        </span>
    );
};

// Availability Chip (for "Instant Delivery")
const AvailabilityChip = ({ isAvailable }) => {
  const bgColor = isAvailable ? 'bg-green-100' : 'bg-red-100';
  const textColor = isAvailable ? 'text-green-800' : 'text-red-800';
  const text = isAvailable ? 'Instant Delivery Available' : 'Instant Delivery Unavailable';

  return (
    <div className={`inline-block px-3 py-1 rounded-full ${bgColor} ${textColor} text-xs font-bold`}>
      {text}
    </div>
  );
};

// Bottom Bar (similar to ModernBottomBarWithButtons)
const CartBottomBar = ({ onAddToCart, onPlaceOrder, totalItems }) => {
    if (totalItems === 0) return null; // Don't show if cart is empty

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50">
             <div className="flex items-center space-x-4 max-w-lg mx-auto">
                {/* Add to Cart button (just saves) */}
                <button
                    onClick={onAddToCart}
                    className="p-3 border border-gray-300 rounded-lg text-brandPink hover:bg-gray-50"
                    title="Save selections to main cart"
                >
                    <ShoppingCartIcon className="w-6 h-6" />
                </button>
                 {/* Place Order button */}
                <button
                    onClick={onPlaceOrder}
                    className="flex-1 h-[50px] flex items-center justify-center bg-darkPink text-white rounded-lg text-base font-semibold transition hover:bg-opacity-90"
                >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    <span>Place Order Now ({totalItems})</span>
                </button>
            </div>
        </div>
    );
}


// --- Main Page Component ---
export default function RestaurantMenuPage() {
  const router = useRouter();
  const { restaurantId, restaurantName: encodedName } = router.query;
  const restaurantName = encodedName ? decodeURIComponent(encodedName) : 'Restaurant';

  const [preOrderCategories, setPreOrderCategories] = useState([]); // PreOrderCategory[]
  const [currentMenuItems, setCurrentMenuItems] = useState([]); // MenuItem[]
  const [isLoading, setIsLoading] = useState(true);
  const [isInstantDeliveryAvailable, setIsInstantDeliveryAvailable] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0); // 0 for PreOrder, 1 for Current
  const [error, setError] = useState('');

  const { cart, addToCart, incrementItem, decrementItem, clearCartForRestaurant, totalItems } = useCart(); // Use cart context

  // --- Fetch Data ---
  useEffect(() => {
    if (!restaurantId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const restaurantRef = doc(db, 'restaurants', restaurantId);

        // Fetch PreOrder Categories
        const preOrderSnap = await getDocs(collection(restaurantRef, 'preOrderCategories'));
        const categories = preOrderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPreOrderCategories(categories);

        // Fetch Current Menu Items
        const menuQuery = query(collection(restaurantRef, 'menuItems'), where('category', '==', 'Current Menu'));
        const menuSnap = await getDocs(menuQuery);
        const items = menuSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCurrentMenuItems(items);

        // Check Rider Availability (simplified query)
         const ridersQuery = query(
          collection(db, 'riders'),
          where('isAvailable', '==', true)
          // We might need a more specific location check here in a real app
          // whereArrayContains('serviceableLocations', 'Daffodil Smart City') // Assuming fixed location for now
        );
        const ridersSnap = await getDocs(ridersQuery);
        setIsInstantDeliveryAvailable(!ridersSnap.empty);


      } catch (err) {
        console.error("Error fetching restaurant menu:", err);
        setError("Failed to load menu. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]); // Re-fetch if restaurantId changes

  // --- Cart Handling ---
  // Get cart items specific to THIS restaurant's temporary selection
  const currentRestaurantCart = Object.values(cart).filter(item => item.restaurantId === restaurantId);
  const currentTotalItems = currentRestaurantCart.reduce((sum, item) => sum + item.quantity, 0);


  // --- Navigation Handlers ---
  const handlePreOrderCategoryClick = (category) => {
    // Navigate to a specific pre-order menu page (if needed, or handle directly)
    // For now, let's assume clicking category shows items (if structure supports it)
    // This navigation matches your Android app's logic
    const encodedRestName = encodeURIComponent(restaurantName);
    const encodedCatName = encodeURIComponent(`Pre-order ${category.name}`); // Prefix required by Android structure
    router.push(`/preorder-menu/${restaurantId}/${encodedRestName}/${encodedCatName}`); // Define this route later
  };

  const handlePlaceOrder = () => {
     // Note: saveSelectionToCart is implicitly handled by CartContext saving to localStorage
     router.push(`/checkout/${restaurantId}`); // Define checkout route later
  };

   const handleAddToCart = () => {
     // saveSelectionToCart is handled by CartContext
     alert('Items saved to cart!'); // Simple feedback
     // Optionally, navigate away or clear temporary selection if needed
  };


  // --- Render Loading State ---
  if (isLoading) {
    return <LoadingSpinner />; // Use your splash/loading component
  }

  // --- Render Main Content ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20"> {/* Padding bottom for cart bar */}
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white shadow-sm p-3 flex items-center space-x-2">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 truncate flex-1">{restaurantName}</h1>
      </div>

       {/* Banner Ad placeholder - Add your Ad component here if needed */}
       {/* <YourAdBannerComponent /> */}

      {/* Tabs */}
      <div className="sticky top-[68px] z-20 bg-white border-b border-gray-200"> {/* Adjust top value based on TopAppBar height */}
        <div className="flex">
          <button
            onClick={() => setSelectedTabIndex(0)}
            className={`flex-1 py-3 text-center text-sm font-medium border-b-2 ${
              selectedTabIndex === 0
                ? 'border-brandPink text-brandPink'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Pre-Order Category
          </button>
          <button
            onClick={() => setSelectedTabIndex(1)}
            className={`flex-1 py-3 text-center text-sm font-medium border-b-2 ${
              selectedTabIndex === 1
                ? 'border-brandPink text-brandPink'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
             <BlinkingText text="Available Now" />
          </button>
        </div>
      </div>

      {/* Content Area based on Tab */}
      <div className="p-4 space-y-4">
        {error && <p className="text-red-600 text-center">{error}</p>}

        {selectedTabIndex === 0 && (
          // Pre-Order Categories List
          preOrderCategories.length > 0 ? (
            preOrderCategories.map((category) => (
              <PreOrderCategoryCard
                key={category.id}
                category={category}
                onClick={() => handlePreOrderCategoryClick(category)}
              />
            ))
          ) : (
            <p className="text-gray-600 text-center py-10">No pre-order categories available.</p>
          )
        )}

        {selectedTabIndex === 1 && (
          // Current Menu Items List
          <>
            <div className="text-center">
                <AvailabilityChip isAvailable={isInstantDeliveryAvailable} />
            </div>
            {currentMenuItems.length > 0 ? (
                currentMenuItems.map((item) => {
                const cartItem = cart[item.id];
                // Ensure item is treated as part of the current restaurant for cart logic
                const restaurantDetails = { restaurantId, restaurantName };
                 // Only enable if delivery is available
                const isEnabled = isInstantDeliveryAvailable;

                return (
                    <MenuItemCard
                    key={item.id}
                    menuItem={item}
                    quantity={cartItem?.quantity || 0}
                    onAdd={() => addToCart(item, restaurantDetails)}
                    onIncrement={() => incrementItem(item.id)}
                    onDecrement={() => decrementItem(item.id)}
                    isEnabled={isEnabled}
                    />
                );
                })
            ) : (
                <p className="text-gray-600 text-center py-10">No items available right now.</p>
            )}
          </>
        )}
      </div>

      {/* Bottom Cart Bar */}
      <CartBottomBar
          onAddToCart={handleAddToCart}
          onPlaceOrder={handlePlaceOrder}
          totalItems={currentTotalItems}
      />

    </div>
  );
}
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../../context/CartContext'; // Adjust path
import { useAuth } from '../../context/AuthContext'; // Adjust path
import { db } from '../../firebase/config'; // Adjust path
import { doc, getDoc, collection, query, where, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import ProtectedRoute from '../../components/ProtectedRoute'; // Adjust path
import LoadingSpinner from '../../components/LoadingSpinner'; // Adjust path
import { ArrowLeftIcon, MapPinIcon, ReceiptPercentIcon, BanknotesIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
// react-lottie-player can be heavy, let's use simpler animations for now
// import Lottie from 'react-lottie-player';
// import celebrationAnimationData from '../../public/celebration.json'; // Need a web-compatible animation

// --- Helper Components ---

// Simple Section Header
const SectionHeader = ({ title }) => (
    <h2 className="text-lg font-bold text-gray-800 mb-2 px-5">{title}</h2>
);

// Modern Card Wrapper
const ModernCard = ({ children, className = "" }) => (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden mx-4 ${className}`}>
        <div className="p-4">
            {children}
        </div>
    </div>
);

// Price Row
const PriceRow = ({ label, amount, isTotal = false }) => (
    <div className="flex justify-between items-center py-1.5">
        <span className={`text-sm ${isTotal ? 'font-bold text-deepPink' : 'text-gray-600'}`}>
            {label}
        </span>
        <span className={`font-semibold ${isTotal ? 'text-lg text-deepPink' : 'text-sm text-gray-800'}`}>
            ৳{amount?.toFixed(0) ?? '...'} {/* Show loading indicator if null */}
        </span>
    </div>
);

// Order Sent Overlay (Simplified)
const OrderSentOverlay = ({ onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 2500); // Automatically dismiss after 2.5 seconds
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-[100]">
            <div className="bg-green-500 w-24 h-24 rounded-full flex items-center justify-center mb-5 animate-bounce">
                <CheckCircleIcon className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Order Sent!</h2>
            <p className="text-white/90">Your order has been confirmed.</p>
        </div>
    );
};


// --- Main Checkout Page Component ---
function CheckoutPageContent() {
  const router = useRouter();
  const { restaurantId } = router.query;
  const { user } = useAuth();
  const { cart, clearCartForRestaurant } = useCart();

  // --- State ---
  const [userProfile, setUserProfile] = useState(null); // Full user profile with address
  const [deliveryCharge, setDeliveryCharge] = useState(null);
  const [serviceCharge, setServiceCharge] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingCharges, setIsLoadingCharges] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showOrderSent, setShowOrderSent] = useState(false);
  const [error, setError] = useState('');

  // --- Memoized Cart Items for this restaurant ---
  const itemsForRestaurant = useMemo(() => {
    if (!restaurantId) return [];
    return Object.values(cart).filter(item => item.restaurantId === restaurantId);
  }, [cart, restaurantId]);

  const itemsSubtotal = useMemo(() => {
    return itemsForRestaurant.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [itemsForRestaurant]);

  const isPreOrder = itemsForRestaurant.length > 0 && itemsForRestaurant[0].menuItem.category?.startsWith("Pre-order");
  const restaurantName = itemsForRestaurant.length > 0 ? itemsForRestaurant[0].restaurantName : 'Your Order';

  // --- Redirect if cart is empty for this restaurant or restaurantId is missing ---
  useEffect(() => {
      if (router.isReady && (!restaurantId || itemsForRestaurant.length === 0)) {
          console.warn("Checkout page loaded with invalid restaurantId or empty cart for it. Redirecting to cart.");
          router.replace('/cart'); // Use replace to avoid adding to history
      }
  }, [router.isReady, restaurantId, itemsForRestaurant, router]);

  // --- Fetch User Profile ---
  useEffect(() => {
    if (!user) return;
    setIsLoadingProfile(true);
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef)
      .then(docSnap => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          setError("User profile not found."); // Should ideally not happen
        }
      })
      .catch(err => {
        console.error("Error fetching user profile:", err);
        setError("Could not load your profile details.");
      })
      .finally(() => setIsLoadingProfile(false));
  }, [user]);

  // --- Fetch/Calculate Charges (Replicating CheckoutScreen.kt logic) ---
  useEffect(() => {
    if (!userProfile || !restaurantId) return; // Wait for profile and ID

    const calculateCharges = async () => {
      setIsLoadingCharges(true);
      setError(''); // Clear previous errors
      let baseDelivery = 20.0;
      let baseService = 5.0;
      let additionalDelivery = 0.0;
      let additionalService = 0.0;

      const baseLocation = userProfile.baseLocation;
      const subLocation = userProfile.subLocation;

      if (!baseLocation || !subLocation) {
          setError("Please complete your location details in your profile.");
          setIsLoadingCharges(false);
          setDeliveryCharge(baseDelivery); // Set defaults even if error
          setServiceCharge(baseService);
          return;
      }

      try {
        // 1. Get base charges from location
        const locQuery = query(collection(db, 'locations'), where('name', '==', baseLocation));
        const locSnap = await getDocs(locQuery);

        if (!locSnap.empty) {
          const locData = locSnap.docs[0].data();
          const subLocations = locData.subLocations || [];
          const subIndex = subLocations.indexOf(subLocation);

          if (subIndex !== -1) {
              const deliveryKey = isPreOrder ? 'deliveryCharge' : 'deliveryChargeYumzy';
              const serviceKey = isPreOrder ? 'serviceCharge' : 'serviceChargeYumzy';
              const deliveryArray = locData[deliveryKey] || [];
              const serviceArray = locData[serviceKey] || [];

              if (subIndex < deliveryArray.length) baseDelivery = Number(deliveryArray[subIndex]) || baseDelivery;
              if (subIndex < serviceArray.length) baseService = Number(serviceArray[subIndex]) || baseService;
          }
        } else {
             console.warn(`Location document not found for: ${baseLocation}`);
        }

        // 2. Get additional charges if it's the yumzy_store
        if (restaurantId === 'yumzy_store') {
          const itemBaseIds = [...new Set(itemsForRestaurant.map(item => {
              const id = item.menuItem.id;
              return id.includes('_') ? id.split('_')[0] : id; // Get base ID before variant
          }))];

          if (itemBaseIds.length > 0) {
             // Fetch all relevant item docs in one go if possible, or loop
             for (const baseId of itemBaseIds) {
                 try {
                    const itemDocRef = doc(db, 'store_items', baseId);
                    const itemDocSnap = await getDoc(itemDocRef);
                    if (itemDocSnap.exists()) {
                        additionalDelivery += itemDocSnap.data().additionalDeliveryCharge || 0.0;
                        additionalService += itemDocSnap.data().additionalServiceCharge || 0.0;
                    }
                 } catch (itemErr) {
                     console.error(`Failed to fetch additional charges for item ${baseId}:`, itemErr);
                     // Decide if you want to proceed without these charges or show error
                 }
             }
          }
        }

        setDeliveryCharge(baseDelivery + additionalDelivery);
        setServiceCharge(baseService + additionalService);

      } catch (err) {
        console.error("Error calculating charges:", err);
        setError("Could not calculate delivery charges. Using defaults.");
        // Set default charges on error
        setDeliveryCharge(baseDelivery + additionalDelivery);
        setServiceCharge(baseService + additionalService);
      } finally {
        setIsLoadingCharges(false);
      }
    };

    calculateCharges();
  }, [userProfile, restaurantId, itemsForRestaurant, isPreOrder]); // Recalculate if these change


  // --- Handle Order Placement ---
  const handleConfirmOrder = async () => {
     if (!user || !userProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder) return;

     setIsPlacingOrder(true);
     setError('');

     const finalTotal = itemsSubtotal + deliveryCharge + serviceCharge;

     // Prepare order items (Ensure miniResName is included correctly)
     const orderItems = itemsForRestaurant.map(cartItem => ({
        itemName: cartItem.menuItem.name, // Use the name which might include variant
        quantity: cartItem.quantity,
        price: cartItem.menuItem.price,
        miniResName: cartItem.restaurantName || '' // Use the name stored in the cart item
     }));

     const orderType = isPreOrder ? "PreOrder" : "Instant"; //
     const firstItemCategory = itemsForRestaurant[0]?.menuItem.category || ''; //

     const newOrder = {
        userId: user.uid, //
        userName: userProfile.name || user.displayName || 'N/A', //
        userPhone: userProfile.phone || 'N/A', //
        userBaseLocation: userProfile.baseLocation || 'N/A', //
        userSubLocation: userProfile.subLocation || 'N/A', //
        building: userProfile.building || '', //
        floor: userProfile.floor || '', //
        room: userProfile.room || '', //
        restaurantId: restaurantId, //
        restaurantName: restaurantName, //
        totalPrice: finalTotal, //
        deliveryCharge: deliveryCharge, //
        serviceCharge: serviceCharge, //
        items: orderItems, //
        orderStatus: "Pending", //
        createdAt: Timestamp.now(), //
        orderType: orderType, //
        preOrderCategory: orderType === "PreOrder" ? firstItemCategory : "" //
     };

     try {
        await addDoc(collection(db, 'orders'), newOrder); //
        clearCartForRestaurant(restaurantId); //
        setShowOrderSent(true);
        // Don't navigate immediately, let the overlay show

     } catch (err) {
        console.error("Error placing order:", err);
        setError("Failed to place order. Please try again.");
        setIsPlacingOrder(false);
     }
  };

  // --- Navigation after success animation ---
   const handleOrderSentComplete = () => {
        setShowOrderSent(false);
        // Navigate to orders and trigger ad
        router.push({
            pathname: '/orders',
            query: { showAd: 'true' }
        });
  };

  const finalTotal = (deliveryCharge !== null && serviceCharge !== null)
    ? itemsSubtotal + deliveryCharge + serviceCharge
    : null;

  // --- Render ---
  if (!router.isReady || (restaurantId && itemsForRestaurant.length === 0 && !isLoadingCharges && !isLoadingProfile)) {
      // If router isn't ready, or if it IS ready but items are confirmed empty, show loading or let useEffect redirect
      return <LoadingSpinner />;
  }


  return (
    <div className="min-h-screen bg-lightGray pb-24 relative"> {/* Padding for bottom bar, relative for overlay */}
        {/* Top Bar */}
         <div className="sticky top-0 z-30 bg-white shadow-sm p-3 flex items-center space-x-2">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100" disabled={isPlacingOrder}>
                <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-800 truncate flex-1">Confirm Order</h1>
         </div>

        {/* Main Content */}
        <div className="space-y-5 py-4">
            {/* Delivery Address */}
            <section>
                <SectionHeader title="Delivery Address"/>
                <ModernCard>
                    {isLoadingProfile ? (
                        <p className="text-sm text-gray-500 text-center py-2">Loading address...</p>
                    ) : (
                        <div className="flex items-start space-x-2">
                            <MapPinIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"/>
                            <p className="text-sm text-gray-700">
                                {userProfile?.building ? `${userProfile.building}, ` : ''}
                                {userProfile?.floor ? `Flr ${userProfile.floor}, ` : ''}
                                {userProfile?.room ? `Rm ${userProfile.room}, ` : ''}
                                {userProfile?.subLocation ? `${userProfile.subLocation}, ` : ''}
                                {userProfile?.baseLocation || 'Address not set'}
                            </p>
                        </div>
                    )}
                </ModernCard>
            </section>

             {/* Order Summary */}
            <section>
                <SectionHeader title="Order Summary"/>
                <ModernCard>
                    <div className="space-y-2 divide-y divide-gray-100">
                        {itemsForRestaurant.map(item => (
                            <div key={item.menuItem.id} className="flex justify-between items-center pt-2 first:pt-0">
                                <span className="text-sm text-gray-700">{item.quantity} x {item.menuItem.name}</span>
                                <span className="text-sm font-medium text-gray-800">৳{(item.menuItem.price * item.quantity).toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                </ModernCard>
            </section>

            {/* Price Details */}
            <section>
                 <SectionHeader title="Price Details"/>
                 <ModernCard>
                    {isLoadingCharges ? (
                         <p className="text-sm text-gray-500 text-center py-2">Calculating charges...</p>
                    ) : (
                        <div className="space-y-1">
                            <PriceRow label="Items Subtotal" amount={itemsSubtotal} />
                            <PriceRow label="Delivery Charge" amount={deliveryCharge} />
                            <PriceRow label="Service Charge" amount={serviceCharge} />
                            <hr className="my-2 border-gray-200"/>
                            <PriceRow label="Total to Pay" amount={finalTotal} isTotal={true} />
                        </div>
                    )}
                 </ModernCard>
            </section>

             {/* Error Message */}
            {error && (
                <div className="mx-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center space-x-2">
                    <ExclamationCircleIcon className="w-5 h-5"/>
                    <span>{error}</span>
                </div>
            )}
        </div>

        {/* Bottom Confirm Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40">
            <button
                onClick={handleConfirmOrder}
                disabled={isLoadingCharges || isLoadingProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder || !!error}
                className={`w-full h-[50px] flex items-center justify-center rounded-xl text-base font-semibold transition text-white ${
                    (isLoadingCharges || isLoadingProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder || !!error)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-darkPink hover:bg-opacity-90'
                }`}
            >
                {isPlacingOrder ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Placing Order...
                    </>
                ) : (
                    `Confirm & Place Order (৳${finalTotal?.toFixed(0) ?? '...'})`
                )}
            </button>
        </div>

        {/* Order Sent Overlay */}
        {showOrderSent && <OrderSentOverlay onComplete={handleOrderSentComplete} />}
    </div>
  );
}

// Wrap with ProtectedRoute
export default function Checkout() {
  return (
    <ProtectedRoute>
      <CheckoutPageContent />
    </ProtectedRoute>
  );
}
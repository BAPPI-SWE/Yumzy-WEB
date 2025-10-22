import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute'; // Adjust path
import { useAuth } from '../context/AuthContext'; // Adjust path
import { db } from '../firebase/config'; // Adjust path
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner'; // Adjust path
import { InformationCircleIcon, MapPinIcon, ShoppingBagIcon, ClockIcon, ArrowRightIcon, XMarkIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid'; // Solid Icons

// --- Helper Functions (from OrdersScreen.kt) ---

// Format Firestore Timestamp to readable Date and Time
const formatTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return 'Invalid Date';
  }
  const date = timestamp.toDate();
  // Example format: Oct 21, 2025 at 11:30 AM
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
         ' at ' +
         date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};
// Format Timestamp to just Date (Short)
const formatDateShort = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';
    return timestamp.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};
// Format Timestamp to just Time
const formatTime = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';
    return timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Get color based on status (similar to getStatusColor)
const getStatusColor = (status = '') => {
    switch (status.toLowerCase()) {
        case "pending": return 'text-orange-500 bg-orange-100'; // text color, background color
        case "confirmed": return 'text-blue-500 bg-blue-100'; //
        case "preparing": return 'text-green-600 bg-green-100'; //
        case "delivered": return 'text-green-600 bg-green-100'; //
        case "cancelled": return 'text-red-500 bg-red-100'; //
        case "accepted": return 'text-pink-600 bg-pink-100'; // Adapted 'accepted' color
        default: return 'text-gray-500 bg-gray-100'; //
    }
};

// --- Reusable Components ---

// Order Card (similar to ModernOrderCard)
const OrderCard = ({ order, onClick }) => {
    const statusColors = getStatusColor(order.orderStatus);
    const itemCountText = order.items.length === 1 ? '1 item' : `${order.items.length} items`; //

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl shadow cursor-pointer transition hover:shadow-md"
        >
            <div className="p-4 space-y-2.5">
                {/* Header: Restaurant & Status */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 min-w-0">
                       <BuildingStorefrontIcon className={`w-5 h-5 flex-shrink-0 ${statusColors.split(' ')[0]}`}/> {/* Use text color */}
                       <span className="font-bold text-gray-800 text-sm truncate">{order.restaurantName}</span>
                    </div>
                     <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors}`}>
                        {order.orderStatus}
                     </span>
                </div>

                 {/* Info Row: Items, Date, Time */}
                <div className="flex items-center space-x-2 text-xs text-gray-500 flex-wrap">
                    <div className="flex items-center space-x-1">
                        <ShoppingBagIcon className="w-3.5 h-3.5"/>
                        <span>{itemCountText}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span>{formatDateShort(order.createdAt)}</span>
                     <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-1">
                        <ClockIcon className="w-3.5 h-3.5"/>
                        <span>{formatTime(order.createdAt)}</span>
                    </div>
                </div>

                {/* Footer: Price & View Button */}
                <div className="flex justify-between items-center pt-1">
                     <div className="flex items-baseline space-x-1">
                        <span className="text-sm text-gray-700">Total:</span>
                        <span className="text-base font-bold text-gray-800">৳{order.totalPrice?.toFixed(0)}</span>
                     </div>
                     <button className={`flex items-center space-x-1 text-xs font-semibold ${statusColors.split(' ')[0]} hover:opacity-80`}>
                        <span>View Details</span>
                        <ArrowRightIcon className="w-3.5 h-3.5"/>
                     </button>
                </div>
            </div>
        </div>
    );
};

// Order Details Modal (similar to EnhancedOrderDetailsDialog)
const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;
    const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>
                     <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                         <XMarkIcon className="w-5 h-5 text-gray-500"/>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 space-y-4 overflow-y-auto">
                    <p className="font-semibold text-gray-800">{order.restaurantName}</p>
                    <p className="text-xs text-gray-500">Ordered on {formatTimestamp(order.createdAt)}</p>
                    <p className={`text-sm font-semibold ${getStatusColor(order.orderStatus).split(' ')[0]}`}>
                        Status: {order.orderStatus}
                    </p>

                    <h3 className="text-sm font-bold pt-2">Items:</h3>
                    <div className="space-y-1.5 text-sm">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start">
                                <div className="flex-1 mr-2">
                                     <span className="text-gray-700">{item.quantity} x {item.name}</span>
                                      {item.miniResName && <span className="block text-xs text-gray-500 ml-4">from {item.miniResName}</span>}
                                </div>

                                <span className="font-medium text-gray-800 whitespace-nowrap">৳{(item.price * item.quantity).toFixed(0)}</span>
                            </div>
                        ))}
                    </div>

                    <hr className="my-2 border-gray-200"/>

                    {/* Price Details */}
                     <div className="space-y-1 text-sm">
                         <div className="flex justify-between"><span className="text-gray-600">Items Subtotal</span><span className="font-medium">৳{itemsSubtotal.toFixed(0)}</span></div>
                         {order.deliveryCharge > 0 && <div className="flex justify-between"><span className="text-gray-600">Delivery Charge</span><span className="font-medium">৳{order.deliveryCharge.toFixed(0)}</span></div>}
                         {order.serviceCharge > 0 && <div className="flex justify-between"><span className="text-gray-600">Service Charge</span><span className="font-medium">৳{order.serviceCharge.toFixed(0)}</span></div>}
                         <hr className="my-1 border-gray-200"/>
                         <div className="flex justify-between font-bold text-base text-deepPink"><span >Total Payable</span><span>৳{order.totalPrice.toFixed(0)}</span></div>
                     </div>
                </div>
                 {/* Close Button Footer */}
                <div className="p-4 border-t border-gray-200">
                     <button
                        onClick={onClose}
                        className="w-full h-[45px] flex items-center justify-center bg-darkPink text-white rounded-lg text-sm font-semibold transition hover:bg-opacity-90"
                     >
                        Close
                    </button>
                </div>
            </div>
         </div>
    );
};


// --- Main Orders Page Component ---
function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAd } = router.query; // Check if showAd=true is in the URL

  const [orders, setOrders] = useState([]); // Order[]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null); // The order to show in the modal

   // --- Ad Logic ---
  useEffect(() => {
    if (showAd === 'true') {
        console.log("Orders page loaded with showAd=true");
        // !! IMPORTANT: Implement your Ad logic here !!
        // This might involve calling a function from an Ad SDK.
        // For now, we'll just log it.
        // Example: AdMob.showInterstitialAd();

        // Optional: Remove the query param after showing ad to prevent re-trigger on refresh
        // router.replace('/orders', undefined, { shallow: true });
    }
  }, [showAd, router]);


  // --- Fetch Orders ---
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc') // Show newest first
    );

    getDocs(ordersQuery)
      .then(snapshot => {
        const fetchedOrders = snapshot.docs.map(doc => {
             const data = doc.data();
             // Ensure items array exists and price is a number
             const items = (data.items || []).map(item => ({
                 name: item.itemName || item.name || 'Unknown Item', // Handle potential old data field name
                 quantity: Number(item.quantity) || 0,
                 price: Number(item.itemPrice || item.price) || 0.0, // Handle potential old data field name
                 miniResName: item.miniResName || '', //
             }));
             return {
                id: doc.id, //
                restaurantName: data.restaurantName || 'Unknown Restaurant', //
                totalPrice: Number(data.totalPrice) || 0.0, //
                orderStatus: data.orderStatus || 'Unknown', //
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(), // Ensure it's a Timestamp
                items: items, //
                deliveryCharge: Number(data.deliveryCharge) || 0.0, //
                serviceCharge: Number(data.serviceCharge) || 0.0, //
             };
        });
        setOrders(fetchedOrders);
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
        setError("Failed to load your orders.");
      })
      .finally(() => setIsLoading(false));

  }, [user]); // Re-fetch if user changes

  return (
    <div className="min-h-screen bg-lightGray pb-10"> {/* Ensure content clears bottom nav */}
         {/* Custom Top Bar */}
         <div className="bg-darkPink text-white pt-10 pb-5 px-4 rounded-b-[20px] shadow-md sticky top-0 z-10">
            <h1 className="text-xl font-bold text-center">My Orders</h1>
       </div>

       {/* Content Area */}
       <div className="p-4 space-y-4">
        {isLoading && (
          <div className="flex justify-center pt-20">
             <p>Loading orders...</p> {/* Or use LoadingSpinner */}
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center pt-20 text-center text-red-600">
            <InformationCircleIcon className="w-12 h-12 mb-3"/>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && orders.length === 0 && (
          // Empty State
          <div className="flex flex-col items-center justify-center pt-20 text-center">
             <InformationCircleIcon className="w-16 h-16 text-gray-300 mb-4"/>
             <p className="text-lg font-medium text-gray-500">You haven't placed any orders yet.</p>
          </div>
        )}

         {!isLoading && !error && orders.length > 0 && (
            // Orders List
            orders.map(order => (
                <OrderCard
                    key={order.id}
                    order={order}
                    onClick={() => setSelectedOrder(order)}
                />
            ))
         )}
       </div>

       {/* Details Modal */}
        <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
        />
    </div>
  );
}

// Wrap with ProtectedRoute
export default function Orders() {
  return (
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  );
}
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import ProtectedRoute from '../../components/ProtectedRoute';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeftIcon, MapPinIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

// --- Helper Components ---

// Simple Section Header
const SectionHeader = ({ title }) => (
  <h2 style={{
    fontSize: '18px',
    fontWeight: 700,
    color: '#1F2937',
    marginBottom: '8px',
    paddingLeft: '20px',
    paddingRight: '20px'
  }}>{title}</h2>
);

// Modern Card Wrapper
const ModernCard = ({ children, className = "" }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    marginLeft: '16px',
    marginRight: '16px'
  }}>
    <div style={{ padding: '16px' }}>
      {children}
    </div>
  </div>
);

// Price Row
const PriceRow = ({ label, amount, isTotal = false }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '6px',
    paddingBottom: '6px'
  }}>
    <span style={{
      fontSize: isTotal ? '14px' : '14px',
      fontWeight: isTotal ? 700 : 400,
      color: isTotal ? '#D50032' : '#4B5563'
    }}>
      {label}
    </span>
    <span style={{
      fontWeight: 600,
      fontSize: isTotal ? '18px' : '14px',
      color: isTotal ? '#D50032' : '#1F2937'
    }}>
      ৳{amount?.toFixed(0) ?? '...'}
    </span>
  </div>
);

// Order Sent Overlay
const OrderSentOverlay = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div style={{
        backgroundColor: '#22C55E',
        width: '96px',
        height: '96px',
        borderRadius: '9999px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        animation: 'bounce 1s infinite'
      }}>
        <CheckCircleIcon style={{ width: '64px', height: '64px', color: 'white' }} />
      </div>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 700,
        color: 'white',
        marginBottom: '4px'
      }}>Order Sent!</h2>
      <p style={{
        color: 'rgba(255, 255, 255, 0.9)'
      }}>Your order has been confirmed.</p>
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </div>
  );
};

// --- Main Checkout Page Component ---
function CheckoutPageContent() {
  const router = useRouter();
  const { restaurantId } = router.query;
  const { user } = useAuth();
  const { cart, clearCartForRestaurant } = useCart();

  const [userProfile, setUserProfile] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(null);
  const [serviceCharge, setServiceCharge] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingCharges, setIsLoadingCharges] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showOrderSent, setShowOrderSent] = useState(false);
  const [error, setError] = useState('');

  const itemsForRestaurant = useMemo(() => {
    if (!restaurantId) return [];
    return Object.values(cart).filter(item => item.restaurantId === restaurantId);
  }, [cart, restaurantId]);

  const itemsSubtotal = useMemo(() => {
    return itemsForRestaurant.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [itemsForRestaurant]);

  const isPreOrder = itemsForRestaurant.length > 0 && itemsForRestaurant[0].menuItem.category?.startsWith("Pre-order");
  const restaurantName = itemsForRestaurant.length > 0 ? itemsForRestaurant[0].restaurantName : 'Your Order';

  useEffect(() => {
    if (router.isReady && (!restaurantId || itemsForRestaurant.length === 0)) {
      console.warn("Checkout page loaded with invalid restaurantId or empty cart for it. Redirecting to cart.");
      router.replace('/cart');
    }
  }, [router.isReady, restaurantId, itemsForRestaurant, router]);

  useEffect(() => {
    if (!user) return;
    setIsLoadingProfile(true);
    const userDocRef = doc(db, 'users', user.uid);
    getDoc(userDocRef)
      .then(docSnap => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        } else {
          setError("User profile not found.");
        }
      })
      .catch(err => {
        console.error("Error fetching user profile:", err);
        setError("Could not load your profile details.");
      })
      .finally(() => setIsLoadingProfile(false));
  }, [user]);

  useEffect(() => {
    if (!userProfile || !restaurantId) return;

    const calculateCharges = async () => {
      setIsLoadingCharges(true);
      setError('');
      let baseDelivery = 20.0;
      let baseService = 5.0;
      let additionalDelivery = 0.0;
      let additionalService = 0.0;

      const baseLocation = userProfile.baseLocation;
      const subLocation = userProfile.subLocation;

      if (!baseLocation || !subLocation) {
        setError("Please complete your location details in your profile.");
        setIsLoadingCharges(false);
        setDeliveryCharge(baseDelivery);
        setServiceCharge(baseService);
        return;
      }

      try {
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

        if (restaurantId === 'yumzy_store') {
          const itemBaseIds = [...new Set(itemsForRestaurant.map(item => {
            const id = item.menuItem.id;
            return id.includes('_') ? id.split('_')[0] : id;
          }))];

          if (itemBaseIds.length > 0) {
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
              }
            }
          }
        }

        setDeliveryCharge(baseDelivery + additionalDelivery);
        setServiceCharge(baseService + additionalService);

      } catch (err) {
        console.error("Error calculating charges:", err);
        setError("Could not calculate delivery charges. Using defaults.");
        setDeliveryCharge(baseDelivery + additionalDelivery);
        setServiceCharge(baseService + additionalService);
      } finally {
        setIsLoadingCharges(false);
      }
    };

    calculateCharges();
  }, [userProfile, restaurantId, itemsForRestaurant, isPreOrder]);

  const handleConfirmOrder = async () => {
    if (!user || !userProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder) return;

    setIsPlacingOrder(true);
    setError('');

    const finalTotal = itemsSubtotal + deliveryCharge + serviceCharge;

    const orderItems = itemsForRestaurant.map(cartItem => ({
      itemName: cartItem.menuItem.name,
      quantity: cartItem.quantity,
      price: cartItem.menuItem.price,
      miniResName: cartItem.restaurantName || ''
    }));

    const orderType = isPreOrder ? "PreOrder" : "Instant";
    const firstItemCategory = itemsForRestaurant[0]?.menuItem.category || '';

    const newOrder = {
      userId: user.uid,
      userName: userProfile.name || user.displayName || 'N/A',
      userPhone: userProfile.phone || 'N/A',
      userBaseLocation: userProfile.baseLocation || 'N/A',
      userSubLocation: userProfile.subLocation || 'N/A',
      building: userProfile.building || '',
      floor: userProfile.floor || '',
      room: userProfile.room || '',
      restaurantId: restaurantId,
      restaurantName: restaurantName,
      totalPrice: finalTotal,
      deliveryCharge: deliveryCharge,
      serviceCharge: serviceCharge,
      items: orderItems,
      orderStatus: "Pending",
      createdAt: Timestamp.now(),
      orderType: orderType,
      preOrderCategory: orderType === "PreOrder" ? firstItemCategory : ""
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      clearCartForRestaurant(restaurantId);
      setShowOrderSent(true);
    } catch (err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
      setIsPlacingOrder(false);
    }
  };

  const handleOrderSentComplete = () => {
    setShowOrderSent(false);
    router.push({
      pathname: '/orders',
      query: { showAd: 'true' }
    });
  };

  const finalTotal = (deliveryCharge !== null && serviceCharge !== null)
    ? itemsSubtotal + deliveryCharge + serviceCharge
    : null;

  if (!router.isReady || (restaurantId && itemsForRestaurant.length === 0 && !isLoadingCharges && !isLoadingProfile)) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      paddingBottom: '96px',
      position: 'relative'
    }}>
      {/* Top Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: 'white',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button 
          onClick={() => router.back()}
          disabled={isPlacingOrder}
          style={{
            padding: '8px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: isPlacingOrder ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => !isPlacingOrder && (e.currentTarget.style.backgroundColor = '#F3F4F6')}
          onMouseLeave={(e) => !isPlacingOrder && (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <ArrowLeftIcon style={{ width: '24px', height: '24px', color: '#374151' }} />
        </button>
        <h1 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#1F2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }}>Confirm Order</h1>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingTop: '16px',
        paddingBottom: '16px'
      }}>
        {/* Delivery Address */}
        <section>
          <SectionHeader title="Delivery Address" />
          <ModernCard>
            {isLoadingProfile ? (
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                textAlign: 'center',
                paddingTop: '8px',
                paddingBottom: '8px'
              }}>Loading address...</p>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <MapPinIcon style={{
                  width: '20px',
                  height: '20px',
                  color: '#16A34A',
                  marginTop: '2px',
                  flexShrink: 0
                }} />
                <p style={{
                  fontSize: '14px',
                  color: '#374151'
                }}>
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
          <SectionHeader title="Order Summary" />
          <ModernCard>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderTop: '1px solid #F3F4F6'
            }}>
              {itemsForRestaurant.map(item => (
                <div 
                  key={item.menuItem.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '8px'
                  }}
                >
                  <span style={{
                    fontSize: '14px',
                    color: '#374151'
                  }}>{item.quantity} x {item.menuItem.name}</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1F2937'
                  }}>৳{(item.menuItem.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </section>

        {/* Price Details */}
        <section>
          <SectionHeader title="Price Details" />
          <ModernCard>
            {isLoadingCharges ? (
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                textAlign: 'center',
                paddingTop: '8px',
                paddingBottom: '8px'
              }}>Calculating charges...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <PriceRow label="Items Subtotal" amount={itemsSubtotal} />
                <PriceRow label="Delivery Charge" amount={deliveryCharge} />
                <PriceRow label="Service Charge" amount={serviceCharge} />
                <hr style={{
                  marginTop: '8px',
                  marginBottom: '8px',
                  border: 'none',
                  borderTop: '1px solid #E5E7EB'
                }} />
                <PriceRow label="Total to Pay" amount={finalTotal} isTotal={true} />
              </div>
            )}
          </ModernCard>
        </section>

        {/* Error Message */}
        {error && (
          <div style={{
            marginLeft: '16px',
            marginRight: '16px',
            padding: '12px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ExclamationCircleIcon style={{ width: '20px', height: '20px' }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Bottom Confirm Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: '16px',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 40
      }}>
        <button
          onClick={handleConfirmOrder}
          disabled={isLoadingCharges || isLoadingProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder || !!error}
          style={{
            width: '100%',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            border: 'none',
            color: 'white',
            backgroundColor: (isLoadingCharges || isLoadingProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder || !!error)
              ? '#9CA3AF'
              : '#B70314',
            cursor: (isLoadingCharges || isLoadingProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder || !!error)
              ? 'not-allowed'
              : 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isLoadingCharges && !isLoadingProfile && deliveryCharge !== null && serviceCharge !== null && !isPlacingOrder && !error) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoadingCharges && !isLoadingProfile && deliveryCharge !== null && serviceCharge !== null && !isPlacingOrder && !error) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isPlacingOrder ? (
            <>
              <svg style={{
                animation: 'spin 1s linear infinite',
                marginLeft: '-4px',
                marginRight: '12px',
                height: '20px',
                width: '20px',
                color: 'white'
              }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Placing Order...
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
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

export default function Checkout() {
  return (
    <ProtectedRoute>
      <CheckoutPageContent />
    </ProtectedRoute>
  );
}
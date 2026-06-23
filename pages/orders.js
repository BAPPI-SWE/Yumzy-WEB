import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import { InformationCircleIcon, MapPinIcon, ShoppingBagIcon, ClockIcon, ArrowRightIcon, XMarkIcon, BuildingStorefrontIcon, UserIcon, ExclamationTriangleIcon, PhoneIcon } from '@heroicons/react/24/solid';

// --- Helper Functions ---
const formatTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return 'Invalid Date';
  }
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
         ' at ' +
         date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDateShort = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '';
  return timestamp.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '';
  return timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const getStatusColor = (status = '') => {
  switch (status.toLowerCase()) {
    case "pending": return { text: '#F97316', bg: '#FFEDD5' };
    case "confirmed": return { text: '#3B82F6', bg: '#DBEAFE' };
    case "preparing": return { text: '#16A34A', bg: '#DCFCE7' };
    case "delivered": return { text: '#16A34A', bg: '#DCFCE7' };
    case "cancelled": return { text: '#EF4444', bg: '#FEE2E2' };
    case "accepted": return { text: '#DB2777', bg: '#FCE7F3' };
    default: return { text: '#6B7280', bg: '#F3F4F6' };
  }
};

// --- Order Card ---
const OrderCard = ({ order, userPhoneLastFour, onClick }) => {
  const statusColors = getStatusColor(order.orderStatus);
  const itemCountText = order.items.length === 1 ? '1 item' : `${order.items.length} items`;
  const cardTitle = order.restaurantId === 'yumzy_store' ? 'Foodish Store' : order.restaurantName;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'}
    >
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Header: Restaurant & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <BuildingStorefrontIcon style={{ width: '20px', height: '20px', flexShrink: 0, color: statusColors.text }} />
            <span style={{
              fontWeight: 700, color: '#1F2937', fontSize: '14px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{cardTitle}</span>
          </div>
          <span style={{
            padding: '2px 10px', borderRadius: '9999px', fontSize: '12px',
            fontWeight: 600, color: statusColors.text, backgroundColor: statusColors.bg
          }}>
            {order.orderStatus}
          </span>
        </div>

        {/* User ID Row */}
        {userPhoneLastFour && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9CA3AF' }}>
            <UserIcon style={{ width: '13px', height: '13px' }} />
            <span>User ID: ****{userPhoneLastFour}</span>
          </div>
        )}

        {/* Info Row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '12px', color: '#6B7280', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShoppingBagIcon style={{ width: '14px', height: '14px' }} />
            <span>{itemCountText}</span>
          </div>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <span>{formatDateShort(order.createdAt)}</span>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ClockIcon style={{ width: '14px', height: '14px' }} />
            <span>{formatTime(order.createdAt)}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '14px', color: '#374151' }}>Total:</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>৳{order.totalPrice?.toFixed(0)}</span>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px',
            fontWeight: 600, color: statusColors.text, backgroundColor: 'transparent',
            border: 'none', cursor: 'pointer', opacity: 1, transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <span>View Details</span>
            <ArrowRightIcon style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Cancel Confirmation Dialog ---
const CancelConfirmDialog = ({ onConfirm, onCancel }) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 110, padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%', maxWidth: '380px', padding: '20px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>
          Cancel Order?
        </h3>
        <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '20px' }}>
          You&apos;ll be redirected to our WhatsApp helpline to complete your cancellation request.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onConfirm}
            style={{
              width: '100%', height: '42px', backgroundColor: '#EF4444',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Go to WhatsApp
          </button>
          <button
            onClick={onCancel}
            style={{
              width: '100%', height: '42px', backgroundColor: 'transparent',
              color: '#6B7280', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            No, Keep Order
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Order Details Modal ---
const OrderDetailsModal = ({ order, userPhoneLastFour, userPhone, onClose }) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [riderPhone, setRiderPhone] = useState('');
  const [isFetchingRider, setIsFetchingRider] = useState(false);

  // Fetch rider phone from riders collection using riderId
  useEffect(() => {
    setRiderPhone('');
    if (!order?.riderId) return;

    const fetchRiderPhone = async () => {
      setIsFetchingRider(true);
      try {
        const riderDocRef = doc(db, 'riders', order.riderId);
        const riderSnap = await getDoc(riderDocRef);
        if (riderSnap.exists()) {
          setRiderPhone(riderSnap.data().phone || '');
        }
      } catch (err) {
        console.error('Error fetching rider phone:', err);
      } finally {
        setIsFetchingRider(false);
      }
    };

    fetchRiderPhone();
  }, [order?.riderId]);

  if (!order) return null;

  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cardTitle = order.restaurantId === 'yumzy_store' ? 'Foodish Store' : order.restaurantName;

  // Cancellable: order < 5 minutes old AND status is "Pending"
  const now = Timestamp.now().seconds;
  const orderTime = order.createdAt.seconds;
  const isCancellable = (now - orderTime) < 300 && order.orderStatus === 'Pending';

  const handleCancelOrder = () => {
    const whatsappNumber = '8801746324620';
    const message = `Hello, I would like to cancel my order. My phone number is ${userPhone || 'N/A'}.`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setShowCancelConfirm(false);
    onClose();
  };

  const handleCallRider = () => {
    if (riderPhone) {
      window.location.href = `tel:${riderPhone}`;
    }
  };

  return (
    <>
      {showCancelConfirm && (
        <CancelConfirmDialog
          onConfirm={handleCancelOrder}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
      <div style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '16px', backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          backgroundColor: 'white', borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          width: '100%', maxWidth: '448px', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column'
        }}>

          {/* Header */}
          <div style={{
            padding: '16px', borderBottom: '1px solid #E5E7EB',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937' }}>Order Summary</h2>
            <button
              onClick={onClose}
              style={{
                padding: '4px', borderRadius: '9999px', backgroundColor: 'transparent',
                border: 'none', cursor: 'pointer', transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <XMarkIcon style={{ width: '20px', height: '20px', color: '#6B7280' }} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

            <p style={{ fontWeight: 600, color: '#1F2937' }}>{cardTitle}</p>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>Ordered on {formatTimestamp(order.createdAt)}</p>

            {userPhoneLastFour && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9CA3AF' }}>
                <UserIcon style={{ width: '13px', height: '13px' }} />
                <span>User ID: ****{userPhoneLastFour}</span>
              </div>
            )}

            {/* Status */}
            <p style={{ fontSize: '14px', fontWeight: 600, color: getStatusColor(order.orderStatus).text }}>
              Status: {order.orderStatus}
            </p>

            {/* Rider Info Box */}
            {order.riderName ? (
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Your Rider
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                    {order.riderName}
                  </span>
                  {riderPhone && (
                    <span style={{ fontSize: '12px', color: '#4B5563' }}>
                      {riderPhone}
                    </span>
                  )}
                  {isFetchingRider && (
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Loading contact...</span>
                  )}
                </div>

                {/* Call button — shown only when phone is available */}
                {riderPhone && (
                  <button
                    onClick={handleCallRider}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: '#16A34A',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <PhoneIcon style={{ width: '14px', height: '14px' }} />
                    Call
                  </button>
                )}
              </div>
            ) : null}

            {/* Items */}
            <h3 style={{ fontSize: '14px', fontWeight: 700, paddingTop: '4px' }}>Items:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
              {order.items.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '8px' }}>
                    <span style={{ color: '#374151' }}>{item.quantity} x {item.name}</span>
                    {item.miniResName && item.miniResName !== 'Yumzy Store' && (
                      <span style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginLeft: '16px' }}>
                        from {item.miniResName}
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 500, color: '#1F2937', whiteSpace: 'nowrap' }}>
                    ৳{(item.price * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            <hr style={{ margin: '4px 0', borderColor: '#E5E7EB' }} />

            {/* Price Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4B5563' }}>Items Subtotal</span>
                <span style={{ fontWeight: 500 }}>৳{itemsSubtotal.toFixed(0)}</span>
              </div>
              {order.deliveryCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4B5563' }}>Delivery Charge</span>
                  <span style={{ fontWeight: 500 }}>৳{order.deliveryCharge.toFixed(0)}</span>
                </div>
              )}
              {order.serviceCharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#4B5563' }}>Service Charge</span>
                  <span style={{ fontWeight: 500 }}>৳{order.serviceCharge.toFixed(0)}</span>
                </div>
              )}
              <hr style={{ margin: '4px 0', borderColor: '#E5E7EB' }} />
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontWeight: 700, fontSize: '16px', color: '#D50032'
              }}>
                <span>Total Payable</span>
                <span>৳{order.totalPrice.toFixed(0)}</span>
              </div>
            </div>

            {/* Cancel Order Button */}
            {isCancellable && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                style={{
                  width: '100%', height: '45px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', backgroundColor: 'white',
                  color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '4px'
                }}
              >
                <ExclamationTriangleIcon style={{ width: '18px', height: '18px' }} />
                Cancel Order
              </button>
            )}
          </div>

          {/* Close Button Footer */}
          <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB' }}>
            <button
              onClick={onClose}
              style={{
                width: '100%', height: '45px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', backgroundColor: '#B70314', color: 'white',
                borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                transition: 'opacity 0.2s', border: 'none', cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// --- Main Orders Page Component ---
function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAd } = router.query;

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [userPhone, setUserPhone] = useState('');

  // --- Ad Logic ---
  useEffect(() => {
    if (showAd === 'true') {
      console.log("Orders page loaded with showAd=true");
    }
  }, [showAd, router]);

  // --- Fetch user phone number (Auth first, then Firestore fallback) ---
  useEffect(() => {
    if (!user) return;

    if (user.phoneNumber) {
      setUserPhone(user.phoneNumber);
      return;
    }

    const fetchPhone = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserPhone(data.phoneNumber || data.phone || '');
        }
      } catch (err) {
        console.error("Error fetching user phone:", err);
      }
    };

    fetchPhone();
  }, [user]);

  const userPhoneLastFour = userPhone.length >= 4 ? userPhone.slice(-4) : userPhone;

  // --- Fetch Orders (with real-time updates) ---
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        const items = (data.items || []).map(item => ({
          name: item.itemName || item.name || 'Unknown Item',
          quantity: Number(item.quantity) || 0,
          price: Number(item.itemPrice || item.price) || 0.0,
          miniResName: item.miniResName || '',
        }));
        return {
          id: doc.id,
          restaurantName: data.restaurantName || 'Unknown Restaurant',
          restaurantId: data.restaurantId || '',
          totalPrice: Number(data.totalPrice) || 0.0,
          orderStatus: data.orderStatus || 'Unknown',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
          items: items,
          deliveryCharge: Number(data.deliveryCharge) || 0.0,
          serviceCharge: Number(data.serviceCharge) || 0.0,
          riderName: data.riderName || '',
          riderId: data.riderId || '',
        };
      });
      setOrders(fetchedOrders);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching orders:", err);
      setError("Failed to load your orders.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', paddingBottom: '40px' }}>

      {/* Custom Top Bar */}
      <div style={{
        background: 'linear-gradient(to bottom, #B70314, #8B0A10)',
        color: 'white', paddingTop: '40px', paddingBottom: '20px',
        paddingLeft: '16px', paddingRight: '16px',
        borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center' }}>My Orders</h1>
      </div>

      {/* Content Area */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && error && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', paddingTop: '80px', textAlign: 'center', color: '#DC2626'
          }}>
            <InformationCircleIcon style={{ width: '48px', height: '48px', marginBottom: '12px' }} />
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && orders.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', paddingTop: '80px', textAlign: 'center'
          }}>
            <InformationCircleIcon style={{ width: '64px', height: '64px', color: '#D1D5DB', marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', fontWeight: 500, color: '#6B7280' }}>
              You haven&apos;t placed any orders yet.
            </p>
          </div>
        )}

        {!isLoading && !error && orders.length > 0 && (
          orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              userPhoneLastFour={userPhoneLastFour}
              onClick={() => setSelectedOrder(order)}
            />
          ))
        )}
      </div>

      {/* Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        userPhoneLastFour={userPhoneLastFour}
        userPhone={userPhone}
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
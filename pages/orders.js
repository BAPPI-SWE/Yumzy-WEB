import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import { InformationCircleIcon, MapPinIcon, ShoppingBagIcon, ClockIcon, ArrowRightIcon, BuildingStorefrontIcon, UserIcon } from '@heroicons/react/24/solid';
import { getDisplayStatusText, getStatusColor } from '../lib/orderTracking';

// --- Helper Functions ---
const formatDateShort = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '';
  return timestamp.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '';
  return timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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

// --- Main Orders Page Component ---
function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAd } = router.query;

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [nowMillis, setNowMillis] = useState(Date.now());

  // Live ticker so simulated early-stage statuses (Order Placed / Received /
  // Confirmed / Preparing) progress on the list in real time, just like the
  // tracking page, instead of sitting on "Pending" forever.
  useEffect(() => {
    const t = setInterval(() => setNowMillis(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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
              order={{ ...order, orderStatus: getDisplayStatusText(order, nowMillis) }}
              userPhoneLastFour={userPhoneLastFour}
              onClick={() => router.push(`/order-tracking/${order.id}`)}
            />
          ))
        )}
      </div>
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
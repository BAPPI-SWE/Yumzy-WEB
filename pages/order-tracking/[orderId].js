// pages/order-tracking/[orderId].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ArrowLeftIcon, PhoneIcon, ClockIcon, CheckIcon,
  ExclamationTriangleIcon, TruckIcon, FireIcon, UserIcon,
} from '@heroicons/react/24/solid';
import {
  TRACKING_STAGES, computeProgress, computeEtaRangeMinutes,
} from '../../lib/orderTracking';

const taka = String.fromCharCode(2547);

const formatTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp.toDate !== 'function') return 'Invalid Date';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const pad2 = (n) => String(n).padStart(2, '0');

// --- Cancel confirmation dialog (WhatsApp redirect, phone number only) ---
const CancelConfirmDialog = ({ onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '16px'
  }}>
    <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '380px', padding: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', marginBottom: '8px' }}>Cancel Order?</h3>
      <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '20px' }}>
        You&apos;ll be redirected to our WhatsApp helpline to complete your cancellation request.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button onClick={onConfirm} style={{
          width: '100%', height: '42px', backgroundColor: '#EF4444', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
        }}>Go to WhatsApp</button>
        <button onClick={onCancel} style={{
          width: '100%', height: '42px', backgroundColor: 'transparent', color: '#6B7280',
          border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
        }}>No, Keep Order</button>
      </div>
    </div>
  </div>
);

// --- Hero header ---
const HeroHeader = ({ order, activeStage, isCancelled, etaRange }) => {
  let gradient = 'linear-gradient(145deg, #DC0C25 0%, #A50018 100%)';
  let headline = 'Order Placed';
  let sub = 'Sending your order to the restaurant';
  let emoji = '\u{1F551}'; // clock

  if (isCancelled) {
    gradient = 'linear-gradient(145deg, #FF7A7A 0%, #E53935 100%)';
    headline = 'Order Cancelled';
    sub = 'This order has been cancelled';
    emoji = '\u274C';
  } else if (activeStage === 'DELIVERED') {
    gradient = 'linear-gradient(145deg, #66BB6A 0%, #2E7D32 100%)';
    headline = 'Delivered!';
    sub = "Enjoy your meal from Foodish";
    emoji = '\u{1F389}';
  } else if (activeStage === 'ON_THE_WAY') {
    gradient = 'linear-gradient(145deg, #42A5F5 0%, #1565C0 100%)';
    headline = 'On The Way';
    sub = 'Your rider is heading to you now';
    emoji = '\u{1F6F5}';
  } else if (activeStage === 'PREPARING') {
    gradient = 'linear-gradient(145deg, #FFB74D 0%, #EF6C00 100%)';
    headline = 'Preparing Your Food';
    sub = "Foodish is preparing your order";
    emoji = '\u{1F373}';
  } else if (activeStage === 'CONFIRMED') {
    headline = 'Order Confirmed';
    sub = "We've confirmed your order";
    emoji = '\u2705';
  } else if (activeStage === 'RECEIVED') {
    headline = 'Order Received';
    sub ="Restaurant Seen your order";
    emoji = '\u{1F4E9}';
  }

  return (
    <div style={{
      background: gradient, padding: '40px 20px', display: 'flex',
      flexDirection: 'column', alignItems: 'center', textAlign: 'center'
    }}>
      <div style={{
        width: '88px', height: '88px', borderRadius: '9999px',
        backgroundColor: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '42px', marginBottom: '16px',
        animation: !isCancelled && activeStage !== 'DELIVERED' ? 'ot-pulse 1s ease-in-out infinite' : 'none'
      }}>
        {emoji}
      </div>
      <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>{headline}</h1>
      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', marginTop: '4px', maxWidth: '320px' }}>{sub}</p>

      {etaRange && (
        <div style={{
          marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px',
          backgroundColor: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: '24px', padding: '8px 16px'
        }}>
          <ClockIcon style={{ width: '16px', height: '16px', color: 'white' }} />
          <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>
            Arriving in {etaRange[0]}-{etaRange[1]} min
          </span>
        </div>
      )}

      <div style={{
        marginTop: '10px', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: '20px',
        padding: '6px 14px', color: 'white', fontSize: '12px', fontWeight: 600
      }}>
        Order #{order.id.slice(-6).toUpperCase()}
      </div>

      <style>{`@keyframes ot-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>
    </div>
  );
};

// --- Cooking animation row ---
const CookingRow = ({ etaRange }) => (
  <div style={{ backgroundColor: '#FFF3E0', borderRadius: '14px', padding: '10px 14px', marginTop: '10px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <FireIcon style={{ width: '20px', height: '20px', color: '#EF6C00', animation: 'ot-bounce 0.5s ease-in-out infinite alternate' }} />
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#EF6C00' }}>
        Your food is cooking
        <span style={{ display: 'inline-block', width: '18px' }}>
          <span className="ot-dots">...</span>
        </span>
      </span>
    </div>
    {etaRange && (
      <p style={{ fontSize: '12px', fontWeight: 600, color: '#B86200', margin: '6px 0 0 30px' }}>
        Estimated delivery: {etaRange[0]}-{etaRange[1]} min
      </p>
    )}
    <style>{`
      @keyframes ot-bounce { from { transform: translateY(0); } to { transform: translateY(-4px); } }
      @keyframes ot-dot-fade { 0%, 20% { opacity: 0; } 50%, 100% { opacity: 1; } }
      .ot-dots { position: relative; }
    `}</style>
  </div>
);

// --- Rider info card ---
const RiderCard = ({ order, riderPhone }) => (
  <div style={{
    backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px',
    padding: '12px 14px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px'
  }}>
    <div style={{
      width: '44px', height: '44px', borderRadius: '9999px',
      background: 'linear-gradient(135deg, #34D399, #059669)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>
        {order.riderName ? order.riderName.charAt(0).toUpperCase() : <UserIcon style={{ width: '20px', height: '20px' }} />}
      </span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '10px', fontWeight: 700, color: '#16A34A', letterSpacing: '0.05em', margin: 0 }}>YOUR RIDER</p>
      <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
        {order.riderName || 'Assigning a rider...'}
      </p>
      {riderPhone && <p style={{ fontSize: '12px', color: '#4B5563', margin: 0 }}>{riderPhone}</p>}
    </div>
    {riderPhone && (
      <a href={`tel:${riderPhone}`} style={{
        width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#16A34A',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none'
      }}>
        <PhoneIcon style={{ width: '18px', height: '18px', color: 'white' }} />
      </a>
    )}
  </div>
);

// --- On the way animation row ---
const OnTheWayRow = () => (
  <div style={{ backgroundColor: '#E3F2FD', borderRadius: '14px', padding: '12px 14px', marginTop: '10px' }}>
    <p style={{ fontSize: '13px', fontWeight: 500, color: '#1565C0', margin: '0 0 10px 0' }}>
      Your rider is speeding your way!
    </p>
    <div style={{ position: 'relative', height: '28px', width: '100%' }}>
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0, height: '2px',
        backgroundColor: '#B3D4F5', transform: 'translateY(-50%)'
      }} />
      <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', animation: 'ot-ride 1.8s linear infinite' }}>
        <TruckIcon style={{ width: '24px', height: '24px', color: '#1565C0' }} />
      </div>
    </div>
    <style>{`@keyframes ot-ride { 0% { left: 0%; } 100% { left: 88%; } }`}</style>
  </div>
);

// --- Timeline step row ---
const TimelineStepRow = ({ stageDef, state, isLast, children }) => {
  const color = state === 'DONE' ? '#4CAF50' : state === 'ACTIVE' ? '#B70314' : '#CFCFCF';
  const textColor = state === 'PENDING' ? '#B0B0B0' : '#1A1A1A';

  return (
    <div style={{ display: 'flex', animation: 'ot-reveal 0.4s ease-out both' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '9999px',
          backgroundColor: state === 'PENDING' ? '#E8E8E8' : color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          {state === 'DONE' && <CheckIcon style={{ width: '14px', height: '14px', color: 'white' }} />}
          {state === 'ACTIVE' && (
            <div style={{ width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: 'white', animation: 'ot-pulse-dot 1s ease-in-out infinite' }} />
          )}
        </div>
        {!isLast && <div style={{ width: '2px', flex: 1, minHeight: '30px', backgroundColor: state === 'DONE' ? '#4CAF50' : '#E8E8E8' }} />}
      </div>
      <div style={{ marginLeft: '14px', paddingBottom: '24px', flex: 1 }}>
        <p style={{ margin: 0, fontSize: '15px', fontWeight: state === 'ACTIVE' ? 700 : 600, color: textColor }}>
          {stageDef.title}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: state === 'PENDING' ? '#C5C5C5' : '#757575' }}>
          {stageDef.subtitle}
        </p>
        {children}
      </div>
      <style>{`
        @keyframes ot-reveal { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ot-pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

// --- Cancelled card ---
const CancelledCard = ({ userPhone }) => {
  const handleContact = () => {
    const message = `Hello, I have a question about my cancelled order. My phone number is ${userPhone || 'N/A'}.`;
    window.open(`https://wa.me/8801746324620?text=${encodeURIComponent(message)}`, '_blank');
  };
  return (
    <div style={{
      backgroundColor: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: '16px',
      padding: '20px', textAlign: 'center', margin: '0 16px'
    }}>
      <ExclamationTriangleIcon style={{ width: '36px', height: '36px', color: '#E53935', margin: '0 auto 10px' }} />
      <p style={{ fontWeight: 700, color: '#B71C1C', margin: 0 }}>This order was cancelled</p>
      <p style={{ fontSize: '13px', color: '#8D6E6E', margin: '6px 0 14px 0' }}>
        If this wasn&apos;t expected, please reach out to our support team for help.
      </p>
      <button onClick={handleContact} style={{
        backgroundColor: '#E53935', color: 'white', border: 'none', borderRadius: '8px',
        padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
      }}>
        Contact Support
      </button>
    </div>
  );
};

function OrderTrackingPageContent() {
  const router = useRouter();
  const { orderId } = router.query;
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [riderPhone, setRiderPhone] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [nowMillis, setNowMillis] = useState(Date.now());
  const [preparingStartMillis, setPreparingStartMillis] = useState(null);

  // Live 1-second ticker
  useEffect(() => {
    const t = setInterval(() => setNowMillis(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Live order listener
  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
      setIsLoading(false);
      if (snap.exists()) {
        const data = snap.data();
        const items = (data.items || []).map((item) => ({
          name: item.itemName || item.name || 'Unknown Item',
          quantity: Number(item.quantity) || 0,
          price: Number(item.itemPrice ?? item.price) || 0,
          miniResName: item.miniResName || '',
        }));
        setOrder({
          id: snap.id,
          restaurantName: data.restaurantName || 'Unknown Restaurant',
          totalPrice: Number(data.totalPrice) || 0,
          orderStatus: data.orderStatus || 'Pending',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
          items,
          deliveryCharge: Number(data.deliveryCharge) || 0,
          serviceCharge: Number(data.serviceCharge) || 0,
          riderName: data.riderName || '',
          riderId: data.riderId || '',
        });
      }
    });
    return () => unsub();
  }, [orderId]);

  // Rider phone lookup
  useEffect(() => {
    setRiderPhone('');
    if (!order?.riderId) return;
    getDoc(doc(db, 'riders', order.riderId)).then((snap) => {
      if (snap.exists()) setRiderPhone(snap.data().phone || '');
    }).catch(() => {});
  }, [order?.riderId]);

  // User phone lookup (for cancel / support messages)
  useEffect(() => {
    if (!user) return;
    if (user.phoneNumber) { setUserPhone(user.phoneNumber); return; }
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserPhone(data.phoneNumber || data.phone || '');
      }
    }).catch(() => {});
  }, [user]);

  // Progress is computed defensively even before `order` loads, so the
  // hook below (which depends on it) can always run in the same order.
  const progress = order ? computeProgress(order, nowMillis) : { activeStage: null, reachedStages: new Set() };

  // The ETA countdown should only start ticking once the order is actually
  // being prepared — not from the moment it was placed. We capture the
  // wall-clock time the very first time we observe this, and count from there.
  useEffect(() => {
    if (progress.activeStage === 'PREPARING' && preparingStartMillis === null) {
      setPreparingStartMillis(Date.now());
    }
  }, [progress.activeStage, preparingStartMillis]);

  if (isLoading || !order) {
    return <LoadingSpinner />;
  }

  const isCancelled = (order.orderStatus || '').toLowerCase() === 'cancelled';
  const { activeStage, reachedStages } = progress;

  const showEta = !isCancelled && activeStage === 'PREPARING' && preparingStartMillis !== null;
  const etaRange = showEta ? computeEtaRangeMinutes(order.id, preparingStartMillis, nowMillis) : null;

  // 3-minute cancellation window, reactive via the ticker.
  const createdMillis = order.createdAt.toDate().getTime();
  const elapsedSec = Math.floor((nowMillis - createdMillis) / 1000);
  const remainingCancelSec = Math.max(0, 180 - elapsedSec);
  const isCancellable = remainingCancelSec > 0 && order.orderStatus === 'Pending';
  const cancelCountdown = `${pad2(Math.floor(remainingCancelSec / 60))}:${pad2(remainingCancelSec % 60)}`;

  const handleCancelOrder = () => {
    const message = `Hello, I would like to cancel my order. My phone number is ${userPhone || 'N/A'}.`;
    window.open(`https://wa.me/8801746324620?text=${encodeURIComponent(message)}`, '_blank');
    setShowCancelConfirm(false);
  };

  const itemsSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', paddingBottom: '40px' }}>
      {showCancelConfirm && (
        <CancelConfirmDialog onConfirm={handleCancelOrder} onCancel={() => setShowCancelConfirm(false)} />
      )}

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, backgroundColor: 'white',
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <button onClick={() => router.back()} style={{ padding: '8px', borderRadius: '9999px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
          <ArrowLeftIcon style={{ width: '22px', height: '22px', color: '#374151' }} />
        </button>
        <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#1F2937', margin: 0 }}>Track Order</h1>
      </div>

      <HeroHeader order={order} activeStage={activeStage} isCancelled={isCancelled} etaRange={etaRange} />

      <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '20px' }}>
        {isCancelled ? (
          <CancelledCard userPhone={userPhone} />
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', margin: '0 16px' }}>
            {TRACKING_STAGES.map((stageDef, index) => {
              const state = stageDef.key === activeStage ? 'ACTIVE' : (reachedStages.has(stageDef.key) ? 'DONE' : 'PENDING');
              if (state === 'PENDING') return null; // hidden until reached
              const isLast = state === 'ACTIVE';
              return (
                <TimelineStepRow key={stageDef.key} stageDef={stageDef} state={state} isLast={isLast}>
                  {stageDef.key === 'PREPARING' && state === 'ACTIVE' && <CookingRow etaRange={etaRange} />}
                  {stageDef.key === 'ACCEPTED' && state !== 'PENDING' && <RiderCard order={order} riderPhone={riderPhone} />}
                  {stageDef.key === 'ON_THE_WAY' && state === 'ACTIVE' && <OnTheWayRow />}
                </TimelineStepRow>
              );
            })}
          </div>
        )}

        {/* Order items + price */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', margin: '0 16px' }}>
          <p style={{ fontWeight: 700, fontSize: '16px', color: '#1F2937', margin: 0 }}>{order.restaurantName}</p>
          <p style={{ fontSize: '12px', color: '#757575', margin: '4px 0 14px 0' }}>Ordered on {formatTimestamp(order.createdAt)}</p>
          <hr style={{ border: 'none', borderTop: '1px solid #EFEFEF', margin: '0 0 14px 0' }} />
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#333333', padding: '4px 0' }}>
              <span>{item.quantity} x {item.name}</span>
              <span style={{ fontWeight: 600 }}>{taka}{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #EFEFEF', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '2px 0' }}>
            <span style={{ color: '#4B5563' }}>Items Subtotal</span><span>{taka}{itemsSubtotal.toFixed(0)}</span>
          </div>
          {order.deliveryCharge > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '2px 0' }}>
              <span style={{ color: '#4B5563' }}>Delivery Charge</span><span>{taka}{order.deliveryCharge.toFixed(0)}</span>
            </div>
          )}
          {order.serviceCharge > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '2px 0' }}>
              <span style={{ color: '#4B5563' }}>Service Charge</span><span>{taka}{order.serviceCharge.toFixed(0)}</span>
            </div>
          )}
          <hr style={{ border: 'none', borderTop: '1px solid #EFEFEF', margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', color: '#D50032' }}>
            <span>Total Payable</span><span>{taka}{order.totalPrice.toFixed(0)}</span>
          </div>
        </div>

        {isCancellable && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            style={{
              margin: '0 16px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 16px', backgroundColor: 'white', color: '#EF4444', border: '1px solid #EF4444',
              borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ExclamationTriangleIcon style={{ width: '18px', height: '18px' }} />
              Cancel Order
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(239,68,68,0.12)',
              borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontWeight: 700
            }}>
              <ClockIcon style={{ width: '13px', height: '13px' }} />
              {cancelCountdown}
            </span>
          </button>
        )}

        <button
          onClick={() => router.push('/home')}
          style={{
            margin: '0 16px', height: '48px', backgroundColor: '#B70314', color: 'white',
            border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default function OrderTracking() {
  return <ProtectedRoute><OrderTrackingPageContent /></ProtectedRoute>;
}
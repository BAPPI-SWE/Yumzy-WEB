import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import ProtectedRoute from '../../components/ProtectedRoute';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  ArrowLeftIcon, MapPinIcon, CheckCircleIcon, ExclamationCircleIcon,
  BanknotesIcon, CreditCardIcon, XMarkIcon, ArrowRightIcon, CheckIcon, CurrencyBangladeshiIcon
} from '@heroicons/react/24/solid';

const PaymentType = { COD: 'COD', BKASH: 'BKASH', NAGAD: 'NAGAD', ROCKET: 'ROCKET' };

const paymentMethods = {
  COD:    { name: 'Cash on Delivery', color: '#10B981', icon: BanknotesIcon },
  BKASH:  { name: 'Bkash',  number: '01970102586',  color: '#E2136E', icon: CurrencyBangladeshiIcon },
  NAGAD:  { name: 'Nagad',  number: '01988143409',  color: '#F15A29', icon: CurrencyBangladeshiIcon },
  ROCKET: { name: 'Rocket', number: '017463246207', color: '#00AEEF', icon: CurrencyBangladeshiIcon },
};

const SectionHeader = ({ title }) => (
  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', marginBottom: '8px', paddingLeft: '20px', paddingRight: '20px' }}>{title}</h2>
);

const ModernCard = ({ children }) => (
  <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden', marginLeft: '16px', marginRight: '16px' }}>
    <div style={{ padding: '16px' }}>{children}</div>
  </div>
);

const PriceRow = ({ label, amount, isTotal = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', paddingBottom: '6px' }}>
    <span style={{ fontSize: '14px', fontWeight: isTotal ? 700 : 400, color: isTotal ? '#D50032' : '#4B5563' }}>{label}</span>
    <span style={{ fontWeight: 600, fontSize: isTotal ? '18px' : '14px', color: isTotal ? '#D50032' : '#1F2937' }}>
      {String.fromCharCode(2547)}{amount?.toFixed(0) ?? '...'}
    </span>
  </div>
);

const OrderSentOverlay = ({ onComplete }) => {
  useEffect(() => { const t = setTimeout(onComplete, 2500); return () => clearTimeout(t); }, [onComplete]);
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: '#22C55E', width: '96px', height: '96px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', animation: 'bounce 1s infinite' }}>
        <CheckCircleIcon style={{ width: '64px', height: '64px', color: 'white' }} />
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Order Sent!</h2>
      <p style={{ color: 'rgba(255,255,255,0.9)' }}>Your order has been confirmed.</p>
      <style>{"@keyframes bounce { 0%,100%{transform:translateY(-25%)} 50%{transform:translateY(0)} }"}</style>
    </div>
  );
};

const PaymentMethodDialog = ({ onClose, onPaymentSelected }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (selectedMethod && !showForm) { const t = setTimeout(() => setShowForm(true), 500); return () => clearTimeout(t); }
  }, [selectedMethod]);

  if (selectedMethod && showForm) {
    const method = paymentMethods[selectedMethod];
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', backgroundColor: method.color, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <method.icon style={{ width: '24px', height: '24px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{method.name} Payment</h3>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><XMarkIcon style={{ width: '24px', height: '24px' }} /></button>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FBBF24', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#92400E', fontWeight: 600 }}>Send money to {method.number}</p>
              <p style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>Then enter your mobile number and transaction ID below.</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Mobile Number</label>
              <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="01XXXXXXXXX"
                style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = method.color} onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Transaction ID</label>
              <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter transaction ID"
                style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = method.color} onBlur={(e) => e.target.style.borderColor = '#D1D5DB'} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '12px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => mobileNumber && transactionId && onPaymentSelected(selectedMethod, mobileNumber + "," + transactionId)}
                disabled={!mobileNumber || !transactionId}
                style={{ flex: 1, padding: '12px', backgroundColor: mobileNumber && transactionId ? method.color : '#9CA3AF', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: mobileNumber && transactionId ? 'pointer' : 'not-allowed' }}>Confirm</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', backgroundColor: '#B70314', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Select Payment Method</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><XMarkIcon style={{ width: '24px', height: '24px' }} /></button>
        </div>
        <div style={{ padding: '20px' }}>
          {[['BKASH','Bkash','01970102586','#E2136E'],['NAGAD','Nagad','01988143409','#F15A29'],['ROCKET','Rocket','017463246207','#00AEEF']].map(([type, label, num, color], i) => (
            <button key={type} onClick={() => setSelectedMethod(type)}
              style={{ width: '100%', padding: '16px', backgroundColor: '#F8F9FA', border: '1px solid #E0E0E0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: i < 2 ? '12px' : '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CurrencyBangladeshiIcon style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: '#6B7280' }}>Send to: {num}</p>
                </div>
              </div>
              <ArrowRightIcon style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
            </button>
          ))}
          <button onClick={onClose} style={{ width: '100%', padding: '12px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState({ type: PaymentType.COD, details: '' });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // KEY FIX: prevents empty-cart guard from redirecting to /cart after order is placed
  const orderPlacedRef = useRef(false);

  const itemsForRestaurant = useMemo(() => {
    if (!restaurantId) return [];
    return Object.values(cart).filter(item => item.restaurantId === restaurantId);
  }, [cart, restaurantId]);

  const itemsSubtotal = useMemo(() =>
    itemsForRestaurant.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
    [itemsForRestaurant]);

  const isPreOrder = itemsForRestaurant.length > 0 && itemsForRestaurant[0].menuItem.category?.startsWith("Pre-order");
  const restaurantName = itemsForRestaurant.length > 0
    ? (restaurantId === 'yumzy_store' ? 'Yumzy Store' : itemsForRestaurant[0].restaurantName)
    : 'Your Order';

  // Guard: only redirect to /cart if order has NOT been placed
  useEffect(() => {
    if (router.isReady && !orderPlacedRef.current && (!restaurantId || itemsForRestaurant.length === 0)) {
      router.replace('/cart');
    }
  }, [router.isReady, restaurantId, itemsForRestaurant]);

  useEffect(() => {
    if (!user) return;
    setIsLoadingProfile(true);
    getDoc(doc(db, 'users', user.uid))
      .then(snap => { if (snap.exists()) setUserProfile(snap.data()); else setError("User profile not found."); })
      .catch(() => setError("Could not load your profile details."))
      .finally(() => setIsLoadingProfile(false));
  }, [user]);

  useEffect(() => {
    if (!userProfile || !restaurantId) return;
    const calculateCharges = async () => {
      setIsLoadingCharges(true); setError('');
      let baseDelivery = 20.0, baseService = 5.0, additionalDelivery = 0.0, additionalService = 0.0;
      const { baseLocation, subLocation } = userProfile;
      if (!baseLocation || !subLocation) {
        setError("Please complete your location details in your profile.");
        setDeliveryCharge(baseDelivery); setServiceCharge(baseService); setIsLoadingCharges(false); return;
      }
      try {
        const locSnap = await getDocs(query(collection(db, 'locations'), where('name', '==', baseLocation)));
        if (!locSnap.empty) {
          const locData = locSnap.docs[0].data();
          const subIndex = (locData.subLocations || []).indexOf(subLocation);
          if (subIndex !== -1) {
            const dArr = locData[isPreOrder ? 'deliveryCharge' : 'deliveryChargeYumzy'] || [];
            const sArr = locData[isPreOrder ? 'serviceCharge' : 'serviceChargeYumzy'] || [];
            if (subIndex < dArr.length) { const n = Number(dArr[subIndex]); if (!isNaN(n)) baseDelivery = n; }
            if (subIndex < sArr.length) { const n = Number(sArr[subIndex]); if (!isNaN(n)) baseService = n; }
          }
        }
        if (restaurantId === 'yumzy_store') {
          const baseIds = [...new Set(itemsForRestaurant.map(item => { const id = item.menuItem.id; return id.includes('_') ? id.split('_')[0] : id; }))];
          for (const bid of baseIds) {
            try {
              const snap = await getDoc(doc(db, 'store_items', bid));
              if (snap.exists()) { additionalDelivery += snap.data().additionalDeliveryCharge || 0; additionalService += snap.data().additionalServiceCharge || 0; }
            } catch(e) { console.error(e); }
          }
        }
        setDeliveryCharge(baseDelivery + additionalDelivery);
        setServiceCharge(baseService + additionalService);
      } catch(err) {
        console.error("Error calculating charges:", err);
        setError("Could not calculate delivery charges. Using defaults.");
        setDeliveryCharge(baseDelivery + additionalDelivery);
        setServiceCharge(baseService + additionalService);
      } finally { setIsLoadingCharges(false); }
    };
    calculateCharges();
  }, [userProfile, restaurantId, isPreOrder]);

  const handlePaymentSelect = (paymentType, details = '') => { setSelectedPaymentMethod({ type: paymentType, details }); setShowPaymentDialog(false); };

  const getPaymentString = () => {
    switch (selectedPaymentMethod.type) {
      case PaymentType.COD:    return 'COD';
      case PaymentType.BKASH:  return "Bkash,01970102586," + selectedPaymentMethod.details;
      case PaymentType.NAGAD:  return "Nagad,01988143409," + selectedPaymentMethod.details;
      case PaymentType.ROCKET: return "Rocket,017463246207," + selectedPaymentMethod.details;
      default: return 'COD';
    }
  };

  const getPaymentDisplayText = () => {
    const method = paymentMethods[selectedPaymentMethod.type];
    if (selectedPaymentMethod.type === PaymentType.COD) return method.name;
    return method.name + " (" + selectedPaymentMethod.details.split(',')[0] + ")";
  };

  const handleConfirmOrder = async () => {
    if (!user || !userProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder) return;
    setIsPlacingOrder(true); setError('');
    const finalTotal = itemsSubtotal + deliveryCharge + serviceCharge;
    const orderItems = itemsForRestaurant.map(ci => ({
      itemName: ci.menuItem.name, quantity: ci.quantity, price: ci.menuItem.price,
      miniResName: (ci.restaurantName && ci.restaurantName !== 'Yumzy Store') ? ci.restaurantName : ''
    }));
    const orderType = isPreOrder ? "PreOrder" : "Instant";
    const newOrder = {
      userId: user.uid, userName: userProfile.name || user.displayName || 'N/A',
      userPhone: userProfile.phone || 'N/A', userBaseLocation: userProfile.baseLocation || 'N/A',
      userSubLocation: userProfile.subLocation || 'N/A', building: userProfile.building || '',
      floor: userProfile.floor || '', room: userProfile.room || '',
      restaurantId, restaurantName, totalPrice: finalTotal, deliveryCharge, serviceCharge,
      items: orderItems, orderStatus: "Pending", createdAt: Timestamp.now(),
      orderType, preOrderCategory: orderType === "PreOrder" ? (itemsForRestaurant[0]?.menuItem.category || '') : "",
      payment: getPaymentString()
    };
    try {
      await addDoc(collection(db, 'orders'), newOrder);
      // Set ref BEFORE clearing cart — prevents the empty-cart guard from redirecting to /cart
      orderPlacedRef.current = true;
      clearCartForRestaurant(restaurantId);
      setShowOrderSent(true);
    } catch(err) {
      console.error("Error placing order:", err);
      setError("Failed to place order. Please try again.");
      setIsPlacingOrder(false);
    }
  };

  // After success animation → redirect to orders
  const handleOrderSentComplete = () => {
    setShowOrderSent(false);
    router.push({ pathname: '/orders', query: { showAd: 'true' } });
  };

  const finalTotal = deliveryCharge !== null && serviceCharge !== null ? itemsSubtotal + deliveryCharge + serviceCharge : null;
  const isConfirmDisabled = isLoadingCharges || isLoadingProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder || !!error;

  if (!router.isReady || (restaurantId && itemsForRestaurant.length === 0 && !isLoadingCharges && !isLoadingProfile && !orderPlacedRef.current)) {
    return <LoadingSpinner />;
  }

  const taka = String.fromCharCode(2547);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', paddingBottom: '96px', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 30, backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={() => router.back()} disabled={isPlacingOrder} style={{ padding: '8px', borderRadius: '9999px', border: 'none', backgroundColor: 'transparent', cursor: isPlacingOrder ? 'not-allowed' : 'pointer' }}>
          <ArrowLeftIcon style={{ width: '24px', height: '24px', color: '#374151' }} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1F2937', flex: 1 }}>Confirm Order</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px', paddingBottom: '16px' }}>
        <section>
          <SectionHeader title="Delivery Address" />
          <ModernCard>
            {isLoadingProfile ? <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>Loading address...</p> : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPinIcon style={{ width: '20px', height: '20px', color: '#16A34A', marginTop: '2px', flexShrink: 0 }} />
                <p style={{ fontSize: '14px', color: '#374151' }}>
                  {userProfile?.building ? userProfile.building + ', ' : ''}
                  {userProfile?.floor ? 'Flr ' + userProfile.floor + ', ' : ''}
                  {userProfile?.room ? 'Rm ' + userProfile.room + ', ' : ''}
                  {userProfile?.subLocation ? userProfile.subLocation + ', ' : ''}
                  {userProfile?.baseLocation || 'Address not set'}
                </p>
              </div>
            )}
          </ModernCard>
        </section>

        <section>
          <SectionHeader title="Order Summary" />
          <ModernCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {itemsForRestaurant.map((item, index) => (
                <div key={item.menuItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '8px', borderTop: index === 0 ? 'none' : '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#374151' }}>{item.quantity} x {item.menuItem.name}</span>
                    {item.restaurantId === 'yumzy_store' && item.restaurantName && item.restaurantName !== 'Yumzy Store' && (
                      <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>from {item.restaurantName}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937', whiteSpace: 'nowrap' }}>{taka}{(item.menuItem.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </section>

        <section>
          <SectionHeader title="Payment Method" />
          <ModernCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div onClick={() => handlePaymentSelect(PaymentType.COD)} style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: selectedPaymentMethod.type === PaymentType.COD ? '#F0F9FF' : 'transparent', border: selectedPaymentMethod.type === PaymentType.COD ? '2px solid #0EA5E9' : '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '12px', border: selectedPaymentMethod.type === PaymentType.COD ? '6px solid #0EA5E9' : '2px solid #9CA3AF' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BanknotesIcon style={{ width: '20px', height: '20px', color: '#10B981' }} />
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>Cash on Delivery</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', marginLeft: '28px' }}>Pay when you receive your order</p>
                </div>
                {selectedPaymentMethod.type === PaymentType.COD && <CheckIcon style={{ width: '20px', height: '20px', color: '#0EA5E9' }} />}
              </div>
              <div onClick={() => setShowPaymentDialog(true)} style={{ display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: selectedPaymentMethod.type !== PaymentType.COD ? '#F0F9FF' : 'transparent', border: selectedPaymentMethod.type !== PaymentType.COD ? '2px solid #0EA5E9' : '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '12px', border: selectedPaymentMethod.type !== PaymentType.COD ? '6px solid #0EA5E9' : '2px solid #9CA3AF' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCardIcon style={{ width: '20px', height: '20px', color: '#8B5CF6' }} />
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>Other Payment Method</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', marginLeft: '28px' }}>Bkash, Nagad, Rocket</p>
                </div>
                {selectedPaymentMethod.type !== PaymentType.COD && <CheckIcon style={{ width: '20px', height: '20px', color: '#0EA5E9' }} />}
              </div>
              {selectedPaymentMethod.type !== PaymentType.COD && selectedPaymentMethod.details && (
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '8px', borderLeft: '4px solid ' + paymentMethods[selectedPaymentMethod.type].color }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>{getPaymentDisplayText()}</p>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Transaction ID: {selectedPaymentMethod.details.split(',')[1]}</p>
                </div>
              )}
            </div>
          </ModernCard>
        </section>

        <section>
          <SectionHeader title="Price Details" />
          <ModernCard>
            {isLoadingCharges ? <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>Calculating charges...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <PriceRow label="Items Subtotal" amount={itemsSubtotal} />
                <PriceRow label="Delivery Charge" amount={deliveryCharge} />
                <PriceRow label="Service Charge" amount={serviceCharge} />
                <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #E5E7EB' }} />
                <PriceRow label="Total to Pay" amount={finalTotal} isTotal={true} />
              </div>
            )}
          </ModernCard>
        </section>

        {error && (
          <div style={{ marginLeft: '16px', marginRight: '16px', padding: '12px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExclamationCircleIcon style={{ width: '20px', height: '20px' }} />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '16px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 40 }}>
        <button onClick={handleConfirmOrder} disabled={isConfirmDisabled}
          style={{ width: '100%', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '16px', fontWeight: 600, border: 'none', color: 'white', backgroundColor: isConfirmDisabled ? '#9CA3AF' : '#B70314', cursor: isConfirmDisabled ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}>
          {isPlacingOrder ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite', marginRight: '12px', height: '20px', width: '20px', color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Placing Order...
              <style>{"@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>
            </>
          ) : ("Confirm & Place Order (" + taka + (finalTotal?.toFixed(0) ?? '...') + ")")}
        </button>
      </div>

      {showPaymentDialog && <PaymentMethodDialog onClose={() => setShowPaymentDialog(false)} onPaymentSelected={handlePaymentSelect} />}
      {showOrderSent && <OrderSentOverlay onComplete={handleOrderSentComplete} />}
    </div>
  );
}

export default function Checkout() {
  return <ProtectedRoute><CheckoutPageContent /></ProtectedRoute>;
}
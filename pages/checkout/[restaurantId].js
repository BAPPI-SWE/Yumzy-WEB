import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import ProtectedRoute from '../../components/ProtectedRoute';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  BanknotesIcon,
  CreditCardIcon,
  XMarkIcon,
  ArrowRightIcon,
  CheckIcon,
  CurrencyBangladeshiIcon
} from '@heroicons/react/24/solid';

// --- Payment Types and Constants ---
const PaymentType = {
  COD: 'COD',
  BKASH: 'BKASH',
  NAGAD: 'NAGAD',
  ROCKET: 'ROCKET'
};

const paymentMethods = {
  [PaymentType.COD]: {
    name: 'Cash on Delivery',
    description: 'Pay when you receive your order',
    color: '#10B981',
    icon: BanknotesIcon
  },
  [PaymentType.BKASH]: {
    name: 'Bkash',
    number: '01970102586',
    color: '#E2136E',
    icon: CurrencyBangladeshiIcon
  },
  [PaymentType.NAGAD]: {
    name: 'Nagad',
    number: '01988143409',
    color: '#F15A29',
    icon: CurrencyBangladeshiIcon
  },
  [PaymentType.ROCKET]: {
    name: 'Rocket',
    number: '017463246207',
    color: '#00AEEF',
    icon: CurrencyBangladeshiIcon
  }
};

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

// Payment Method Dialog Component
const PaymentMethodDialog = ({ onClose, onPaymentSelected }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    if (selectedMethod && !showForm) {
      const timer = setTimeout(() => setShowForm(true), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedMethod]);

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const handleSubmit = () => {
    if (mobileNumber && transactionId) {
      onPaymentSelected(selectedMethod, `${mobileNumber},${transactionId}`);
    }
  };

  if (selectedMethod && showForm) {
    const method = paymentMethods[selectedMethod];
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            backgroundColor: method.color,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <method.icon style={{ width: '24px', height: '24px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{method.name} Payment</h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <XMarkIcon style={{ width: '24px', height: '24px' }} />
            </button>
          </div>

          {/* Instructions */}
          <div style={{ padding: '20px' }}>
            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FBBF24',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '14px', color: '#92400E', fontWeight: 600 }}>
                Send money to {method.number}
              </p>
              <p style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>
                Then enter your mobile number and transaction ID below.
              </p>
            </div>

            {/* Mobile Number Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = method.color}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            {/* Transaction ID Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Transaction ID
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = method.color}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!mobileNumber || !transactionId}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: mobileNumber && transactionId ? method.color : '#9CA3AF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: mobileNumber && transactionId ? 'pointer' : 'not-allowed',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (mobileNumber && transactionId) e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  if (mobileNumber && transactionId) e.currentTarget.style.opacity = '1';
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Payment Method Selection View
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '400px',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          backgroundColor: '#B70314',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Select Payment Method</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <XMarkIcon style={{ width: '24px', height: '24px' }} />
          </button>
        </div>

        {/* Payment Options */}
        <div style={{ padding: '20px' }}>
          {/* Bkash */}
          <button
            onClick={() => handleMethodSelect(PaymentType.BKASH)}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#F8F9FA',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(226, 19, 110, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F8F9FA';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#E2136E',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CurrencyBangladeshiIcon style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>Bkash</p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>Send to: 01970102586</p>
              </div>
            </div>
            <ArrowRightIcon style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
          </button>

          {/* Nagad */}
          <button
            onClick={() => handleMethodSelect(PaymentType.NAGAD)}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#F8F9FA',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(241, 90, 41, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F8F9FA';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#F15A29',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CurrencyBangladeshiIcon style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>Nagad</p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>Send to: 01988143409</p>
              </div>
            </div>
            <ArrowRightIcon style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
          </button>

          {/* Rocket */}
          <button
            onClick={() => handleMethodSelect(PaymentType.ROCKET)}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#F8F9FA',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 174, 239, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F8F9FA';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#00AEEF',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CurrencyBangladeshiIcon style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>Rocket</p>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>Send to: 017463246207</p>
              </div>
            </div>
            <ArrowRightIcon style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          >
            Cancel
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
  
  // Payment method states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState({
    type: PaymentType.COD,
    details: ''
  });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const itemsForRestaurant = useMemo(() => {
    if (!restaurantId) return [];
    return Object.values(cart).filter(item => item.restaurantId === restaurantId);
  }, [cart, restaurantId]);

  const itemsSubtotal = useMemo(() => {
    return itemsForRestaurant.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [itemsForRestaurant]);

  const isPreOrder = itemsForRestaurant.length > 0 && itemsForRestaurant[0].menuItem.category?.startsWith("Pre-order");
  
  const restaurantName = itemsForRestaurant.length > 0 
    ? (restaurantId === 'yumzy_store' ? 'Yumzy Store' : itemsForRestaurant[0].restaurantName)
    : 'Your Order';

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

  // --- Fetch/Calculate Charges ---
  useEffect(() => {
    if (!userProfile || !restaurantId) {
        if (router.isReady && userProfile === null) {
           // Still loading profile
        } else if (router.isReady && userProfile && (!userProfile.baseLocation || !userProfile.subLocation)) {
           // Profile loaded but missing location
           setError("Location details missing in profile. Using default charges.");
           setDeliveryCharge(20.0);
           setServiceCharge(5.0);
           setIsLoadingCharges(false);
        }
        return; 
    }

    const calculateCharges = async () => {
      console.log("--- Starting Charge Calculation ---"); 
      setIsLoadingCharges(true);
      setError('');
      let baseDelivery = 20.0;
      let baseService = 5.0;
      let additionalDelivery = 0.0;
      let additionalService = 0.0;

      const baseLocation = userProfile.baseLocation;
      const subLocation = userProfile.subLocation;

      console.log(`User Location: Base='${baseLocation}', Sub='${subLocation}'`); 

      if (!baseLocation || !subLocation) {
          setError("Please complete your location details in your profile.");
          setIsLoadingCharges(false);
          setDeliveryCharge(baseDelivery); 
          setServiceCharge(baseService);
          console.log("--- Charge Calculation ENDED (Missing Location) ---"); 
          return;
      }

      try {
        console.log(`Querying 'locations' where name == '${baseLocation}'`); 
        const locQuery = query(collection(db, 'locations'), where('name', '==', baseLocation));
        const locSnap = await getDocs(locQuery);

        if (!locSnap.empty) {
          const locData = locSnap.docs[0].data();
          console.log("Location Data Found:", locData); 

          const subLocations = locData.subLocations || [];
          const subIndex = subLocations.indexOf(subLocation);
          console.log(`SubLocations Array: [${subLocations.join(', ')}], Found '${subLocation}' at index: ${subIndex}`); 

          if (subIndex !== -1) {
              const deliveryKey = isPreOrder ? 'deliveryCharge' : 'deliveryChargeYumzy';
              const serviceKey = isPreOrder ? 'serviceCharge' : 'serviceChargeYumzy';
              console.log(`Is PreOrder: ${isPreOrder}, Using keys: delivery='${deliveryKey}', service='${serviceKey}'`); 

              const deliveryArray = locData[deliveryKey] || [];
              const serviceArray = locData[serviceKey] || [];
              console.log(`Delivery Charges Array:`, deliveryArray); 
              console.log(`Service Charges Array:`, serviceArray); 

              if (subIndex < deliveryArray.length) {
                  const fetchedDelivery = Number(deliveryArray[subIndex]);
                  if (!isNaN(fetchedDelivery)) {
                      baseDelivery = fetchedDelivery;
                  } else {
                      console.warn(`Invalid number format for delivery charge at index ${subIndex}:`, deliveryArray[subIndex]);
                  }
              } else {
                   console.warn(`SubLocation index ${subIndex} is out of bounds for delivery charges array (length ${deliveryArray.length})`);
              }

              if (subIndex < serviceArray.length) {
                  const fetchedService = Number(serviceArray[subIndex]);
                   if (!isNaN(fetchedService)) {
                      baseService = fetchedService;
                  } else {
                       console.warn(`Invalid number format for service charge at index ${subIndex}:`, serviceArray[subIndex]);
                  }
              } else {
                   console.warn(`SubLocation index ${subIndex} is out of bounds for service charges array (length ${serviceArray.length})`);
              }
              console.log(`Base charges calculated: Delivery=${baseDelivery}, Service=${baseService}`); 
          } else {
               console.warn(`User's subLocation '${subLocation}' not found in location document's subLocations array.`); 
          }
        } else {
             console.warn(`Location document not found for baseLocation: '${baseLocation}'`); 
        }

        if (restaurantId === 'yumzy_store') {
          console.log("Checking additional charges for yumzy_store items."); 
          const itemBaseIds = [...new Set(itemsForRestaurant.map(item => {
            const id = item.menuItem.id;
            return id.includes('_') ? id.split('_')[0] : id; 
          }))];
          console.log("Base Item IDs for additional charges:", itemBaseIds); 

          if (itemBaseIds.length > 0) {
             for (const baseId of itemBaseIds) {
                 try {
                    const itemDocRef = doc(db, 'store_items', baseId);
                    const itemDocSnap = await getDoc(itemDocRef);
                    if (itemDocSnap.exists()) {
                        const itemData = itemDocSnap.data();
                        const addDel = itemData.additionalDeliveryCharge || 0.0;
                        const addSer = itemData.additionalServiceCharge || 0.0;
                        additionalDelivery += addDel;
                        additionalService += addSer;
                        console.log(`Item '${baseId}': Add Delivery=${addDel}, Add Service=${addSer}`); 
                    } else {
                         console.log(`Item '${baseId}' document not found for additional charges.`); 
                    }
                 } catch (itemErr) {
                     console.error(`Failed to fetch additional charges for item ${baseId}:`, itemErr);
                 }
             }
             console.log(`Total additional charges: Delivery=${additionalDelivery}, Service=${additionalService}`); 
          }
        }

        const finalDelivery = baseDelivery + additionalDelivery;
        const finalService = baseService + additionalService;

        console.log(`Setting final charges: Delivery=${finalDelivery}, Service=${finalService}`); 
        setDeliveryCharge(finalDelivery);
        setServiceCharge(finalService);

      } catch (err) {
        console.error("Error calculating charges:", err);
        setError("Could not calculate delivery charges. Using defaults.");
        const finalDeliveryOnError = baseDelivery + additionalDelivery;
        const finalServiceOnError = baseService + additionalService;
        console.log(`Setting charges on ERROR: Delivery=${finalDeliveryOnError}, Service=${finalServiceOnError}`); 
        setDeliveryCharge(finalDeliveryOnError);
        setServiceCharge(finalServiceOnError);
      } finally {
        setIsLoadingCharges(false);
        console.log("--- Charge Calculation ENDED ---"); 
      }
    };

    calculateCharges();
  }, [userProfile, restaurantId, itemsForRestaurant, isPreOrder, router.isReady, user]); 

  const handlePaymentSelect = (paymentType, details = '') => {
    setSelectedPaymentMethod({
      type: paymentType,
      details: details
    });
    setShowPaymentDialog(false);
  };

  const getPaymentString = () => {
    switch (selectedPaymentMethod.type) {
      case PaymentType.COD:
        return 'COD';
      case PaymentType.BKASH:
        return `Bkash,01970102586,${selectedPaymentMethod.details}`;
      case PaymentType.NAGAD:
        return `Nagad,01988143409,${selectedPaymentMethod.details}`;
      case PaymentType.ROCKET:
        return `Rocket,017463246207,${selectedPaymentMethod.details}`;
      default:
        return 'COD';
    }
  };

  const getPaymentDisplayText = () => {
    const method = paymentMethods[selectedPaymentMethod.type];
    if (selectedPaymentMethod.type === PaymentType.COD) {
      return method.name;
    }
    const details = selectedPaymentMethod.details.split(',');
    return `${method.name} (${details[0]})`;
  };

  const handleConfirmOrder = async () => {
    if (!user || !userProfile || deliveryCharge === null || serviceCharge === null || isPlacingOrder) return;

    setIsPlacingOrder(true);
    setError('');

    const finalTotal = itemsSubtotal + deliveryCharge + serviceCharge;
    const paymentString = getPaymentString();

    const orderItems = itemsForRestaurant.map(cartItem => ({
      itemName: cartItem.menuItem.name,
      quantity: cartItem.quantity,
      price: cartItem.menuItem.price,
      miniResName: (cartItem.restaurantName && cartItem.restaurantName !== 'Yumzy Store') ? cartItem.restaurantName : ''
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
      preOrderCategory: orderType === "PreOrder" ? firstItemCategory : "",
      payment: paymentString // Add payment field
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
              gap: '12px',
            }}>
              {itemsForRestaurant.map((item, index) => (
                <div 
                  key={item.menuItem.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    paddingTop: '8px',
                    borderTop: index === 0 ? 'none' : '1px solid #F3F4F6'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: '8px' }}>
                    <span style={{
                      fontSize: '14px',
                      color: '#374151'
                    }}>{item.quantity} x {item.menuItem.name}</span>
                    
                    {item.restaurantId === 'yumzy_store' && item.restaurantName && item.restaurantName !== 'Yumzy Store' && (
                      <span style={{
                        fontSize: '11px',
                        color: '#6B7280',
                        fontWeight: 500,
                        marginTop: '2px'
                      }}>
                        from {item.restaurantName}
                      </span>
                    )}
                  </div>
                  
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1F2937',
                    whiteSpace: 'nowrap'
                  }}>৳{(item.menuItem.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </ModernCard>
        </section>

        {/* Payment Method Section */}
        <section>
          <SectionHeader title="Payment Method" />
          <ModernCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Cash on Delivery Option */}
              <div
                onClick={() => handlePaymentSelect(PaymentType.COD)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: selectedPaymentMethod.type === PaymentType.COD ? '#F0F9FF' : 'transparent',
                  border: selectedPaymentMethod.type === PaymentType.COD ? '2px solid #0EA5E9' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedPaymentMethod.type !== PaymentType.COD) {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPaymentMethod.type !== PaymentType.COD) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: selectedPaymentMethod.type === PaymentType.COD ? '6px solid #0EA5E9' : '2px solid #9CA3AF',
                  marginRight: '12px',
                  transition: 'all 0.2s'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BanknotesIcon style={{ width: '20px', height: '20px', color: '#10B981' }} />
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                      Cash on Delivery
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', marginLeft: '28px' }}>
                    Pay when you receive your order
                  </p>
                </div>
                {selectedPaymentMethod.type === PaymentType.COD && (
                  <CheckIcon style={{ width: '20px', height: '20px', color: '#0EA5E9' }} />
                )}
              </div>

              {/* Other Payment Methods Option */}
              <div
                onClick={() => setShowPaymentDialog(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: selectedPaymentMethod.type !== PaymentType.COD ? '#F0F9FF' : 'transparent',
                  border: selectedPaymentMethod.type !== PaymentType.COD ? '2px solid #0EA5E9' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedPaymentMethod.type === PaymentType.COD) {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPaymentMethod.type === PaymentType.COD) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: selectedPaymentMethod.type !== PaymentType.COD ? '6px solid #0EA5E9' : '2px solid #9CA3AF',
                  marginRight: '12px',
                  transition: 'all 0.2s'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCardIcon style={{ width: '20px', height: '20px', color: '#8B5CF6' }} />
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                      Other Payment Method
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', marginLeft: '28px' }}>
                    Bkash, Nagad, Rocket
                  </p>
                </div>
                {selectedPaymentMethod.type !== PaymentType.COD && (
                  <CheckIcon style={{ width: '20px', height: '20px', color: '#0EA5E9' }} />
                )}
              </div>

              {/* Show selected digital payment details */}
              {selectedPaymentMethod.type !== PaymentType.COD && selectedPaymentMethod.details && (
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${paymentMethods[selectedPaymentMethod.type].color}`
                }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                    {getPaymentDisplayText()}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                    Transaction ID: {selectedPaymentMethod.details.split(',')[1]}
                  </p>
                </div>
              )}
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

      {/* Payment Method Dialog */}
      {showPaymentDialog && (
        <PaymentMethodDialog
          onClose={() => setShowPaymentDialog(false)}
          onPaymentSelected={handlePaymentSelect}
        />
      )}

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
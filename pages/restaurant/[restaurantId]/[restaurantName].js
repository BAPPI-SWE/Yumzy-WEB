import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase/config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useCart } from '../../../context/CartContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { ArrowLeftIcon, PlusIcon, MinusIcon, ShoppingCartIcon, CheckCircleIcon, ClockIcon, BuildingStorefrontIcon, ChevronRightIcon, BanknotesIcon } from '@heroicons/react/24/solid';
import { FireIcon } from '@heroicons/react/24/outline';

// --- Reusable Components ---

// Simple Card for Menu Item
const MenuItemCard = ({ menuItem, quantity, onAdd, onIncrement, onDecrement, isEnabled }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      opacity: isEnabled ? 1 : 0.6
    }}>
      <div style={{
        flex: 1,
        minWidth: 0
      }}>
        <p style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1F2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{menuItem.name}</p>
        <p style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#DC0C25',
          marginTop: '4px'
        }}>
          ৳{menuItem.price.toFixed(0)}
        </p>
      </div>
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

// Quantity Selector
const QuantitySelector = ({ quantity, onAdd, onIncrement, onDecrement, isEnabled }) => {
  if (quantity === 0) {
    return (
      <button
        onClick={onAdd}
        disabled={!isEnabled}
        style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isEnabled ? '#DC0C25' : '#D1D5DB',
          color: 'white',
          borderRadius: '9999px',
          border: 'none',
          cursor: isEnabled ? 'pointer' : 'not-allowed',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => isEnabled && (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => isEnabled && (e.currentTarget.style.opacity = '1')}
      >
        <PlusIcon style={{ width: '20px', height: '20px' }} />
      </button>
    );
  } else {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <button
          onClick={onDecrement}
          disabled={!isEnabled}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isEnabled ? '#E5E7EB' : '#D1D5DB',
            color: '#374151',
            borderRadius: '9999px',
            border: 'none',
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => isEnabled && (e.currentTarget.style.backgroundColor = '#D1D5DB')}
          onMouseLeave={(e) => isEnabled && (e.currentTarget.style.backgroundColor = '#E5E7EB')}
        >
          <MinusIcon style={{ width: '16px', height: '16px' }} />
        </button>
        <span style={{
          fontSize: '16px',
          fontWeight: 700,
          minWidth: '20px',
          textAlign: 'center'
        }}>{quantity}</span>
        <button
          onClick={onIncrement}
          disabled={!isEnabled}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isEnabled ? '#DC0C25' : '#D1D5DB',
            color: 'white',
            borderRadius: '9999px',
            border: 'none',
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => isEnabled && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => isEnabled && (e.currentTarget.style.opacity = '1')}
        >
          <PlusIcon style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    );
  }
};

// Card for PreOrder Category
const PreOrderCategoryCard = ({ category, onClick }) => {
  const cardColor = '#6366F1';
  const textColor = '#4338CA';
  const bgColorLight = '#EEF2FF';

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: bgColorLight
      }}
    >
      <div style={{
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9999px',
              backgroundColor: cardColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BuildingStorefrontIcon style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#1F2937'
            }}>{category.name}</h3>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#4B5563',
            paddingLeft: '4px'
          }}>
            <ClockIcon style={{ width: '14px', height: '14px' }} />
            <span>Order: {category.startTime} - {category.endTime}</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            paddingLeft: '4px',
            color: textColor
          }}>
            <BanknotesIcon style={{ width: '14px', height: '14px' }} />
            <span>Delivery: {category.deliveryTime}</span>
          </div>
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '9999px',
          backgroundColor: cardColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: '12px'
        }}>
          <ChevronRightIcon style={{ width: '24px', height: '24px', color: 'white' }} />
        </div>
      </div>
    </div>
  );
};

// Blinking Text Component
const BlinkingText = ({ text }) => {
  return (
    <span style={{
      fontWeight: 600,
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }}>
      {text} <FireIcon style={{
        width: '16px',
        height: '16px',
        display: 'inline-block',
        marginBottom: '2px',
        color: '#EF4444'
      }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </span>
  );
};

// Availability Chip
const AvailabilityChip = ({ isAvailable }) => {
  const bgColor = isAvailable ? '#D1FAE5' : '#FEE2E2';
  const textColor = isAvailable ? '#065F46' : '#991B1B';
  const text = isAvailable ? 'Available' : 'Instant Delivery Unavailable';

  return (
    <div style={{
      display: 'inline-block',
      paddingLeft: '12px',
      paddingRight: '12px',
      paddingTop: '4px',
      paddingBottom: '4px',
      borderRadius: '9999px',
      backgroundColor: bgColor,
      color: textColor,
      fontSize: '12px',
      fontWeight: 700
    }}>
      {text}
    </div>
  );
};

// Bottom Bar
const CartBottomBar = ({ onAddToCart, onPlaceOrder, totalItems }) => {
  if (totalItems === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      padding: '16px',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
      zIndex: 50
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        maxWidth: '512px',
        margin: '0 auto'
      }}>
        <button
          onClick={onAddToCart}
          style={{
            padding: '12px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            color: '#DC0C25',
            backgroundColor: 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          title="Save selections to main cart"
        >
          <ShoppingCartIcon style={{ width: '24px', height: '24px' }} />
        </button>
        <button
          onClick={onPlaceOrder}
          style={{
            flex: 1,
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#B70314',
            color: 'white',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <CheckCircleIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
          <span>Place Order Now ({totalItems})</span>
        </button>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function RestaurantMenuPage() {
  const router = useRouter();
  const { restaurantId, restaurantName: encodedName } = router.query;
  const restaurantName = encodedName ? decodeURIComponent(encodedName) : 'Restaurant';

  const [preOrderCategories, setPreOrderCategories] = useState([]);
  const [currentMenuItems, setCurrentMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstantDeliveryAvailable, setIsInstantDeliveryAvailable] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [error, setError] = useState('');

  const { cart, addToCart, incrementItem, decrementItem, clearCartForRestaurant, totalItems } = useCart();

  // --- Fetch Data ---
  useEffect(() => {
    if (!restaurantId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const restaurantRef = doc(db, 'restaurants', restaurantId);

        const preOrderSnap = await getDocs(collection(restaurantRef, 'preOrderCategories'));
        const categories = preOrderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPreOrderCategories(categories);

        const menuQuery = query(collection(restaurantRef, 'menuItems'), where('category', '==', 'Current Menu'));
        const menuSnap = await getDocs(menuQuery);
        const items = menuSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCurrentMenuItems(items);

        const ridersQuery = query(
          collection(db, 'riders'),
          where('isAvailable', '==', true)
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
  }, [restaurantId]);

  const currentRestaurantCart = Object.values(cart).filter(item => item.restaurantId === restaurantId);
  const currentTotalItems = currentRestaurantCart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePreOrderCategoryClick = (category) => {
    const encodedRestName = encodeURIComponent(restaurantName);
    const encodedCatName = encodeURIComponent(`Pre-order ${category.name}`);
    router.push(`/preorder-menu/${restaurantId}/${encodedRestName}/${encodedCatName}`);
  };

  const handlePlaceOrder = () => {
    router.push(`/checkout/${restaurantId}`);
  };

  const handleAddToCart = () => {
    alert('Items saved to cart!');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9FAFB',
      paddingBottom: '80px'
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
          style={{
            padding: '8px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
        }}>{restaurantName}</h1>
      </div>

      {/* Tabs */}
      <div style={{
        position: 'sticky',
        top: '68px',
        zIndex: 20,
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div style={{ display: 'flex' }}>
          <button
            onClick={() => setSelectedTabIndex(0)}
            style={{
              flex: 1,
              paddingTop: '12px',
              paddingBottom: '12px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 500,
              borderBottom: selectedTabIndex === 0 ? '2px solid #DC0C25' : '2px solid transparent',
              color: selectedTabIndex === 0 ? '#DC0C25' : '#4B5563',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => selectedTabIndex !== 0 && (e.currentTarget.style.color = '#1F2937')}
            onMouseLeave={(e) => selectedTabIndex !== 0 && (e.currentTarget.style.color = '#4B5563')}
          >
            Pre-Order Category
          </button>
          <button
            onClick={() => setSelectedTabIndex(1)}
            style={{
              flex: 1,
              paddingTop: '12px',
              paddingBottom: '12px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 500,
              borderBottom: selectedTabIndex === 1 ? '2px solid #DC0C25' : '2px solid transparent',
              color: selectedTabIndex === 1 ? '#DC0C25' : '#4B5563',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => selectedTabIndex !== 1 && (e.currentTarget.style.color = '#1F2937')}
            onMouseLeave={(e) => selectedTabIndex !== 1 && (e.currentTarget.style.color = '#4B5563')}
          >
            <BlinkingText text="Available Now" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {error && <p style={{ color: '#DC2626', textAlign: 'center' }}>{error}</p>}

        {selectedTabIndex === 0 && (
          preOrderCategories.length > 0 ? (
            preOrderCategories.map((category) => (
              <PreOrderCategoryCard
                key={category.id}
                category={category}
                onClick={() => handlePreOrderCategoryClick(category)}
              />
            ))
          ) : (
            <p style={{ color: '#4B5563', textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
              No pre-order categories available.
            </p>
          )
        )}

        {selectedTabIndex === 1 && (
          <>
            <div style={{ textAlign: 'center' }}>
              <AvailabilityChip isAvailable={isInstantDeliveryAvailable} />
            </div>
            {currentMenuItems.length > 0 ? (
              currentMenuItems.map((item) => {
                const cartItem = cart[item.id];
                const restaurantDetails = { restaurantId, restaurantName };
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
              <p style={{ color: '#4B5563', textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
                No items available right now.
              </p>
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
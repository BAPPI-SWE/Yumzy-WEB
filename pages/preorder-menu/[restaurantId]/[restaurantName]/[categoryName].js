import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useCart } from '../../../../context/CartContext';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { ArrowLeftIcon, PlusIcon, MinusIcon, ShoppingCartIcon, CheckCircleIcon, TagIcon, NoSymbolIcon } from '@heroicons/react/24/solid';

// Menu Item Card
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
      opacity: !isEnabled ? 0.6 : 1
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
        }}>
          {menuItem.name}
        </p>
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
            backgroundColor: '#E5E7EB',
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
        }}>
          {quantity}
        </span>
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

// Bottom Bar
const CartBottomBar = ({ onAddToCart, onPlaceOrder, totalItems }) => {
  const [cartHovered, setCartHovered] = useState(false);
  const [orderHovered, setOrderHovered] = useState(false);

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
          onMouseEnter={() => setCartHovered(true)}
          onMouseLeave={() => setCartHovered(false)}
          title="Save selections to main cart"
          style={{
            padding: '12px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            color: '#DC0C25',
            backgroundColor: cartHovered ? '#F9FAFB' : 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          <ShoppingCartIcon style={{ width: '24px', height: '24px' }} />
        </button>
        <button
          onClick={onPlaceOrder}
          onMouseEnter={() => setOrderHovered(true)}
          onMouseLeave={() => setOrderHovered(false)}
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
            opacity: orderHovered ? 0.9 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          <CheckCircleIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
          <span>Place Order Now ({totalItems})</span>
        </button>
      </div>
    </div>
  );
};

// Main Page Component
export default function PreOrderCategoryMenuPage() {
  const router = useRouter();
  const {
    restaurantId,
    restaurantName: encodedRestName,
    categoryName: encodedCatName
  } = router.query;

  const [backHovered, setBackHovered] = useState(false);

  const restaurantName = encodedRestName ? decodeURIComponent(encodedRestName) : 'Restaurant';
  const categoryName = encodedCatName ? decodeURIComponent(encodedCatName) : 'Category';
  const displayCategoryName = categoryName.replace(/^Pre-order\s*/i, '');

  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { cart, addToCart, incrementItem, decrementItem } = useCart();

  useEffect(() => {
    if (!restaurantId || !categoryName || categoryName === 'Category') return;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const menuQuery = query(
          collection(db, 'restaurants', restaurantId, 'menuItems'),
          where('category', '==', categoryName)
        );
        const menuSnap = await getDocs(menuQuery);
        const items = menuSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          price: doc.data().price || 0.0,
          category: doc.data().category || '',
        }));
        setMenuItems(items);
      } catch (err) {
        console.error("Error fetching pre-order menu items:", err);
        setError("Failed to load menu items. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, categoryName]);

  const currentRestaurantCart = Object.values(cart).filter(item => item.restaurantId === restaurantId);
  const currentTotalItems = currentRestaurantCart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = () => {
    router.push(`/checkout/${restaurantId}`);
  };
  
  const handleAddToCart = () => {
    alert('Items saved to cart!');
  };

  return (
    <ProtectedRoute>
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
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button
            onClick={() => router.back()}
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            style={{
              padding: '8px',
              borderRadius: '9999px',
              backgroundColor: backHovered ? '#F3F4F6' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
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
          }}>
            {displayCategoryName}
          </h1>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '80px',
            paddingBottom: '80px'
          }}>
            <LoadingSpinner />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: '#DC2626'
          }}>
            <NoSymbolIcon style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 8px',
              color: '#FCA5A5'
            }} />
            {error}
          </div>
        )}

        {/* Content Area */}
        {!isLoading && !error && (
          <div style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {menuItems.length > 0 ? (
              menuItems.map((item) => {
                const cartItem = cart[item.id];
                const cartMenuItem = { 
                  id: item.id, 
                  name: item.name, 
                  price: item.price, 
                  category: item.category 
                };
                const restaurantDetails = { restaurantId, restaurantName };

                return (
                  <MenuItemCard
                    key={item.id}
                    menuItem={item}
                    quantity={cartItem?.quantity || 0}
                    onAdd={() => addToCart(cartMenuItem, restaurantDetails)}
                    onIncrement={() => incrementItem(item.id)}
                    onDecrement={() => decrementItem(item.id)}
                    isEnabled={true}
                  />
                );
              })
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '80px',
                textAlign: 'center'
              }}>
                <TagIcon style={{
                  width: '64px',
                  height: '64px',
                  color: '#D1D5DB',
                  marginBottom: '16px'
                }} />
                <p style={{
                  fontSize: '18px',
                  fontWeight: 500,
                  color: '#6B7280'
                }}>
                  No items found in this category.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bottom Cart Bar */}
        <CartBottomBar
          onAddToCart={handleAddToCart}
          onPlaceOrder={handlePlaceOrder}
          totalItems={currentTotalItems}
        />
      </div>
    </ProtectedRoute>
  );
}
import ProtectedRoute from '../components/ProtectedRoute';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/router';
import { ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid';

// --- Reusable Components ---

// Quantity Selector
const QuantitySelector = ({ quantity, onIncrement, onDecrement }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button
        onClick={onDecrement}
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FEE2E2',
          color: '#DC0C25',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FECACA'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
      >
        <MinusIcon style={{ width: '16px', height: '16px' }} />
      </button>
      <span style={{ fontSize: '16px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
        {quantity}
      </span>
      <button
        onClick={onIncrement}
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#DC0C25',
          color: 'white',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        <PlusIcon style={{ width: '16px', height: '16px' }} />
      </button>
    </div>
  );
};

// Cart Item Row
const CartItemRow = ({ item, onIncrement, onDecrement }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', paddingBottom: '12px' }}>
      <div style={{ flex: 1, marginRight: '16px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>{item.menuItem.name}</p>
        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>৳{item.menuItem.price.toFixed(0)}</p>
      </div>
      <QuantitySelector
        quantity={item.quantity}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />
    </div>
  );
};

// Restaurant Cart Card
const RestaurantCartCard = ({ restaurantName, restaurantId, items, onIncrement, onDecrement, onClearRestaurant, onPlaceOrder }) => {
  const subTotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BuildingStorefrontIcon style={{ width: '20px', height: '20px', color: '#D50032' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>{restaurantName}</h3>
        </div>
        <button
          onClick={() => onClearRestaurant(restaurantId)}
          style={{
            fontSize: '12px',
            color: '#EF4444',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#B91C1C'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#EF4444'}
          title={`Clear all items from ${restaurantName}`}
        >
          Clear
        </button>
      </div>

      {/* Items */}
      <div style={{ padding: '16px' }}>
        {items.map((item, index) => (
          <div key={item.menuItem.id}>
            <CartItemRow
              item={item}
              onIncrement={() => onIncrement(item.menuItem.id)}
              onDecrement={() => onDecrement(item.menuItem.id)}
            />
            {index < items.length - 1 && <div style={{ height: '1px', backgroundColor: '#F3F4F6', marginTop: '12px', marginBottom: '12px' }} />}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563' }}>Subtotal:</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#D50032' }}>৳{subTotal.toFixed(0)}</span>
        </div>
        <button
          onClick={() => onPlaceOrder(restaurantId)}
          style={{
            width: '100%',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#B70314',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

// --- Main Cart Page Component ---
function CartPage() {
  const { cart, incrementItem, decrementItem, clearCartForRestaurant } = useCart();
  const router = useRouter();

  // --- Group items by restaurant ---
  const groupedItems = Object.values(cart).reduce((acc, item) => {
    const { restaurantId } = item;
    if (!acc[restaurantId]) {
      acc[restaurantId] = {
        restaurantName: item.restaurantName,
        items: [],
      };
    }
    acc[restaurantId].items.push(item);
    return acc;
  }, {});

  const restaurantIds = Object.keys(groupedItems);

  const handlePlaceOrder = (restaurantId) => {
    router.push(`/checkout/${restaurantId}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', paddingBottom: '40px' }}>
      {/* Custom Top Bar */}
      <div style={{
        background: 'linear-gradient(to bottom, #B70314, #9A0311)',
        color: 'white',
        paddingTop: '40px',
        paddingBottom: '20px',
        paddingLeft: '16px',
        paddingRight: '16px',
        borderBottomLeftRadius: '20px',
        borderBottomRightRadius: '20px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center' }}>My Cart</h1>
      </div>

      {/* Cart Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {restaurantIds.length === 0 ? (
          // Empty Cart View
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', textAlign: 'center' }}>
            <ShoppingCartIcon style={{ width: '64px', height: '64px', color: '#D1D5DB', marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', fontWeight: 500, color: '#6B7280' }}>Your cart is empty.</p>
            <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>Add items from restaurants or stores!</p>
            <button
              onClick={() => router.push('/home')}
              style={{
                marginTop: '24px',
                paddingLeft: '20px',
                paddingRight: '20px',
                paddingTop: '8px',
                paddingBottom: '8px',
                backgroundColor: '#DC0C25',
                color: 'white',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Browse Items
            </button>
          </div>
        ) : (
          // List of Restaurant Carts
          restaurantIds.map((resId) => (
            <RestaurantCartCard
              key={resId}
              restaurantId={resId}
              restaurantName={groupedItems[resId].restaurantName}
              items={groupedItems[resId].items}
              onIncrement={incrementItem}
              onDecrement={decrementItem}
              onClearRestaurant={clearCartForRestaurant}
              onPlaceOrder={handlePlaceOrder}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Wrap the page with ProtectedRoute
export default function Cart() {
  return (
    <ProtectedRoute>
      <CartPage />
    </ProtectedRoute>
  );
}
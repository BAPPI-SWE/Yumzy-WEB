import { useCart } from '../context/CartContext';
import { XMarkIcon, PlusIcon, MinusIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid';
import { useState, useMemo } from 'react';

// Quantity Selector
const QuantitySelector = ({ quantity, onAdd, onIncrement, onDecrement, isEnabled }) => {
  if (quantity === 0) {
    return (
      <button
        onClick={onAdd}
        disabled={!isEnabled}
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isEnabled ? '#DC0C25' : '#D1D5DB',
          color: 'white',
          borderRadius: '9999px',
          border: 'none',
          cursor: isEnabled ? 'pointer' : 'not-allowed',
          transition: 'opacity 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)'
        }}
        onMouseEnter={(e) => isEnabled && (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => isEnabled && (e.currentTarget.style.opacity = '1')}
      >
        <PlusIcon style={{ width: '24px', height: '24px' }} />
      </button>
    );
  } else {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <button
          onClick={onDecrement}
          disabled={!isEnabled}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#E5E7EB',
            color: '#374151',
            borderRadius: '9999px',
            border: 'none',
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => isEnabled && (e.currentTarget.style.backgroundColor = '#D1D5DB')}
          onMouseLeave={(e) => isEnabled && (e.currentTarget.style.backgroundColor = '#E5E7EB')}
        >
          <MinusIcon style={{ width: '20px', height: '20px' }} />
        </button>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            minWidth: '24px',
            textAlign: 'center'
          }}
        >
          {quantity}
        </span>
        <button
          onClick={onIncrement}
          disabled={!isEnabled}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isEnabled ? '#DC0C25' : '#D1D5DB',
            color: 'white',
            borderRadius: '9999px',
            border: 'none',
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => isEnabled && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => isEnabled && (e.currentTarget.style.opacity = '1')}
        >
          <PlusIcon style={{ width: '20px', height: '20px' }} />
        </button>
      </div>
    );
  }
};

export default function ItemDetailModal({ item, onClose }) {
  const [closeHovered, setCloseHovered] = useState(false);
  const [doneHovered, setDoneHovered] = useState(false);
  
  // --- HOOKS MOVED HERE ---
  const { cart, addToCart, incrementItem, decrementItem } = useCart();
  const isMultiVariant = item?.variants && item.variants.length > 0;

  const totalQuantity = useMemo(() => {
    if (!item) return 0; // Guard against null item
    if (!isMultiVariant) {
      return cart[item.id]?.quantity || 0;
    } else {
      return item.variants.reduce((sum, variant) => {
        const variantId = `${item.id}_${variant.name}`;
        return sum + (cart[variantId]?.quantity || 0);
      }, 0);
    }
  }, [cart, item, isMultiVariant]);
  // --- END OF MOVED HOOKS ---

  if (!item) return null;

  // This variable is safe to declare here as it's not a hook
  const isEnabled = item.isEnabled;

  const createCartMenuItem = (variant = null) => {
    const id = variant ? `${item.id}_${variant.name}` : item.id;
    const name = variant ? `${item.name} (${variant.name})` : item.name;
    const price = variant ? variant.price : item.price;
    return { id, name, price, category: 'Store Item' };
  };

  const restaurantDetails = {
    restaurantId: 'yumzy_store',
    restaurantName: item.miniResName || 'Yumzy Store'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          width: '100%',
          maxWidth: '448px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Section */}
        <div
          style={{
            position: 'relative',
            height: '192px',
            width: '100%',
            backgroundColor: '#E5E7EB',
            flexShrink: 0
          }}
        >
          <img
            src={item.imageUrl || '/placeholder-image.png'}
            alt={item.name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          {/* Close Button */}
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHovered(true)}
            onMouseLeave={() => setCloseHovered(false)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '32px',
              height: '32px',
              backgroundColor: closeHovered ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              zIndex: 10
            }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px' }} />
          </button>
          {/* Total Quantity Badge */}
          {totalQuantity > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '24px',
                height: '24px',
                padding: '0 8px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'white',
                backgroundColor: '#DC0C25',
                borderRadius: '9999px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {totalQuantity}
            </span>
          )}
        </div>

        {/* Scrollable Details Section */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937' }}>{item.name}</h2>

          {item.miniResName && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#DC0C25',
                fontWeight: 500
              }}
            >
              <BuildingStorefrontIcon style={{ width: '16px', height: '16px' }} />
              <span>{item.miniResName}</span>
            </div>
          )}

          <p style={{ fontSize: '14px', color: '#4B5563' }}>
            {item.itemDescription || 'No description available.'}
          </p>

          {!isEnabled && (
            <p
              style={{
                fontSize: '14px',
                color: '#991B1B',
                fontWeight: 600,
                textAlign: 'center',
                padding: '8px 0',
                backgroundColor: '#FEE2E2',
                borderRadius: '8px'
              }}
            >
              {item.stock !== 'yes' ? 'Currently Out of Stock' : 'Shop is Closed'}
            </p>
          )}

          {isMultiVariant ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>Choose Variant:</h3>
              {item.variants.map((variant) => {
                const variantId = `${item.id}_${variant.name}`;
                const quantity = cart[variantId]?.quantity || 0;
                const cartMenuItem = createCartMenuItem(variant);

                return (
                  <div
                    key={variant.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#F9FAFB',
                      padding: '12px',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>{variant.name}</p>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: '#DC0C25' }}>
                        ৳{variant.price.toFixed(0)}
                      </p>
                    </div>
                    <QuantitySelector
                      quantity={quantity}
                      onAdd={() => addToCart(cartMenuItem, restaurantDetails)}
                      onIncrement={() => incrementItem(variantId)}
                      onDecrement={() => decrementItem(variantId)}
                      isEnabled={isEnabled}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px'
              }}
            >
              <div>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>Price</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#DC0C25' }}>
                  ৳{item.price.toFixed(0)}
                </p>
              </div>
              <QuantitySelector
                quantity={cart[item.id]?.quantity || 0}
                onAdd={() => addToCart(createCartMenuItem(), restaurantDetails)}
                onIncrement={() => incrementItem(item.id)}
                onDecrement={() => decrementItem(item.id)}
                isEnabled={isEnabled}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #E5E7EB',
            marginTop: 'auto',
            flexShrink: 0
          }}
        >
          <button
            onClick={onClose}
            onMouseEnter={() => setDoneHovered(true)}
            onMouseLeave={() => setDoneHovered(false)}
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
              opacity: doneHovered ? 0.9 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {totalQuantity > 0
              ? `Done (${totalQuantity} item${totalQuantity > 1 ? 's' : ''})`
              : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
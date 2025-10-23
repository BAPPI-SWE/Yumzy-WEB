import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import ProtectedRoute from '../../components/ProtectedRoute';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useCart } from '../../context/CartContext';
import {
  ArrowLeftIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  TagIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/solid';
import ItemDetailModal from '../../components/ItemDetailModal';

// --- Enum for SortOrder ---
const SortOrder = {
  NONE: 'none',
  PRICE_LOW_TO_HIGH: 'low_high',
  PRICE_HIGH_TO_LOW: 'high_low',
};

// --- Helper function to get relevant price for sorting ---
const getSortPrice = (item) => {
  if (item.variants && item.variants.length > 0) {
    return Math.min(...item.variants.map((v) => v.price));
  }
  return item.price;
};

// --- Item Card ---
const StoreItemCard = ({ item, quantity, onAdd, onIncrement, onDecrement, onClick, isEnabled }) => {
  const [isHovered, setIsHovered] = useState(false);

  const displayPrice =
    item.variants && item.variants.length > 0
      ? `৳${Math.min(...item.variants.map((v) => v.price)).toFixed(0)} - ৳${Math.max(
          ...item.variants.map((v) => v.price)
        ).toFixed(0)}`
      : `৳${item.price.toFixed(0)}`;

  const isMultiVariant = item.variants && item.variants.length > 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: isHovered 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        opacity: !isEnabled ? 0.6 : 1,
        cursor: isEnabled ? 'pointer' : 'default',
        transition: 'all 0.2s'
      }}
    >
      <button
        onClick={onClick}
        disabled={!isEnabled}
        style={{
          display: 'block',
          width: '100%',
          border: 'none',
          padding: 0,
          backgroundColor: 'transparent',
          cursor: isEnabled ? 'pointer' : 'default'
        }}
      >
        <div style={{ position: 'relative', height: '144px', width: '100%', backgroundColor: '#E5E7EB' }}>
          <img
            src={item.imageUrl || '/placeholder-image.png'}
            alt={item.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            loading="lazy"
          />
          {!isEnabled && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: '8px'
            }}>
              <NoSymbolIcon style={{ width: '32px', height: '32px', marginBottom: '4px' }} />
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center'
              }}>
                {item.stock !== 'yes' ? 'Out of Stock' : 'Shop Closed'}
              </span>
            </div>
          )}
          {quantity > 0 && !isMultiVariant && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'white',
              backgroundColor: '#DC0C25',
              borderRadius: '9999px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
              {quantity}
            </span>
          )}
        </div>
      </button>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#1F2937',
          flex: 1,
          minHeight: '40px',
          lineHeight: '1.3',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {item.name}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#DC0C25' }}>{displayPrice}</span>
          {isMultiVariant ? (
            <button
              onClick={onClick}
              disabled={!isEnabled}
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: !isEnabled ? '#E5E7EB' : 'rgba(220, 12, 37, 0.1)',
                color: !isEnabled ? '#9CA3AF' : '#DC0C25',
                borderRadius: '9999px',
                border: 'none',
                cursor: isEnabled ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => { if (isEnabled) e.currentTarget.style.backgroundColor = 'rgba(220, 12, 37, 0.2)'; }}
              onMouseLeave={(e) => { if (isEnabled) e.currentTarget.style.backgroundColor = 'rgba(220, 12, 37, 0.1)'; }}
            >
              <PlusIcon style={{ width: '20px', height: '20px' }} />
            </button>
          ) : (
            <QuantitySelector
              quantity={quantity}
              onAdd={onAdd}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              isEnabled={isEnabled}
              size="small"
            />
          )}
        </div>
      </div>
    </div>
  );
};

// --- Quantity Selector ---
const QuantitySelector = ({ quantity, onAdd, onIncrement, onDecrement, isEnabled, size = 'normal' }) => {
  const buttonSize = size === 'small' ? '28px' : '36px';
  const iconSize = size === 'small' ? '16px' : '20px';
  const numberSize = size === 'small' ? '14px' : '16px';
  const space = size === 'small' ? '6px' : '10px';

  if (quantity === 0) {
    return (
      <button
        onClick={onAdd}
        disabled={!isEnabled}
        style={{
          width: buttonSize,
          height: buttonSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: !isEnabled ? '#D1D5DB' : '#DC0C25',
          color: 'white',
          borderRadius: '9999px',
          border: 'none',
          cursor: isEnabled ? 'pointer' : 'not-allowed',
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => { if (isEnabled) e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={(e) => { if (isEnabled) e.currentTarget.style.opacity = '1'; }}
      >
        <PlusIcon style={{ width: iconSize, height: iconSize }} />
      </button>
    );
  } else {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: space }}>
        <button
          onClick={onDecrement}
          disabled={!isEnabled}
          style={{
            width: buttonSize,
            height: buttonSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: !isEnabled ? '#D1D5DB' : '#E5E7EB',
            color: '#374151',
            borderRadius: '9999px',
            border: 'none',
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => { if (isEnabled) e.currentTarget.style.backgroundColor = '#D1D5DB'; }}
          onMouseLeave={(e) => { if (isEnabled) e.currentTarget.style.backgroundColor = '#E5E7EB'; }}
        >
          <MinusIcon style={{ width: iconSize, height: iconSize }} />
        </button>
        <span style={{
          fontSize: numberSize,
          fontWeight: 700,
          minWidth: '16px',
          textAlign: 'center'
        }}>
          {quantity}
        </span>
        <button
          onClick={onIncrement}
          disabled={!isEnabled}
          style={{
            width: buttonSize,
            height: buttonSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: !isEnabled ? '#D1D5DB' : '#DC0C25',
            color: 'white',
            borderRadius: '9999px',
            border: 'none',
            cursor: isEnabled ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => { if (isEnabled) e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={(e) => { if (isEnabled) e.currentTarget.style.opacity = '1'; }}
        >
          <PlusIcon style={{ width: iconSize, height: iconSize }} />
        </button>
      </div>
    );
  }
};

// --- Bottom Cart Bar ---
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '512px', margin: '0 auto' }}>
        <button
          onClick={onAddToCart}
          style={{
            padding: '12px',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            color: '#DC0C25',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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

// --- Main Page ---
export default function ItemGridPage() {
  const router = useRouter();
  const { slug, title: encodedTitle } = router.query;
  const pageTitle = encodedTitle ? decodeURIComponent(encodedTitle) : 'Items';

  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortOrder, setSortOrder] = useState(SortOrder.NONE);

  const { cart, addToCart, incrementItem, decrementItem } = useCart();

  const filterType = slug?.[0];
  const filterValue = slug?.[1] ? decodeURIComponent(slug[1]) : null;

  useEffect(() => {
    if (!filterType || !filterValue) {
      if (router.isReady) {
        setError('Could not determine items to load.');
        setIsLoading(false);
      }
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setAllItems([]);

      try {
        let itemsQuery;
        let shopStatusMap = {};

        if (filterType === 'subCategory') {
          itemsQuery = query(collection(db, 'store_items'), where('subCategory', '==', filterValue));
          const itemsSnap = await getDocs(itemsQuery);
          const miniResIds = [...new Set(itemsSnap.docs.map((d) => d.data().miniRes).filter(Boolean))];

          if (miniResIds.length > 0) {
            const shopStatusQuery = query(collection(db, 'mini_restaurants'), where('__name__', 'in', miniResIds));
            const shopStatusSnap = await getDocs(shopStatusQuery);
            shopStatusSnap.docs.forEach((doc) => {
              shopStatusMap[doc.id] = doc.data().open === 'yes';
            });
          }
        } else if (filterType === 'miniRes') {
          itemsQuery = query(collection(db, 'store_items'), where('miniRes', '==', filterValue));
          const shopDocRef = doc(db, 'mini_restaurants', filterValue);
          const shopDocSnap = await getDoc(shopDocRef);
          shopStatusMap[filterValue] = shopDocSnap.exists() && shopDocSnap.data().open === 'yes';
        } else {
          throw new Error('Invalid filter type');
        }

        const finalItemsSnap = await getDocs(itemsQuery);
        const fetchedItems = finalItemsSnap.docs.map((doc) => {
          const data = doc.data();
          const miniResId = data.miniRes;
          const isShopOpen = !miniResId || shopStatusMap[miniResId] !== false;
          const isInStock = data.stock === 'yes';
          const isItemEnabled = isShopOpen && isInStock;

          const multiVariant = parseInt(data.multiVariant || 0);
          let variants = [];
          if (multiVariant >= 1) {
            for (let i = 1; i <= multiVariant; i++) {
              const vName = data[`variant${i}name`];
              const vPrice = parseFloat(data[`variant${i}price`]);
              if (vName && !isNaN(vPrice)) {
                variants.push({ name: vName, price: vPrice });
              }
            }
          }

          return {
            id: doc.id,
            name: data.name || '',
            price: parseFloat(data.price) || 0.0,
            imageUrl: data.imageUrl || '',
            itemDescription: data.itemDescription || '',
            stock: data.stock || 'yes',
            isEnabled: isItemEnabled,
            variants,
            miniResId: miniResId || '',
            miniResName: data.miniResName || '',
          };
        });
        setAllItems(fetchedItems);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError('Failed to load items. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filterType, filterValue, router.isReady]);

  const sortedItems = useMemo(() => {
    const itemsToSort = [...allItems];
    switch (sortOrder) {
      case SortOrder.PRICE_LOW_TO_HIGH:
        return itemsToSort.sort((a, b) => getSortPrice(a) - getSortPrice(b));
      case SortOrder.PRICE_HIGH_TO_LOW:
        return itemsToSort.sort((a, b) => getSortPrice(b) - getSortPrice(a));
      default:
        return itemsToSort;
    }
  }, [allItems, sortOrder]);

  const currentRestaurantCart = Object.values(cart).filter((item) => item.restaurantId === 'yumzy_store');
  const currentTotalItems = currentRestaurantCart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSortClick = () => {
    setSortOrder((current) => {
      if (current === SortOrder.NONE) return SortOrder.PRICE_LOW_TO_HIGH;
      if (current === SortOrder.PRICE_LOW_TO_HIGH) return SortOrder.PRICE_HIGH_TO_LOW;
      return SortOrder.NONE;
    });
  };

  const handlePlaceOrder = () => router.push(`/checkout/yumzy_store`);
  const handleAddToCart = () => alert('Items saved to cart!');
  const handleItemClick = (item) =>
    item.isEnabled
      ? setSelectedItem(item)
      : alert(item.stock !== 'yes' ? 'Out of Stock' : 'Shop Closed');
  const handleCloseModal = () => setSelectedItem(null);

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column' }}>
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
          }}>
            {pageTitle}
          </h1>

          <button
            onClick={handleSortClick}
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
            title={
              sortOrder === SortOrder.NONE
                ? 'Sort by Price'
                : sortOrder === SortOrder.PRICE_LOW_TO_HIGH
                ? 'Sorted: Low to High'
                : 'Sorted: High to Low'
            }
          >
            {sortOrder === SortOrder.NONE && <ArrowsUpDownIcon style={{ width: '24px', height: '24px', color: '#6B7280' }} />}
            {sortOrder === SortOrder.PRICE_LOW_TO_HIGH && <ArrowUpIcon style={{ width: '24px', height: '24px', color: '#DC0C25' }} />}
            {sortOrder === SortOrder.PRICE_HIGH_TO_LOW && <ArrowDownIcon style={{ width: '24px', height: '24px', color: '#DC0C25' }} />}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '96px' }}>
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <LoadingSpinner />
            </div>
          )}

          {!isLoading && error && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '24px', textAlign: 'center' }}>
              <NoSymbolIcon style={{ width: '48px', height: '48px', color: '#F87171', marginBottom: '12px' }} />
              <p style={{ color: '#DC2626' }}>{error}</p>
            </div>
          )}

          {!isLoading && !error && sortedItems.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '24px', textAlign: 'center' }}>
              <TagIcon style={{ width: '48px', height: '48px', color: '#9CA3AF', marginBottom: '12px' }} />
              <p style={{ color: '#4B5563' }}>No items found.</p>
            </div>
          )}

          {!isLoading && !error && sortedItems.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              padding: '16px'
            }}>
              {sortedItems.map((item) => {
                let quantity = 0;
                if (item.variants && item.variants.length > 0) {
                  quantity = item.variants.reduce((sum, variant) => {
                    const variantId = `${item.id}_${variant.name}`;
                    return sum + (cart[variantId]?.quantity || 0);
                  }, 0);
                } else {
                  quantity = cart[item.id]?.quantity || 0;
                }

                const cartMenuItem = { id: item.id, name: item.name, price: item.price };
                const restaurantDetails = {
                  restaurantId: 'yumzy_store',
                  restaurantName: item.miniResName || 'Yumzy Store',
                };

                return (
                  <StoreItemCard
                    key={item.id}
                    item={item}
                    quantity={quantity}
                    onAdd={() => addToCart(cartMenuItem, restaurantDetails)}
                    onIncrement={() => incrementItem(item.id)}
                    onDecrement={() => decrementItem(item.id)}
                    onClick={() => handleItemClick(item)}
                    isEnabled={item.isEnabled}
                  />
                );
              })}
            </div>
          )}
        </div>

        <CartBottomBar
          onAddToCart={handleAddToCart}
          onPlaceOrder={handlePlaceOrder}
          totalItems={currentTotalItems}
        />

        {selectedItem && <ItemDetailModal item={selectedItem} onClose={handleCloseModal} />}
      </div>
    </ProtectedRoute>
  );
}
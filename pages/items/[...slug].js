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

// --- Helper: discounted price ---
const applyDiscount = (originalPrice, discountPercent) => {
  if (discountPercent && discountPercent > 0) {
    return originalPrice * (1 - discountPercent / 100);
  }
  return originalPrice;
};

// --- Helper function to get relevant price for sorting (uses discounted price) ---
const getSortPrice = (item) => {
  if (item.variants && item.variants.length > 0) {
    return Math.min(...item.variants.map((v) => applyDiscount(v.price, item.itemDiscount)));
  }
  return applyDiscount(item.price, item.itemDiscount);
};

// --- Responsive grid style injected once ---
const GRID_STYLE_ID = 'item-grid-responsive-style';
function injectGridStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(GRID_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = GRID_STYLE_ID;
  style.textContent = `
    .item-grid {
      display: grid;
      gap: 16px;
      padding: 16px;
      /* Mobile: 2 columns */
      grid-template-columns: repeat(2, 1fr);
    }
    @media (min-width: 640px) {
      .item-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    @media (min-width: 900px) {
      .item-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    @media (min-width: 1200px) {
      .item-grid {
        grid-template-columns: repeat(5, 1fr);
      }
    }
    /* Card image height: taller on mobile, capped on desktop */
    .item-card-img {
      height: 144px;
    }
    @media (min-width: 640px) {
      .item-card-img {
        height: 160px;
      }
    }
  `;
  document.head.appendChild(style);
}

// --- Discount Ribbon Badge ---
const DiscountRibbonBadge = ({ discountPercent }) => (
  <span style={{
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#E53935',
    color: 'white',
    fontSize: '11px',
    fontWeight: 700,
    padding: '5px 10px',
    borderRadius: '0 0 12px 0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
    zIndex: 1,
  }}>
    <TagIcon style={{ width: '12px', height: '12px' }} />
    {Math.round(discountPercent)}% OFF
  </span>
);

// --- Item Card ---
const StoreItemCard = ({ item, quantity, onAdd, onIncrement, onDecrement, onClick, isEnabled }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Inject responsive styles on first render
  useEffect(() => { injectGridStyle(); }, []);

  const hasDiscount = item.itemDiscount > 0;
  const isMultiVariant = item.variants && item.variants.length > 0;

  const originalDisplayPrice = isMultiVariant
    ? `৳${Math.min(...item.variants.map((v) => v.price)).toFixed(0)} - ৳${Math.max(
        ...item.variants.map((v) => v.price)
      ).toFixed(0)}`
    : `৳${item.price.toFixed(0)}`;

  const discountedDisplayPrice = isMultiVariant
    ? `৳${Math.min(...item.variants.map((v) => applyDiscount(v.price, item.itemDiscount))).toFixed(0)} - ৳${Math.max(
        ...item.variants.map((v) => applyDiscount(v.price, item.itemDiscount))
      ).toFixed(0)}`
    : `৳${applyDiscount(item.price, item.itemDiscount).toFixed(0)}`;

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
        transition: 'all 0.2s',
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
          cursor: isEnabled ? 'pointer' : 'default',
        }}
      >
        {/* Use className for responsive height */}
        <div className="item-card-img" style={{ position: 'relative', width: '100%', backgroundColor: '#E5E7EB' }}>
          <img
            src={item.imageUrl || '/placeholder-image.png'}
            alt={item.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
          {hasDiscount && <DiscountRibbonBadge discountPercent={item.itemDiscount} />}
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
              padding: '8px',
            }}>
              <NoSymbolIcon style={{ width: '32px', height: '32px', marginBottom: '4px' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>
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
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
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
          WebkitBoxOrient: 'vertical',
        }}>
          {item.name}
        </p>

        {item.miniResName && item.miniResName !== 'Yumzy Store' && (
          <span style={{ fontSize: '11px', color: '#D50032', fontWeight: 500, marginTop: '4px' }}>
            {item.miniResName}
          </span>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hasDiscount && (
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                color: '#9CA3AF',
                textDecoration: 'line-through',
              }}>
                {originalDisplayPrice}
              </span>
            )}
            <span style={{ fontSize: '16px', fontWeight: 700, color: hasDiscount ? '#E53935' : '#DC0C25' }}>
              {discountedDisplayPrice}
            </span>
          </div>
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
                transition: 'background-color 0.2s',
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
          transition: 'opacity 0.2s',
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
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => { if (isEnabled) e.currentTarget.style.backgroundColor = '#D1D5DB'; }}
          onMouseLeave={(e) => { if (isEnabled) e.currentTarget.style.backgroundColor = '#E5E7EB'; }}
        >
          <MinusIcon style={{ width: iconSize, height: iconSize }} />
        </button>
        <span style={{ fontSize: numberSize, fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
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
            transition: 'opacity 0.2s',
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
      zIndex: 50,
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
            transition: 'background-color 0.2s',
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
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <CheckCircleIcon style={{ width: '20px', height: '20px', marginRight: '8px' }} />
          <span>Continue ({totalItems})</span>
        </button>
      </div>
    </div>
  );
};

// --- Main Page ---
export default function ItemGridPage() {
  const router = useRouter();
  const { slug, title: encodedTitle } = router.query;
  const decodedSlugTitle = slug?.[1] ? decodeURIComponent(slug[1]) : 'Items';
  const pageTitle = encodedTitle ? decodeURIComponent(encodedTitle) : decodedSlugTitle;

  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortOrder, setSortOrder] = useState(SortOrder.NONE);

  const { cart, addToCart, incrementItem, decrementItem } = useCart();

  const filterType = slug?.[0];
  const filterValue = slug?.[1] ? decodeURIComponent(slug[1]) : null;

  // Inject responsive CSS on mount
  useEffect(() => { injectGridStyle(); }, []);

  useEffect(() => {
    if (!filterType || !filterValue) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setAllItems([]);

      try {
        let itemsQuery;
        let shopStatusMap = {};
        let shopNameMap = {};

        if (filterType === 'subCategory') {
          itemsQuery = query(collection(db, 'store_items'), where('subCategory', '==', filterValue));
          const itemsSnap = await getDocs(itemsQuery);
          const miniResIds = [...new Set(itemsSnap.docs.map((d) => d.data().miniRes).filter(Boolean))];

          if (miniResIds.length > 0) {
            const shopStatusQuery = query(collection(db, 'mini_restaurants'), where('__name__', 'in', miniResIds));
            const shopStatusSnap = await getDocs(shopStatusQuery);
            shopStatusSnap.docs.forEach((doc) => {
              shopStatusMap[doc.id] = doc.data().open === 'yes';
              shopNameMap[doc.id] = doc.data().name || 'Yumzy Store';
            });
          }
        } else if (filterType === 'miniRes') {
          itemsQuery = query(collection(db, 'store_items'), where('miniRes', '==', filterValue));
          const shopDocRef = doc(db, 'mini_restaurants', filterValue);
          const shopDocSnap = await getDoc(shopDocRef);

          if (shopDocSnap.exists()) {
            shopStatusMap[filterValue] = shopDocSnap.data().open === 'yes';
            shopNameMap[filterValue] = shopDocSnap.data().name || 'Yumzy Store';
          } else {
            shopStatusMap[filterValue] = false;
            shopNameMap[filterValue] = 'Yumzy Store';
          }
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
          const miniResName = miniResId ? (shopNameMap[miniResId] || data.miniResName || '') : (data.miniResName || '');

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
            miniResName,
            itemDiscount: parseFloat(data.itemDiscount) || 0,
          };
        });

        const sortedByPriority = fetchedItems.sort((a, b) => {
          const priorityA = a.priority ?? 999;
          const priorityB = b.priority ?? 999;
          return priorityA - priorityB;
        });

        setAllItems(sortedByPriority);
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
        return itemsToSort.sort((a, b) => {
          const priceA = getSortPrice(a);
          const priceB = getSortPrice(b);
          if (priceA !== priceB) return priceA - priceB;
          return (a.priority ?? 999) - (b.priority ?? 999);
        });
      case SortOrder.PRICE_HIGH_TO_LOW:
        return itemsToSort.sort((a, b) => {
          const priceA = getSortPrice(a);
          const priceB = getSortPrice(b);
          if (priceA !== priceB) return priceB - priceA;
          return (a.priority ?? 999) - (b.priority ?? 999);
        });
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
  const handleAddToCart = () => alert('Items saved to cart! (This is a placeholder)');
  const handleItemClick = (item) =>
    item.isEnabled
      ? setSelectedItem(item)
      : alert(item.stock !== 'yes' ? 'Out of Stock' : 'Shop Closed');
  const handleCloseModal = () => setSelectedItem(null);

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column' }}>

        {/* --- Top Bar --- */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: 'white',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
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
            flex: 1,
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
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={
              sortOrder === SortOrder.NONE ? 'Sort by Price'
              : sortOrder === SortOrder.PRICE_LOW_TO_HIGH ? 'Sorted: Low to High'
              : 'Sorted: High to Low'
            }
          >
            {sortOrder === SortOrder.NONE && <ArrowsUpDownIcon style={{ width: '24px', height: '24px', color: '#6B7280' }} />}
            {sortOrder === SortOrder.PRICE_LOW_TO_HIGH && <ArrowUpIcon style={{ width: '24px', height: '24px', color: '#DC0C25' }} />}
            {sortOrder === SortOrder.PRICE_HIGH_TO_LOW && <ArrowDownIcon style={{ width: '24px', height: '24px', color: '#DC0C25' }} />}
          </button>
        </div>

        {/* --- Content --- */}
        {/* Max-width wrapper keeps the grid centred on very wide screens */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '96px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '60px' }}>
                <LoadingSpinner />
              </div>
            )}

            {!isLoading && error && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 24px', textAlign: 'center' }}>
                <NoSymbolIcon style={{ width: '48px', height: '48px', color: '#F87171', marginBottom: '12px' }} />
                <p style={{ color: '#DC2626' }}>{error}</p>
              </div>
            )}

            {!isLoading && !error && sortedItems.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 24px', textAlign: 'center' }}>
                <TagIcon style={{ width: '48px', height: '48px', color: '#9CA3AF', marginBottom: '12px' }} />
                <p style={{ color: '#4B5563' }}>No items found.</p>
              </div>
            )}

            {!isLoading && !error && sortedItems.length > 0 && (
              // className drives the responsive columns via injected <style>
              <div className="item-grid">
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

                  // Discounted price is what actually gets added to the cart,
                  // so it flows through to checkout automatically.
                  const cartMenuItem = {
                    id: item.id,
                    name: item.name,
                    price: applyDiscount(item.price, item.itemDiscount),
                  };
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
import { useState, useEffect, useMemo } from 'react';
import PublicRoute from '../../components/PublicRoute';
import { useRouter } from 'next/router';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
  StarIcon,
  ClockIcon,
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

// --- Page styles (one <style> block, rendered by the page) ---
function ItemPageStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }

      /* ── Top bar: floats over the restaurant photo, turns white after scrolling ── */
      .fd-items-topbar {
        position: fixed; top: 0; left: 0; right: 0; z-index: 40;
        height: 56px;
        display: flex; align-items: center; gap: 10px;
        padding: 0 12px;
        background-color: transparent;
        transition: background-color 0.2s ease, box-shadow 0.2s ease;
      }
      .fd-items-topbar.is-solid {
        background-color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .fd-items-title {
        flex: 1; min-width: 0; margin: 0;
        font-size: 17px; font-weight: 700; color: #1C1C1E;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        opacity: 0; transition: opacity 0.2s ease;
      }
      .fd-items-topbar.is-solid .fd-items-title { opacity: 1; }
      .fd-round-btn {
        width: 38px; height: 38px; flex-shrink: 0;
        border-radius: 50%; border: none; cursor: pointer;
        background-color: white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.18);
        display: flex; align-items: center; justify-content: center;
      }
      .fd-round-btn:hover { background-color: #F4F4F6; }

      /* ── Restaurant header: photo + white info panel sliding over it ── */
      .fd-res-photo {
        position: relative; width: 100%; height: 210px;
        background: linear-gradient(135deg, #E5202F, #B00020);
        overflow: hidden;
      }
      .fd-res-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .fd-res-photo::after {
        content: ''; position: absolute; left: 0; right: 0; top: 0; height: 90px;
        background: linear-gradient(to bottom, rgba(0,0,0,0.45), transparent);
      }
      .fd-res-info {
        position: relative; margin-top: -22px;
        background-color: white;
        border-radius: 22px 22px 0 0;
        padding: 14px 16px 10px;
      }
      .fd-header-title {
        margin: 0; font-size: 20px; line-height: 26px; font-weight: 800; color: #1C1C1E;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .fd-header-sub {
        margin: 2px 0 0; font-size: 13px; line-height: 18px; color: #6B6B70;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .fd-info-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
      .fd-info-chip {
        display: inline-flex; align-items: center; gap: 4px;
        background-color: #F4F4F6; border-radius: 999px;
        padding: 5px 9px;
        font-size: 12px; line-height: 14px; font-weight: 500; color: #3A3A3C;
      }

      /* ── Category header: round picture + name ── */
      .fd-cat-header {
        display: flex; align-items: center; gap: 14px;
        padding: 68px 16px 10px; /* 56px top bar + space */
        background-color: white;
      }
      .fd-cat-picture {
        width: 62px; height: 62px; flex-shrink: 0;
        border-radius: 50%; overflow: hidden;
        background-color: #FFF0F4;
        display: flex; align-items: center; justify-content: center;
      }
      .fd-cat-picture img { width: 100%; height: 100%; object-fit: cover; display: block; }

      /* ── Filter chips: stay pinned under the top bar ── */
      .fd-filter-bar {
        position: sticky; top: 56px; z-index: 30;
        background-color: white;
        border-bottom: 1px solid #F1F1F4;
      }
      .fd-filter-row {
        display: flex; gap: 8px;
        overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
        padding: 8px 16px;
        max-width: 1100px; margin: 0 auto;
      }
      .fd-filter-row::-webkit-scrollbar { display: none; }
      .fd-filter-chip {
        flex-shrink: 0;
        border: none; cursor: pointer; font-family: inherit;
        border-radius: 999px;
        padding: 8px 16px;
        font-size: 13px; line-height: 16px; font-weight: 600;
        background-color: #F4F4F6; color: #3A3A3C;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .fd-filter-chip.is-selected { background-color: #DC0C25; color: white; }

      /* ── Items ── */
      .fd-items-content { max-width: 1100px; margin: 0 auto; padding: 12px 16px 110px; }
      .fd-section-heading {
        margin: 14px 0 10px; font-size: 18px; font-weight: 800; color: #1C1C1E;
      }
      .fd-item-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
      .fd-item-row {
        display: flex; align-items: center; gap: 12px;
        background-color: white;
        border-radius: 16px;
        padding: 10px;
        box-shadow: 0 3px 12px rgba(0,0,0,0.07);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .fd-item-row.is-enabled:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(0,0,0,0.10); }
      .fd-item-photo {
        position: relative; flex-shrink: 0;
        width: 92px; height: 92px;
        border: none; padding: 0;
        border-radius: 12px; overflow: hidden;
        background-color: #F1F1F4;
      }
      .fd-item-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .fd-item-name {
        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        border: none; background: none; padding: 0; margin: 0;
        text-align: left; font-family: inherit;
        font-size: 15px; line-height: 19px; font-weight: 600; color: #1C1C1E;
      }
      .fd-item-sub {
        margin: 2px 0 0; font-size: 12px; line-height: 16px; color: #6B6B70;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }

      @media (min-width: 700px) {
        .fd-item-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
      }

      /* ── Desktop ── */
      @media (min-width: 1024px) {
        /* the top bar is always white on desktop */
        .fd-items-topbar { background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 0 24px; }
        .fd-items-title { opacity: 1; }
        .fd-round-btn { box-shadow: none; background-color: #F4F4F6; }
        .fd-round-btn:hover { background-color: #E9E9EC; }

        .fd-res-header { max-width: 1100px; margin: 0 auto; padding: 76px 16px 0; }
        .fd-res-photo { height: 280px; border-radius: 24px; }
        .fd-res-photo::after { display: none; }
        .fd-res-info { margin-top: 0; border-radius: 0; padding: 18px 4px 10px; background: none; }
        .fd-header-title { font-size: 30px; line-height: 36px; }
        .fd-header-sub { font-size: 15px; line-height: 20px; }
        .fd-cat-header { max-width: 1100px; margin: 0 auto; padding: 84px 16px 14px; background: none; }
        .fd-item-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      }
    `}</style>
  );
}

// --- Small grey pill used in the restaurant header ---
const InfoChip = ({ children }) => <span className="fd-info-chip">{children}</span>;

// --- Item Row: photo on the left, name, price and the + button on the right ---
const StoreItemRow = ({ item, quantity, onAdd, onIncrement, onDecrement, onClick, isEnabled, showShopName }) => {
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

  const shopName = item.miniResName && item.miniResName !== 'Yumzy Store' ? item.miniResName : '';
  const subLine = showShopName && shopName ? shopName : item.itemDescription;

  return (
    <div className={`fd-item-row${isEnabled ? ' is-enabled' : ''}`}>
      {/* Photo: opens the item details */}
      <button
        type="button"
        className="fd-item-photo"
        onClick={onClick}
        disabled={!isEnabled}
        aria-label={`View ${item.name}`}
        style={{ cursor: isEnabled ? 'pointer' : 'default' }}
      >
        {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" />}

        {hasDiscount && (
          <span style={{
            position: 'absolute', top: '5px', left: '5px',
            backgroundColor: '#E53935', color: 'white',
            fontSize: '9px', fontWeight: 700, lineHeight: '11px',
            padding: '2px 6px', borderRadius: '999px',
          }}>
            {Math.round(item.itemDiscount)}% OFF
          </span>
        )}

        {quantity > 0 && (
          <span style={{
            position: 'absolute', top: '5px', right: '5px',
            minWidth: '22px', height: '22px', padding: '0 5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: 'white',
            backgroundColor: '#DC0C25', borderRadius: '999px',
          }}>
            {quantity}
          </span>
        )}

        {!isEnabled && (
          <span style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, lineHeight: '12px', textAlign: 'center', padding: '4px',
          }}>
            {item.stock !== 'yes' ? 'OUT OF STOCK' : 'SHOP CLOSED'}
          </span>
        )}
      </button>

      {/* Name, description / shop, price and quantity */}
      <div style={{
        flex: 1, minWidth: 0, minHeight: '92px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div>
          <button
            type="button"
            className="fd-item-name"
            onClick={onClick}
            disabled={!isEnabled}
            style={{ cursor: isEnabled ? 'pointer' : 'default' }}
          >
            {item.name}
          </button>
          {subLine && <p className="fd-item-sub">{subLine}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '6px', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {hasDiscount && (
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#8E8E93', textDecoration: 'line-through' }}>
                {originalDisplayPrice}
              </span>
            )}
            <span style={{ fontSize: '15px', fontWeight: 700, color: hasDiscount ? '#E53935' : '#DC0C25' }}>
              {discountedDisplayPrice}
            </span>
          </div>

          {isMultiVariant ? (
            <button
              type="button"
              onClick={onClick}
              disabled={!isEnabled}
              aria-label={`Choose an option for ${item.name}`}
              style={{
                width: '32px', height: '32px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: !isEnabled ? '#E5E7EB' : 'rgba(220, 12, 37, 0.1)',
                color: !isEnabled ? '#9CA3AF' : '#DC0C25',
                borderRadius: '9999px', border: 'none',
                cursor: isEnabled ? 'pointer' : 'not-allowed',
              }}
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

  // Header information (restaurant photo, cuisine... or the category picture)
  const [header, setHeader] = useState({ imageUrl: '', cuisine: '', rating: null, deliveryTime: '', isOpen: true });
  // Selected filter chip. null = "All".
  const [selectedFilter, setSelectedFilter] = useState(null);
  // true once the page is scrolled past the photo (the top bar turns white)
  const [isScrolled, setIsScrolled] = useState(false);

  const { cart, addToCart, incrementItem, decrementItem } = useCart();

  const filterType = slug?.[0];
  const filterValue = slug?.[1] ? decodeURIComponent(slug[1]) : null;

  // true  = opened from a restaurant / shop -> big photo header, chips = food categories
  // false = opened from a sub-category      -> round picture header, chips = shops
  const isRestaurantPage = filterType === 'miniRes';

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 150);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!filterType || !filterValue) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setAllItems([]);
      setSelectedFilter(null);
      setHeader({ imageUrl: '', cuisine: '', rating: null, deliveryTime: '', isOpen: true });

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

          // Picture of this sub-category for the header (optional, so it has its own try/catch)
          try {
            const subCatSnap = await getDocs(
              query(collection(db, 'store_sub_categories'), where('name', '==', filterValue))
            );
            const subCatImage = subCatSnap.docs[0]?.data().imageUrl;
            setHeader((h) => ({ ...h, imageUrl: typeof subCatImage === 'string' ? subCatImage : '' }));
          } catch (headerErr) {
            console.error('Could not load the category picture:', headerErr);
          }
        } else if (filterType === 'miniRes') {
          itemsQuery = query(collection(db, 'store_items'), where('miniRes', '==', filterValue));
          const shopDocRef = doc(db, 'mini_restaurants', filterValue);
          const shopDocSnap = await getDoc(shopDocRef);

          if (shopDocSnap.exists()) {
            const shop = shopDocSnap.data();
            shopStatusMap[filterValue] = shop.open === 'yes';
            shopNameMap[filterValue] = shop.name || 'Yumzy Store';
            // Header information for the restaurant page
            setHeader({
              imageUrl: typeof shop.imageUrl === 'string' ? shop.imageUrl : '',
              cuisine: typeof shop.cuisine === 'string' ? shop.cuisine : '',
              rating: typeof shop.rating === 'number' ? shop.rating : null,
              deliveryTime: typeof shop.deliveryTime === 'string' ? shop.deliveryTime.trim() : '',
              isOpen: shop.open === 'yes',
            });
          } else {
            shopStatusMap[filterValue] = false;
            shopNameMap[filterValue] = 'Yumzy Store';
            setHeader((h) => ({ ...h, isOpen: false }));
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

          const parsedPriority = parseInt(data.priority, 10);

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
            // used for the filter chips on a restaurant page
            subCategory: typeof data.subCategory === 'string' ? data.subCategory : '',
            // lower number shows first (same rule as the Android app)
            priority: Number.isNaN(parsedPriority) ? null : parsedPriority,
          };
        });

        const sortedByPriority = fetchedItems.sort((a, b) => {
          const priorityA = a.priority ?? Number.MAX_SAFE_INTEGER;
          const priorityB = b.priority ?? Number.MAX_SAFE_INTEGER;
          if (priorityA !== priorityB) return priorityA - priorityB;
          return a.name.localeCompare(b.name);
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

  // Items are grouped (and filtered) by sub-category on a restaurant page,
  // and by shop name on a category page.
  const groupKeyOf = (item) => (isRestaurantPage ? item.subCategory : item.miniResName) || '';

  // The chips at the top: every category (or shop) that has at least one item.
  const filterOptions = useMemo(
    () => [...new Set(allItems.map(groupKeyOf).filter(Boolean))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allItems, isRestaurantPage]
  );

  const sortedItems = useMemo(() => {
    const itemsToSort = selectedFilter == null
      ? [...allItems]
      : allItems.filter((item) => groupKeyOf(item) === selectedFilter);
    switch (sortOrder) {
      case SortOrder.PRICE_LOW_TO_HIGH:
        return itemsToSort.sort((a, b) => getSortPrice(a) - getSortPrice(b));
      case SortOrder.PRICE_HIGH_TO_LOW:
        return itemsToSort.sort((a, b) => getSortPrice(b) - getSortPrice(a));
      default:
        return itemsToSort;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, sortOrder, selectedFilter, isRestaurantPage]);

  // Section titles ("Pizza", "Coffee", ...) are shown only on the plain, unfiltered list.
  const showSections = selectedFilter == null && sortOrder === SortOrder.NONE && filterOptions.length > 1;
  const sections = useMemo(() => {
    if (!showSections) return [{ title: null, items: sortedItems }];
    const map = new Map(); // a Map keeps the order in which each group first appears
    sortedItems.forEach((item) => {
      const key = groupKeyOf(item) || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()].map(([title, items]) => ({ title, items }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedItems, showSections, isRestaurantPage]);

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

  const shopCount = new Set(allItems.map((item) => item.miniResId).filter(Boolean)).size;
  const itemCountText = `${allItems.length} item${allItems.length === 1 ? '' : 's'}`;
  const sortTitle = sortOrder === SortOrder.NONE ? 'Sort by price'
    : sortOrder === SortOrder.PRICE_LOW_TO_HIGH ? 'Sorted: low to high'
    : 'Sorted: high to low';

  // The top bar floats over the restaurant photo until the page is scrolled.
  const topBarSolid = !isRestaurantPage || isScrolled;

  return (
    <PublicRoute>{/* open to guests: login is asked only at checkout */}
      <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFB' }}>
        <ItemPageStyles />

        {/* --- Top Bar: back, title, sort --- */}
        <div className={`fd-items-topbar${topBarSolid ? ' is-solid' : ''}`}>
          <button type="button" className="fd-round-btn" onClick={() => router.back()} aria-label="Back">
            <ArrowLeftIcon style={{ width: '20px', height: '20px', color: '#1C1C1E' }} />
          </button>
          <h1 className="fd-items-title">{pageTitle}</h1>
          <button
            type="button"
            className="fd-round-btn"
            onClick={handleSortClick}
            title={sortTitle}
            aria-label={sortTitle}
          >
            {sortOrder === SortOrder.NONE && <ArrowsUpDownIcon style={{ width: '20px', height: '20px', color: '#1C1C1E' }} />}
            {sortOrder === SortOrder.PRICE_LOW_TO_HIGH && <ArrowUpIcon style={{ width: '20px', height: '20px', color: '#DC0C25' }} />}
            {sortOrder === SortOrder.PRICE_HIGH_TO_LOW && <ArrowDownIcon style={{ width: '20px', height: '20px', color: '#DC0C25' }} />}
          </button>
        </div>

        {/* --- Header --- */}
        {isRestaurantPage ? (
          <div className="fd-res-header">
            <div className="fd-res-photo">
              {header.imageUrl && <img src={header.imageUrl} alt="" />}
            </div>
            <div className="fd-res-info">
              <p className="fd-header-title">{pageTitle}</p>
              <p className="fd-header-sub">{header.cuisine || 'Restaurant'}</p>
              {!isLoading && !error && (
                <div className="fd-info-chips">
                  {/* Rating and delivery time appear only when they exist in Firestore */}
                  {header.rating != null && (
                    <InfoChip>
                      <StarIcon style={{ width: '14px', height: '14px', color: '#FFA726' }} />
                      {header.rating.toFixed(1)}
                    </InfoChip>
                  )}
                  {header.deliveryTime && (
                    <InfoChip>
                      <ClockIcon style={{ width: '14px', height: '14px', color: '#6B6B70' }} />
                      {header.deliveryTime}
                    </InfoChip>
                  )}
                  <InfoChip>
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      backgroundColor: header.isOpen ? '#2EAD5B' : '#8E8E93',
                    }} />
                    {header.isOpen ? 'Open now' : 'Closed'}
                  </InfoChip>
                  <InfoChip>{itemCountText}</InfoChip>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="fd-cat-header">
            <div className="fd-cat-picture">
              {header.imageUrl
                ? <img src={header.imageUrl} alt="" />
                : <TagIcon style={{ width: '28px', height: '28px', color: '#DC0C25' }} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="fd-header-title">{pageTitle}</p>
              {!isLoading && !error && (
                <p className="fd-header-sub">
                  {itemCountText}{shopCount > 1 ? ` from ${shopCount} shops` : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* --- Filter chips: "All" + one per category (restaurant page) or per shop (category page) --- */}
        {filterOptions.length > 1 && (
          <div className="fd-filter-bar">
            <div className="fd-filter-row">
              <button
                type="button"
                className={`fd-filter-chip${selectedFilter == null ? ' is-selected' : ''}`}
                aria-pressed={selectedFilter == null}
                onClick={() => setSelectedFilter(null)}
              >
                All
              </button>
              {filterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`fd-filter-chip${selectedFilter === option ? ' is-selected' : ''}`}
                  aria-pressed={selectedFilter === option}
                  onClick={() => setSelectedFilter(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- Content --- */}
        <div className="fd-items-content">
          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '40px' }}>
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

          {!isLoading && !error && sections.map((section) => (
            <div key={section.title || 'all'}>
              {section.title && <h2 className="fd-section-heading">{section.title}</h2>}
              <div className="fd-item-grid">
                {section.items.map((item) => {
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
                    <StoreItemRow
                      key={item.id}
                      item={item}
                      quantity={quantity}
                      onAdd={() => addToCart(cartMenuItem, restaurantDetails)}
                      onIncrement={() => incrementItem(item.id)}
                      onDecrement={() => decrementItem(item.id)}
                      onClick={() => handleItemClick(item)}
                      isEnabled={item.isEnabled}
                      showShopName={!isRestaurantPage}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <CartBottomBar
          onAddToCart={handleAddToCart}
          onPlaceOrder={handlePlaceOrder}
          totalItems={currentTotalItems}
        />

        {selectedItem && <ItemDetailModal item={selectedItem} onClose={handleCloseModal} />}
      </div>
    </PublicRoute>
  );
}

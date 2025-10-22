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
  const displayPrice =
    item.variants && item.variants.length > 0
      ? `৳${Math.min(...item.variants.map((v) => v.price)).toFixed(0)} - ৳${Math.max(
          ...item.variants.map((v) => v.price)
        ).toFixed(0)}`
      : `৳${item.price.toFixed(0)}`;

  const isMultiVariant = item.variants && item.variants.length > 0;

  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden flex flex-col ${
        !isEnabled ? 'opacity-60' : 'cursor-pointer'
      }`}
    >
      <button onClick={onClick} disabled={!isEnabled} className="block w-full">
        <div className="relative h-36 w-full bg-gray-200">
          <img
            src={item.imageUrl || '/placeholder-image.png'}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {!isEnabled && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-2">
              <NoSymbolIcon className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold text-center">
                {item.stock !== 'yes' ? 'Out of Stock' : 'Shop Closed'}
              </span>
            </div>
          )}
          {quantity > 0 && !isMultiVariant && (
            <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-brandPink rounded-full shadow">
              {quantity}
            </span>
          )}
        </div>
      </button>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-semibold text-gray-800 flex-1 min-h-[40px] leading-tight">{item.name}</p>
        <div className="flex justify-between items-end mt-2">
          <span className="text-base font-bold text-brandPink">{displayPrice}</span>
          {isMultiVariant ? (
            <button
              onClick={onClick}
              disabled={!isEnabled}
              className="w-8 h-8 flex items-center justify-center bg-brandPink/10 text-brandPink rounded-full disabled:bg-gray-200 disabled:text-gray-400 transition hover:bg-brandPink/20"
            >
              <PlusIcon className="w-5 h-5" />
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
  const buttonSize = size === 'small' ? 'w-7 h-7' : 'w-9 h-9';
  const iconSize = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
  const numberSize = size === 'small' ? 'text-sm' : 'text-base';
  const space = size === 'small' ? 'space-x-1.5' : 'space-x-2.5';

  if (quantity === 0) {
    return (
      <button
        onClick={onAdd}
        disabled={!isEnabled}
        className={`${buttonSize} flex items-center justify-center bg-brandPink text-white rounded-full disabled:bg-gray-300 transition hover:bg-opacity-90`}
      >
        <PlusIcon className={iconSize} />
      </button>
    );
  } else {
    return (
      <div className={`flex items-center ${space}`}>
        <button
          onClick={onDecrement}
          disabled={!isEnabled}
          className={`${buttonSize} flex items-center justify-center bg-gray-200 text-gray-700 rounded-full disabled:bg-gray-300 transition hover:bg-gray-300`}
        >
          <MinusIcon className={iconSize} />
        </button>
        <span className={`${numberSize} font-bold min-w-[16px] text-center`}>{quantity}</span>
        <button
          onClick={onIncrement}
          disabled={!isEnabled}
          className={`${buttonSize} flex items-center justify-center bg-brandPink text-white rounded-full disabled:bg-gray-300 transition hover:bg-opacity-90`}
        >
          <PlusIcon className={iconSize} />
        </button>
      </div>
    );
  }
};

// --- Bottom Cart Bar ---
const CartBottomBar = ({ onAddToCart, onPlaceOrder, totalItems }) => {
  if (totalItems === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50">
      <div className="flex items-center space-x-4 max-w-lg mx-auto">
        <button
          onClick={onAddToCart}
          className="p-3 border border-gray-300 rounded-lg text-brandPink hover:bg-gray-50"
          title="Save selections to main cart"
        >
          <ShoppingCartIcon className="w-6 h-6" />
        </button>
        <button
          onClick={onPlaceOrder}
          className="flex-1 h-[50px] flex items-center justify-center bg-darkPink text-white rounded-lg text-base font-semibold transition hover:bg-opacity-90"
        >
          <CheckCircleIcon className="w-5 h-5 mr-2" />
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-30 bg-white shadow-sm p-3 flex items-center space-x-2">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 truncate flex-1">{pageTitle}</h1>

          <button
            onClick={handleSortClick}
            className="p-2 rounded-full hover:bg-gray-100"
            title={
              sortOrder === SortOrder.NONE
                ? 'Sort by Price'
                : sortOrder === SortOrder.PRICE_LOW_TO_HIGH
                ? 'Sorted: Low to High'
                : 'Sorted: High to Low'
            }
          >
            {sortOrder === SortOrder.NONE && <ArrowsUpDownIcon className="w-6 h-6 text-gray-500" />}
            {sortOrder === SortOrder.PRICE_LOW_TO_HIGH && <ArrowUpIcon className="w-6 h-6 text-brandPink" />}
            {sortOrder === SortOrder.PRICE_HIGH_TO_LOW && <ArrowDownIcon className="w-6 h-6 text-brandPink" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col justify-center items-center h-full p-6 text-center">
              <NoSymbolIcon className="w-12 h-12 text-red-400 mb-3" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!isLoading && !error && sortedItems.length === 0 && (
            <div className="flex flex-col justify-center items-center h-full p-6 text-center">
              <TagIcon className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600">No items found.</p>
            </div>
          )}

          {!isLoading && !error && sortedItems.length > 0 && (
            <div className="grid grid-cols-2 gap-4 p-4">
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

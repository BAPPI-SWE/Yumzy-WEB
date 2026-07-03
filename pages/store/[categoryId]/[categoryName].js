import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import ProtectedRoute from '../../../components/ProtectedRoute';
import LoadingSpinner from '../../../components/LoadingSpinner';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
  CheckCircleIcon,
  SpeakerWaveIcon,
  NoSymbolIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../../context/AuthContext';

// --- Helper: Split array into chunks of given size ---
async function batchInQuery(collectionRef, field, values) {
  if (!values || values.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < values.length; i += 30) {
    chunks.push(values.slice(i, i + 30));
  }
  const snapshots = await Promise.all(
    chunks.map(chunk => getDocs(query(collectionRef, where(field, 'in', chunk))))
  );
  return snapshots.flatMap(snap => snap.docs);
}

// --- Grocery Order Terms & Conditions Popup ---
const GroceryTermsDialog = ({ onDismiss }) => {
  const freshRed = '#E8354E';
  const softRedBg = '#FFF3F4';

  const terms = [
    { number: '১', text: 'শুধু প্রি-অর্ডার করতে পারবেন। প্রি-অর্ডারের ৩ ঘণ্টার মধ্যে ডেলিভারি।' },
    { number: '২', text: 'Grocery item এর সাথে Fast food restaurant er খাবার বা city food এর খাবার অর্ডার করলে অর্ডার Cancel হয়ে যাবে।' }
  ];

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'white',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)'
        }}
      >
        {/* Header band */}
        <div
          style={{
            background: `linear-gradient(to bottom, ${freshRed}, #F4566B)`,
            padding: '22px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ShoppingCartIcon style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: '19px', margin: 0 }}>
            Grocery অর্ডার এর শর্তাবলী
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {terms.map((term) => (
            <div
              key={term.number}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: softRedBg,
                borderRadius: '14px',
                padding: '12px'
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '9999px',
                  backgroundColor: freshRed,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {term.number}
              </div>
              <p style={{ color: '#2B2B2B', fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {term.text}
              </p>
            </div>
          ))}
        </div>

        {/* Action button */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <button
            onClick={onDismiss}
            style={{
              width: '100%',
              height: '50px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: freshRed,
              color: 'white',
              fontWeight: 700,
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            বুঝেছি
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// --- Announcement Card ---
const AnnouncementCard = ({ announcement }) => {
  return (
    <div
      style={{
        background: 'linear-gradient(to right, rgba(213,0,50,0.8), rgba(220,12,37,0.8))',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite'
      }}
    >
      <SpeakerWaveIcon style={{ width: '24px', height: '24px', flexShrink: 0 }} />
      <p style={{ fontSize: '14px', fontWeight: 500 }}>{announcement.text}</p>
    </div>
  );
};

// --- SubCategory Card ---
const SubCategoryCard = ({ subCategory, itemCount, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: isHovered ? '#F9FAFB' : 'white',
        padding: '12px',
        borderRadius: '12px',
        boxShadow: isHovered
          ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease'
      }}
    >
      <img
        src={subCategory.imageUrl || '/placeholder-image.png'}
        alt={subCategory.name}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '9999px',
          objectFit: 'cover',
          border: '2px solid #FFEBEE',
          flexShrink: 0
        }}
      />
      <div style={{ flex: 1, marginLeft: '12px', marginRight: '12px' }}>
        <h3 style={{ fontWeight: 700, color: '#1F2937', fontSize: '15px' }}>{subCategory.name}</h3>
        <p style={{ fontSize: '12px', color: '#6B7280' }}>{itemCount} items</p>
      </div>
      <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />
    </button>
  );
};

// --- Mini Restaurant Card ---
const MiniRestaurantCard = ({ restaurant, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isClosed = restaurant.open === 'no';

  return (
    <button
      onClick={onClick}
      disabled={isClosed}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: isHovered && !isClosed ? '#F9FAFB' : 'white',
        padding: '12px',
        borderRadius: '12px',
        boxShadow: isHovered && !isClosed
          ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        border: 'none',
        cursor: isClosed ? 'not-allowed' : 'pointer',
        opacity: isClosed ? 0.6 : 1,
        textAlign: 'left',
        transition: 'all 0.2s ease'
      }}
    >
      <img
        src={restaurant.imageUrl || '/placeholder-image.png'}
        alt={restaurant.name}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '8px',
          objectFit: 'cover',
          flexShrink: 0
        }}
      />
      <div style={{ flex: 1, marginLeft: '12px', marginRight: '12px' }}>
        <h3 style={{ fontWeight: 700, color: '#1F2937', fontSize: '15px' }}>{restaurant.name}</h3>
        <div
          style={{
            marginTop: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: isClosed ? '#FEE2E2' : '#D1FAE5',
            color: isClosed ? '#B91C1C' : '#065F46'
          }}
        >
          {isClosed ? (
            <LockClosedIcon style={{ width: '12px', height: '12px', marginRight: '4px' }} />
          ) : (
            <CheckCircleIcon style={{ width: '12px', height: '12px', marginRight: '4px' }} />
          )}
          {isClosed ? 'Closed' : 'Open'}
        </div>
      </div>
      {!isClosed && <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#9CA3AF' }} />}
      {isClosed && <NoSymbolIcon style={{ width: '20px', height: '20px', color: '#F87171' }} />}
    </button>
  );
};

// --- Main Page Component ---
export default function SubCategoryListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { categoryId, categoryName: encodedName } = router.query;
  const categoryName = encodedName ? decodeURIComponent(encodedName) : 'Category';

  const [subCategories, setSubCategories] = useState([]);
  const [miniRestaurants, setMiniRestaurants] = useState([]);
  const [itemCounts, setItemCounts] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userSubLocation, setUserSubLocation] = useState(null);
  const [error, setError] = useState('');
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [showGroceryTerms, setShowGroceryTerms] = useState(false);

  // --- Show Grocery terms popup once when entering the Grocery section ---
  useEffect(() => {
    if (categoryId && String(categoryId).toLowerCase() === 'grocery') {
      setShowGroceryTerms(true);
    }
  }, [categoryId]);

  // --- Fetch Data ---
  useEffect(() => {
    if (!categoryId || !user) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      let location = userSubLocation;

      // 1. Fetch Location
      if (!location) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            location = userDocSnap.data()?.subLocation;
            setUserSubLocation(location);
          } else {
            setError('User profile not found.');
            setIsLoading(false);
            return;
          }
        } catch (err) {
          setError('Could not verify your location.');
          setIsLoading(false);
          return;
        }
      }

      if (!location) {
        setError('Please set your delivery location in profile.');
        setIsLoading(false);
        return;
      }

      try {
        // 2. Parallel Fetching
        const [announceSnap, subCatSnap, miniResSnap] = await Promise.all([
          getDocs(query(collection(db, 'announce'), where('parentCategory', '==', categoryId), where('availableLocations', 'array-contains', location))),
          getDocs(query(collection(db, 'store_sub_categories'), where('parentCategory', '==', categoryId), where('availableLocations', 'array-contains', location))),
          getDocs(query(collection(db, 'mini_restaurants'), where('parentCategory', '==', categoryId), where('availableLocations', 'array-contains', location)))
        ]);

        // 3. Announcements
        setAnnouncements(announceSnap.docs.map(d => ({ id: d.id, text: d.data().text || '' })));

        // 4. Sub-Categories with Strict Priority Sorting
        const fetchedSubCats = subCatSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || '',
            imageUrl: data.imageUrl || '',
            priority: data.priority !== undefined && data.priority !== null ? Number(data.priority) : 9999
          };
        }).sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          return a.name.localeCompare(b.name);
        });
        
        setSubCategories(fetchedSubCats);

        // 5. Item Counts — FIXED: Use batch query to handle more than 30 sub-categories
        if (fetchedSubCats.length > 0) {
          const subCatNames = fetchedSubCats.map(sc => sc.name);
          const itemDocs = await batchInQuery(collection(db, 'store_items'), 'subCategory', subCatNames);
          const counts = {};
          itemDocs.forEach(itemDoc => {
            const subCat = itemDoc.data().subCategory;
            if (subCat) counts[subCat] = (counts[subCat] || 0) + 1;
          });
          setItemCounts(counts);
        }

        // 6. Mini-Restaurants with Strict Priority Sorting
        const sortedMiniRes = miniResSnap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || '',
            imageUrl: data.imageUrl || '',
            open: data.open || 'no',
            priority: data.priority !== undefined && data.priority !== null ? Number(data.priority) : 9999
          };
        }).sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          return a.name.localeCompare(b.name);
        });

        setMiniRestaurants(sortedMiniRes);

      } catch (err) {
        console.error('Error fetching store data:', err);
        setError('Failed to load store information.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryId, user, userSubLocation]);

  // --- Handlers ---
  const handleSubCategoryClick = (name) => {
    const encoded = encodeURIComponent(name);
    router.push(`/items/subCategory/${encoded}?title=${encoded}`);
  };

  const handleMiniRestaurantClick = (id, name) => {
    const encoded = encodeURIComponent(name);
    router.push(`/items/miniRes/${id}?title=${encoded}`);
  };

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        {/* Grocery order terms & conditions popup */}
        {showGroceryTerms && (
          <GroceryTermsDialog onDismiss={() => setShowGroceryTerms(false)} />
        )}

        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          >
            <ArrowLeftIcon style={{ width: '24px', height: '24px', color: '#374151' }} />
          </button>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1F2937',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {categoryName}
          </h1>
        </div>

        {isLoading && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && error && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', textAlign: 'center' }}>
            <NoSymbolIcon style={{ width: '48px', height: '48px', color: '#F87171', marginBottom: '12px' }} />
            <p style={{ color: '#DC2626' }}>{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div style={{ borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex' }}>
                <button
                  onClick={() => setSelectedTabIndex(0)}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: selectedTabIndex === 0 ? 700 : 500,
                    borderBottom: selectedTabIndex === 0 ? '2px solid #D50032' : '2px solid transparent',
                    color: selectedTabIndex === 0 ? '#D50032' : '#6B7280',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Categories
                </button>
                <button
                  onClick={() => setSelectedTabIndex(1)}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: selectedTabIndex === 1 ? 700 : 500,
                    borderBottom: selectedTabIndex === 1 ? '2px solid #D50032' : '2px solid transparent',
                    color: selectedTabIndex === 1 ? '#D50032' : '#6B7280',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Shops
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#F9FAFB' }}>
              {announcements.map(a => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))}

              {selectedTabIndex === 0 &&
                (subCategories.length > 0 ? (
                  subCategories.map(sc => (
                    <SubCategoryCard
                      key={sc.id}
                      subCategory={sc}
                      itemCount={itemCounts[sc.name] || 0}
                      onClick={() => handleSubCategoryClick(sc.name)}
                    />
                  ))
                ) : (
                  <p style={{ color: '#4B5563', textAlign: 'center', padding: '40px 0' }}>
                    No categories found in this section for your location.
                  </p>
                ))}

              {selectedTabIndex === 1 &&
                (miniRestaurants.length > 0 ? (
                  miniRestaurants.map(res => (
                    <MiniRestaurantCard
                      key={res.id}
                      restaurant={res}
                      onClick={() => handleMiniRestaurantClick(res.id, res.name)}
                    />
                  ))
                ) : (
                  <p style={{ color: '#4B5563', textAlign: 'center', padding: '40px 0' }}>
                    No shops found in this section for your location.
                  </p>
                ))}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
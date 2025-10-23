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
  NoSymbolIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../../context/AuthContext';

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

  // --- Fetch Data ---
  useEffect(() => {
    if (!categoryId || !user) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setSubCategories([]);
      setMiniRestaurants([]);
      setItemCounts({});
      setAnnouncements([]);

      let location = userSubLocation;

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
          console.error('Error fetching user location:', err);
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
        const announceQuery = query(
          collection(db, 'announce'),
          where('parentCategory', '==', categoryId),
          where('availableLocations', 'array-contains', location)
        );
        const announceSnap = await getDocs(announceQuery);
        setAnnouncements(announceSnap.docs.map(d => ({ id: d.id, text: d.data().text || '' })));

        const subCatQuery = query(
          collection(db, 'store_sub_categories'),
          where('parentCategory', '==', categoryId),
          where('availableLocations', 'array-contains', location)
        );
        const subCatSnap = await getDocs(subCatQuery);
        const fetchedSubCats = subCatSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name || '',
          imageUrl: d.data().imageUrl || ''
        }));
        setSubCategories(fetchedSubCats);

        if (fetchedSubCats.length > 0) {
          const subCatNames = fetchedSubCats.map(sc => sc.name);
          const itemsQuery = query(collection(db, 'store_items'), where('subCategory', 'in', subCatNames));
          const itemsSnap = await getDocs(itemsQuery);
          const counts = {};
          itemsSnap.docs.forEach(itemDoc => {
            const subCat = itemDoc.data().subCategory;
            if (subCat) counts[subCat] = (counts[subCat] || 0) + 1;
          });
          setItemCounts(counts);
        }

        const miniResQuery = query(
          collection(db, 'mini_restaurants'),
          where('parentCategory', '==', categoryId),
          where('availableLocations', 'array-contains', location)
        );
        const miniResSnap = await getDocs(miniResQuery);
        setMiniRestaurants(
          miniResSnap.docs.map(d => ({
            id: d.id,
            name: d.data().name || '',
            imageUrl: d.data().imageUrl || '',
            open: d.data().open || 'no'
          }))
        );
      } catch (err) {
        console.error('Error fetching store data:', err);
        setError('Failed to load store information.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryId, user, userSubLocation]);

  // --- Navigation Handlers ---
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
        {/* Top Bar */}
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

        {/* Loading */}
        {isLoading && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <LoadingSpinner />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', textAlign: 'center' }}>
            <NoSymbolIcon style={{ width: '48px', height: '48px', color: '#F87171', marginBottom: '12px' }} />
            <p style={{ color: '#DC2626' }}>{error}</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Tabs */}
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

            {/* Tab Content */}
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

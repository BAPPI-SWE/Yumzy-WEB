// pages/home.js

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRouter } from 'next/router';

// --- Real Components ---
import HomeTopBar from '../components/HomeTopBar';
import OfferSlider from '../components/OfferSlider';
import CategorySection from '../components/CategorySection';
import RestaurantCard from '../components/RestaurantCard';
import SearchResultsList from '../components/SearchResultsList';

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

function HomePageContent() {
  const { user } = useAuth();
  const router = useRouter();

  // --- State ---
  const [userProfile, setUserProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [combinedRestaurants, setCombinedRestaurants] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allMiniRestaurants, setAllMiniRestaurants] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppDialog, setShowAppDialog] = useState(() => {
    return sessionStorage.getItem('appDialogDismissed') !== 'true';
  });

  const handleCloseDialog = () => {
    sessionStorage.setItem('appDialogDismissed', 'true');
    setShowAppDialog(false);
  };

  // --- Fetch Data ---
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      setError('');
      let profile = null;
      let userLocation = null;

      try {
        // 1. Fetch User Profile
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          profile = {
            baseLocation: data.baseLocation || 'Campus',
            subLocation: data.subLocation || '',
          };
          setUserProfile(profile);
          userLocation = profile.subLocation;
        } else {
          setError('User profile not found.');
          setIsLoadingData(false);
          return;
        }

        if (!userLocation) {
          setError('Please set your delivery location in your profile.');
          setIsLoadingData(false);
          return;
        }

        // --- Fetch Data in parallel ---
        const [offersSnap, restaurantsSnap, subCategoriesSnap, miniRestaurantsSnap] = await Promise.all([
          getDocs(query(collection(db, 'offers'), where('availableLocations', 'array-contains', userLocation))),
          getDocs(query(collection(db, 'restaurants'), where('deliveryLocations', 'array-contains', userLocation))),
          getDocs(query(collection(db, 'store_sub_categories'), where('availableLocations', 'array-contains', userLocation))),
          getDocs(query(collection(db, 'mini_restaurants'), where('availableLocations', 'array-contains', userLocation)))
        ]);

        // 2. Process Offers
        const fetchedOffers = offersSnap.docs.map((doc) => ({
          imageUrl: doc.data().imageUrl || '',
          availableLocations: doc.data().availableLocations || [],
        }));
        setOffers(fetchedOffers);

        // 3. Process Main Restaurants
        const mainRestaurants = restaurantsSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'No Name',
          cuisine: doc.data().cuisine || 'General',
          imageUrl: doc.data().imageUrl || null,
          type: 'MAIN',
          priority: doc.data().priority != null ? parseInt(doc.data().priority, 10) : null,
          open: 'yes'
        }));

        // 4. Process Mini Restaurants
        const miniRestaurants = miniRestaurantsSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'No Name',
          cuisine: doc.data().cuisine || 'Shop',
          imageUrl: doc.data().imageUrl || null,
          type: 'MINI',
          priority: doc.data().priority != null ? parseInt(doc.data().priority, 10) : null,
          open: doc.data().open || 'no'
        }));

        // 5. Merge and Sort by Priority
        const combined = [...mainRestaurants, ...miniRestaurants].sort((a, b) => {
          const pa = a.priority != null ? a.priority : Number.MAX_SAFE_INTEGER;
          const pb = b.priority != null ? b.priority : Number.MAX_SAFE_INTEGER;
          return pa - pb;
        });

        setCombinedRestaurants(combined);
        setAllMiniRestaurants(miniRestaurants);

        // 6. Process SubCategories
        const fetchedSubCats = subCategoriesSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
          itemCount: 0,
          imageUrl: doc.data().imageUrl || '',
        }));

        let finalSubCats = fetchedSubCats;
        if (fetchedSubCats.length > 0) {
          const subCategoryNames = fetchedSubCats.map((it) => it.name);

          // --- FIXED: Use batch query to handle more than 30 sub-categories ---
          const itemDocs = await batchInQuery(collection(db, 'store_items'), 'subCategory', subCategoryNames);

          const itemCounts = itemDocs
            .map((it) => it.data().subCategory)
            .filter(Boolean)
            .reduce((acc, name) => {
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {});

          finalSubCats = fetchedSubCats.map((subCat) => ({
            ...subCat,
            itemCount: itemCounts[subCat.name] || 0,
          }));
        }
        setAllSubCategories(finalSubCats);

      } catch (err) {
        console.error('Error fetching home data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  // --- Navigation Handlers ---
  const handleItemClick = (item) => {
    const encodedName = encodeURIComponent(item.name);
    if (item.type === 'MAIN') {
      router.push(`/restaurant/${item.id}/${encodedName}`);
    } else {
      if (item.open === 'no') return;
      router.push(`/items/miniRes/${item.id}?title=${encodedName}`);
    }
  };

  const handleCategoryClick = (categoryId, categoryName) => {
    const encodedName = encodeURIComponent(categoryName);
    router.push(`/store/${categoryId}/${encodedName}`);
  };

  const handleSubCategorySearchClick = (subCategoryName) => {
    const encodedSubCat = encodeURIComponent(subCategoryName);
    router.push(`/items/subCategory/${encodedSubCat}?title=${encodedSubCat}`);
  };

  const handleMiniRestaurantSearchClick = (miniResId, miniResName, isOpen) => {
    if (!isOpen) return;
    const encodedTitle = encodeURIComponent(miniResName);
    router.push(`/items/miniRes/${miniResId}?title=${encodedTitle}`);
  };

  const handleNotificationClick = () => router.push('/orders');
  const handleFavoriteClick = () => alert('Favorites clicked!');

  // --- Search Results ---
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const lowerQuery = searchQuery.toLowerCase();
    const restaurantResults = combinedRestaurants
      .filter((r) => r.name.toLowerCase().includes(lowerQuery) || r.cuisine.toLowerCase().includes(lowerQuery))
      .map((r) => ({ type: 'restaurant', data: r }));
    const subCategoryResults = allSubCategories
      .filter((sc) => sc.name.toLowerCase().includes(lowerQuery))
      .map((sc) => ({ type: 'subCategory', data: sc }));
    return [...restaurantResults, ...subCategoryResults];
  }, [searchQuery, combinedRestaurants, allSubCategories]);

  if (isLoadingData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 80px)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#4B5563' }}>Loading Foodish...</p>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '100vh', width: '100%', margin: 0, padding: 0 }}>
      <HomeTopBar
        userProfile={userProfile}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onNotificationClick={handleNotificationClick}
        onFavoriteClick={handleFavoriteClick}
      />

      <div style={{
        flex: 1,
        overflowY: 'auto',
        filter: searchResults !== null ? 'blur(4px)' : 'none',
        pointerEvents: searchResults !== null ? 'none' : 'auto',
        transition: 'filter 0.2s',
        width: '100%'
      }}>
        {error && (
          <div style={{ padding: '16px', margin: '16px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '8px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {!error && userProfile?.subLocation && (
          <div style={{ paddingTop: '8px', paddingBottom: '16px' }}>
            {offers.length > 0 && <OfferSlider offers={offers} />}
            <div style={{ marginTop: '12px' }}>
              <CategorySection onCategoryClick={handleCategoryClick} />
            </div>

            <div style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#1F2937' }}>
                Available Restaurants & Shops
              </h2>
              {combinedRestaurants.length === 0 ? (
                <p style={{ color: '#4B5563', textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
                  No outlets found delivering to your location.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {combinedRestaurants.map((res) => (
                    <RestaurantCard
                      key={res.id}
                      restaurant={res}
                      onClick={() => handleItemClick(res)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ height: '40px' }}></div>
      </div>

      <SearchResultsList
        results={searchResults}
        onRestaurantClick={(id, name) => {
          const item = combinedRestaurants.find(r => r.id === id);
          if (item) handleItemClick(item);
        }}
        onSubCategoryClick={handleSubCategorySearchClick}
        onMiniRestaurantClick={handleMiniRestaurantSearchClick}
      />

      {/* --- WhatsApp Helpline Button --- */}
      <a
        href="https://wa.me/8801746324620"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          width: '50px',
          height: '50px',
          backgroundColor: '#25D366',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.045c0 2.12.554 4.188 1.597 6.011L0 24l6.135-1.61a11.77 11.77 0 005.911 1.586h.005c6.635 0 12.048-5.414 12.052-12.049a11.762 11.762 0 00-3.418-8.52z" />
        </svg>
      </a>

      {/* --- App Download Dialog --- */}
      {showAppDialog && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '28px 24px 24px',
            width: '320px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
            position: 'relative',
            textAlign: 'center',
          }}>
            <button
              onClick={handleCloseDialog}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#6B7280',
                lineHeight: 1,
                padding: '4px',
              }}
            >
              &#x2715;
            </button>

            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#FFF7ED',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
            }}>
              🍔
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: '0 0 8px' }}>
              Get the Foodish App!
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px', lineHeight: '1.5' }}>
              For a faster and smoother experience, download our Android app.
            </p>

            <a
              href="https://play.google.com/store/apps/details?id=com.yumzy.userapp"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                backgroundColor: '#1F2937',
                color: '#fff',
                borderRadius: '10px',
                padding: '12px 20px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '15px',
                marginBottom: '12px',
              }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
                <path d="M3.18 23.76a2 2 0 001.94-.21l11.34-6.55-2.9-2.9-10.38 9.66zM.54 1.1A2 2 0 000 2.54v18.92a2 2 0 00.54 1.44l.08.07 10.59-10.59v-.25L.62 1.03l-.08.07zM20.3 10.4l-2.88-1.66-3.24 3.24 3.24 3.24 2.9-1.68a2.02 2.02 0 000-3.14zM5.12.45L16.46 7 13.56 9.9 3.18.45A2 2 0 005.12.45z" />
              </svg>
              Download on Google Play
            </a>

            <button
              onClick={handleCloseDialog}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9CA3AF',
                fontSize: '13px',
              }}
            >
              Continue on Web
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
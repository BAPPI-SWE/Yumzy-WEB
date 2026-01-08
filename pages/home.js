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

function HomePageContent() {
  const { user } = useAuth();
  const router = useRouter();

  // --- State ---
  const [userProfile, setUserProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [combinedRestaurants, setCombinedRestaurants] = useState([]); // Unified list for the UI
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allMiniRestaurants, setAllMiniRestaurants] = useState([]); // Kept for Search Results
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

        // --- Fetch Data in parallel (Matching Android Logic) ---
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
          priority: doc.data().priority || 999,
          open: 'yes'
        }));

        // 4. Process Mini Restaurants
        const miniRestaurants = miniRestaurantsSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'No Name',
          cuisine: doc.data().cuisine || 'Shop',
          imageUrl: doc.data().imageUrl || null,
          type: 'MINI',
          priority: doc.data().priority || 999,
          open: doc.data().open || 'no'
        }));

        // 5. Merge and Sort by Priority (Exact logic from your Android code)
        const combined = [...mainRestaurants, ...miniRestaurants].sort((a, b) => {
            return (a.priority || 999) - (b.priority || 999);
        });
        
        setCombinedRestaurants(combined);
        setAllMiniRestaurants(miniRestaurants);

        // 6. Process SubCategories (Counting items)
        const fetchedSubCats = subCategoriesSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
          itemCount: 0,
          imageUrl: doc.data().imageUrl || '',
        }));

        let finalSubCats = fetchedSubCats;
        if (fetchedSubCats.length > 0) {
          const subCategoryNames = fetchedSubCats.map((it) => it.name);
          const itemsQuery = query(collection(db, 'store_items'), where('subCategory', 'in', subCategoryNames));
          const itemsSnap = await getDocs(itemsQuery);
          const itemCounts = itemsSnap.docs
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

  // --- Unified Navigation Handler ---
  const handleItemClick = (item) => {
    const encodedName = encodeURIComponent(item.name);
    
    if (item.type === 'MAIN') {
      // Navigate to Restaurant Menu
      router.push(`/restaurant/${item.id}/${encodedName}`);
    } else {
      // Navigate to Mini Restaurant Grid (if open)
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

  // --- Search Results Calculation ---
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const lowerQuery = searchQuery.toLowerCase();

    // Use combined list for restaurant searching to include both types
    const restaurantResults = combinedRestaurants
      .filter(
        (r) => r.name.toLowerCase().includes(lowerQuery) || r.cuisine.toLowerCase().includes(lowerQuery)
      )
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
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#4B5563' }}>Loading Yumzy...</p>
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
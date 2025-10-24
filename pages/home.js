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
  const [restaurants, setRestaurants] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allMiniRestaurants, setAllMiniRestaurants] = useState([]);
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
          setOffers([]);
          setRestaurants([]);
          setIsLoadingData(false);
          return;
        }

        // --- Fetch Offers, Restaurants, SubCategories, MiniRestaurants in parallel ---
        const offersPromise = getDocs(
          query(collection(db, 'offers'), where('availableLocations', 'array-contains', userLocation))
        );
        const restaurantsPromise = getDocs(
          query(collection(db, 'restaurants'), where('deliveryLocations', 'array-contains', userLocation))
        );
        const subCategoriesPromise = getDocs(
          query(collection(db, 'store_sub_categories'), where('availableLocations', 'array-contains', userLocation))
        );
        const miniRestaurantsPromise = getDocs(
          query(collection(db, 'mini_restaurants'), where('availableLocations', 'array-contains', userLocation))
        );

        const [offersSnap, restaurantsSnap, subCategoriesSnap, miniRestaurantsSnap] = await Promise.all([
          offersPromise,
          restaurantsPromise,
          subCategoriesPromise,
          miniRestaurantsPromise,
        ]);

        // Offers
        const fetchedOffers = offersSnap.docs.map((doc) => ({
          imageUrl: doc.data().imageUrl || '',
          availableLocations: doc.data().availableLocations || [],
        }));
        setOffers(fetchedOffers);

        // Restaurants
        const fetchedRestaurants = restaurantsSnap.docs.map((doc) => ({
          ownerId: doc.id,
          name: doc.data().name || 'No Name',
          cuisine: doc.data().cuisine || 'No Cuisine',
          deliveryLocations: doc.data().deliveryLocations || [],
          imageUrl: doc.data().imageUrl || null,
        }));
        setRestaurants(fetchedRestaurants);

        // SubCategories
        const fetchedSubCats = subCategoriesSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
          itemCount: 0,
          imageUrl: doc.data().imageUrl || '',
        }));

        // Count items for each subcategory
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

        // MiniRestaurants
        const fetchedMiniRestaurants = miniRestaurantsSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
          imageUrl: doc.data().imageUrl || '',
          open: doc.data().open || 'no',
        }));
        setAllMiniRestaurants(fetchedMiniRestaurants);
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
  const handleRestaurantClick = (restaurantId, restaurantName) => {
    const encodedName = encodeURIComponent(restaurantName);
    router.push(`/restaurant/${restaurantId}/${encodedName}`);
  };

  const handleCategoryClick = (categoryId, categoryName) => {
    const encodedName = encodeURIComponent(categoryName);
    router.push(`/store/${categoryId}/${encodedName}`);
  };

  const handleNotificationClick = () => router.push('/orders');
  const handleFavoriteClick = () => alert('Favorites clicked!');

  const handleSubCategorySearchClick = (subCategoryName) => {
    const encodedSubCat = encodeURIComponent(subCategoryName);
    router.push(`/items/subCategory/${encodedSubCat}?title=${encodedSubCat}`);
  };

  const handleMiniRestaurantClick = (miniResId, miniResName, isOpen) => {
    if (!isOpen) return;
    const encodedTitle = encodeURIComponent(miniResName);
    router.push(`/items/miniRes/${miniResId}?title=${encodedTitle}`);
  };

  // --- Search Results Calculation ---
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const lowerQuery = searchQuery.toLowerCase();

    const restaurantResults = restaurants
      .filter(
        (r) => r.name.toLowerCase().includes(lowerQuery) || r.cuisine.toLowerCase().includes(lowerQuery)
      )
      .map((r) => ({ type: 'restaurant', data: r }));

    const subCategoryResults = allSubCategories
      .filter((sc) => sc.name.toLowerCase().includes(lowerQuery))
      .map((sc) => ({ type: 'subCategory', data: sc }));

    const miniRestaurantResults = allMiniRestaurants
      .filter((mr) => mr.name.toLowerCase().includes(lowerQuery))
      .map((mr) => ({ type: 'miniRestaurant', data: mr }));

    return [...restaurantResults, ...subCategoryResults, ...miniRestaurantResults];
  }, [searchQuery, restaurants, allSubCategories, allMiniRestaurants]);

  // --- Render Loading or Content ---
  if (isLoadingData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 'calc(100vh - 80px)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#4B5563'
          }}>
            Loading Yumzy...
          </p>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // --- Render Page ---
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      margin: 0,
      padding: 0
    }}>
      <HomeTopBar
        userProfile={userProfile}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onNotificationClick={handleNotificationClick}
        onFavoriteClick={handleFavoriteClick}
      />

      {/* Main content (kept visible, blurred when searching) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        filter: searchResults !== null ? 'blur(4px)' : 'none',
        pointerEvents: searchResults !== null ? 'none' : 'auto',
        transition: 'filter 0.2s',
        width: '100%',
        margin: 0,
        padding: 0
      }}>
        {error && (
          <div style={{
            padding: '16px',
            margin: '16px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {!error && userProfile?.subLocation && (
          <div style={{
            paddingTop: '16px',
            paddingBottom: '16px'
          }}>
            {offers.length > 0 && <OfferSlider offers={offers} />}
            <div style={{ marginTop: '24px' }}>
              <CategorySection onCategoryClick={handleCategoryClick} />
            </div>

            <div style={{
              paddingLeft: '16px',
              paddingRight: '16px',
              marginTop: '24px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '12px',
                color: '#1F2937'
              }}>
                Available Hotels Near You
              </h2>
              {restaurants.length === 0 ? (
                <p style={{
                  color: '#4B5563',
                  textAlign: 'center',
                  paddingTop: '40px',
                  paddingBottom: '40px'
                }}>
                  No restaurants found delivering to your location.
                </p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  {restaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.ownerId}
                      restaurant={restaurant}
                      onClick={() => handleRestaurantClick(restaurant.ownerId, restaurant.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ height: '40px' }}></div>
      </div>

      {/* Search Results Overlay */}
      <SearchResultsList
        results={searchResults}
        onRestaurantClick={handleRestaurantClick}
        onSubCategoryClick={handleSubCategorySearchClick}
        onMiniRestaurantClick={handleMiniRestaurantClick}
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
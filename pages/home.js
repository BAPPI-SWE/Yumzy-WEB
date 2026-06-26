// pages/home.js

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRouter } from 'next/router';

import HomeTopBar from '../components/HomeTopBar';
import OfferSlider from '../components/OfferSlider';
import CategorySection from '../components/CategorySection';
import RestaurantCard from '../components/RestaurantCard';
import SearchResultsList from '../components/SearchResultsList';

// --- Batch in-query helper ---
async function batchInQuery(collectionRef, field, values) {
  if (!values || values.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < values.length; i += 30) chunks.push(values.slice(i, i + 30));
  const snapshots = await Promise.all(
    chunks.map(chunk => getDocs(query(collectionRef, where(field, 'in', chunk))))
  );
  return snapshots.flatMap(snap => snap.docs);
}

// --- Closed overlay wrapper (unchanged logic) ---
function RestaurantCardWithStatus({ restaurant, onClick }) {
  const isClosed = restaurant.type === 'MINI' && restaurant.open !== 'yes';

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ pointerEvents: isClosed ? 'none' : 'auto' }}>
        <RestaurantCard
          restaurant={restaurant}
          onClick={isClosed ? undefined : onClick}
        />
      </div>

      {restaurant.type === 'MINI' && !isClosed && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          backgroundColor: '#16A34A', color: '#fff',
          fontSize: '10px', fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '0 16px 0 10px',
          letterSpacing: '0.5px', zIndex: 2,
        }}>
          OPEN
        </div>
      )}

      {isClosed && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3, cursor: 'not-allowed',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            backgroundColor: '#DC0C25', color: '#fff',
            borderRadius: '10px', padding: '9px 18px',
            fontWeight: 700, fontSize: '14px', letterSpacing: '1px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            CLOSED
          </div>
        </div>
      )}
    </div>
  );
}

// --- Section Header ---
function SectionHeader({ title, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline',
      justifyContent: 'space-between', marginBottom: '20px',
    }}>
      <h2 style={{
        fontSize: '20px', fontWeight: 800,
        color: '#111827', margin: 0, letterSpacing: '-0.3px',
      }}>
        {title}
      </h2>
      {count != null && (
        <span style={{
          fontSize: '13px', color: '#6B7280', fontWeight: 500,
        }}>
          {count} available
        </span>
      )}
    </div>
  );
}

// --- Stats strip (desktop only) ---
function StatsStrip() {
  const stats = [
    { icon: '🚀', label: 'Fast Delivery', value: '30–40 min avg' },
    { icon: '🍽️', label: 'Restaurants', value: '50+ options' },
    { icon: '⭐', label: 'Rating', value: '4.8 / 5.0' },
    { icon: '🎁', label: 'Safe Delivery', value: 'On all orders' },
  ];
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      marginBottom: '32px',
    }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          backgroundColor: 'white',
          borderRadius: '14px',
          padding: '16px 18px',
          border: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <span style={{ fontSize: '24px' }}>{s.icon}</span>
          <div>
            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
            <p style={{ fontSize: '14px', color: '#1F2937', margin: 0, fontWeight: 700 }}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page Content ───────────────────────────────────────────
function HomePageContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [combinedRestaurants, setCombinedRestaurants] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allMiniRestaurants, setAllMiniRestaurants] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppDialog, setShowAppDialog] = useState(() =>
    sessionStorage.getItem('appDialogDismissed') !== 'true'
  );

  const handleCloseDialog = () => {
    sessionStorage.setItem('appDialogDismissed', 'true');
    setShowAppDialog(false);
  };

  // --- Fetch Data (identical to original) ---
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      setError('');
      let profile = null;
      let userLocation = null;

      try {
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

        const [offersSnap, restaurantsSnap, subCategoriesSnap, miniRestaurantsSnap] = await Promise.all([
          getDocs(query(collection(db, 'offers'), where('availableLocations', 'array-contains', userLocation))),
          getDocs(query(collection(db, 'restaurants'), where('deliveryLocations', 'array-contains', userLocation))),
          getDocs(query(collection(db, 'store_sub_categories'), where('availableLocations', 'array-contains', userLocation))),
          getDocs(query(collection(db, 'mini_restaurants'), where('availableLocations', 'array-contains', userLocation)))
        ]);

        const fetchedOffers = offersSnap.docs.map((doc) => ({
          imageUrl: doc.data().imageUrl || '',
          availableLocations: doc.data().availableLocations || [],
        }));
        setOffers(fetchedOffers);

        // Store fetch index so equal-priority items keep their original Firestore order
        const mainRestaurants = restaurantsSnap.docs.map((doc, idx) => ({
          id: doc.id,
          name: doc.data().name || 'No Name',
          cuisine: doc.data().cuisine || 'General',
          imageUrl: doc.data().imageUrl || null,
          type: 'MAIN',
          priority: doc.data().priority != null ? parseInt(doc.data().priority, 10) : null,
          open: 'yes',
          parentCategory: doc.data().parentCategory || '',
          _fetchIndex: idx,
        }));

        const miniRestaurants = miniRestaurantsSnap.docs.map((doc, idx) => ({
          id: doc.id,
          name: doc.data().name || 'No Name',
          cuisine: doc.data().cuisine || 'Shop',
          imageUrl: doc.data().imageUrl || null,
          type: 'MINI',
          priority: doc.data().priority != null ? parseInt(doc.data().priority, 10) : null,
          open: doc.data().open || 'no',
          parentCategory: doc.data().parentCategory || '',
          _fetchIndex: idx + 10000, // offset so MAIN and MINI indices don't collide
        }));

        // Sort by priority ascending (nulls last), then by original fetch order for stability
        const combined = [...mainRestaurants, ...miniRestaurants]
          .filter((r) => (r.parentCategory || '').toLowerCase() !== 'grocery')
          .sort((a, b) => {
            const pa = a.priority != null ? a.priority : Number.MAX_SAFE_INTEGER;
            const pb = b.priority != null ? b.priority : Number.MAX_SAFE_INTEGER;
            if (pa !== pb) return pa - pb;
            return a._fetchIndex - b._fetchIndex; // stable: preserve Firestore fetch order on tie
          });

        setCombinedRestaurants(combined);
        setAllMiniRestaurants(miniRestaurants);

        const fetchedSubCats = subCategoriesSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || '',
          itemCount: 0,
          imageUrl: doc.data().imageUrl || '',
        }));

        let finalSubCats = fetchedSubCats;
        if (fetchedSubCats.length > 0) {
          const subCategoryNames = fetchedSubCats.map((it) => it.name);
          const itemDocs = await batchInQuery(collection(db, 'store_items'), 'subCategory', subCategoryNames);
          const itemCounts = itemDocs
            .map((it) => it.data().subCategory)
            .filter(Boolean)
            .reduce((acc, name) => { acc[name] = (acc[name] || 0) + 1; return acc; }, {});

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

  // --- Navigation (identical to original) ---
  const handleItemClick = (item) => {
    const encodedName = encodeURIComponent(item.name);
    if (item.type === 'MAIN') {
      router.push(`/restaurant/${item.id}/${encodedName}`);
    } else {
      if (item.open !== 'yes') return;
      router.push(`/items/miniRes/${item.id}?title=${encodedName}`);
    }
  };

  const handleCategoryClick = (categoryId, categoryName) => {
    router.push(`/store/${categoryId}/${encodeURIComponent(categoryName)}`);
  };

  const handleSubCategorySearchClick = (subCategoryName) => {
    const enc = encodeURIComponent(subCategoryName);
    router.push(`/items/subCategory/${enc}?title=${enc}`);
  };

  const handleMiniRestaurantSearchClick = (miniResId, miniResName, isOpen) => {
    if (!isOpen) return;
    router.push(`/items/miniRes/${miniResId}?title=${encodeURIComponent(miniResName)}`);
  };

  const handleNotificationClick = () => router.push('/orders');
  const handleFavoriteClick = () => alert('Favorites clicked!');

  // --- Search ---
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

  // --- Loading State ---
  if (isLoadingData) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        height: '100vh', gap: '16px', backgroundColor: '#F8FAFC',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #DC0C25, #FF4057)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px',
        }}>🍔</div>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#374151', margin: 0 }}>
          Loading Foodish...
        </p>
        <LoadingSpinner />
      </div>
    );
  }

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Keania+One&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background-color: #F8FAFC; }

        /* Desktop layout */
        .home-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          position: relative;
        }
        .home-content-wrapper {
          flex: 1;
          width: 100%;
          position: relative;
        }

        /* Mobile content padding */
        .home-main {
          padding: 16px 16px 80px;
          max-width: 100%;
        }

        /* Desktop overrides */
        @media (min-width: 1024px) {
          body { background-color: #F1F5F9; }
          .home-main {
            max-width: 1280px;
            margin: 0 auto;
            padding: 32px 40px 60px;
          }
          .restaurant-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)) !important;
            gap: 20px !important;
          }
          .offers-section {
            margin-bottom: 32px !important;
          }
          .stats-strip { display: grid !important; }
          .section-divider { margin-bottom: 28px !important; }
        }

        @media (min-width: 1440px) {
          .home-main { max-width: 1440px; padding: 36px 64px 80px; }
          .restaurant-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
          }
        }

        /* Hide stats on mobile */
        .stats-strip { display: none; }

        /* Smooth blur for search */
        .content-blurred {
          filter: blur(4px);
          pointer-events: none;
        }

        /* WhatsApp button */
        .whatsapp-btn:hover { transform: scale(1.1) !important; }
      `}</style>

      <div className="home-layout">
        <HomeTopBar
          userProfile={userProfile}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onNotificationClick={handleNotificationClick}
          onFavoriteClick={handleFavoriteClick}
        />

        <div className="home-content-wrapper">
          {/* Main scrollable content */}
          <div
            className={`home-main ${searchResults !== null ? 'content-blurred' : ''}`}
            style={{ transition: 'filter 0.2s' }}
          >
            {error && (
              <div style={{
                padding: '16px 20px', marginBottom: '20px',
                backgroundColor: '#FEF2F2', color: '#991B1B',
                borderRadius: '12px', border: '1px solid #FECDD3',
                fontSize: '14px', fontWeight: 500,
              }}>
                ⚠️ {error}
              </div>
            )}

            {!error && userProfile?.subLocation && (
              <>
                {/* ── Desktop: 50/50 hero + offers row ── */}
                <style>{`
                  @media(min-width:1024px){
                    .desktop-only { display: block !important; }
                    .hero-offers-row { display: flex !important; }
                    .mobile-offers { display: none !important; }
                    .stats-strip { display: grid !important; }
                  }
                `}</style>

                {/* Stats strip — desktop only */}
                <div className="stats-strip">
                  <StatsStrip />
                </div>

                {/* 50/50 row — hidden on mobile, shown on desktop */}
                <div
                  className="hero-offers-row"
                  style={{
                    display: 'none',
                    gap: '20px',
                    marginBottom: '28px',
                    alignItems: 'stretch',
                  }}
                >
                  {/* Left 50%: greeting hero */}
                  <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #DC0C25 0%, #C50020 100%)',
                    borderRadius: '20px',
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '200px',
                  }}>
                    {/* Background emoji watermark */}
                    <div style={{
                      position: 'absolute', right: '-8px', bottom: '-12px',
                      fontSize: '110px', opacity: 0.12, lineHeight: 1,
                      userSelect: 'none', pointerEvents: 'none',
                    }}>🍔</div>

                    <p style={{
                      fontSize: '13px', color: 'rgba(255,255,255,0.75)',
                      margin: '0 0 8px', fontWeight: 600,
                      letterSpacing: '0.3px',
                    }}>
                      Good {getTimeOfDay()}, {userProfile.subLocation} 👋
                    </p>
                    <h1 style={{
                      fontSize: '26px', fontWeight: 900, color: 'white',
                      margin: '0 0 20px', lineHeight: 1.25, letterSpacing: '-0.4px',
                    }}>
                      What are you craving today?
                    </h1>

                    {/* Quick stat pills */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[['🚀', '30–40 min'], ['🍽️', '50+ outlets'], ['🎁', 'Safe delivery']].map(([icon, label]) => (
                        <div key={label} style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          backgroundColor: 'rgba(255,255,255,0.18)',
                          borderRadius: '8px', padding: '5px 10px',
                          fontSize: '12px', fontWeight: 600, color: 'white',
                        }}>
                          <span>{icon}</span>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right 50%: offer slider */}
                  {offers.length > 0 && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <OfferSlider offers={offers} />
                    </div>
                  )}
                </div>

                {/* Mobile-only offers */}
                {offers.length > 0 && (
                  <div className="mobile-offers" style={{ marginBottom: '20px' }}>
                    <SectionHeader title="Announcements" />
                    <OfferSlider offers={offers} />
                  </div>
                )}

                {/* Categories */}
                <div className="section-divider" style={{ marginBottom: '24px' }}>
                  <SectionHeader title="Browse Categories" />
                  <CategorySection onCategoryClick={handleCategoryClick} />
                </div>

                {/* Restaurants & Shops grid */}
                <div>
                  <SectionHeader
                    title="Restaurants & Shops"
                    count={combinedRestaurants.length || null}
                  />
                  {combinedRestaurants.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '60px 20px',
                      backgroundColor: 'white', borderRadius: '20px',
                      border: '1px solid #F1F5F9',
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏗️</div>
                      <p style={{ color: '#6B7280', fontSize: '16px', margin: 0 }}>
                        No outlets found delivering to your location.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="restaurant-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      {combinedRestaurants.map((res) => (
                        <RestaurantCardWithStatus
                          key={res.id}
                          restaurant={res}
                          onClick={() => handleItemClick(res)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Search overlay */}
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

        {/* WhatsApp helpline button */}
        <a
          href="https://wa.me/8801603738865"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-btn"
          style={{
            position: 'fixed', bottom: '88px', right: '20px',
            width: '52px', height: '52px',
            backgroundColor: '#25D366', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37,211,102,0.4)',
            zIndex: 1000, transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.045c0 2.12.554 4.188 1.597 6.011L0 24l6.135-1.61a11.77 11.77 0 005.911 1.586h.005c6.635 0 12.048-5.414 12.052-12.049a11.762 11.762 0 00-3.418-8.52z"/>
          </svg>
        </a>

        {/* App Download Dialog */}
        {showAppDialog && (
          <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '20px',
          }}>
            <div style={{
              backgroundColor: 'white', borderRadius: '20px',
              padding: '32px 28px 24px', width: '100%', maxWidth: '360px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              position: 'relative', textAlign: 'center',
            }}>
              <button
                onClick={handleCloseDialog}
                style={{
                  position: 'absolute', top: '14px', right: '14px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#F3F4F6', border: 'none', cursor: 'pointer',
                  fontSize: '14px', color: '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>

              <div style={{
                width: '68px', height: '68px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #DC0C25, #FF4057)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px', fontSize: '34px',
              }}>🍔</div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
                Get the Foodish App!
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px', lineHeight: 1.6 }}>
                For a faster and smoother experience, download our Android app.
              </p>

              <a
                href="https://play.google.com/store/apps/details?id=com.yumzy.userapp"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', backgroundColor: '#111827', color: 'white',
                  borderRadius: '12px', padding: '13px 20px',
                  textDecoration: 'none', fontWeight: 700, fontSize: '15px',
                  marginBottom: '12px', transition: 'background 0.15s',
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <path d="M3.18 23.76a2 2 0 001.94-.21l11.34-6.55-2.9-2.9-10.38 9.66zM.54 1.1A2 2 0 000 2.54v18.92a2 2 0 00.54 1.44l.08.07 10.59-10.59v-.25L.62 1.03l-.08.07zM20.3 10.4l-2.88-1.66-3.24 3.24 3.24 3.24 2.9-1.68a2.02 2.02 0 000-3.14zM5.12.45L16.46 7 13.56 9.9 3.18.45A2 2 0 005.12.45z"/>
                </svg>
                Download on Google Play
              </a>

              <button
                onClick={handleCloseDialog}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9CA3AF', fontSize: '13px', fontWeight: 500,
                }}
              >
                Continue on Web
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// --- Utility ---
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
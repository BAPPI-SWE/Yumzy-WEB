// pages/home.js
//
// Home page. Same layout as the Android app:
//   Phone  : animated top bar -> offer cards -> categories -> banner slider -> restaurants
//   Desktop: header -> (animated hero card | banner slider) -> offer cards -> categories -> restaurants

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRouter } from 'next/router';
import { Squares2X2Icon, BuildingStorefrontIcon } from '@heroicons/react/24/solid';

import HomeTopBar from '../components/HomeTopBar';
import { HeroCard } from '../components/HeroSlides';
import OfferSlider from '../components/OfferSlider';
import CategorySection from '../components/CategorySection';
import PromoCardsRow, { loadPromoCards, promoCardHref } from '../components/PromoCardsRow';
import RestaurantCard, { RestaurantCardStyles } from '../components/RestaurantCard';
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

// Reads the optional "rating" and "deliveryTime" fields of a restaurant.
// A rating is shown only when a real number is saved in Firestore.
function readRatingAndTime(data) {
  return {
    rating: typeof data.rating === 'number' ? data.rating : null,
    deliveryTime: typeof data.deliveryTime === 'string' && data.deliveryTime.trim()
      ? data.deliveryTime.trim()
      : null,
  };
}

// --- Section Header (red icon + title, optional count on the right) ---
function SectionHeader({ title, count, Icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: '14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        {Icon && <Icon style={{ width: '22px', height: '22px', color: '#DC0C25', flexShrink: 0 }} />}
        <h2 className="fd-section-title">{title}</h2>
      </div>
      {count != null && (
        <span style={{ fontSize: '13px', color: '#6B6B70', fontWeight: 500, flexShrink: 0 }}>
          {count} places
        </span>
      )}
    </div>
  );
}

// ─── Main Page Content ───────────────────────────────────────────
function HomePageContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [promoCards, setPromoCards] = useState([]);
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

  // --- Offer cards (same for every location, so they load on their own) ---
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    loadPromoCards().then((cards) => {
      if (!cancelled) setPromoCards(cards);
    });
    return () => { cancelled = true; };
  }, [user]);

  // --- Fetch Data ---
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

        // Banners switched off in the admin app are skipped. Older banners have no
        // "active" field and keep showing. Lower priority number shows first.
        const fetchedOffers = offersSnap.docs
          .map((doc) => ({
            imageUrl: doc.data().imageUrl || '',
            availableLocations: doc.data().availableLocations || [],
            priority: typeof doc.data().priority === 'number' ? doc.data().priority : 0,
            active: doc.data().active !== false,
          }))
          .filter((offer) => offer.active && offer.imageUrl)
          .sort((a, b) => a.priority - b.priority);
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
          ...readRatingAndTime(doc.data()),
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
          ...readRatingAndTime(doc.data()),
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

  const handlePromoCardClick = (card) => router.push(promoCardHref(card));
  const handleSeeAllOffers = () => router.push('/offers');

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

  const isSearching = searchResults !== null;
  const showContent = !error && userProfile?.subLocation;

  // ─── RENDER ─────────────────────────────────────────────────────
  return (
    <>
      <RestaurantCardStyles />
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background-color: #FFFFFF; }

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

        /* Phone */
        .home-main { padding: 14px 16px 80px; max-width: 100%; }
        .home-section { margin-bottom: 20px; }
        .fd-section-title {
          font-size: 19px; font-weight: 800; color: #1C1C1E;
          margin: 0; letter-spacing: -0.3px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        /* minmax(0, 1fr) lets a card shrink, so a long name is cut with "..." instead of widening the page */
        .restaurant-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
        .hero-offers-row { display: none; }
        .mobile-offers { display: block; }

        /* Small tablets: two cards per row */
        @media (min-width: 640px) {
          .restaurant-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        /* Desktop */
        @media (min-width: 1024px) {
          body { background-color: #F8FAFC; }
          .home-main { max-width: 1280px; margin: 0 auto; padding: 28px 40px 60px; }
          .home-section { margin-bottom: 32px; }
          .fd-section-title { font-size: 22px; }
          .restaurant-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
          .hero-offers-row { display: flex; gap: 20px; align-items: stretch; }
          .hero-offers-row > * { flex: 1; min-width: 0; }
          /* the hero card gets the same 11:5 shape as the banner beside it */
          .hero-card-frame { aspect-ratio: 11 / 5; }
          .mobile-offers { display: none; }
        }
        @media (min-width: 1440px) {
          .home-main { max-width: 1440px; padding: 32px 64px 80px; }
        }

        /* Soft blur behind the search results */
        .content-blurred { filter: blur(4px); pointer-events: none; }

        .whatsapp-btn:hover { transform: scale(1.1) !important; }
      `}</style>

      <div className="home-layout">
        <HomeTopBar
          userProfile={userProfile}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onNotificationClick={handleNotificationClick}
          onFavoriteClick={handleFavoriteClick}
          onCategoryClick={handleCategoryClick}
          hideBanner={isSearching}
        />

        <div className="home-content-wrapper">
          <div
            className={`home-main ${isSearching ? 'content-blurred' : ''}`}
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

            {showContent && (
              <>
                {/* Desktop only: animated hero card beside the banner slider */}
                <div className="hero-offers-row home-section">
                  <div className="hero-card-frame">
                    <HeroCard onCategoryClick={handleCategoryClick} />
                  </div>
                  {offers.length > 0 && (
                    <div>
                      <OfferSlider offers={offers} />
                    </div>
                  )}
                </div>

                {/* 1) Offer cards row (created in the admin app) */}
                {promoCards.length > 0 && (
                  <div className="home-section">
                    <PromoCardsRow
                      cards={promoCards}
                      onCardClick={handlePromoCardClick}
                      onSeeAllClick={handleSeeAllOffers}
                    />
                  </div>
                )}

                {/* 2) Categories */}
                <div className="home-section">
                  <SectionHeader title="Categories" Icon={Squares2X2Icon} />
                  <CategorySection onCategoryClick={handleCategoryClick} />
                </div>

                {/* 3) Banner slider (phones; on desktop it sits beside the hero card) */}
                {offers.length > 0 && (
                  <div className="mobile-offers home-section">
                    <OfferSlider offers={offers} />
                  </div>
                )}

                {/* 4) Restaurants */}
                <div>
                  <SectionHeader
                    title="Restaurants"
                    Icon={BuildingStorefrontIcon}
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
                    <div className="restaurant-grid">
                      {combinedRestaurants.map((res) => (
                        <RestaurantCard
                          key={`${res.type}-${res.id}`}
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
              // The results list does not always pass the id, so fall back to the name.
              const item = combinedRestaurants.find((r) => r.id === id)
                || combinedRestaurants.find((r) => r.name === name);
              if (item) handleItemClick(item);
            }}
            onSubCategoryClick={handleSubCategorySearchClick}
            onMiniRestaurantClick={handleMiniRestaurantSearchClick}
          />
        </div>

        {/* WhatsApp helpline button */}
        <a
          href="https://wa.me/8801746324620"
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

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}

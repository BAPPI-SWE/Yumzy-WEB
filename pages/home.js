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

// --- Closed/Open Overlay Wrapper ---
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
          position: 'absolute',
          top: 0,
          right: 0,
          backgroundColor: '#4CAF50',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '0 16px 0 10px',
          letterSpacing: '0.5px',
          zIndex: 2,
        }}>
          OPEN
        </div>
      )}

      {isClosed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.60)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            cursor: 'not-allowed',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#DC0C25',
            color: '#fff',
            borderRadius: '12px',
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '1px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            CLOSED
          </div>
        </div>
      )}
    </div>
  );
}

// --- Eid ul Azha Banner Dialog ---
function EidBannerDialog({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px',
    }}>
      <style>{`
        @keyframes eidFadeInScale {
          from { opacity: 0; transform: scale(0.88); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes eidFloatStar {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-7px) rotate(15deg); opacity: 1; }
        }
        @keyframes eidCrescentGlow {
          0%, 100% { filter: drop-shadow(0 0 5px #f5c842); }
          50% { filter: drop-shadow(0 0 14px #f5c842); }
        }
        @keyframes eidShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .eid-dialog-card {
          animation: eidFadeInScale 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .eid-star-1 { animation: eidFloatStar 3.1s ease-in-out infinite; }
        .eid-star-2 { animation: eidFloatStar 2.4s ease-in-out infinite 0.5s; }
        .eid-star-3 { animation: eidFloatStar 3.8s ease-in-out infinite 1s; }
        .eid-star-4 { animation: eidFloatStar 2.9s ease-in-out infinite 1.5s; }
        .eid-star-5 { animation: eidFloatStar 4.1s ease-in-out infinite 0.8s; }
        .eid-crescent { animation: eidCrescentGlow 2.5s ease-in-out infinite; }
        .eid-close-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .eid-cta-btn:hover { opacity: 0.9; transform: scale(1.01); }
        .eid-cta-btn:active { transform: scale(0.98); }
      `}</style>

      <div
        className="eid-dialog-card"
        style={{
          background: 'linear-gradient(160deg, #1a3a2a 0%, #0f2419 45%, #1c2e10 100%)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '360px',
          overflow: 'hidden',
          border: '1.5px solid rgba(245,200,66,0.35)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.55)',
          position: 'relative',
        }}
      >
        {/* Top gold band */}
        <div style={{
          background: 'linear-gradient(90deg, #8B6508, #f5c842, #d4920e, #f5c842, #8B6508)',
          height: '5px',
          width: '100%',
        }} />

        {/* Floating decorative stars */}
        <span className="eid-star-1" style={{ position: 'absolute', top: '18px', left: '22px', fontSize: '13px', color: '#f5c842', userSelect: 'none' }}>✦</span>
        <span className="eid-star-2" style={{ position: 'absolute', top: '30px', right: '30px', fontSize: '10px', color: '#f5c842', userSelect: 'none' }}>✦</span>
        <span className="eid-star-3" style={{ position: 'absolute', top: '14px', left: '48%', fontSize: '8px', color: '#f5c842', userSelect: 'none' }}>★</span>
        <span className="eid-star-4" style={{ position: 'absolute', top: '62px', right: '18px', fontSize: '7px', color: '#c8a43a', userSelect: 'none' }}>✦</span>
        <span className="eid-star-5" style={{ position: 'absolute', top: '56px', left: '16px', fontSize: '6px', color: '#c8a43a', userSelect: 'none' }}>★</span>

        {/* Close button */}
        <button
          onClick={onClose}
          className="eid-close-btn"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'rgba(255,255,255,0.08)',
            border: '0.5px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            color: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
            lineHeight: 1,
            transition: 'background 0.2s',
          }}
        >
          ✕
        </button>

        {/* Crescent + Star */}
        <div style={{ textAlign: 'center', paddingTop: '32px', paddingBottom: '4px' }}>
          <svg
            className="eid-crescent"
            viewBox="0 0 80 80"
            width="74"
            height="74"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="38" cy="40" r="24" fill="#f5c842" />
            <circle cx="48" cy="33" r="19" fill="#1a3a2a" />
            <polygon
              points="66,22 68.5,29 76,29 70,33.5 72.5,40.5 66,36 59.5,40.5 62,33.5 56,29 63.5,29"
              fill="#f5c842"
            />
          </svg>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', padding: '4px 20px 0' }}>
          <p style={{
            fontSize: '11px',
            letterSpacing: '3px',
            color: '#c8a43a',
            margin: '0 0 6px',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            Foodish পরিবারের পক্ষ থেকে
          </p>

          <h2 style={{
            fontSize: '32px',
            fontWeight: 800,
            margin: 0,
            color: '#f5c842',
            letterSpacing: '1px',
            lineHeight: 1.1,
            textShadow: '0 2px 12px rgba(245,200,66,0.3)',
          }}>
            ঈদ মুবারক
          </h2>

          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.45)',
            margin: '5px 0 0',
            letterSpacing: '1.5px',
            fontStyle: 'italic',
          }}>
            ঈদুল আযহা ২০২৬
          </p>
        </div>

        {/* Gold divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 24px 14px' }}>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(245,200,66,0.3)' }} />
          <span style={{ color: '#f5c842', fontSize: '13px' }}>✦</span>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(245,200,66,0.3)' }} />
        </div>

        {/* Notice box */}
        <div style={{
          margin: '0 18px',
          background: 'rgba(0,0,0,0.28)',
          border: '1px solid rgba(245,200,66,0.2)',
          borderRadius: '16px',
          padding: '18px 16px',
          textAlign: 'center',
        }}>
          {/* Notice label */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(245,200,66,0.12)',
            border: '0.5px solid rgba(245,200,66,0.3)',
            borderRadius: '20px',
            padding: '4px 12px',
            marginBottom: '12px',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#f5c842" strokeWidth="1.5"/>
              <path d="M12 7v5l3 3" stroke="#f5c842" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#f5c842',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              বিজ্ঞপ্তি
            </span>
          </div>

          <p style={{
            fontSize: '13.5px',
            color: 'rgba(255,255,255,0.82)',
            margin: '0 0 14px',
            lineHeight: 1.75,
          }}>
            ঈদুল আযহা উপলক্ষে আমাদের ডেলিভারি কার্যক্রম সাময়িকভাবে বন্ধ থাকবে।
          </p>

          {/* Date cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{
              background: 'rgba(220,20,20,0.16)',
              border: '0.5px solid rgba(220,80,80,0.28)',
              borderRadius: '12px',
              padding: '12px 8px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,160,160,0.75)', margin: '0 0 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                বন্ধ থাকবে
              </p>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#ff9090', margin: 0, lineHeight: 1 }}>
                ২৪ মে
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,160,160,0.65)', margin: '4px 0 0' }}>
                থেকে ২ জুন পর্যন্ত
              </p>
            </div>

            <div style={{
              background: 'rgba(20,180,100,0.16)',
              border: '0.5px solid rgba(80,200,120,0.28)',
              borderRadius: '12px',
              padding: '12px 8px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '10px', color: 'rgba(100,225,155,0.75)', margin: '0 0 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                আবার চলবে
              </p>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#6de8aa', margin: 0, lineHeight: 1 }}>
                ৩ জুন
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(100,225,155,0.65)', margin: '4px 0 0' }}>
                থেকে স্বাভাবিক
              </p>
            </div>
          </div>
        </div>

        {/* Dua text */}
        <div style={{ textAlign: 'center', padding: '16px 24px 6px' }}>
          <p style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.55)',
            margin: 0,
            lineHeight: 1.8,
            fontStyle: 'italic',
          }}>
            "আপনার ও আপনার পরিবারের জন্য<br />
             দোয়া রইলো।"
          </p>
        </div>

        {/* Bottom divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px 12px' }}>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(245,200,66,0.2)' }} />
          <span style={{ color: 'rgba(245,200,66,0.45)', fontSize: '10px' }}>✦</span>
          <div style={{ flex: 1, height: '0.5px', background: 'rgba(245,200,66,0.2)' }} />
        </div>

        {/* CTA Button */}
        <div style={{ padding: '0 18px 20px' }}>
          <button
            onClick={onClose}
            className="eid-cta-btn"
            style={{
              width: '100%',
              padding: '13px',
              background: 'linear-gradient(90deg, #8B6508, #f5c842, #d4920e, #f5c842, #8B6508)',
              border: 'none',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 800,
              color: '#1a2e10',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              transition: 'opacity 0.2s, transform 0.15s',
            }}
          >
            ঈদ মুবারক 🌙
          </button>
        </div>

        {/* Bottom gold band */}
        <div style={{
          background: 'linear-gradient(90deg, #8B6508, #f5c842, #d4920e, #f5c842, #8B6508)',
          height: '4px',
          width: '100%',
        }} />
      </div>
    </div>
  );
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
  const [showEidDialog, setShowEidDialog] = useState(() => {
    return sessionStorage.getItem('eidDialogDismissed') !== 'true';
  });

  const handleCloseEidDialog = () => {
    sessionStorage.setItem('eidDialogDismissed', 'true');
    setShowEidDialog(false);
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
      if (item.open !== 'yes') return;
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
                    <RestaurantCardWithStatus
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

      {/* --- Eid ul Azha Banner Dialog --- */}
      {showEidDialog && (
        <EidBannerDialog onClose={handleCloseEidDialog} />
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
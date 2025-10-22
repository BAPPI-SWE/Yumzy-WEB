import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../../firebase/config'; // Adjust path
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import ProtectedRoute from '../../../components/ProtectedRoute'; // Adjust path
import LoadingSpinner from '../../../components/LoadingSpinner'; // Adjust path
import { ArrowLeftIcon, ChevronRightIcon, BuildingStorefrontIcon, TagIcon, LockClosedIcon, CheckCircleIcon, SpeakerWaveIcon, NoSymbolIcon } from '@heroicons/react/24/solid'; // Solid icons
import { useAuth } from '../../../context/AuthContext'; // Adjust path

// --- Reusable Components (from SubCategoryListScreen.kt) ---

// Announcement Card (Slightly adjusted style)
const AnnouncementCard = ({ announcement }) => {
    return (
        <div className="bg-gradient-to-r from-deepPink/80 to-brandPink/80 text-white rounded-lg shadow-md p-3 flex items-center space-x-3 animate-pulse">
             <SpeakerWaveIcon className="w-6 h-6 flex-shrink-0" />
             <p className="text-sm font-medium">{announcement.text}</p>
        </div>
    );
};

// SubCategory Card (Slightly adjusted style)
const SubCategoryCard = ({ subCategory, itemCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center bg-white p-3 rounded-xl shadow transition hover:shadow-md hover:bg-gray-50"
    >
       <img
            src={subCategory.imageUrl || '/placeholder-image.png'}
            alt={subCategory.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-softPink flex-shrink-0"
        />
      <div className="flex-1 mx-3 text-left">
        <h3 className="font-bold text-gray-800">{subCategory.name}</h3>
        <p className="text-xs text-gray-500">{itemCount} items</p>
      </div>
      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </button>
  );
};

// Mini Restaurant Card (Slightly adjusted style, indicating open/closed)
const MiniRestaurantCard = ({ restaurant, onClick }) => {
  const isClosed = restaurant.open === 'no';
  return (
    <button
      onClick={onClick}
      disabled={isClosed}
      className={`w-full flex items-center bg-white p-3 rounded-xl shadow transition hover:shadow-md ${isClosed ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
    >
       <img
            src={restaurant.imageUrl || '/placeholder-image.png'}
            alt={restaurant.name}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0" // Changed to rounded-lg
        />
      <div className="flex-1 mx-3 text-left">
        <h3 className="font-bold text-gray-800">{restaurant.name}</h3>
         <div className={`mt-1 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${isClosed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {isClosed ? <LockClosedIcon className="w-3 h-3 mr-1"/> : <CheckCircleIcon className="w-3 h-3 mr-1"/>}
            {isClosed ? 'Closed' : 'Open'}
         </div>
      </div>
      {!isClosed && <ChevronRightIcon className="w-5 h-5 text-gray-400" />}
      {isClosed && <NoSymbolIcon className="w-5 h-5 text-red-400" />}
    </button>
  );
};

// --- Main Page Component ---
export default function SubCategoryListPage() {
  const router = useRouter();
  const { user } = useAuth(); // Needed to get user location
  const { categoryId, categoryName: encodedName } = router.query;
  const categoryName = encodedName ? decodeURIComponent(encodedName) : 'Category';

  const [subCategories, setSubCategories] = useState([]); // SubCategory[]
  const [miniRestaurants, setMiniRestaurants] = useState([]); // MiniRestaurant[]
  const [itemCounts, setItemCounts] = useState({}); // { [subCategoryName]: count }
  const [announcements, setAnnouncements] = useState([]); // Announcement[]
  const [isLoading, setIsLoading] = useState(true);
  const [userSubLocation, setUserSubLocation] = useState(null);
  const [error, setError] = useState('');
  const [selectedTabIndex, setSelectedTabIndex] = useState(0); // 0 Categories, 1 Shops

  // --- Fetch Data ---
  useEffect(() => {
    if (!categoryId || !user) return; // Wait for ID and user

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setSubCategories([]);
      setMiniRestaurants([]);
      setItemCounts({});
      setAnnouncements([]);

      let location = userSubLocation;

      // Fetch location if not already fetched
      if (!location) {
         try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                location = userDocSnap.data()?.subLocation;
                setUserSubLocation(location);
            } else {
                 setError("User profile not found.");
                 setIsLoading(false);
                 return;
            }
         } catch (err) {
             console.error("Error fetching user location:", err);
             setError("Could not verify your location.");
             setIsLoading(false);
             return;
         }
      }

      if (!location) {
          setError("Please set your delivery location in profile.");
          setIsLoading(false);
          return;
      }

      try {
        // Fetch Announcements
        const announceQuery = query(
          collection(db, 'announce'),
          where('parentCategory', '==', categoryId),
          where('availableLocations', 'array-contains', location)
        );
        const announceSnap = await getDocs(announceQuery);
        setAnnouncements(announceSnap.docs.map(d => ({ id: d.id, text: d.data().text || '' })));

        // Fetch SubCategories
        const subCatQuery = query(
          collection(db, 'store_sub_categories'),
          where('parentCategory', '==', categoryId),
          where('availableLocations', 'array-contains', location)
        );
        const subCatSnap = await getDocs(subCatQuery);
        const fetchedSubCats = subCatSnap.docs.map(d => ({
            id: d.id,
            name: d.data().name || '',
            imageUrl: d.data().imageUrl || '',
        }));
        setSubCategories(fetchedSubCats);

        // Fetch Item Counts for SubCategories
        if (fetchedSubCats.length > 0) {
          const subCatNames = fetchedSubCats.map(sc => sc.name);
          const itemsQuery = query(collection(db, 'store_items'), where('subCategory', 'in', subCatNames));
          const itemsSnap = await getDocs(itemsQuery);
          const counts = {};
          itemsSnap.docs.forEach(itemDoc => {
            const subCat = itemDoc.data().subCategory;
            if (subCat) {
              counts[subCat] = (counts[subCat] || 0) + 1;
            }
          });
          setItemCounts(counts);
        }

        // Fetch MiniRestaurants
        const miniResQuery = query(
          collection(db, 'mini_restaurants'),
          where('parentCategory', '==', categoryId),
          where('availableLocations', 'array-contains', location)
        );
        const miniResSnap = await getDocs(miniResQuery);
        setMiniRestaurants(miniResSnap.docs.map(d => ({
            id: d.id,
            name: d.data().name || '',
            imageUrl: d.data().imageUrl || '',
            open: d.data().open || 'no',
        })));

      } catch (err) {
        console.error("Error fetching store data:", err);
        setError("Failed to load store information.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryId, user, userSubLocation]); // Re-run if categoryId or user changes

  // --- Navigation Handlers ---
  const handleSubCategoryClick = (subCategoryName) => {
    const encodedSubCat = encodeURIComponent(subCategoryName);
    const encodedTitle = encodeURIComponent(subCategoryName); // Title is the subCategory name
    router.push(`/items/subCategory/${encodedSubCat}?title=${encodedTitle}`);
  };

  const handleMiniRestaurantClick = (miniResId, miniResName) => {
    const encodedTitle = encodeURIComponent(miniResName);
     router.push(`/items/miniRes/${miniResId}?title=${encodedTitle}`);
  };

  // --- Render Loading/Error/Content ---
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Top Bar */}
         <div className="sticky top-0 z-30 bg-white shadow-sm p-3 flex items-center space-x-2">
            <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-100">
                <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 truncate flex-1">{categoryName}</h1>
        </div>

        {/* Loading State */}
        {isLoading && (
             <div className="flex-1 flex justify-center items-center">
                <LoadingSpinner />
             </div>
        )}

        {/* Error State */}
         {!isLoading && error && (
             <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
                 <NoSymbolIcon className="w-12 h-12 text-red-400 mb-3"/>
                <p className="text-red-600">{error}</p>
             </div>
         )}

        {/* Content */}
        {!isLoading && !error && (
            <>
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setSelectedTabIndex(0)}
                            className={`flex-1 py-3 text-center text-sm font-medium border-b-2 ${
                            selectedTabIndex === 0
                                ? 'border-deepPink text-deepPink font-bold'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Categories
                        </button>
                        <button
                            onClick={() => setSelectedTabIndex(1)}
                            className={`flex-1 py-3 text-center text-sm font-medium border-b-2 ${
                            selectedTabIndex === 1
                                ? 'border-deepPink text-deepPink font-bold'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Shops
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {/* Announcements */}
                    {announcements.map(a => <AnnouncementCard key={a.id} announcement={a} />)}

                    {/* Categories List */}
                    {selectedTabIndex === 0 && (
                        subCategories.length > 0 ? (
                            subCategories.map(subCat => (
                            <SubCategoryCard
                                key={subCat.id}
                                subCategory={subCat}
                                itemCount={itemCounts[subCat.name] || 0}
                                onClick={() => handleSubCategoryClick(subCat.name)}
                            />
                            ))
                         ) : (
                            <p className="text-gray-600 text-center py-10">No categories found in this section for your location.</p>
                         )
                    )}

                    {/* Shops List */}
                    {selectedTabIndex === 1 && (
                         miniRestaurants.length > 0 ? (
                            miniRestaurants.map(res => (
                            <MiniRestaurantCard
                                key={res.id}
                                restaurant={res}
                                onClick={() => handleMiniRestaurantClick(res.id, res.name)}
                            />
                            ))
                         ) : (
                             <p className="text-gray-600 text-center py-10">No shops found in this section for your location.</p>
                         )
                    )}
                </div>
            </>
        )}
      </div>
    </ProtectedRoute>
  );
}
import { useState } from 'react';
import { MapPinIcon, BellIcon, HeartIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Outline icons

// Search Bar Component (similar to ModernSearchBar in HomeScreen.kt)
const SearchBar = ({ query, onQueryChange, onFocusChange }) => {
  const handleClear = () => {
    onQueryChange('');
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
      </div>
      <input
        type="text"
        placeholder="Search Restaurants or Foods..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)} // Optional: handle blur if needed
        className="w-full h-[44px] pl-11 pr-10 py-2 text-sm bg-white rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brandPink focus:border-transparent shadow-sm"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
        </button>
      )}
    </div>
  );
};


// Main Top Bar Component
export default function HomeTopBar({
  userProfile,
  searchQuery,
  onSearchQueryChange,
  onNotificationClick, // Add this prop
  onFavoriteClick      // Add this prop
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    // Gradient background container with rounded bottom corners
    <div className="sticky top-0 z-40 bg-gradient-to-b from-brandPink to-darkPink text-white rounded-b-[20px] shadow-md">
      <div className="px-4 pt-4 pb-3 space-y-3"> {/* Use space-y for spacing */}
        {/* Location and Icons Row (conditionally rendered or styled based on focus/scroll later) */}
        <div className="flex justify-between items-center h-10"> {/* Fixed height */}
          <div className="flex items-center min-w-0"> {/* Allow shrinking */}
            <MapPinIcon className="w-5 h-5 mr-1.5 flex-shrink-0" />
            <div className="flex flex-col min-w-0"> {/* Allow shrinking */}
              <span className="text-sm font-semibold truncate">
                {userProfile?.baseLocation || '...'}
              </span>
              {userProfile?.subLocation && (
                <span className="text-xs text-white/90 truncate">
                  {userProfile.subLocation}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={onFavoriteClick} className="p-2 hover:bg-white/10 rounded-full">
                <HeartIcon className="w-5 h-5" />
            </button>
            <button onClick={onNotificationClick} className="p-2 hover:bg-white/10 rounded-full">
              <BellIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            onFocusChange={setIsSearchFocused}
        />
      </div>
    </div>
  );
}
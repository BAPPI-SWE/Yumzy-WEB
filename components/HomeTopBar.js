import { useState } from 'react';
import { MapPinIcon, BellIcon, HeartIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Search Bar Component
const SearchBar = ({ query, onQueryChange, onFocusChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onQueryChange('');
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange(false);
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%',
      maxWidth: '100%' // Added constraint
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        paddingLeft: '16px',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        <MagnifyingGlassIcon style={{ height: '20px', width: '20px', color: '#6B7280' }} />
      </div>
      <input
        type="text"
        placeholder="Search Restaurants or Foods..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width: '100%',
          maxWidth: '100%', // Added constraint
          height: '44px',
          paddingLeft: '44px',
          paddingRight: query ? '40px' : '16px',
          paddingTop: '8px',
          paddingBottom: '8px',
          fontSize: '14px',
          backgroundColor: 'white',
          borderRadius: '9999px',
          border: isFocused ? '2px solid #DC0C25' : '1px solid #E5E7EB',
          outline: 'none',
          boxShadow: isFocused ? '0 0 0 3px rgba(220, 12, 37, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          transition: 'all 0.2s',
          boxSizing: 'border-box' // Added to include padding in width calculation
        }}
      />
      {query && (
        <button
          onClick={handleClear}
          style={{
            position: 'absolute',
            top: '50%',
            right: '12px',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            zIndex: 2
          }}
        >
          <XMarkIcon style={{ height: '20px', width: '20px', color: '#6B7280' }} />
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
  onNotificationClick,
  onFavoriteClick
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'linear-gradient(to bottom, #DC0C25, #B70314)',
      color: 'white',
      borderBottomLeftRadius: '20px',
      borderBottomRightRadius: '20px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      width: '100%',
      maxWidth: '100%', // Added constraint
      boxSizing: 'border-box' // Added
    }}>
      <div style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '16px',
        paddingBottom: '12px',
        width: '100%',
        maxWidth: '100%', // Added constraint
        boxSizing: 'border-box' // Added
      }}>
        {/* Location and Icons Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '40px',
          marginBottom: '12px',
          width: '100%',
          maxWidth: '100%', // Added constraint
          gap: '8px' // Added gap for better spacing
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
            flex: 1,
            overflow: 'hidden' // Added to prevent overflow
          }}>
            <MapPinIcon style={{
              width: '20px',
              height: '20px',
              marginRight: '6px',
              flexShrink: 0
            }} />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              flex: 1,
              overflow: 'hidden' // Added
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {userProfile?.baseLocation || '...'}
              </span>
              {userProfile?.subLocation && (
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {userProfile.subLocation}
                </span>
              )}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0 // Prevent icons from shrinking
          }}>
            <button
              onClick={onFavoriteClick}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <HeartIcon style={{ width: '20px', height: '20px', color: 'white' }} />
            </button>
            <button
              onClick={onNotificationClick}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <BellIcon style={{ width: '24px', height: '24px', color: 'white' }} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{
          width: '100%',
          maxWidth: '100%', // Added constraint
          boxSizing: 'border-box' // Added
        }}>
          <SearchBar
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            onFocusChange={setIsSearchFocused}
          />
        </div>
      </div>
    </div>
  );
}
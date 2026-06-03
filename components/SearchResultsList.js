import { useState } from 'react';
import { BuildingStorefrontIcon, TagIcon, NoSymbolIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchResultCard = ({ type, data, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  let title = '', subtitle = '', imageUrl = null, isOpen = true;
  let accentColor = '#DC0C25';

  switch (type) {
    case 'restaurant':
      title = data.name;
      subtitle = data.cuisine;
      imageUrl = data.imageUrl;
      accentColor = data.type === 'MINI' ? '#1D4ED8' : '#DC0C25';
      break;
    case 'subCategory':
      title = data.name;
      subtitle = `${data.itemCount} items available`;
      imageUrl = data.imageUrl;
      accentColor = '#7C3AED';
      break;
    case 'miniRestaurant':
      title = data.name;
      subtitle = 'Mini Shop';
      imageUrl = data.imageUrl;
      accentColor = '#1D4ED8';
      isOpen = data.open === 'yes';
      break;
  }

  return (
    <button
      onClick={onClick}
      disabled={!isOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        gap: '14px',
        textAlign: 'left',
        backgroundColor: isHovered && isOpen ? '#F8FAFC' : 'transparent',
        transition: 'background 0.15s',
        opacity: isOpen ? 1 : 0.55,
        cursor: isOpen ? 'pointer' : 'not-allowed',
        border: 'none',
        borderBottom: '1px solid #F1F5F9',
      }}
    >
      {/* Thumbnail */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          style={{
            width: '44px', height: '44px', borderRadius: '10px',
            objectFit: 'cover', flexShrink: 0, backgroundColor: '#F3F4F6',
          }}
        />
      ) : (
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          backgroundColor: accentColor + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {type === 'subCategory'
            ? <TagIcon style={{ width: '20px', height: '20px', color: accentColor }} />
            : <BuildingStorefrontIcon style={{ width: '20px', height: '20px', color: accentColor }} />
          }
        </div>
      )}

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, fontSize: '14px', color: '#1F2937', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <p style={{
            fontSize: '12px', color: '#6B7280', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {subtitle}
          </p>
          {!isOpen && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              fontSize: '11px', color: '#DC2626', fontWeight: 600,
              backgroundColor: '#FEF2F2', padding: '1px 6px', borderRadius: '4px',
              flexShrink: 0,
            }}>
              <NoSymbolIcon style={{ width: '10px', height: '10px' }} />
              Closed
            </span>
          )}
        </div>
      </div>

      {/* Type pill */}
      <div style={{
        fontSize: '11px', fontWeight: 600,
        color: accentColor,
        backgroundColor: accentColor + '15',
        padding: '3px 8px', borderRadius: '6px', flexShrink: 0,
      }}>
        {type === 'subCategory' ? 'Category' : data.type === 'MINI' ? 'Shop' : 'Restaurant'}
      </div>
    </button>
  );
};

export default function SearchResultsList({
  results, onRestaurantClick, onSubCategoryClick, onMiniRestaurantClick,
}) {
  if (results === null) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '110px', /* mobile header height */
      left: 0, right: 0, bottom: 0,
      backgroundColor: 'white',
      overflowY: 'auto',
      zIndex: 200,
      borderTop: '1px solid #F1F5F9',
    }}>
      {/* Desktop: constrain width to content area */}
      <style>{`
        @media (min-width: 1024px) {
          .search-results-inner {
            max-width: 800px;
            margin: 0 auto;
            padding: 8px 0 !important;
          }
        }
      `}</style>

      {results.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 20px', gap: '12px',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            backgroundColor: '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MagnifyingGlassIcon style={{ width: '28px', height: '28px', color: '#9CA3AF' }} />
          </div>
          <p style={{ color: '#6B7280', fontSize: '15px', margin: 0 }}>No results found</p>
          <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>Try a different search term</p>
        </div>
      ) : (
        <div className="search-results-inner" style={{ padding: '8px 0' }}>
          {/* Section header */}
          <p style={{
            fontSize: '11px', fontWeight: 700, color: '#9CA3AF',
            letterSpacing: '0.8px', textTransform: 'uppercase',
            padding: '8px 16px 4px',
          }}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((result, index) => (
            <SearchResultCard
              key={`${result.type}-${result.data.id || result.data.ownerId || index}`}
              type={result.type}
              data={result.data}
              onClick={() => {
                if (result.type === 'restaurant') {
                  onRestaurantClick(result.data.ownerId, result.data.name);
                } else if (result.type === 'subCategory') {
                  onSubCategoryClick(result.data.name);
                } else if (result.type === 'miniRestaurant') {
                  onMiniRestaurantClick(result.data.id, result.data.name, result.data.open === 'yes');
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
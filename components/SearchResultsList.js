import { useState } from 'react';
import { BuildingStorefrontIcon, TagIcon, NoSymbolIcon } from '@heroicons/react/24/solid';

// Simplified Card for displaying search results
const SearchResultCard = ({ type, data, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  let title = '';
  let subtitle = '';
  let imageUrl = null;
  let Icon = TagIcon;
  let isOpen = true;

  switch (type) {
    case 'restaurant':
      title = data.name;
      subtitle = data.cuisine;
      imageUrl = data.imageUrl;
      Icon = BuildingStorefrontIcon;
      break;
    case 'subCategory':
      title = data.name;
      subtitle = `${data.itemCount} items`;
      imageUrl = data.imageUrl;
      Icon = TagIcon;
      break;
    case 'miniRestaurant':
      title = data.name;
      subtitle = 'Shop';
      imageUrl = data.imageUrl;
      Icon = BuildingStorefrontIcon;
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
        padding: '12px',
        gap: '16px',
        textAlign: 'left',
        backgroundColor: isHovered && isOpen ? '#F3F4F6' : 'transparent',
        transition: 'background-color 0.2s',
        borderBottom: '1px solid #F3F4F6',
        borderRadius: '8px',
        opacity: !isOpen ? 0.6 : 1,
        cursor: isOpen ? 'pointer' : 'not-allowed',
        border: 'none'
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            objectFit: 'cover',
            flexShrink: 0,
            backgroundColor: '#E5E7EB'
          }}
        />
      ) : (
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          backgroundColor: '#E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon style={{ width: '24px', height: '24px', color: '#9CA3AF' }} />
        </div>
      )}
      <div style={{
        flex: 1,
        minWidth: 0
      }}>
        <p style={{
          fontWeight: 600,
          color: '#1F2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {title}
        </p>
        <p style={{
          fontSize: '12px',
          color: '#6B7280',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {subtitle}
        </p>
        {!isOpen && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            color: '#EF4444',
            fontWeight: 500,
            marginTop: '2px'
          }}>
            <NoSymbolIcon style={{ width: '12px', height: '12px', marginRight: '4px' }} />
            <span>Closed</span>
          </div>
        )}
      </div>
    </button>
  );
};

export default function SearchResultsList({
  results,
  onRestaurantClick,
  onSubCategoryClick,
  onMiniRestaurantClick,
}) {
  if (results === null) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '110px',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      overflowY: 'auto',
      zIndex: 30
    }}>
      <div style={{
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {results.length === 0 ? (
          <p style={{
            color: '#6B7280',
            textAlign: 'center',
            paddingTop: '40px',
            paddingBottom: '40px'
          }}>
            No results found.
          </p>
        ) : (
          results.map((result, index) => (
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
                  onMiniRestaurantClick(
                    result.data.id,
                    result.data.name,
                    result.data.open === 'yes'
                  );
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
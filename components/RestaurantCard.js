import { useState } from 'react';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, ClockIcon, CheckBadgeIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid';

// Simple Image component
const RestaurantImage = ({ src, alt }) => (
  <img
    src={src || '/placeholder-restaurant.png'}
    alt={alt}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }}
    loading="lazy"
  />
);

export default function RestaurantCard({ restaurant, onClick }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFavHovered, setIsFavHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: isHovered 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
      }}
    >
      {/* Image Section */}
      <div style={{
        position: 'relative',
        height: '130px',
        width: '100%'
      }}>
        <RestaurantImage src={restaurant.imageUrl} alt={restaurant.name} />
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent)'
        }}></div>
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          onMouseEnter={() => setIsFavHovered(true)}
          onMouseLeave={() => setIsFavHovered(false)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isFavHovered ? 'white' : 'rgba(255, 255, 255, 0.9)',
            borderRadius: '9999px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isFavorite ? (
            <HeartSolid style={{ width: '20px', height: '20px', color: '#EF4444' }} />
          ) : (
            <HeartOutline style={{ width: '20px', height: '20px', color: '#4B5563' }} />
          )}
        </button>
      </div>

      {/* Info Section */}
      <div style={{
        padding: '14px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#1F2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {restaurant.name}
        </h3>
        
        {/* Cuisine */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '4px',
          fontSize: '14px',
          color: '#4B5563'
        }}>
          <BuildingStorefrontIcon style={{
            width: '16px',
            height: '16px',
            marginRight: '6px',
            color: 'rgba(220, 12, 37, 0.7)',
            flexShrink: 0
          }} />
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {restaurant.cuisine}
          </span>
        </div>

        {/* Badges/Tags */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '10px',
          fontSize: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            paddingLeft: '8px',
            paddingRight: '8px',
            paddingTop: '2px',
            paddingBottom: '2px',
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            borderRadius: '9999px',
            fontWeight: 600
          }}>
            <CheckBadgeIcon style={{ width: '14px', height: '14px' }} />
            <span>Verified</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#6B7280'
          }}>
            <ClockIcon style={{ width: '14px', height: '14px' }} />
            <span>Deliver in Time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
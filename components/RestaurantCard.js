import { useState } from 'react';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, StarIcon, ClockIcon } from '@heroicons/react/24/solid';

const RestaurantImage = ({ src, alt }) => (
  <img
    src={src || '/placeholder-restaurant.png'}
    alt={alt}
    style={{
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%', objectFit: 'cover',
    }}
    loading="lazy"
  />
);

export default function RestaurantCard({ restaurant, onClick }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isShop = restaurant.type === 'MINI';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 16px 40px rgba(0,0,0,0.13)'
          : '0 2px 8px rgba(0,0,0,0.07)',
        border: '1px solid #F1F5F9',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '148px', width: '100%', backgroundColor: '#F3F4F6' }}>
        <RestaurantImage src={restaurant.imageUrl} alt={restaurant.name} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.05) 60%, transparent 100%)',
        }} />

        {/* Type badge top-left */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          backgroundColor: isShop ? '#1D4ED8' : '#DC0C25',
          color: 'white', fontSize: '10px', fontWeight: 700,
          padding: '3px 8px', borderRadius: '6px',
          letterSpacing: '0.5px', textTransform: 'uppercase',
        }}>
          {isShop ? 'Shop' : 'Restaurant'}
        </div>

        {/* Favourite button top-right */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
          style={{
            position: 'absolute', top: '10px', right: '10px',
            width: '30px', height: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: '50%',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s',
            transform: isFavorite ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {isFavorite
            ? <HeartSolid style={{ width: '16px', height: '16px', color: '#DC0C25' }} />
            : <HeartOutline style={{ width: '16px', height: '16px', color: '#6B7280' }} />
          }
        </button>

        {/* Name on image bottom */}
        <div style={{
          position: 'absolute', bottom: '10px', left: '12px', right: '12px',
        }}>
          <h3 style={{
            fontSize: '15px', fontWeight: 700, color: 'white', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}>
            {restaurant.name}
          </h3>
        </div>
      </div>

      {/* Info footer */}
      <div style={{ padding: '12px 14px' }}>
        {/* Cuisine */}
        <p style={{
          fontSize: '13px', color: '#6B7280', margin: '0 0 10px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {restaurant.cuisine}
        </p>

        {/* Metrics row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid #F3F4F6', paddingTop: '10px',
        }}>
          {/* Rating pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            backgroundColor: '#FEF9C3', borderRadius: '6px',
            padding: '3px 8px',
          }}>
            <StarIcon style={{ width: '13px', height: '13px', color: '#CA8A04' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#854D0E' }}>4.5</span>
          </div>

          {/* Delivery time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ClockIcon style={{ width: '13px', height: '13px', color: '#9CA3AF' }} />
            <span style={{ fontSize: '12px', color: '#6B7280' }}>20–35 min</span>
          </div>

          {/* Free delivery */}
          <div style={{
            fontSize: '11px', fontWeight: 600, color: '#16A34A',
            backgroundColor: '#F0FDF4', padding: '3px 8px', borderRadius: '6px',
          }}>
            ✔️Verified
          </div>
        </div>
      </div>
    </div>
  );
}
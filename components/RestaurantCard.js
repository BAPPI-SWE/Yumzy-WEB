// components/RestaurantCard.js
//
// Restaurant card on the home page: photo on the left, details and a
// "View Menu" pill on the right. Same design as the Android app.

import { useState } from 'react';
import { HeartIcon as HeartOutline, ClockIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, CheckBadgeIcon, StarIcon } from '@heroicons/react/24/solid';

// Shown when a restaurant has no "deliveryTime" field in Firestore.
// Set this to your real typical delivery time.
const DEFAULT_DELIVERY_TIME = '20–30 min';

export function RestaurantCardStyles() {
  return (
    <style>{`
      .fd-rest-card {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-width: 0;
        padding: 8px;
        background-color: white;
        border: none;
        border-radius: 18px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.07);
        text-align: left;
        font-family: inherit;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .fd-rest-card:hover  { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(0,0,0,0.11); }
      .fd-rest-card:active { transform: scale(0.98); }
      .fd-rest-card.is-closed { cursor: not-allowed; }
      .fd-rest-card.is-closed:hover { transform: none; box-shadow: 0 4px 14px rgba(0,0,0,0.07); }

      .fd-rest-photo {
        position: relative;
        flex-shrink: 0;
        width: 122px;
        height: 104px;
        border-radius: 14px;
        overflow: hidden;
        background-color: #F1F1F4;
      }
      .fd-rest-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

      .fd-rest-body {
        flex: 1;
        min-width: 0;
        height: 104px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .fd-rest-line { display: flex; align-items: center; min-width: 0; }
      .fd-rest-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      @media (min-width: 1024px) {
        .fd-rest-card { padding: 10px; gap: 14px; border-radius: 20px; }
        .fd-rest-photo { width: 140px; height: 116px; border-radius: 16px; }
        .fd-rest-body { height: 116px; }
      }
    `}</style>
  );
}

export default function RestaurantCard({ restaurant, onClick }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const isClosed = restaurant.type === 'MINI' && restaurant.open !== 'yes';
  const isPreOrder = !isClosed && (restaurant.parentCategory || '').toLowerCase() === 'personal_care';
  const hasRating = typeof restaurant.rating === 'number';

  const handleKeyDown = (e) => {
    if (isClosed) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick && onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={isClosed ? -1 : 0}
      aria-disabled={isClosed}
      aria-label={`${restaurant.name}${isClosed ? ', closed' : ''}`}
      className={`fd-rest-card${isClosed ? ' is-closed' : ''}`}
      onClick={isClosed ? undefined : onClick}
      onKeyDown={handleKeyDown}
    >
      {/* ── Photo ── */}
      <div className="fd-rest-photo">
        {restaurant.imageUrl && (
          <img src={restaurant.imageUrl} alt="" loading="lazy" />
        )}

        {isClosed && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              backgroundColor: 'white', color: '#1C1C1E',
              fontSize: '12px', fontWeight: 700, lineHeight: '14px',
              padding: '5px 12px', borderRadius: '999px',
            }}>
              Closed
            </span>
          </div>
        )}

        {isPreOrder && (
          <span style={{
            position: 'absolute', top: '6px', left: '6px',
            backgroundColor: '#DC0C25', color: 'white',
            fontSize: '10px', fontWeight: 700, lineHeight: '12px',
            padding: '3px 8px', borderRadius: '999px',
          }}>
            Pre-order
          </span>
        )}
      </div>

      {/* ── Details ── */}
      <div className="fd-rest-body">
        {/* Name + verified badge + favourite */}
        <div className="fd-rest-line">
          <span className="fd-rest-ellipsis" style={{
            flex: 1, fontSize: '15.5px', lineHeight: '20px', fontWeight: 700, color: '#1C1C1E',
          }}>
            {restaurant.name}
          </span>
          <CheckBadgeIcon
            title="Verified shop"
            style={{ width: '16px', height: '16px', color: '#FFA726', flexShrink: 0, marginLeft: '4px' }}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            style={{
              background: 'none', border: 'none', padding: 0, marginLeft: '6px',
              cursor: 'pointer', display: 'flex', flexShrink: 0,
              transform: isFavorite ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.3, 1.6, 0.5, 1)',
            }}
          >
            {isFavorite
              ? <HeartSolid style={{ width: '22px', height: '22px', color: '#DC0C25' }} />
              : <HeartOutline style={{ width: '22px', height: '22px', color: '#DC0C25' }} />}
          </button>
        </div>

        {/* Rating (only when a real one exists in Firestore) | delivery time */}
        <div className="fd-rest-line" style={{ fontSize: '12.5px', lineHeight: '16px', color: '#3A3A3C' }}>
          {hasRating && (
            <>
              <StarIcon style={{ width: '15px', height: '15px', color: '#FFA726', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: '#1C1C1E', marginLeft: '3px', fontSize: '13px' }}>
                {restaurant.rating.toFixed(1)}
              </span>
              <span style={{ color: '#C7C7CC', margin: '0 8px' }}>|</span>
            </>
          )}
          <ClockIcon style={{ width: '14px', height: '14px', color: '#6B6B70', flexShrink: 0 }} />
          <span style={{ marginLeft: '4px', fontWeight: 500 }}>
            {restaurant.deliveryTime || DEFAULT_DELIVERY_TIME}
          </span>
        </div>

        {/* Cuisine + open / closed */}
        <div className="fd-rest-line" style={{ fontSize: '12.5px', lineHeight: '16px' }}>
          <span className="fd-rest-ellipsis" style={{ flex: 1, color: '#6B6B70' }}>
            {restaurant.cuisine}
          </span>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, marginLeft: '6px',
            backgroundColor: isClosed ? '#B0B0B5' : '#2EAD5B',
          }} />
          <span style={{
            marginLeft: '4px', fontSize: '11.5px', fontWeight: 600, flexShrink: 0,
            color: isClosed ? '#6B6B70' : '#1F8A47',
          }}>
            {isClosed ? 'Closed' : 'Open'}
          </span>
        </div>

        {/* "View Menu" pill (the whole card is the tap target) */}
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            backgroundColor: isClosed ? '#8E8E93' : '#DC0C25', color: 'white',
            fontSize: '12px', fontWeight: 700, lineHeight: '16px',
            padding: '5px 12px', borderRadius: '999px',
          }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
            </svg>
            {isClosed ? 'Closed now' : 'View Menu'}
          </span>
        </div>
      </div>
    </div>
  );
}

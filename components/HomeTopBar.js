import { useState, useEffect } from 'react';
import { MapPinIcon, BellIcon, HeartIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchBar = ({ query, onQueryChange, onFocusChange, isDesktop }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        paddingLeft: '14px', display: 'flex', alignItems: 'center',
        pointerEvents: 'none', zIndex: 1
      }}>
        <MagnifyingGlassIcon style={{ height: '18px', width: '18px', color: isFocused ? '#DC0C25' : '#9CA3AF' }} />
      </div>
      <input
        type="text"
        placeholder="Search restaurants, foods, shops..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => { setIsFocused(true); onFocusChange(true); }}
        onBlur={() => { setIsFocused(false); onFocusChange(false); }}
        style={{
          width: '100%',
          height: isDesktop ? '42px' : '44px',
          paddingLeft: '40px',
          paddingRight: query ? '40px' : '16px',
          fontSize: '14px',
          backgroundColor: isDesktop ? '#F9FAFB' : 'white',
          borderRadius: '10px',
          border: isFocused ? '1.5px solid #DC0C25' : `1.5px solid ${isDesktop ? '#E5E7EB' : 'transparent'}`,
          outline: 'none',
          boxShadow: isFocused ? '0 0 0 3px rgba(220,12,37,0.08)' : 'none',
          transition: 'all 0.2s',
          boxSizing: 'border-box',
          color: '#1F2937',
        }}
      />
      {query && (
        <button
          onClick={() => onQueryChange('')}
          style={{
            position: 'absolute', top: '50%', right: '10px',
            transform: 'translateY(-50%)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
          }}
        >
          <XMarkIcon style={{ height: '16px', width: '16px', color: '#9CA3AF' }} />
        </button>
      )}
    </div>
  );
};

export default function HomeTopBar({
  userProfile, searchQuery, onSearchQueryChange,
  onNotificationClick, onFavoriteClick
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Keania+One&display=swap');
        .foodish-desktop-header { display: none; }
        .foodish-mobile-header { display: flex; }
        @media (min-width: 1024px) {
          .foodish-desktop-header { display: flex; }
          .foodish-mobile-header { display: none; }
        }
      `}</style>

      {/* ── DESKTOP HEADER ── */}
      <header className="foodish-desktop-header" style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'white',
        borderBottom: '1px solid #F1F5F9',
        alignItems: 'center',
        padding: '0 40px',
        height: '68px',
        gap: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{
            fontFamily: "'Keania One', cursive",
            fontSize: '26px',
            color: '#DC0C25',
            letterSpacing: '1px',
            lineHeight: 1,
          }}>
            FOODISH
          </span>
        </div>

        {/* Location pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: '#FEF2F2', borderRadius: '8px',
          padding: '6px 14px', flexShrink: 0,
          border: '1px solid #FECDD3',
        }}>
          <MapPinIcon style={{ width: '16px', height: '16px', color: '#DC0C25', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#DC0C25', fontWeight: 600, lineHeight: 1.2 }}>
              {userProfile?.baseLocation || 'Loading...'}
            </span>
            {userProfile?.subLocation && (
              <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600, lineHeight: 1.2 }}>
                {userProfile.subLocation}
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '520px' }}>
          <SearchBar
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            onFocusChange={setIsSearchFocused}
            isDesktop={true}
          />
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          <IconBtn onClick={onFavoriteClick} label="Favorites">
            <HeartIcon style={{ width: '20px', height: '20px', color: '#6B7280' }} />
          </IconBtn>
          <IconBtn onClick={onNotificationClick} label="Orders & Notifications">
            <BellIcon style={{ width: '20px', height: '20px', color: '#6B7280' }} />
          </IconBtn>
        </div>
      </header>

      {/* ── MOBILE HEADER ── */}
      <header className="foodish-mobile-header" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'linear-gradient(160deg, #DC0C25 0%, #B70314 100%)',
        flexDirection: 'column',
        borderBottomLeftRadius: '22px',
        borderBottomRightRadius: '22px',
        boxShadow: '0 4px 20px rgba(220,12,37,0.3)',
        overflow: 'hidden',
      }}>
        {/* Top row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MapPinIcon style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', margin: 0, fontWeight: 500 }}>
                Delivering to
              </p>
              <p style={{
                fontSize: '14px', color: 'white', margin: 0, fontWeight: 700,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {userProfile?.subLocation || userProfile?.baseLocation || '...'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            <MobileIconBtn onClick={onFavoriteClick}>
              <HeartIcon style={{ width: '20px', height: '20px', color: 'white' }} />
            </MobileIconBtn>
            <MobileIconBtn onClick={onNotificationClick}>
              <BellIcon style={{ width: '20px', height: '20px', color: 'white' }} />
            </MobileIconBtn>
          </div>
        </div>
        {/* Search row */}
        <div style={{ padding: '0 16px 16px' }}>
          <SearchBar
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            onFocusChange={setIsSearchFocused}
            isDesktop={false}
          />
        </div>
      </header>
    </>
  );
}

function IconBtn({ onClick, label, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px', backgroundColor: hovered ? '#F9FAFB' : 'transparent',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function MobileIconBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px', backgroundColor: 'rgba(255,255,255,0.15)',
        border: 'none', borderRadius: '8px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}
import { useState, useEffect } from 'react';
import { MapPinIcon, BellIcon, HeartIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { homeCategories, useHeroSlide, HeroStyles, HeroBackground, HeroSlideContent } from './HeroSlides';

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
        placeholder="Search restaurants or food"
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
          borderRadius: isDesktop ? '10px' : '14px',
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
  onNotificationClick, onFavoriteClick,
  onCategoryClick, // (categoryId, categoryName) => void, called when the banner is tapped
  hideBanner = false, // true while search results are showing
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Animated banner (mobile)
  const slideIndex = useHeroSlide();
  const slide = homeCategories[slideIndex];

  const locationText = userProfile
    ? [userProfile.subLocation, userProfile.baseLocation].filter(Boolean).join(', ') || 'Set your location'
    : '...';

  return (
    <>
      <HeroStyles />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <img
            src="/favicon.png"
            alt="Foodish logo"
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
          />
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

      {/* ── MOBILE TOP BAR ──
          Same design as the Android app:
          1) a banner that scrolls away with the page (location row + animated slides)
          2) the search bar, which stays pinned to the top while scrolling            */}
      <div
        className="foodish-mobile-header"
        style={{
          position: 'relative',
          flexDirection: 'column',
          overflow: 'hidden',
          // The banner folds away while the user is searching, to leave room for results
          maxHeight: hideBanner ? '0px' : '200px',
          transition: 'max-height 0.25s ease',
        }}
      >
        <HeroBackground index={slideIndex} />

        <div style={{ position: 'relative', padding: '10px 16px 8px' }}>
          {/* Location + buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MapPinIcon style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '10px', lineHeight: '12px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>
                Deliver to
              </p>
              <p style={{
                fontSize: '13px', lineHeight: '16px', color: 'white', margin: 0, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {locationText}
              </p>
            </div>
            <MobileIconBtn onClick={onFavoriteClick} label="Favorites">
              <HeartIcon style={{ width: '18px', height: '18px', color: 'white' }} />
            </MobileIconBtn>
            <MobileIconBtn onClick={onNotificationClick} label="Orders & Notifications">
              <BellIcon style={{ width: '18px', height: '18px', color: 'white' }} />
            </MobileIconBtn>
          </div>

          {/* Animated slides */}
          <div style={{ marginTop: '6px' }}>
            <HeroSlideContent index={slideIndex} onCategoryClick={onCategoryClick} size="compact" />
          </div>
        </div>
      </div>

      {/* Search bar: pinned. Its colour follows the banner so the two look like one piece. */}
      <div
        className="foodish-mobile-header"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          backgroundColor: slide.colorBottom,
          transition: 'background-color 0.8s ease',
          padding: '8px 16px 12px',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        }}
      >
        <SearchBar
          query={searchQuery}
          onQueryChange={onSearchQueryChange}
          onFocusChange={setIsSearchFocused}
          isDesktop={false}
        />
      </div>
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

function MobileIconBtn({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: '34px', height: '34px', flexShrink: 0,
        backgroundColor: 'rgba(255,255,255,0.18)',
        border: 'none', borderRadius: '50%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

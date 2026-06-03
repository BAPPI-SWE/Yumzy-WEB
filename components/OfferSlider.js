import { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const OfferImage = ({ src, alt }) => (
  <img
    src={src || '/placeholder-image.png'}
    alt={alt}
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    loading="lazy"
  />
);

export default function OfferSlider({ offers }) {
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef(null);
  const trackRef = useRef(null);

  if (!offers || offers.length === 0) return null;

  const total = offers.length;

  const goTo = (idx) => {
    setCurrent((idx + total) % total);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => goTo(current + 1), 4000);
    return () => clearInterval(intervalRef.current);
  }, [current]);

  return (
    <div style={{ padding: '0 0 4px' }}>
      {/* Desktop: full-width hero slider */}
      <div style={{ display: 'none' }} className="offer-desktop">
        <style>{`
          .offer-desktop { display: none !important; }
          .offer-mobile { display: block !important; }
          @media (min-width: 1024px) {
            .offer-desktop { display: block !important; }
            .offer-mobile { display: none !important; }
          }
        `}</style>
        <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', height: '240px' }}>
          {offers.map((offer, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', inset: 0,
                opacity: i === current ? 1 : 0,
                transition: 'opacity 0.5s ease',
                pointerEvents: i === current ? 'auto' : 'none',
              }}
            >
              <OfferImage src={offer.imageUrl} alt={`Offer ${i + 1}`} />
            </div>
          ))}

          {/* Prev/Next */}
          {total > 1 && (
            <>
              <SliderArrow direction="left" onClick={() => goTo(current - 1)} />
              <SliderArrow direction="right" onClick={() => goTo(current + 1)} />
            </>
          )}

          {/* Dots */}
          {total > 1 && (
            <div style={{
              position: 'absolute', bottom: '14px', left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', gap: '6px',
            }}>
              {offers.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === current ? '22px' : '7px',
                    height: '7px',
                    borderRadius: '4px',
                    backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.5)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="offer-mobile" style={{ display: 'block' }}>
        <style>{`
          .offer-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        <div
          className="offer-scroll"
          ref={trackRef}
          style={{
            display: 'flex', gap: '12px',
            overflowX: 'auto', paddingBottom: '4px',
            paddingLeft: '16px', paddingRight: '16px',
            scrollSnapType: 'x mandatory',
            msOverflowStyle: 'none', scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {offers.map((offer, index) => (
            <div
              key={index}
              style={{
                flexShrink: 0, width: '82vw', maxWidth: '300px',
                height: '150px', borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                scrollSnapAlign: 'start',
                cursor: 'pointer',
              }}
            >
              <OfferImage src={offer.imageUrl} alt={`Offer ${index + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderArrow({ direction, onClick }) {
  const [hovered, setHovered] = useState(false);
  const Icon = direction === 'left' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute', top: '50%',
        [direction]: '14px',
        transform: 'translateY(-50%)',
        width: '36px', height: '36px',
        borderRadius: '50%',
        backgroundColor: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'background 0.15s',
        zIndex: 5,
      }}
    >
      <Icon style={{ width: '20px', height: '20px', color: '#1F2937' }} />
    </button>
  );
}
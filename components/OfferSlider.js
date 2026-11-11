// components/OfferSlider.js
//
// The wide banner slider ("offers" collection, managed in the admin app's Banners tab).
// Every banner keeps the same 11:5 shape on all screens, which is exactly what the
// admin app crops to (1320 x 600 px), so nothing is cut off.

import { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const SLIDE_MS = 4000;

export default function OfferSlider({ offers }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);
  const total = offers ? offers.length : 0;

  // Move on automatically. Restarts whenever the slide changes (also after a manual tap).
  useEffect(() => {
    if (total < 2) return undefined;
    const timer = setTimeout(() => setCurrent((c) => (c + 1) % total), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [current, total]);

  // If the list gets shorter, never point past the end.
  useEffect(() => {
    if (current >= total && total > 0) setCurrent(0);
  }, [current, total]);

  if (total === 0) return null;

  const goTo = (index) => setCurrent((index + total) % total);

  // Swipe left / right on phones
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
  };

  return (
    <div>
      <style>{`
        .fd-offer-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 11 / 5;
          border-radius: 20px;
          overflow: hidden;
          background-color: #F1F1F4;
        }
        .fd-offer-arrow { display: none; }
        @media (min-width: 1024px) {
          .fd-offer-frame { border-radius: 24px; }
          .fd-offer-arrow { display: flex; opacity: 0; transition: opacity 0.15s; }
          .fd-offer-frame:hover .fd-offer-arrow { opacity: 1; }
        }
      `}</style>

      <div className="fd-offer-frame" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {offers.map((offer, i) => (
          <img
            key={i}
            src={offer.imageUrl}
            alt={`Offer ${i + 1}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === current ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          />
        ))}

        {total > 1 && (
          <>
            <SliderArrow direction="left" onClick={() => goTo(current - 1)} />
            <SliderArrow direction="right" onClick={() => goTo(current + 1)} />
          </>
        )}
      </div>

      {/* Dots under the banner. The active dot stretches into a short pill. */}
      {total > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
          {offers.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show offer ${i + 1}`}
              style={{
                width: i === current ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: i === current ? '#DC0C25' : '#DADADF',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SliderArrow({ direction, onClick }) {
  const Icon = direction === 'left' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      className="fd-offer-arrow"
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous offer' : 'Next offer'}
      style={{
        position: 'absolute', top: '50%',
        [direction]: '14px',
        transform: 'translateY(-50%)',
        width: '36px', height: '36px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.9)',
        border: 'none', cursor: 'pointer',
        alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 5,
      }}
    >
      <Icon style={{ width: '20px', height: '20px', color: '#1F2937' }} />
    </button>
  );
}

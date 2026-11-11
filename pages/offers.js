// pages/offers.js
//
// "All Offers": every active offer card in a grid.
// Opened from the "See all offers" tile on the home page.
// Tapping a card opens the restaurant that the offer belongs to.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeftIcon, TagIcon } from '@heroicons/react/24/solid';
import ProtectedRoute from '../components/ProtectedRoute';
import { loadPromoCards, promoCardHref, PromoCardStyles, PromoCardTile } from '../components/PromoCardsRow';

function AllOffersContent() {
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadPromoCards().then((loaded) => {
      if (cancelled) return;
      setCards(loaded);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <PromoCardStyles />
      <style>{`
        * { box-sizing: border-box; }
        .fd-offers-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px;
          max-width: 1280px;
          margin: 0 auto;
        }
        @media (min-width: 640px)  { .fd-offers-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
        @media (min-width: 1024px) { .fd-offers-grid { grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 28px 40px; } }
        @keyframes fdSpin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: 'none', backgroundColor: '#F4F4F6', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeftIcon style={{ width: '20px', height: '20px', color: '#1C1C1E' }} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1C1C1E', margin: 0 }}>
          All Offers
        </h1>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '3px solid #F1F5F9', borderTop: '3px solid #DC0C25',
            animation: 'fdSpin 0.75s linear infinite',
          }} />
        </div>
      )}

      {!isLoading && cards.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '80px 24px', textAlign: 'center',
        }}>
          <TagIcon style={{ width: '52px', height: '52px', color: '#C7C7CC', marginBottom: '12px' }} />
          <p style={{ color: '#6B6B70', fontSize: '14px', margin: 0 }}>
            No offers right now. Please check back later.
          </p>
        </div>
      )}

      {!isLoading && cards.length > 0 && (
        <div className="fd-offers-grid">
          {cards.map((card) => (
            <PromoCardTile
              key={card.id}
              card={card}
              onClick={() => router.push(promoCardHref(card))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AllOffersPage() {
  return (
    <ProtectedRoute>
      <AllOffersContent />
    </ProtectedRoute>
  );
}

// components/PromoCardsRow.js
//
// Offer cards: the small 5:4 cards in a scrolling row near the top of the home page.
// They are created in the admin app (Offers tab > Offer Cards) and stored in the
// "promo_cards" collection. Tapping a card opens its restaurant.

import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

// How many cards show on Home before the "See all offers" tile appears.
export const MAX_HOME_PROMO_CARDS = 6;

// Small tag in the bottom-left corner of every card. Set to '' to hide it.
const PROMO_CARD_TAG_TEXT = 'Order Now';

// Loads all active offer cards, lowest priority number first.
// Never throws: if the cards cannot be read, it returns an empty list
// and the row is simply not shown.
export async function loadPromoCards() {
  try {
    const snap = await getDocs(query(collection(db, 'promo_cards'), where('active', '==', true)));
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
          restaurantId: typeof data.restaurantId === 'string' ? data.restaurantId : '',
          restaurantName: typeof data.restaurantName === 'string' ? data.restaurantName : '',
          restaurantType: data.restaurantType === 'MAIN' ? 'MAIN' : 'MINI',
          priority: typeof data.priority === 'number' ? data.priority : Number.MAX_SAFE_INTEGER,
        };
      })
      .filter((card) => card.imageUrl && card.restaurantId)
      .sort((a, b) => a.priority - b.priority || a.restaurantName.localeCompare(b.restaurantName));
  } catch (err) {
    console.error('Could not load offer cards:', err);
    return [];
  }
}

// Where a card leads: the same pages the restaurant list uses.
export function promoCardHref(card) {
  const name = encodeURIComponent(card.restaurantName);
  return card.restaurantType === 'MAIN'
    ? `/restaurant/${card.restaurantId}/${name}`
    : `/items/miniRes/${card.restaurantId}?title=${name}`;
}

export function PromoCardStyles() {
  return (
    <style>{`
      .fd-promo-row {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        scroll-snap-type: x proximity;
        scrollbar-width: none;
        -ms-overflow-style: none;
        /* let the row run to the screen edges on phones */
        margin: 0 -16px;
        padding: 2px 16px 4px;
      }
      .fd-promo-row::-webkit-scrollbar { display: none; }
      .fd-promo-row > * { flex: 0 0 136px; scroll-snap-align: start; }

      .fd-promo-tile {
        position: relative;
        display: block;
        width: 100%;
        aspect-ratio: 5 / 4;
        padding: 0;
        border: none;
        border-radius: 16px;
        overflow: hidden;
        background-color: #F1F1F4;
        cursor: pointer;
        font-family: inherit;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .fd-promo-tile:hover  { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,0,0,0.14); }
      .fd-promo-tile:active { transform: scale(0.96); }
      .fd-promo-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }

      .fd-promo-tag {
        position: absolute; left: 8px; bottom: 8px;
        display: inline-flex; align-items: center;
        background-color: #FFC928; color: #1C1C1E;
        font-size: 10px; font-weight: 700; line-height: 14px;
        padding: 3px 4px 3px 9px;
        border-radius: 999px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      }

      @media (min-width: 1024px) {
        .fd-promo-row { gap: 16px; margin: 0; padding: 4px 0 8px; }
        .fd-promo-row > * { flex-basis: 210px; }
        .fd-promo-tile { border-radius: 20px; }
        .fd-promo-tag { left: 12px; bottom: 12px; font-size: 12px; line-height: 16px; padding: 4px 6px 4px 12px; }
      }
    `}</style>
  );
}

// One offer card. The picture already contains the offer text (made by the admin).
export function PromoCardTile({ card, onClick }) {
  return (
    <button
      type="button"
      className="fd-promo-tile"
      onClick={onClick}
      aria-label={`Offer from ${card.restaurantName}`}
    >
      <img src={card.imageUrl} alt="" loading="lazy" />
      {PROMO_CARD_TAG_TEXT && (
        <span className="fd-promo-tag">
          {PROMO_CARD_TAG_TEXT}
          <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.2 14.8a.75.75 0 010-1.06L10.94 10 7.2 6.26a.75.75 0 111.06-1.06l4.27 4.27a.75.75 0 010 1.06l-4.27 4.27a.75.75 0 01-1.06 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </button>
  );
}

function SeeAllOffersTile({ extraCount, onClick }) {
  return (
    <button
      type="button"
      className="fd-promo-tile"
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #E5202F, #B00020)',
        color: 'white',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{
        width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'white',
        color: '#B00020', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 20 20" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M7.2 14.8a.75.75 0 010-1.06L10.94 10 7.2 6.26a.75.75 0 111.06-1.06l4.27 4.27a.75.75 0 010 1.06l-4.27 4.27a.75.75 0 01-1.06 0z" clipRule="evenodd" />
        </svg>
      </span>
      <span style={{ fontSize: '13px', fontWeight: 700, lineHeight: '16px', marginTop: '6px' }}>
        See all offers
      </span>
      <span style={{ fontSize: '11px', lineHeight: '14px', opacity: 0.85 }}>
        +{extraCount} more
      </span>
    </button>
  );
}

export default function PromoCardsRow({ cards, onCardClick, onSeeAllClick }) {
  if (!cards || cards.length === 0) return null;
  const visibleCards = cards.slice(0, MAX_HOME_PROMO_CARDS);
  const extraCount = cards.length - visibleCards.length;

  return (
    <>
      <PromoCardStyles />
      <div className="fd-promo-row">
        {visibleCards.map((card) => (
          <div key={card.id}>
            <PromoCardTile card={card} onClick={() => onCardClick(card)} />
          </div>
        ))}
        {/* More cards than fit on Home: finish the row with a "See all offers" tile */}
        {extraCount > 0 && (
          <div>
            <SeeAllOffersTile extraCount={extraCount} onClick={onSeeAllClick} />
          </div>
        )}
      </div>
    </>
  );
}

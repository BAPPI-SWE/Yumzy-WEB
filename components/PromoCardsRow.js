// components/PromoCardsRow.js
//
// Offer cards: the small 5:4 cards in a scrolling row near the top of the home page.
// They are created in the admin app (Offers tab > Offer Cards) and stored in the
// "promo_cards" collection. Tapping a card opens its restaurant.

import { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

// How many cards show on Home before the "See all offers" tile appears.
export const MAX_HOME_PROMO_CARDS = 6;

// Small tag in the bottom-left corner of every card. Set to '' to hide it.
const PROMO_CARD_TAG_TEXT = 'Order Now';

// ─── Intro animation ─────────────────────────────────────────────
// When the home page opens, the mascot walks in from the right, says two
// short lines, then pulls the offer cards in with a rope and walks off.
//
// Picture: /public/mascot/offer_mascot.png (he faces right in the file;
// the page flips him so he walks to the left).
const MASCOT_SRC = '/mascot/offer_mascot.png';
const INTRO_TEXT_1 = 'অফার খুঁজছো?';   // shown while he stands
const INTRO_TEXT_2 = 'এই নাও!';         // shown while he pulls

// Timing, in milliseconds
const INTRO_START_DELAY = 250; // short wait after the cards have loaded
const INTRO_ENTER_MS = 650;    // mascot walks in
const INTRO_TALK_MS = 1250;    // he stands and "talks"
const INTRO_PULL_MS = 1400;    // he pulls the cards in and walks off

// The intro plays once each time the site is opened,
// not again when the user comes back to the home page.
let promoIntroPlayed = false;

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
      /* The stage is the window everything moves inside. It runs to the screen
         edges on phones, and hides the cards while they wait off-screen. */
      .fd-promo-stage {
        position: relative;
        overflow: hidden;
        margin: 0 -16px;
        --row-pad: 16px;        /* empty space before the first card */
        --pull-extra: 24px;     /* how far past the edge the cards wait */
      }
      .fd-promo-row {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        scroll-snap-type: x proximity;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding: 4px var(--row-pad) 6px;
      }

      /* ── Intro: where things are in each phase ──
         idle / enter / talk : cards wait just past the right edge
         pull                : cards slide to their place; the mascot layer slides
                               the same distance with the same timing, so the rope
                               between them keeps its length
         done                : mascot removed, cards in place                      */
      .fd-intro-idle .fd-promo-row,
      .fd-intro-enter .fd-promo-row,
      .fd-intro-talk .fd-promo-row {
        transform: translateX(calc(100% + var(--pull-extra)));
      }
      .fd-intro-pull .fd-promo-row {
        transform: translateX(0);
        transition: transform ${INTRO_PULL_MS}ms cubic-bezier(0.5, 0, 0.2, 1);
      }
      .fd-mascot-layer {
        position: absolute; inset: 0;
        z-index: 2;
        pointer-events: none;
      }
      .fd-intro-pull .fd-mascot-layer {
        transform: translateX(calc(-100% - var(--pull-extra)));
        transition: transform ${INTRO_PULL_MS}ms cubic-bezier(0.5, 0, 0.2, 1);
      }
      /* The mascot stands near the right edge. Before "enter" he is off-screen. */
      .fd-mascot {
        position: absolute;
        right: 8px; bottom: 4px;
        height: calc(100% - 8px);
        aspect-ratio: 414 / 540;
        transform: translateX(170%);
      }
      .fd-intro-enter .fd-mascot,
      .fd-intro-talk .fd-mascot,
      .fd-intro-pull .fd-mascot {
        transform: translateX(0);
        transition: transform ${INTRO_ENTER_MS}ms cubic-bezier(0.2, 0.7, 0.3, 1);
      }
      .fd-mascot-body { width: 100%; height: 100%; transform-origin: 50% 90%; }
      .fd-mascot-body img {
        width: 100%; height: 100%; display: block;
        transform: scaleX(-1); /* flip: he walks to the left */
      }
      /* Walking: he rocks from side to side. Standing: a small bounce. */
      @keyframes fdMascotWalk {
        0%, 100% { transform: rotate(-5deg) translateY(0); }
        50%      { transform: rotate(5deg) translateY(-3%); }
      }
      @keyframes fdMascotIdle {
        0%, 100% { transform: translateY(0) scale(1, 1); }
        50%      { transform: translateY(-2%) scale(1.02, 0.98); }
      }
      .fd-intro-enter .fd-mascot-body,
      .fd-intro-pull .fd-mascot-body { animation: fdMascotWalk 0.36s ease-in-out infinite; }
      .fd-intro-talk .fd-mascot-body { animation: fdMascotIdle 0.6s ease-in-out infinite; }

      /* Rope: from the rope end on his back to the left edge of the first card */
      .fd-mascot-rope {
        position: absolute;
        left: 86%; top: 44%;
        width: calc(14% + 8px + var(--pull-extra) + var(--row-pad) + 2px);
        height: 32%;
        overflow: visible;
      }

      /* Speech bubble, to the left of his face */
      @keyframes fdBubblePop {
        0%   { opacity: 0; transform: scale(0.5); }
        70%  { opacity: 1; transform: scale(1.08); }
        100% { opacity: 1; transform: scale(1); }
      }
      .fd-mascot-bubble {
        position: absolute;
        right: 84%; top: 8%;
        white-space: nowrap;
        background-color: white; color: #1C1C1E;
        font-size: 14px; font-weight: 700; line-height: 20px;
        padding: 6px 12px;
        border-radius: 14px 14px 4px 14px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        transform-origin: 100% 100%;
        animation: fdBubblePop 0.3s cubic-bezier(0.3, 1.4, 0.5, 1) both;
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
        .fd-promo-stage { margin: 0; --row-pad: 0px; }
        .fd-promo-row { gap: 16px; padding: 6px 0 10px; }
        .fd-mascot-bubble { font-size: 17px; line-height: 24px; padding: 8px 16px; }
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

// Runs the intro once. Returns the current phase:
// 'idle' -> 'enter' -> 'talk' -> 'pull' -> 'done'
function usePromoIntro(hasCards) {
  const [phase, setPhase] = useState(() => (promoIntroPlayed ? 'done' : 'idle'));

  useEffect(() => {
    if (!hasCards || promoIntroPlayed) return undefined;

    const finish = () => {
      promoIntroPlayed = true;
      setPhase('done');
    };

    // People who switch off animations in their device settings just get the cards.
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      finish();
      return undefined;
    }

    const timers = [];
    let cancelled = false;
    const at = (ms, action) => timers.push(setTimeout(() => !cancelled && action(), ms));

    // Start only when the picture is ready. If it cannot load, skip the intro.
    const picture = new window.Image();
    picture.onload = () => {
      if (cancelled) return;
      const t1 = INTRO_START_DELAY;
      const t2 = t1 + INTRO_ENTER_MS;
      const t3 = t2 + INTRO_TALK_MS;
      const t4 = t3 + INTRO_PULL_MS + 100;
      at(t1, () => setPhase('enter'));
      at(t2, () => setPhase('talk'));
      at(t3, () => setPhase('pull'));
      at(t4, finish);
    };
    picture.onerror = () => !cancelled && finish();
    picture.src = MASCOT_SRC;

    // Leaving the page in the middle of the intro: stop the timers.
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [hasCards]);

  return phase;
}

function PromoMascot({ phase }) {
  const isTalking = phase === 'talk' || phase === 'pull';
  const text = phase === 'pull' ? INTRO_TEXT_2 : INTRO_TEXT_1;

  return (
    <div className="fd-mascot-layer" aria-hidden="true">
      <div className="fd-mascot">
        {/* Rope (drawn first, so it goes behind him) */}
        <svg className="fd-mascot-rope" viewBox="0 0 100 40" preserveAspectRatio="none">
          <path
            d="M0,24 Q48,38 100,8"
            fill="none" stroke="#8A5A2B" strokeWidth="6" strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M0,24 Q48,38 100,8"
            fill="none" stroke="#D9AE72" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="5 5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="fd-mascot-body">
          <img src={MASCOT_SRC} alt="" />
        </div>

        {/* key = text: the bubble pops again when the words change */}
        {isTalking && (
          <div key={text} className="fd-mascot-bubble">{text}</div>
        )}
      </div>
    </div>
  );
}

export default function PromoCardsRow({ cards, onCardClick, onSeeAllClick }) {
  const hasCards = !!cards && cards.length > 0;
  const phase = usePromoIntro(hasCards);

  if (!hasCards) return null;
  const visibleCards = cards.slice(0, MAX_HOME_PROMO_CARDS);
  const extraCount = cards.length - visibleCards.length;

  return (
    <div className={`fd-promo-stage fd-intro-${phase}`}>
      <PromoCardStyles />
      {phase !== 'done' && <PromoMascot phase={phase} />}
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
    </div>
  );
}

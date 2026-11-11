// components/HeroSlides.js
//
// The animated banner that rotates through the four categories.
// It is shared by:
//   - the mobile top bar   (components/HomeTopBar.js)
//   - the desktop hero card (pages/home.js)
//   - the category row      (components/CategorySection.js uses the same list)
//
// Same design as the Android app: the colour glides between red and orange
// tones, the letters drop in, the icon pops in, and small bars show progress.

import { useEffect, useState } from 'react';

// How long each slide stays on screen, in milliseconds.
export const HERO_SLIDE_MS = 3800;

// One list drives BOTH the banner and the category row.
//   icon        = PNG in /public/categories (the same icons as the Android app)
//   emoji       = shown only if the PNG is missing
//   tag         = small label on the banner
//   colorTop /
//   colorBottom = banner colour while this slide is showing
export const homeCategories = [
  {
    id: 'fast_food', name: 'Fast Food', tag: 'HUNGRY?',
    icon: '/categories/ic_cat_fast_food.png', emoji: '🍔',
    colorTop: '#E5202F', colorBottom: '#B00020', // red
  },
  {
    id: 'pharmacy', name: 'Rice & Curry', tag: 'LUNCH SORTED',
    icon: '/categories/ic_cat_rice_curry.png', emoji: '🍛',
    colorTop: '#F0562B', colorBottom: '#C62810', // red-orange
  },
  {
    id: 'personal_care', name: 'City Food', tag: 'PRE-ORDER',
    icon: '/categories/ic_cat_city_food.png', emoji: '🍕',
    colorTop: '#D81B4F', colorBottom: '#A00037', // crimson
  },
  {
    id: 'grocery', name: 'Grocery', tag: 'DAILY NEEDS',
    icon: '/categories/ic_cat_grocery.png', emoji: '🛒',
    colorTop: '#EA6A12', colorBottom: '#C84300', // deep orange
  },
];

// Returns the index of the slide that is showing. It moves on every HERO_SLIDE_MS.
export function useHeroSlide() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % homeCategories.length),
      HERO_SLIDE_MS
    );
    return () => clearInterval(timer);
  }, []);
  return index;
}

// Category picture. Falls back to an emoji if the PNG file is not in /public/categories yet.
export function CategoryIcon({ category, size }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span style={{ fontSize: `${Math.round(size * 0.8)}px`, lineHeight: 1 }} aria-hidden="true">
        {category.emoji}
      </span>
    );
  }
  return (
    <img
      src={category.icon}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain', display: 'block' }}
    />
  );
}

// All the keyframes used by the banner. Rendered once by whoever shows a banner.
export function HeroStyles() {
  return (
    <style>{`
      @keyframes fdHeroLetterDrop {
        0%   { opacity: 0; transform: translateY(-18px); }
        60%  { opacity: 1; transform: translateY(3px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes fdHeroRise {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fdHeroIconPop {
        0%   { opacity: 0; transform: scale(0.4) rotate(-20deg); }
        70%  { opacity: 1; transform: scale(1.08) rotate(3deg); }
        100% { opacity: 1; transform: scale(1) rotate(0deg); }
      }
      @keyframes fdHeroIconFloat {
        0%, 100% { transform: translateY(-3px); }
        50%      { transform: translateY(3px); }
      }
      @keyframes fdHeroBarFill {
        from { width: 0%; }
        to   { width: 100%; }
      }
      @keyframes fdHeroTwinkle {
        0%, 100% { opacity: 0.15; transform: scale(0.8); }
        50%      { opacity: 0.9;  transform: scale(1.1); }
      }
      .fd-hero-letter {
        display: inline-block;
        white-space: pre;
        animation: fdHeroLetterDrop 0.5s cubic-bezier(0.3, 1.4, 0.5, 1) both;
      }
      /* People who switch off animations in their phone / computer settings get a still banner */
      @media (prefers-reduced-motion: reduce) {
        .fd-hero-letter, .fd-hero-anim { animation: none !important; }
      }
    `}</style>
  );
}

// The coloured background. One layer per slide; the active layer fades in,
// which makes the colour glide from one slide to the next.
export function HeroBackground({ index }) {
  return (
    <>
      {homeCategories.map((category, i) => (
        <div
          key={category.id}
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, ${category.colorTop} 0%, ${category.colorBottom} 100%)`,
            opacity: i === index ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
      ))}

      {/* Soft rings behind the icon */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[1, 2, 3, 4].map((ring) => (
          <div
            key={ring}
            style={{
              position: 'absolute',
              right: '12%', top: '50%',
              width: `${ring * 84}px`, height: `${ring * 84}px`,
              marginRight: `${-ring * 42}px`, marginTop: `${-ring * 42}px`,
              borderRadius: '50%',
              border: `1px solid rgba(255,255,255,${0.13 - ring * 0.022})`,
            }}
          />
        ))}
        {/* Twinkling sparkles */}
        {[
          { left: '56%', top: '30%', size: 10, delay: '0s' },
          { left: '68%', top: '68%', size: 7, delay: '0.6s' },
          { left: '94%', top: '24%', size: 8, delay: '1.1s' },
          { left: '62%', top: '50%', size: 6, delay: '0.3s' },
        ].map((sparkle, i) => (
          <span
            key={i}
            className="fd-hero-anim"
            style={{
              position: 'absolute', left: sparkle.left, top: sparkle.top,
              color: 'white', fontSize: `${sparkle.size + 4}px`, lineHeight: 1,
              animation: `fdHeroTwinkle 1.6s ease-in-out ${sparkle.delay} infinite`,
            }}
          >
            ✦
          </span>
        ))}
      </div>
    </>
  );
}

// The moving part: tag, title, "Order now", progress bars and the icon.
//   size = 'compact' (mobile top bar) or 'large' (desktop hero card)
export function HeroSlideContent({ index, onCategoryClick, size = 'compact' }) {
  const slide = homeCategories[index];
  const large = size === 'large';

  const titleSize = large ? 44 : 24;
  const iconBox = large ? 132 : 66;
  const iconSize = large ? 108 : 54;

  return (
    <button
      type="button"
      onClick={() => onCategoryClick && onCategoryClick(slide.id, slide.name)}
      aria-label={`Open ${slide.name}`}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: large ? '24px' : '8px',
        width: '100%', padding: 0, margin: 0,
        background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left', color: 'white', fontFamily: 'inherit',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* key = index: React builds this block again for every slide, which restarts the animations */}
        <div key={index} className="fd-hero-anim" style={{ animation: 'fdHeroRise 0.42s ease both' }}>
          <span style={{
            display: 'inline-block',
            fontSize: large ? '12px' : '9px', fontWeight: 700, letterSpacing: '1px',
            lineHeight: 1.2,
            backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: '999px',
            padding: large ? '5px 12px' : '2px 8px',
          }}>
            {slide.tag}
          </span>
          <div
            style={{
              fontSize: `${titleSize}px`, fontWeight: 800,
              lineHeight: large ? 1.15 : '28px',
              marginTop: large ? '10px' : '2px',
              letterSpacing: '-0.3px',
              whiteSpace: 'nowrap',
            }}
          >
            {slide.name.split('').map((letter, i) => (
              <span
                key={i}
                className="fd-hero-letter"
                style={{ animationDelay: `${80 + i * 40}ms` }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: large ? '14px' : '10px',
          marginTop: large ? '18px' : '5px',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '2px',
            backgroundColor: 'white', color: slide.colorBottom,
            borderRadius: '999px',
            fontSize: large ? '14px' : '10px', fontWeight: 700, lineHeight: 1.4,
            padding: large ? '8px 12px 8px 18px' : '2px 5px 2px 10px',
            transition: 'color 0.8s ease',
          }}>
            Order now
            <svg viewBox="0 0 20 20" width={large ? 18 : 13} height={large ? 18 : 13} fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.2 14.8a.75.75 0 010-1.06L10.94 10 7.2 6.26a.75.75 0 111.06-1.06l4.27 4.27a.75.75 0 010 1.06l-4.27 4.27a.75.75 0 01-1.06 0z" clipRule="evenodd" />
            </svg>
          </span>

          {/* Progress bars: one per slide, the active one fills while its slide shows */}
          <div style={{ display: 'flex', gap: '4px' }} aria-hidden="true">
            {homeCategories.map((category, i) => (
              <span
                key={category.id}
                style={{
                  position: 'relative', overflow: 'hidden',
                  width: large ? '28px' : '16px', height: '4px',
                  borderRadius: '2px', backgroundColor: 'rgba(255,255,255,0.30)',
                }}
              >
                {i < index && (
                  <span style={{ position: 'absolute', inset: 0, backgroundColor: 'white' }} />
                )}
                {i === index && (
                  <span
                    key={index}
                    className="fd-hero-anim"
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%',
                      backgroundColor: 'white',
                      animation: `fdHeroBarFill ${HERO_SLIDE_MS}ms linear both`,
                    }}
                  />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Icon: pops in for every slide, then floats gently */}
      <div
        className="fd-hero-anim"
        style={{
          flexShrink: 0,
          animation: 'fdHeroIconFloat 3.2s ease-in-out infinite',
        }}
      >
        <div
          key={index}
          className="fd-hero-anim"
          style={{
            width: `${iconBox}px`, height: `${iconBox}px`, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fdHeroIconPop 0.55s cubic-bezier(0.3, 1.3, 0.5, 1) both',
          }}
        >
          <CategoryIcon category={slide} size={iconSize} />
        </div>
      </div>
    </button>
  );
}

// Desktop hero card: the same banner, bigger, shown in the page content.
export function HeroCard({ onCategoryClick }) {
  const index = useHeroSlide();
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: '24px',
      padding: '32px 36px',
      display: 'flex', alignItems: 'center',
      width: '100%', height: '100%',
      boxShadow: '0 10px 30px rgba(176,0,32,0.18)',
    }}>
      <HeroBackground index={index} />
      <HeroSlideContent index={index} onCategoryClick={onCategoryClick} size="large" />
    </div>
  );
}

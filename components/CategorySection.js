// components/CategorySection.js
//
// The four category icons on the home page.
// Icons sit directly on the page (no box or background), like the Android app.
// The list itself lives in HeroSlides.js so the banner and this row always match.

import { homeCategories, CategoryIcon } from './HeroSlides';

// Size of the category icons, in pixels.
const ICON_SIZE_MOBILE = 48;
const ICON_SIZE_DESKTOP = 64;

export default function CategorySection({ onCategoryClick }) {
  return (
    <div className="fd-cat-row">
      <style>{`
        .fd-cat-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .fd-cat-item {
          flex: 1;
          min-width: 0;
          max-width: 96px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 4px 2px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.15s ease;
        }
        .fd-cat-item:hover  { transform: translateY(-3px); }
        .fd-cat-item:active { transform: scale(0.92); }
        .fd-cat-label {
          font-size: 12px;
          font-weight: 600;
          line-height: 15px;
          color: #1C1C1E;
          text-align: center;
        }
        .fd-cat-icon-desktop { display: none; }
        /* The third category pulses gently, same as in the app */
        @keyframes fdCatPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.12); }
        }
        .fd-cat-pulse { animation: fdCatPulse 1.7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fd-cat-pulse { animation: none; }
        }

        @media (min-width: 1024px) {
          .fd-cat-row { justify-content: flex-start; gap: 28px; }
          .fd-cat-item { flex: none; width: 120px; max-width: none; gap: 10px; }
          .fd-cat-label { font-size: 14px; line-height: 18px; }
          .fd-cat-icon-mobile  { display: none; }
          .fd-cat-icon-desktop { display: block; }
        }
      `}</style>

      {homeCategories.map((category) => (
        <button
          key={category.id}
          type="button"
          className="fd-cat-item"
          onClick={() => onCategoryClick(category.id, category.name)}
        >
          <span className={category.id === 'personal_care' ? 'fd-cat-pulse' : undefined}>
            <span className="fd-cat-icon-mobile">
              <CategoryIcon category={category} size={ICON_SIZE_MOBILE} />
            </span>
            <span className="fd-cat-icon-desktop">
              <CategoryIcon category={category} size={ICON_SIZE_DESKTOP} />
            </span>
          </span>
          <span className="fd-cat-label">{category.name}</span>
        </button>
      ))}
    </div>
  );
}

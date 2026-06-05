import { ShoppingCartIcon, BuildingStorefrontIcon, GiftIcon, InboxIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const categories = [
  { id: 'fast_food',     name: 'Fast Food',    Icon: BuildingStorefrontIcon, color: '#DC0C25', bg: '#FEF2F2' },
  { id: 'pharmacy',      name: 'Rice & Curry', Icon: InboxIcon,              color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'personal_care', name: 'City Food',    Icon: GiftIcon,               color: '#0284C7', bg: '#F0F9FF' },
  { id: 'grocery',       name: 'Grocery',      Icon: ShoppingCartIcon,       color: '#16A34A', bg: '#F0FDF4' },
];

const CategoryItem = ({ category, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const Icon = category.Icon;

  return (
    <button
      onClick={() => onClick(category.id, category.name)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        background: hovered ? category.bg : 'white',
        border: `1.5px solid ${hovered ? category.color + '40' : '#F1F5F9'}`,
        cursor: 'pointer',
        padding: '14px 8px',
        borderRadius: '16px',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 8px 24px ${category.color}22` : '0 1px 4px rgba(0,0,0,0.04)',
        flex: '1',
        minWidth: '72px',   // enough for icon + 2-line label
        maxWidth: '120px',  // prevent over-stretching on desktop
      }}
    >
      <div style={{
        width: '48px', height: '48px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: hovered ? category.color + '18' : category.bg,
        borderRadius: '13px',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}>
        <Icon style={{ width: '24px', height: '24px', color: category.color }} />
      </div>
      <span style={{
        fontSize: '11px',
        fontWeight: 600,
        color: hovered ? category.color : '#374151',
        transition: 'color 0.2s',
        textAlign: 'center',
        lineHeight: '1.3',
        // Allow wrapping so text is never clipped
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        width: '100%',
      }}>
        {category.name}
      </span>
    </button>
  );
};

export default function CategorySection({ onCategoryClick }) {
  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      // Allow natural wrapping on very small screens, scrollable on mid sizes
      flexWrap: 'nowrap',
      overflowX: 'auto',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      paddingBottom: '2px', // prevent shadow clip
    }}>
      <style>{`
        .cat-row::-webkit-scrollbar { display: none; }
        @media (min-width: 480px) {
          .cat-row { justify-content: space-between !important; overflow-x: visible !important; }
        }
      `}</style>
      {categories.map((cat) => (
        <CategoryItem key={cat.id} category={cat} onClick={onCategoryClick} />
      ))}
    </div>
  );
}
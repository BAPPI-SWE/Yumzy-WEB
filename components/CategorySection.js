import { ShoppingCartIcon, BuildingStorefrontIcon, GiftIcon, InboxIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const categories = [
  { id: 'fast_food',      name: 'Fast Food',   Icon: BuildingStorefrontIcon, color: '#DC0C25', bg: '#FEF2F2' },
  { id: 'pharmacy',       name: 'Rice & Curry', Icon: InboxIcon,              color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'personal_care',  name: 'City Food',   Icon: GiftIcon,               color: '#0284C7', bg: '#F0F9FF' },
  { id: 'grocery',        name: 'Grocery',     Icon: ShoppingCartIcon,       color: '#16A34A', bg: '#F0FDF4' },
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
        gap: '8px',
        background: hovered ? category.bg : 'white',
        border: `1.5px solid ${hovered ? category.color + '40' : '#F1F5F9'}`,
        cursor: 'pointer',
        padding: '18px 12px',
        borderRadius: '16px',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 8px 24px ${category.color}22` : '0 1px 4px rgba(0,0,0,0.04)',
        flex: '1',
        minWidth: 0,
      }}
    >
      <div style={{
        width: '52px', height: '52px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: hovered ? category.color + '18' : category.bg,
        borderRadius: '14px',
        transition: 'background 0.2s',
      }}>
        <Icon style={{ width: '26px', height: '26px', color: category.color }} />
      </div>
      <span style={{
        fontSize: '12px', fontWeight: 600,
        color: hovered ? category.color : '#374151',
        transition: 'color 0.2s', textAlign: 'center',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        width: '100%',
      }}>
        {category.name}
      </span>
    </button>
  );
};

export default function CategorySection({ onCategoryClick }) {
  return (
    <div>
      {/* Desktop: horizontal card row (handled by grid in home page) */}
      {/* Mobile: compact pill row */}
      <div style={{
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        <style>{`.cat-scroll::-webkit-scrollbar { display: none; }`}</style>
        {categories.map((cat) => (
          <CategoryItem key={cat.id} category={cat} onClick={onCategoryClick} />
        ))}
      </div>
    </div>
  );
}
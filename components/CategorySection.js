import { ShoppingCartIcon, BuildingStorefrontIcon, BeakerIcon, GiftIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

// Define categories
const categories = [
  { id: 'fast_food', name: 'Fast Food', Icon: BuildingStorefrontIcon },
  { id: 'pharmacy', name: 'Pharmacy', Icon: BeakerIcon },
  { id: 'personal_care', name: 'City Food', Icon: GiftIcon },
  { id: 'grocery', name: 'Grocery', Icon: ShoppingCartIcon },
];

const CategoryItem = ({ category, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = category.Icon;

  return (
    <button
      onClick={() => onClick(category.id, category.name)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px'
      }}
    >
      <div style={{
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isHovered ? 'rgba(213, 0, 50, 0.2)' : 'rgba(213, 0, 50, 0.1)',
        borderRadius: '9999px',
        transition: 'background-color 0.2s'
      }}>
        <Icon style={{
          width: '28px',
          height: '28px',
          color: '#D50032'
        }} />
      </div>
      <span style={{
        fontSize: '12px',
        fontWeight: 600,
        color: isHovered ? '#D50032' : '#374151',
        transition: 'color 0.2s',
        textAlign: 'center'
      }}>
        {category.name}
      </span>
    </button>
  );
};

export default function CategorySection({ onCategoryClick }) {
  return (
    <div style={{
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingTop: '16px'
    }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 700,
        marginBottom: '16px',
        color: '#1F2937'
      }}>
        Categories
      </h2>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-start'
      }}>
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            onClick={onCategoryClick}
          />
        ))}
      </div>
    </div>
  );
}
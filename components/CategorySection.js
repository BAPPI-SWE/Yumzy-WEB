import { ShoppingCartIcon, BuildingStorefrontIcon, BeakerIcon, GiftIcon } from '@heroicons/react/24/outline';

// Define categories (similar to your Category data class)
const categories = [
  { id: 'fast_food', name: 'Fast Food', Icon: BuildingStorefrontIcon }, // Replaced Fastfood with BuildingStorefront
  { id: 'pharmacy', name: 'Pharmacy', Icon: BeakerIcon }, // Replaced LocalPharmacy with Beaker
  { id: 'personal_care', name: 'City Food', Icon: GiftIcon }, // Replaced FoodBank with Gift
  { id: 'grocery', name: 'Grocery', Icon: ShoppingCartIcon },
];

const CategoryItem = ({ category, onClick }) => {
  const Icon = category.Icon;
  return (
    <button
      onClick={() => onClick(category.id, category.name)}
      className="flex flex-col items-center space-y-1.5 group"
    >
      <div className="w-14 h-14 flex items-center justify-center bg-deepPink/10 rounded-full transition group-hover:bg-deepPink/20">
        <Icon className="w-7 h-7 text-deepPink" />
      </div>
      <span className="text-xs font-semibold text-gray-700 group-hover:text-deepPink">
        {category.name}
      </span>
    </button>
  );
};

export default function CategorySection({ onCategoryClick }) {
  return (
    <div className="px-4 pt-4">
         <h2 className="text-lg font-bold mb-4 text-gray-800">Categories</h2>
        <div className="flex justify-around items-start">
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
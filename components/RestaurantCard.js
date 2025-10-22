import { useState } from 'react';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, MapPinIcon, ClockIcon, CheckBadgeIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid'; // Use BuildingStorefront for Restaurant

// Simple Image component
const RestaurantImage = ({ src, alt }) => (
  <img
    src={src || '/placeholder-restaurant.png'} // Provide a restaurant fallback image
    alt={alt}
    className="absolute inset-0 w-full h-full object-cover"
    loading="lazy"
  />
);

export default function RestaurantCard({ restaurant, onClick }) {
  const [isFavorite, setIsFavorite] = useState(false); // Simple favorite state

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition transform hover:shadow-xl hover:-translate-y-1 duration-200"
    >
      {/* Image Section */}
      <div className="relative h-[130px] w-full">
        <RestaurantImage src={restaurant.imageUrl} alt={restaurant.name} />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking button
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white"
        >
          {isFavorite ? (
            <HeartSolid className="w-5 h-5 text-red-500" />
          ) : (
            <HeartOutline className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Info Section */}
      <div className="p-3.5">
        <h3 className="text-base font-bold text-gray-800 truncate">
          {restaurant.name}
        </h3>
        {/* Cuisine */}
        <div className="flex items-center mt-1 text-sm text-gray-600">
          <BuildingStorefrontIcon className="w-4 h-4 mr-1.5 text-brandPink/70 flex-shrink-0" />
          <span className="truncate">{restaurant.cuisine}</span>
        </div>

        {/* Badges/Tags */}
        <div className="flex items-center justify-between mt-2.5 text-xs">
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
            <CheckBadgeIcon className="w-3.5 h-3.5" />
            <span>Verified</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-500">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>Deliver in Time</span> {/* Assuming this is always true for now */}
          </div>
        </div>
      </div>
    </div>
  );
}
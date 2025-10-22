import { BuildingStorefrontIcon, TagIcon, NoSymbolIcon } from '@heroicons/react/24/solid';

// Simplified Card for displaying search results
const SearchResultCard = ({ type, data, onClick }) => {
    let title = '';
    let subtitle = '';
    let imageUrl = null;
    let Icon = TagIcon; // Default icon
    let isOpen = true; // Assume open unless specified

    switch (type) {
        case 'restaurant':
            title = data.name;
            subtitle = data.cuisine;
            imageUrl = data.imageUrl;
            Icon = BuildingStorefrontIcon;
            break;
        case 'subCategory':
            title = data.name;
            subtitle = `${data.itemCount} items`;
            imageUrl = data.imageUrl;
            Icon = TagIcon;
            break;
        case 'miniRestaurant':
            title = data.name;
            subtitle = 'Shop'; // Simple label
            imageUrl = data.imageUrl;
            Icon = BuildingStorefrontIcon;
            isOpen = data.open === 'yes';
            break;
    }

    return (
        <button
            onClick={onClick}
            disabled={!isOpen}
            className={`w-full flex items-center p-3 space-x-4 text-left hover:bg-gray-100 transition border-b border-gray-100 last:border-b-0 rounded-lg ${
                !isOpen ? 'opacity-60 cursor-not-allowed' : ''
            }`}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-200"
                />
            ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-gray-400" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{title}</p>
                <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                {!isOpen && (
                    <div className="flex items-center text-xs text-red-500 font-medium mt-0.5">
                        <NoSymbolIcon className="w-3 h-3 mr-1" />
                        <span>Closed</span>
                    </div>
                )}
            </div>
        </button>
    );
};

export default function SearchResultsList({
    results,
    onRestaurantClick,
    onSubCategoryClick,
    onMiniRestaurantClick,
}) {
    // Return null if results aren't ready or search is empty
    if (results === null) return null;

    return (
        <div className="absolute top-[110px] left-0 right-0 bottom-0 bg-white shadow-lg overflow-y-auto z-30 md:max-w-md md:mx-auto md:bottom-auto md:rounded-b-lg">
            <div className="p-2 space-y-1">
                {results.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">No results found.</p>
                ) : (
                    results.map((result, index) => (
                        <SearchResultCard
                            key={`${result.type}-${result.data.id || result.data.ownerId || index}`}
                            type={result.type}
                            data={result.data}
                            onClick={() => {
                                if (result.type === 'restaurant') {
                                    onRestaurantClick(result.data.ownerId, result.data.name);
                                } else if (result.type === 'subCategory') {
                                    onSubCategoryClick(result.data.name);
                                } else if (result.type === 'miniRestaurant') {
                                    onMiniRestaurantClick(
                                        result.data.id,
                                        result.data.name,
                                        result.data.open === 'yes'
                                    );
                                }
                            }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

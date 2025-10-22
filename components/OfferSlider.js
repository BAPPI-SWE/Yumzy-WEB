// Simple Image component that handles potential missing images
const OfferImage = ({ src, alt }) => {
    // In a real app, you might use Next.js <Image> component for optimization,
    // but for simplicity, we use a standard <img> tag.
    // Add error handling if needed.
    return (
        <img
            src={src || '/placeholder-image.png'} // Provide a fallback image path if src is empty
            alt={alt}
            className="w-full h-full object-cover" // Ensure image covers the card
            loading="lazy" // Lazy load images
        />
    );
};

export default function OfferSlider({ offers }) {
  if (!offers || offers.length === 0) {
    return null; // Don't render anything if there are no offers
  }

  return (
    <div className="px-4 pt-2"> {/* Add horizontal padding */}
        <h2 className="text-lg font-bold mb-3 text-gray-800">Special Offers</h2>
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide"> {/* Enable horizontal scroll */}
        {offers.map((offer, index) => (
            <div
            key={index}
            className="flex-shrink-0 w-[280px] h-[140px] rounded-xl overflow-hidden shadow-md cursor-pointer transform hover:scale-105 transition-transform duration-200"
            >
            <OfferImage src={offer.imageUrl} alt={`Offer ${index + 1}`} />
            </div>
        ))}
        </div>
        {/* Basic scrollbar styling (optional, might need browser prefixes) */}
        <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none; /* Hide scrollbar for Chrome, Safari and Opera */
        }
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
        `}</style>
    </div>
  );
}
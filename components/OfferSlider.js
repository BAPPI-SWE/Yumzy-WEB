// Simple Image component that handles potential missing images
const OfferImage = ({ src, alt }) => {
  return (
    <img
      src={src || '/placeholder-image.png'}
      alt={alt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
      loading="lazy"
    />
  );
};

export default function OfferSlider({ offers }) {
  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <div style={{
      paddingLeft: '16px',
      paddingRight: '16px',
      paddingTop: '8px'
    }}>
      <h2 style={{
        fontSize: '18px',
        fontWeight: 700,
        marginBottom: '12px',
        color: '#1F2937'
      }}>
        Special Offers
      </h2>
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        {offers.map((offer, index) => (
          <div
            key={index}
            style={{
              flexShrink: 0,
              width: '280px',
              height: '140px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              transform: 'scale(1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <OfferImage src={offer.imageUrl} alt={`Offer ${index + 1}`} />
          </div>
        ))}
      </div>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
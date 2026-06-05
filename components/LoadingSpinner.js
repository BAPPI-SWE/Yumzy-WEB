// LoadingSpinner.js
// Used everywhere EXCEPT the first-time splash (pages/index.js)
// Shows an animated "FOODISH" wordmark loader

export default function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#fff',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Keania+One&display=swap');

        @keyframes foodish-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.97); }
        }
        @keyframes foodish-bar {
          0%   { width: 0%; }
          60%  { width: 80%; }
          100% { width: 100%; }
        }
        @keyframes foodish-dot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40%           { transform: scale(1);   opacity: 1;   }
        }

        .foodish-logo-text {
          font-family: 'Keania One', cursive;
          font-size: 42px;
          color: #DC0C25;
          letter-spacing: 3px;
          animation: foodish-pulse 1.8s ease-in-out infinite;
          user-select: none;
        }

        .foodish-bar-track {
          width: 140px;
          height: 3px;
          background: #F1F5F9;
          border-radius: 99px;
          overflow: hidden;
          margin-top: 20px;
        }
        .foodish-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #DC0C25, #FF4057);
          border-radius: 99px;
          animation: foodish-bar 1.6s ease-in-out infinite;
        }

        .foodish-dots {
          display: flex;
          gap: 6px;
          margin-top: 16px;
        }
        .foodish-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #DC0C25;
          animation: foodish-dot 1.2s ease-in-out infinite;
        }
        .foodish-dot:nth-child(1) { animation-delay: 0s; }
        .foodish-dot:nth-child(2) { animation-delay: 0.2s; }
        .foodish-dot:nth-child(3) { animation-delay: 0.4s; }

        .foodish-tagline {
          margin-top: 14px;
          font-size: 12px;
          font-weight: 600;
          color: #9CA3AF;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>

      <span className="foodish-logo-text">FOODISH</span>

      <div className="foodish-bar-track">
        <div className="foodish-bar-fill" />
      </div>

      <div className="foodish-dots">
        <div className="foodish-dot" />
        <div className="foodish-dot" />
        <div className="foodish-dot" />
      </div>

      <p className="foodish-tagline">Loading your experience</p>
    </div>
  );
}
// pages/index.js
// - First visit ever:
//     mobile  → Lottie splash (existing animation)
//     desktop → new red branded splash
// - Every visit after: just the spinner while auth resolves → redirect
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('react-lottie-player'), { ssr: false });
import splashAnimation from '../public/splash_animation.json';

const SPLASH_SEEN_KEY  = 'foodishSplashSeen';
const SPLASH_DURATION  = 2800; // ms — how long to show the splash

// ─── Desktop Splash ───────────────────────────────────────────────
function DesktopSplash() {
  const [visible, setVisible] = useState(false);

  // Fade in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(145deg, #DC0C25 0%, #A50018 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Keania+One&display=swap');

        @keyframes ds-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes ds-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ds-bar {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes ds-shine {
          0%   { left: -60%; }
          100% { left: 120%; }
        }

        .ds-emoji {
          font-size: 72px;
          animation: ds-float 3s ease-in-out infinite;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.25));
          margin-bottom: 24px;
        }
        .ds-wordmark {
          font-family: 'Keania One', cursive;
          font-size: 72px;
          color: #fff;
          letter-spacing: 6px;
          line-height: 1;
          text-shadow: 0 4px 32px rgba(0,0,0,0.2);
          animation: ds-fade-up 0.7s ease both;
          animation-delay: 0.15s;
          position: relative;
          overflow: hidden;
          display: inline-block;
          user-select: none;
        }
        .ds-wordmark::after {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          animation: ds-shine 2.2s ease-in-out infinite;
          animation-delay: 0.8s;
        }
        .ds-tagline {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.65);
          letter-spacing: 3.5px;
          text-transform: uppercase;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin-top: 10px;
          animation: ds-fade-up 0.7s ease both;
          animation-delay: 0.3s;
        }
        .ds-bar-track {
          width: 180px;
          height: 3px;
          background: rgba(255,255,255,0.2);
          border-radius: 99px;
          overflow: hidden;
          margin-top: 48px;
          animation: ds-fade-up 0.5s ease both;
          animation-delay: 0.5s;
        }
        .ds-bar-fill {
          height: 100%;
          background: rgba(255,255,255,0.85);
          border-radius: 99px;
          animation: ds-bar ${SPLASH_DURATION}ms ease-out both;
          animation-delay: 0.4s;
        }
        .ds-version {
          position: absolute;
          bottom: 28px;
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          letter-spacing: 1px;
        }
      `}</style>

      <div className="ds-emoji">🍔</div>
      <span className="ds-wordmark">FOODISH</span>
      <p className="ds-tagline">Order. Eat. Repeat.</p>

      <div className="ds-bar-track">
        <div className="ds-bar-fill" />
      </div>

      <span className="ds-version">Daffodil Smart City</span>
    </div>
  );
}

// ─── Mobile Splash (Lottie) ───────────────────────────────────────
function MobileSplash() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100vw',
      backgroundColor: 'white', overflow: 'hidden',
    }}>
      <Lottie
        loop
        animationData={splashAnimation}
        play
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}

// ─── Minimal redirect spinner ─────────────────────────────────────
function RedirectSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', backgroundColor: '#F8FAFC',
    }}>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid #F1F5F9',
        borderTop: '3px solid #DC0C25',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function IndexPage() {
  const { user, profileExists, loading } = useAuth();
  const router   = useRouter();
  const redirected = useRef(false);
  const [phase, setPhase] = useState('init'); // 'init' | 'splash' | 'redirect'

  // Detect mobile once on client
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768;

  const doRedirect = () => {
    if (redirected.current) return;
    redirected.current = true;
    router.replace(
      user ? (profileExists ? '/home' : '/details') : '/auth'
    );
  };

  useEffect(() => {
    const hasSeenSplash = localStorage.getItem(SPLASH_SEEN_KEY) === 'true';

    if (hasSeenSplash) {
      // Returning user — skip splash, go straight to redirect
      setPhase('redirect');
    } else {
      // First visit ever — show splash, mark seen
      localStorage.setItem(SPLASH_SEEN_KEY, 'true');
      setPhase('splash');

      const timer = setTimeout(() => {
        setPhase('redirect');
      }, SPLASH_DURATION);

      return () => clearTimeout(timer);
    }
  }, []);

  // Redirect as soon as phase is 'redirect' AND auth has resolved
  useEffect(() => {
    if (phase === 'redirect' && !loading) {
      doRedirect();
    }
  }, [phase, loading]);

  if (phase === 'init') return null; // tiny flash before localStorage read

  if (phase === 'splash') {
    return isMobile ? <MobileSplash /> : <DesktopSplash />;
  }

  // phase === 'redirect' — show spinner while auth + navigation completes
  return <RedirectSpinner />;
}
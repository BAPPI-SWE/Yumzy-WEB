import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const SPLASH_SEEN_KEY = 'yumzySplashSeen'; // Key for localStorage (persistent)
const SPLASH_DURATION = 2500; // 2.5 seconds for animation

export default function Splash() {
  const { user, profileExists, loading } = useAuth();
  const router = useRouter();
  const [showSplashAnimation, setShowSplashAnimation] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check if splash has been seen *ever* (using localStorage for persistence)
    const hasSeenSplash = localStorage.getItem(SPLASH_SEEN_KEY) === 'true';

    if (hasSeenSplash) {
      // --- Skip Splash Animation (Already seen before) ---
      setShowSplashAnimation(false);
      
      // Redirect immediately based on auth state (once loaded)
      if (!loading && !isRedirecting) {
        setIsRedirecting(true);
        if (user) {
          router.replace(profileExists ? '/home' : '/details');
        } else {
          router.replace('/auth');
        }
      }
    } else {
      // --- Show Splash Animation (First Time Ever) ---
      setShowSplashAnimation(true);
      
      // Mark splash as seen for future visits
      localStorage.setItem(SPLASH_SEEN_KEY, 'true');

      // Wait for splash animation to complete AND auth to be ready
      const splashTimer = setTimeout(() => {
        if (!loading && !isRedirecting) {
          setIsRedirecting(true);
          if (user) {
            router.replace(profileExists ? '/home' : '/details');
          } else {
            router.replace('/auth');
          }
        }
      }, SPLASH_DURATION);

      // Cleanup timer
      return () => clearTimeout(splashTimer);
    }
  }, [user, profileExists, loading, router, isRedirecting]);

  // Handle case where auth loads after splash duration
  useEffect(() => {
    if (!showSplashAnimation && !loading && !isRedirecting) {
      setIsRedirecting(true);
      if (user) {
        router.replace(profileExists ? '/home' : '/details');
      } else {
        router.replace('/auth');
      }
    }
  }, [loading, user, profileExists, showSplashAnimation, router, isRedirecting]);

  // Show splash animation or nothing while redirecting
  if (showSplashAnimation) {
    return <LoadingSpinner />;
  }

  // Show a blank white screen while redirecting quickly
  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Optional: Simple loading indicator for very slow redirects */}
      {loading && (
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #F3F4F6',
          borderTop: '4px solid #DC0C25',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
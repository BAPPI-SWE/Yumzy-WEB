import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// This page acts as our "Splash Screen" and router
export default function Splash() {
  const { user, profileExists, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // We wait until Firebase has checked the auth state
    if (!loading) {
      if (user) {
        // User is logged in
        if (profileExists) {
          // And has a profile, go to the main app
          router.push('/home');
        } else {
          // New user, needs to create a profile
          router.push('/details');
        }
      } else {
        // No user, go to login
        router.push('/auth');
      }
    }
  }, [user, profileExists, loading, router]);

  // While loading, show the splash animation
  return <LoadingSpinner />;
}
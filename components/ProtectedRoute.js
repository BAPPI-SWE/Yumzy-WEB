import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { user, profileExists, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth'); // Redirect to login if not authenticated
      } else if (!profileExists) {
        router.push('/details'); // Redirect to details if profile is incomplete
      }
    }
  }, [user, profileExists, loading, router]);

  // Show loading spinner while checks are performed or if redirecting
  if (loading || !user || !profileExists) {
    return <LoadingSpinner />;
  }

  // If authenticated and profile exists, render the child component (the actual page)
  return children;
}
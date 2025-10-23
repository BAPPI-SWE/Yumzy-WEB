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
        router.push('/auth');
      } else if (!profileExists) {
        router.push('/details');
      }
    }
  }, [user, profileExists, loading, router]);

  if (loading || !user || !profileExists) {
    return <LoadingSpinner />;
  }

  return children;
}
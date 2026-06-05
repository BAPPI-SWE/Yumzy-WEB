// ProtectedRoute.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

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

  // Auth is still resolving — show a minimal centered spinner, not the splash screen
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#F8FAFC',
        gap: '16px',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          border: '3px solid #F1F5F9',
          borderTop: '3px solid #DC0C25',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }} />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Auth resolved but user/profile not ready yet — render nothing while
  // the useEffect above redirects. Avoids flash of protected content.
  if (!user || !profileExists) {
    return null;
  }

  return children;
}
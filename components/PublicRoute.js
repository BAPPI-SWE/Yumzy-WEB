// components/PublicRoute.js
//
// For pages that everyone can open, logged in or not (home, menus, cart...).
// It never redirects. It only waits until Firebase knows whether someone is
// logged in, so the page loads once with the right data (location or not)
// and renders the same way on the server and in the browser.

import { useAuth } from '../context/AuthContext';

export default function PublicRoute({ children }) {
  const { loading } = useAuth();

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

  return children;
}

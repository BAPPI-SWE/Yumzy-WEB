import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function EmailSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  const { user, profileExists, loading, emailSignIn } = useAuth();
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (isProcessing) return;

    if (!email || !password) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      await emailSignIn(email, password);
    } catch (err) {
      setError('Failed to sign in. Please check your email and password.');
      console.error(err);
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      if (profileExists) {
        router.push('/home');
      } else {
        router.push('/details');
      }
    }
  }, [user, profileExists, loading, router]);

  if (loading || user) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '16px',
      backgroundColor: '#F9FAFB'
    }}>
      <form
        onSubmit={handleSignIn}
        style={{
          width: '100%',
          maxWidth: '448px',
          padding: '32px',
          backgroundColor: 'white',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderRadius: '16px'
        }}
      >
        <h1 style={{
          fontSize: '30px',
          fontWeight: 700,
          textAlign: 'center',
          color: '#1F2937'
        }}>
          Welcome Back
        </h1>
        <p style={{
          marginTop: '8px',
          textAlign: 'center',
          color: '#4B5563'
        }}>
          Sign in to continue your session
        </p>

        {error && (
          <p style={{
            marginTop: '16px',
            textAlign: 'center',
            color: '#991B1B',
            backgroundColor: '#FEE2E2',
            padding: '12px',
            borderRadius: '8px'
          }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            placeholder="Email Address"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '18px',
              border: emailFocused ? '2px solid #D50032' : '1px solid #D1D5DB',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            placeholder="Password"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '18px',
              border: passwordFocused ? '2px solid #D50032' : '1px solid #D1D5DB',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          style={{
            width: '100%',
            height: '50px',
            marginTop: '32px',
            fontSize: '18px',
            fontWeight: 600,
            color: 'white',
            backgroundColor: isProcessing ? '#9CA3AF' : '#D50032',
            borderRadius: '12px',
            border: 'none',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.9 : 1,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.opacity = '1')}
        >
          {isProcessing ? 'Signing In...' : 'Sign In'}
        </button>

        <Link href="/auth" passHref>
          <div
            onMouseEnter={() => setLinkHovered(true)}
            onMouseLeave={() => setLinkHovered(false)}
            style={{
              display: 'block',
              marginTop: '24px',
              textAlign: 'center',
              color: '#D50032',
              textDecoration: linkHovered ? 'underline' : 'none',
              cursor: 'pointer'
            }}
          >
            Back to main options
          </div>
        </Link>
      </form>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { auth } from '../firebase/config';
import { updateProfile } from 'firebase/auth';

export default function EmailSignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  const { user, profileExists, loading, emailSignUp } = useAuth();
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (isProcessing) return;

    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      const userCredential = await emailSignUp(email, password);
      await updateProfile(auth.currentUser, {
        displayName: name,
      });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Try signing in.');
      } else {
        setError('Failed to create account. Please try again.');
      }
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
        onSubmit={handleSignUp}
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
          Create an Account
        </h1>

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
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            placeholder="Full Name"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '18px',
              border: nameFocused ? '2px solid #D50032' : '1px solid #D1D5DB',
              borderRadius: '12px',
              outline: 'none',
              transition: 'border 0.2s'
            }}
          />
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
            placeholder="Password (min. 6 characters)"
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
          {isProcessing ? 'Creating Account...' : 'Sign Up'}
        </button>

        <Link href="/email-sign-in" passHref>
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
            Already have an account? Sign In
          </div>
        </Link>
      </form>
    </div>
  );
}
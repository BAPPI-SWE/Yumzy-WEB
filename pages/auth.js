import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Google icon component
const GoogleIcon = () => (
  <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 48 48">
    <path
      fill="#4285F4"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.5 6.51C13.01 13.38 18.08 9.5 24 9.5z"
    ></path>
    <path
      fill="#34A853"
      d="M46.94 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h12.8c-.55 2.72-2.13 4.97-4.54 6.51l8.5 6.51c4.98-4.58 7.94-11.45 7.94-19.53z"
    ></path>
    <path
      fill="#FBBC05"
      d="M10.73 28.09c-.5-1.52-.78-3.14-.78-4.81s.28-3.29.78-4.81l-8.5-6.51C.96 15.7 0 19.73 0 24c0 4.27.96 8.3 2.23 11.91l8.5-6.82z"
    ></path>
    <path
      fill="#EA4335"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.61l-8.5-6.51c-2.18 1.45-4.94 2.3-8.39 2.3-5.91 0-10.99-3.88-12.98-9.18l-8.5 6.51C6.51 42.62 14.62 48 24 48z"
    ></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

export default function AuthScreen() {
  const { user, profileExists, loading, googleSignIn } = useAuth();
  const router = useRouter();
  const [isGoogleHovered, setIsGoogleHovered] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isSignUpHovered, setIsSignUpHovered] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error('Google Sign-In Error', error);
      alert('Failed to sign in with Google. Please try again.');
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
      minHeight: '100vh',
      backgroundColor: '#D50032'
    }}>
      {/* Top section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '80px',
        color: 'white'
      }}>
        <h1 style={{
          fontSize: '30px',
          fontWeight: 700
        }}>
          Welcome to Yumzy🍕
        </h1>
        <p style={{
          marginTop: '12px',
          fontSize: '18px',
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          Let&apos;s satisfy those cravings together!
        </p>
        <div style={{
          marginTop: '32px',
          width: '144px',
          height: '144px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span style={{ fontSize: '96px' }}>🍜</span>
        </div>
      </div>

      {/* Bottom Card */}
      <div style={{
        flex: 1,
        marginTop: '32px',
        backgroundColor: 'white',
        borderTopLeftRadius: '30px',
        borderTopRightRadius: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '448px',
          padding: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            textAlign: 'center',
            color: 'black'
          }}>
            Sign up or Log in
          </h2>
          <p style={{
            marginTop: '8px',
            fontSize: '14px',
            textAlign: 'center',
            color: '#4B5563'
          }}>
            Select your preferred method to continue
          </p>

          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Continue with Google */}
            <button
              onClick={handleGoogleSignIn}
              onMouseEnter={() => setIsGoogleHovered(true)}
              onMouseLeave={() => setIsGoogleHovered(false)}
              style={{
                width: '100%',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                backgroundColor: isGoogleHovered ? '#F9FAFB' : 'white',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <GoogleIcon />
              <span style={{
                fontSize: '16px',
                fontWeight: 500,
                color: 'black'
              }}>
                Continue with Google
              </span>
            </button>

         
            {/* Sign In with Email */}
            <Link href="/email-sign-in" passHref legacyBehavior>
              {/* The <a> tag is the SINGLE direct child of <Link> */}
              <a style={{ textDecoration: 'none' }}>
                {/* The styled div is INSIDE the <a> tag */}
                <div
                  onMouseEnter={() => setIsEmailHovered(true)}
                  onMouseLeave={() => setIsEmailHovered(false)}
                  style={{
                    width: '100%',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    backgroundColor: '#D50032',
                    color: 'white',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    opacity: isEmailHovered ? 0.9 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span style={{ fontSize: '16px', fontWeight: 500 }}>Sign In with Email</span>
                </div>
              </a>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, borderTop: '1px solid #D1D5DB' }}></div>
              <span style={{ padding: '0 16px', fontSize: '14px', color: '#6B7280' }}>or</span>
              <div style={{ flex: 1, borderTop: '1px solid #D1D5DB' }}></div>
            </div>

    {/* Sign Up with Email */}
            <Link href="/email-sign-up" passHref legacyBehavior>
              {/* The <a> tag is the SINGLE direct child of <Link> */}
              <a style={{ textDecoration: 'none' }}>
                {/* The styled div is INSIDE the <a> tag */}
                <div
                  onMouseEnter={() => setIsSignUpHovered(true)}
                  onMouseLeave={() => setIsSignUpHovered(false)}
                  style={{
                    width: '100%',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    border: '1px solid #9CA3AF',
                    color: '#374151',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    backgroundColor: isSignUpHovered ? '#F9FAFB' : 'white',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 500 }}>Sign Up with Email</span>
                </div>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
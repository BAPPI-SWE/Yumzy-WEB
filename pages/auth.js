import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// This is our Google icon. We can't import R.drawable, so we use an SVG.
const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 48 48">
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

  // --- Handle Google Sign-In ---
  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
      // The onAuthStateChanged listener in AuthContext will handle the redirect
    } catch (error) {
      console.error('Google Sign-In Error', error);
      alert('Failed to sign in with Google. Please try again.');
    }
  };

  // --- Redirect logic ---
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

  // --- This is the UI, translated from your AuthScreen.kt ---
  return (
    <div className="flex flex-col min-h-screen bg-deepPink">
      {/* Top section */}
      <div className="flex flex-col items-center pt-20 text-white">
        <h1 className="text-3xl font-bold">Welcome to Yumzy🍕</h1>
        <p className="mt-3 text-lg text-white/90">
          Let's satisfy those cravings together!
        </p>
        <div className="mt-8 w-36 h-36 flex items-center justify-center">
          {/* We don't have R.drawable, so let's use a simple emoji as a placeholder */}
          <span className="text-8xl">🛍️</span>
        </div>
      </div>

      {/* Bottom Card */}
      <div className="flex-1 mt-8 bg-white rounded-t-[30px] flex flex-col items-center">
        <div className="w-full max-w-sm p-8">
          <h2 className="text-2xl font-bold text-center text-black">
            Sign up or Log in
          </h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Select your preferred method to continue
          </p>

          <div className="mt-8 space-y-4">
            {/* Continue with Google */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full h-[50px] flex items-center justify-center gap-4 border border-gray-300 rounded-xl transition hover:bg-gray-50"
            >
              <GoogleIcon />
              <span className="text-base font-medium text-black">
                Continue with Google
              </span>
            </button>

            {/* Sign In with Email */}
            <Link
              href="/email-sign-in"
              className="w-full h-[50px] flex items-center justify-center gap-4 bg-deepPink text-white rounded-xl transition hover:bg-opacity-90"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-base font-medium">Sign In with Email</span>
            </Link>

            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Sign Up with Email */}
            <Link
              href="/email-sign-up"
              className="w-full h-[50px] flex items-center justify-center gap-4 border border-gray-400 text-gray-700 rounded-xl transition hover:bg-gray-50"
            >
              <span className="text-base font-medium">Sign Up with Email</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
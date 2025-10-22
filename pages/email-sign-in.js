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

  const { user, profileExists, loading, emailSignIn } = useAuth();
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault(); // Prevent form from submitting normally
    if (isProcessing) return;

    if (!email || !password) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      await emailSignIn(email, password);
      // AuthContext will handle redirect
    } catch (err) {
      setError('Failed to sign in. Please check your email and password.');
      console.error(err);
      setIsProcessing(false);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <form
        onSubmit={handleSignIn}
        className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Welcome Back
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Sign in to continue your session
        </p>

        {error && (
          <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-lg">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink"
          />
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full h-[50px] mt-8 text-lg font-semibold text-white rounded-xl transition ${
            isProcessing
              ? 'bg-gray-400'
              : 'bg-deepPink hover:bg-opacity-90'
          }`}
        >
          {isProcessing ? 'Signing In...' : 'Sign In'}
        </button>

        <Link
          href="/auth"
          className="block mt-6 text-center text-deepPink hover:underline"
        >
          Back to main options
        </Link>
      </form>
    </div>
  );
}
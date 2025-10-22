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
      // 1. Create the user
      const userCredential = await emailSignUp(email, password);

      // 2. Update their Firebase Auth profile with the name
      await updateProfile(auth.currentUser, {
        displayName: name,
      });

      // AuthContext will detect the new user and redirect to /details
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

  // --- Redirect logic ---
  useEffect(() => {
    if (!loading && user) {
      // New user (no profile) will be sent to /details
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
        onSubmit={handleSignUp}
        className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Create an Account
        </h1>

        {error && (
          <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-lg">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-deepPink"
          />
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
            placeholder="Password (min. 6 characters)"
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
          {isProcessing ? 'Creating Account...' : 'Sign Up'}
        </button>

        <Link
          href="/email-sign-in"
          className="block mt-6 text-center text-deepPink hover:underline"
        >
          Already have an account? Sign In
        </Link>
      </form>
    </div>
  );
}
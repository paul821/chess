//pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { signInUser, createUser } from '../lib/firebase';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await createUser(username, password);
      } else {
        await signInUser(username, password);
      }

      // Redirect to original page or home
      const redirectTo = router.query.redirect || '/';
      router.push(redirectTo);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isSignUp ? 'Sign Up' : 'Sign In'} - Chess Trainer</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/" className="text-2xl font-bold text-black hover:text-gray-700">
              Chess Trainer
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isSignUp ? 'Join the chess training platform' : 'Access advanced features and save your progress'}
            </p>
          </div>

          <div className="card">
            <form className="card-body space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="input"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex justify-center items-center"
                >
                  {loading ? (
                    <>
                      <div className="spinner mr-2"></div>
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  className="text-black hover:text-gray-700 text-sm font-medium"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setUsername('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                >
                  {isSignUp 
                    ? 'Already have an account? Sign in' 
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              Don't want to create an account?{' '}
              <Link href="/" className="text-black hover:text-gray-700 font-medium">
                Continue as guest
              </Link>
            </p>
            <p className="mt-2">
              Guest mode provides full access except Style Analyzer and game export.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
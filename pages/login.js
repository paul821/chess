import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { AuthContext } from './_app';

export default function Login() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // If already signed in, redirect to home
  if (user) {
    router.replace('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const email = `${username}@chesstrainer.com`;
    try {
      // Try sign in
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err) {
      // If sign in fails, try sign up
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push('/');
      } catch (signUpErr) {
        setError(signUpErr.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center">
        <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-semibold mb-6 text-center">Sign In</h1>
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <label className="block mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 mb-4 rounded text-black"
            placeholder="your username"
            required
          />
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-6 rounded text-black"
            placeholder="password"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-white text-black font-semibold rounded hover:opacity-90"
          >
            { /* We handle both sign in and sign up in one form */ }
            Sign In or Register
          </button>
        </form>
      </div>
    </div>
  );
}
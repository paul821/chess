import React, { createContext, useState, useEffect } from 'react';
import '../styles/globals.css';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Context to provide current authenticated user throughout the app
export const AuthContext = createContext(null);

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes and set user
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp;

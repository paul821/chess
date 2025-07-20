//pages/_app.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { useAuthState } from '../lib/firebase';
import '../styles/globals.css';

// Auth Context
import { createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = useAuthState((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Protected routes that require authentication
  const protectedRoutes = ['/style'];
  const isProtectedRoute = protectedRoutes.includes(router.pathname);

  useEffect(() => {
    if (!loading && isProtectedRoute && !user) {
      router.push('/login?redirect=' + router.pathname);
    }
  }, [user, loading, router, isProtectedRoute]);

  const authValue = {
    user,
    loading
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      <Head>
        <title>Chess Trainer - Chess, not checkers.</title>
        <meta name="description" content="Professional chess training platform with AI practice, opening explorer, and game analysis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preload chess assets */}
        <link rel="preload" href="/chessboard.min.css" as="style" />
        <link rel="preload" href="/chessboard.min.js" as="script" />
        <link rel="preload" href="/chess.min.js" as="script" />
        
        {/* Chess.js and ChessBoard.js */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.12.1/chess.min.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/chessboardjs/1.0.0/chessboard-1.0.0.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/chessboardjs/1.0.0/chessboard-1.0.0.min.js"></script>
        
        {/* jQuery (required for ChessBoard.js) */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
      </Head>

      <div className="min-h-screen bg-white">
        <Navbar />
        
        <main className="pt-16">
          {isProtectedRoute && !user ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                <p className="text-gray-600 mb-4">Please sign in to access this feature.</p>
                <button
                  onClick={() => router.push('/login')}
                  className="btn-primary"
                >
                  Sign In
                </button>
              </div>
            </div>
          ) : (
            <Component {...pageProps} />
          )}
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default MyApp;
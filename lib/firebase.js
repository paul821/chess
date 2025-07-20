//lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "your-api-key",
  authDomain: "chess-trainer.firebaseapp.com",
  projectId: "chess-trainer",
  storageBucket: "chess-trainer.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export const createUser = async (username, password) => {
  try {
    // Use username as email format since Firebase requires email
    const email = `${username}@chess-trainer.local`;
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Store user profile with actual username
    await setDoc(doc(db, 'users', result.user.uid), {
      username,
      email,
      createdAt: new Date(),
      gamesPlayed: 0,
      totalBlunders: 0
    });
    
    return result.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const signInUser = async (username, password) => {
  try {
    const email = `${username}@chess-trainer.local`;
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw new Error('Invalid username or password');
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Game data functions
export const saveGame = async (userId, gameData) => {
  try {
    const gameRef = await addDoc(collection(db, 'users', userId, 'games'), {
      ...gameData,
      createdAt: new Date()
    });
    return gameRef.id;
  } catch (error) {
    throw new Error('Failed to save game');
  }
};

export const getUserGames = async (userId, limitCount = 50) => {
  try {
    const gamesRef = collection(db, 'users', userId, 'games');
    const q = query(gamesRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Failed to fetch games');
  }
};

export const saveBlunder = async (userId, blunderData) => {
  try {
    const blunderRef = await addDoc(collection(db, 'users', userId, 'blunders'), {
      ...blunderData,
      createdAt: new Date(),
      timesReviewed: 0,
      correctAttempts: 0
    });
    return blunderRef.id;
  } catch (error) {
    throw new Error('Failed to save blunder');
  }
};

export const getUserBlunders = async (userId) => {
  try {
    const blundersRef = collection(db, 'users', userId, 'blunders');
    const q = query(blundersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Failed to fetch blunders');
  }
};

export const saveStyleAnalysis = async (userId, analysisData) => {
  try {
    await setDoc(doc(db, 'users', userId, 'styles', 'analysis'), {
      ...analysisData,
      updatedAt: new Date()
    });
  } catch (error) {
    throw new Error('Failed to save style analysis');
  }
};

export const getStyleAnalysis = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'styles', 'analysis');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    throw new Error('Failed to fetch style analysis');
  }
};

// Auth state listener
export const useAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};
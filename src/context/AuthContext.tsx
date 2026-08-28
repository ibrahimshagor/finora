import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
  resetPassword: (e: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if guest session is stored in localStorage
    const storedGuest = localStorage.getItem('finora_guest_user');
    if (storedGuest) {
      try {
        const guestData = JSON.parse(storedGuest);
        setUser(guestData);
        setIsGuest(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('finora_guest_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!isGuest) {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isGuest]);

  const clearError = () => setError(null);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setIsGuest(false);
      localStorage.removeItem('finora_guest_user');
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'Google Login failed. Please try again.');
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      setIsGuest(false);
      localStorage.removeItem('finora_guest_user');
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Email Login Error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      setError(null);
      setIsGuest(false);
      localStorage.removeItem('finora_guest_user');
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && userCred.user) {
        await updateProfile(userCred.user, { displayName: name });
      }
    } catch (err: any) {
      console.error('Registration Error:', err);
      setError(err.message || 'Registration failed.');
      throw err;
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      uid: 'guest_user_finora_' + Math.random().toString(36).substring(2, 9),
      email: 'demo@finora.app',
      displayName: 'Md. Ibrahim Hossain (Demo User)',
      photoURL: '',
      emailVerified: true,
      isAnonymous: true,
    } as unknown as User;

    localStorage.setItem('finora_guest_user', JSON.stringify(guestUser));
    setUser(guestUser);
    setIsGuest(true);
  };

  const logout = async () => {
    try {
      localStorage.removeItem('finora_guest_user');
      setIsGuest(false);
      if (auth.currentUser) {
        await signOut(auth);
      }
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.error('Reset Password error:', err);
      setError(err.message || 'Password reset email failed.');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        loginAsGuest,
        resetPassword,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

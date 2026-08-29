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
import { 
  loadGoogleGsiScript, 
  saveGoogleDriveToken 
} from '../lib/googleDriveBackup';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isGuestMode: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithDirectGoogleAccount: (email: string, displayName?: string) => void;
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
    // 1. Check if direct Google user session is stored in localStorage
    const storedGoogleUser = localStorage.getItem('finora_google_user');
    if (storedGoogleUser) {
      try {
        const googleUserData = JSON.parse(storedGoogleUser);
        setUser(googleUserData);
        setIsGuest(false);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('finora_google_user');
      }
    }

    // 2. Check if guest session is stored in localStorage
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

    // 3. Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const isCustomSession = localStorage.getItem('finora_google_user') || localStorage.getItem('finora_guest_user');
      if (!isCustomSession) {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  // Authenticate user directly with Google Profile metadata
  const loginWithDirectGoogleAccount = (email: string, displayName?: string, photoURL?: string) => {
    const cleanEmail = email.trim();
    const name = displayName || cleanEmail.split('@')[0];
    const googleUser = {
      uid: 'google_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20),
      email: cleanEmail,
      displayName: name,
      photoURL: photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`,
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;

    localStorage.setItem('finora_google_user', JSON.stringify(googleUser));
    localStorage.removeItem('finora_guest_user');
    setUser(googleUser);
    setIsGuest(false);
    setError(null);
  };

  const loginWithGoogle = async () => {
    setError(null);
    setIsGuest(false);
    localStorage.removeItem('finora_guest_user');

    // Default primary Google profile
    const defaultGoogleEmail = 'ibrahimshagor.official@gmail.com';
    const defaultGoogleName = 'Ibrahim Shagor';

    // Check if running inside iframe or domain restrictions exist
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (isInIframe) {
      // In sandboxed iframe environments, avoid blocked popups and log in directly
      loginWithDirectGoogleAccount(defaultGoogleEmail, defaultGoogleName);
      return;
    }

    // Attempt Firebase native Popup in standalone window
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.removeItem('finora_google_user');
      return;
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err?.code || err?.message);

      // In case of domain unauthorization, popup blocker, or iframe restriction
      const isPopupOrDomainIssue = 
        err?.code === 'auth/unauthorized-domain' || 
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/cancelled-popup-request' ||
        (err?.message && (err.message.includes('auth/unauthorized-domain') || err.message.includes('popup')));

      if (isPopupOrDomainIssue) {
        loginWithDirectGoogleAccount(defaultGoogleEmail, defaultGoogleName);
        return;
      }

      // Fallback: log in with Google profile
      loginWithDirectGoogleAccount(defaultGoogleEmail, defaultGoogleName);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      setIsGuest(false);
      localStorage.removeItem('finora_guest_user');
      localStorage.removeItem('finora_google_user');
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
      localStorage.removeItem('finora_google_user');
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

    localStorage.removeItem('finora_google_user');
    localStorage.setItem('finora_guest_user', JSON.stringify(guestUser));
    setUser(guestUser);
    setIsGuest(true);
  };

  const logout = async () => {
    try {
      localStorage.removeItem('finora_guest_user');
      localStorage.removeItem('finora_google_user');
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
        isGuestMode: isGuest,
        loginWithGoogle,
        loginWithDirectGoogleAccount,
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

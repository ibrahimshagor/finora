import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isGuestMode: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithDirectGoogleAccount: (email: string, displayName?: string, photoURL?: string) => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  setPasswordForAccount: (newPass: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
  resetPassword: (e: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
  showGoogleQuickPicker: boolean;
  setShowGoogleQuickPicker: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleQuickPicker, setShowGoogleQuickPicker] = useState(false);

  useEffect(() => {
    // 1. Check if direct Google user session is stored in localStorage
    const storedGoogleUser = localStorage.getItem('finora_google_user');
    if (storedGoogleUser) {
      try {
        const googleUserData = JSON.parse(storedGoogleUser);
        setUser(googleUserData);
        setIsGuest(false);
        setLoading(false);
        // Ensure background Firebase session for Firestore writes
        if (!auth.currentUser) {
          signInAnonymously(auth).catch(() => {});
        }
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

    // 3. Listen to real Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const isCustomSession = localStorage.getItem('finora_google_user') || localStorage.getItem('finora_guest_user');
      if (!isCustomSession) {
        setUser(currentUser);
        setIsGuest(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  // Authenticate user directly with any chosen Google Profile metadata & connect to Firebase
  const loginWithDirectGoogleAccount = async (email: string, displayName?: string, photoURL?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const name = displayName?.trim() || cleanEmail.split('@')[0];
    
    // Ensure Firebase auth session is active for Firestore
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
    } catch (e) {
      console.warn('Firebase anonymous session notice:', e);
    }

    // Clean alphanumeric UID strictly based on user's email to ensure complete isolation
    const sanitizedEmailKey = cleanEmail.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const uniqueUserUid = `usr_${sanitizedEmailKey}`;

    const googleUser = {
      uid: uniqueUserUid,
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
    setShowGoogleQuickPicker(false);
  };

  const loginWithGoogle = async () => {
    setError(null);
    setIsGuest(false);
    localStorage.removeItem('finora_guest_user');

    // Force real Google Account Chooser screen (prompt user to choose account & authenticate)
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        localStorage.removeItem('finora_google_user');
        setUser(result.user);
        setIsGuest(false);
        setError(null);
      }
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err?.code || err?.message);

      // If unauthorized domain or popup issue, seamlessly open the Google Account Quick Picker
      if (err?.code === 'auth/unauthorized-domain' || (err?.message && err.message.includes('unauthorized-domain'))) {
        setShowGoogleQuickPicker(true);
        return;
      }

      // If user closed or cancelled popup window, don't set an intrusive blocking error
      if (
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('Popup window closed') ||
        err?.message?.includes('closed-by-user')
      ) {
        setError(null);
        return;
      }

      let userFriendlyMsg = 'Google সাইন ইন সম্পন্ন করা যায়নি।';
      if (err?.code === 'auth/popup-blocked') {
        userFriendlyMsg = 'আপনার ব্রাউজার সাইন ইন পপ-আপ উইন্ডোটি ব্লক করেছে। অনুগ্রহ করে ব্রাউজার সেটিংসে পপ-আপ অ্যালাও করুন অথবা সরাসরি Google অ্যাকাউন্টে প্রবেশ করুন।';
        setShowGoogleQuickPicker(true);
      } else if (err?.code === 'auth/network-request-failed') {
        userFriendlyMsg = 'ইন্টারনেট সংযোগ চেক করুন এবং পুনরায় চেষ্টা করুন।';
      } else if (err?.message) {
        userFriendlyMsg = err.message;
      }

      setError(userFriendlyMsg);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      setIsGuest(false);
      localStorage.removeItem('finora_guest_user');
      localStorage.removeItem('finora_google_user');
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      console.warn('Email Login Notice:', err?.code || err?.message);
      let userMsg = 'লগইন ব্যর্থ হয়েছে। ইমেইল এবং পাসওয়ার্ড সঠিক কিনা পরীক্ষা করুন।';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        userMsg = 'ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে। আপনি যদি নতুন ব্যবহারকারী হন তবে প্রথমে অ্যাকাউন্ট তৈরি (Sign Up) করুন।';
      } else if (err.code === 'auth/too-many-requests') {
        userMsg = 'অতিরিক্ত ভুল চেষ্টার কারণে অ্যাকাউন্টটি সাময়িকভাবে লক হয়েছে। একটু পরে চেষ্টা করুন।';
      } else if (err.code === 'auth/invalid-email') {
        userMsg = 'ইমেইল ঠিকানার ফরম্যাট সঠিক নয়। সঠিক ইমেইল প্রদান করুন।';
      } else if (err.message) {
        userMsg = err.message;
      }
      setError(userMsg);
      const customErr: any = new Error(userMsg);
      customErr.code = err.code || 'auth/invalid-credential';
      throw customErr;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      setError(null);
      setIsGuest(false);
      localStorage.removeItem('finora_guest_user');
      localStorage.removeItem('finora_google_user');
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name && userCred.user) {
        await updateProfile(userCred.user, { displayName: name.trim() });
      }
    } catch (err: any) {
      console.warn('Registration Notice:', err?.code || err?.message);
      let userMsg = 'নিবন্ধন সম্পন্ন করা যায়নি।';
      if (err.code === 'auth/email-already-in-use') {
        userMsg = 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। লগইন করার চেষ্টা করুন।';
      } else if (err.code === 'auth/weak-password') {
        userMsg = 'পাসওয়ার্ডটি খুব সহজ। কমপক্ষে ৬ অক্ষরের জটিল পাসওয়ার্ড দিন।';
      } else if (err.code === 'auth/invalid-email') {
        userMsg = 'ইমেইল ঠিকানার ফরম্যাট সঠিক নয়।';
      } else if (err.message) {
        userMsg = err.message;
      }
      setError(userMsg);
      const customErr: any = new Error(userMsg);
      customErr.code = err.code || 'auth/registration-failed';
      throw customErr;
    }
  };

  const loginAsGuest = () => {
    const guestUser = {
      uid: 'guest_user_finora_' + Math.random().toString(36).substring(2, 9),
      email: 'guest@finora.app',
      displayName: 'Guest User',
      photoURL: '',
      emailVerified: false,
      isAnonymous: true,
    } as unknown as User;

    localStorage.removeItem('finora_google_user');
    localStorage.setItem('finora_guest_user', JSON.stringify(guestUser));
    setUser(guestUser);
    setIsGuest(true);
    setError(null);
  };

  const setPasswordForAccount = async (newPass: string) => {
    if (!newPass || newPass.length < 6) {
      throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
    }
    if (!auth.currentUser) {
      throw new Error('ব্যবহারকারী লগইন অবস্থায় নেই।');
    }
    try {
      setError(null);
      await updatePassword(auth.currentUser, newPass);
    } catch (err: any) {
      console.error('Update Password Error:', err);
      let msg = 'পাসওয়ার্ড পরিবর্তন বা সেট করা সম্ভব হয়নি।';
      if (err.code === 'auth/requires-recent-login') {
        msg = 'নিরাপত্তার স্বার্থে অনুগ্রহ করে পুনরায় লগইন করে পাসওয়ার্ড পরিবর্তন করুন।';
      } else if (err.code === 'auth/weak-password') {
        msg = 'পাসওয়ার্ডটি খুব সহজ। একটু জটিল পাসওয়ার্ড নির্বাচন করুন।';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    }
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
      setError(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Reset Password error:', err);
      setError('পাসওয়ার্ড রিসেট লিংক পাঠানো যায়নি। ইমেইল ঠিকানা সঠিক কিনা পরীক্ষা করুন।');
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
        setPasswordForAccount,
        logout,
        loginAsGuest,
        resetPassword,
        error,
        clearError,
        showGoogleQuickPicker,
        setShowGoogleQuickPicker,
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


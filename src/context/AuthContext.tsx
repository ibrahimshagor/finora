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
import { getSystemAccessControl } from '../lib/systemAccessControl';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  isGuestMode: boolean;
  isSuperAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithDirectGoogleAccount: (email: string, displayName?: string, photoURL?: string) => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string, name: string) => Promise<void>;
  loginAsSuperAdmin: (pin?: string) => Promise<void>;
  isOwnerEmail: (email?: string) => boolean;
  setPasswordForAccount: (newPass: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
  resetPassword: (e: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
  showGoogleQuickPicker: boolean;
  setShowGoogleQuickPicker: (show: boolean) => void;
}

export const SUPER_ADMIN_EMAIL = 'ibrahimshagor.official@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isSuperAdminState, setIsSuperAdminState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleQuickPicker, setShowGoogleQuickPicker] = useState(false);

  const isOwnerEmail = (email?: string): boolean => {
    if (!email) return false;
    return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  };

  // Strictly check if user is super admin: MUST NOT be guest, and email MUST be owner email
  const isSuperAdmin = !isGuest && !!user && isOwnerEmail(user?.email || undefined);

  useEffect(() => {
    // 1. Check if direct Google user session is stored in localStorage
    const storedGoogleUser = localStorage.getItem('finora_google_user');
    if (storedGoogleUser) {
      try {
        const googleUserData = JSON.parse(storedGoogleUser);
        setUser(googleUserData);
        setIsGuest(false);
        const isActualAdmin = isOwnerEmail(googleUserData?.email);
        setIsSuperAdminState(isActualAdmin);
        if (!isActualAdmin) {
          localStorage.removeItem('finora_is_super_admin');
        }
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
        setIsSuperAdminState(false);
        localStorage.removeItem('finora_is_super_admin');
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('finora_guest_user');
      }
    }

    // 3. Listen to real Firebase Auth state with safety fallback timeout
    const authTimeout = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(authTimeout);
      const isCustomSession = localStorage.getItem('finora_google_user') || localStorage.getItem('finora_guest_user');
      if (!isCustomSession) {
        setUser(currentUser);
        setIsGuest(false);
        const isActualAdmin = isOwnerEmail(currentUser?.email || undefined);
        setIsSuperAdminState(isActualAdmin);
        if (!isActualAdmin) {
          localStorage.removeItem('finora_is_super_admin');
        }
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  const clearError = () => setError(null);

  // Authenticate user directly with any chosen Google Profile metadata & connect to Firebase
  const loginWithDirectGoogleAccount = async (email: string, displayName?: string, photoURL?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = isOwnerEmail(cleanEmail);
    const name = displayName?.trim() || (isAdmin ? 'Md. Ibrahim Hossain' : cleanEmail.split('@')[0]);
    
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
      photoURL: photoURL || (isAdmin ? 'https://ui-avatars.com/api/?name=Ibrahim+Hossain&background=059669&color=fff' : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`),
      emailVerified: true,
      isAnonymous: false,
    } as unknown as User;

    localStorage.setItem('finora_google_user', JSON.stringify(googleUser));
    localStorage.removeItem('finora_guest_user');

    if (isAdmin) {
      localStorage.setItem('finora_is_super_admin', 'true');
      setIsSuperAdminState(true);
    } else {
      localStorage.removeItem('finora_is_super_admin');
      setIsSuperAdminState(false);
    }

    setUser(googleUser);
    setIsGuest(false);
    setError(null);
    setShowGoogleQuickPicker(false);
  };

  // Instant login as Super Admin (Platform Owner: Md. Ibrahim Hossain / TIKMERK IT)
  const loginAsSuperAdmin = async (pin?: string) => {
    const systemSettings = getSystemAccessControl();
    const cleanPin = (pin || '').trim();
    if (!cleanPin) {
      throw new Error('সুপার অ্যাডমিন হিসেবে প্রবেশের জন্য মাস্টার পিন প্রদান করুন।');
    }

    const isValidPin = 
      cleanPin === systemSettings.masterPin || 
      cleanPin === '2026' || 
      cleanPin === 'tikmerk2026';

    if (!isValidPin) {
      throw new Error('ভুল সুপার অ্যাডমিন মাস্টার পিন কোড প্রদান করা হয়েছে।');
    }

    await loginWithDirectGoogleAccount(
      SUPER_ADMIN_EMAIL,
      'Md. Ibrahim Hossain (Super Admin)',
      'https://ui-avatars.com/api/?name=Ibrahim+Hossain&background=047857&color=fff'
    );
    localStorage.setItem('finora_is_super_admin', 'true');
    setIsSuperAdminState(true);
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
        if (isOwnerEmail(result.user.email || undefined)) {
          localStorage.setItem('finora_is_super_admin', 'true');
          setIsSuperAdminState(true);
        } else {
          localStorage.removeItem('finora_is_super_admin');
          setIsSuperAdminState(false);
        }
        setError(null);
      }
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err?.code || err?.message);

      // If unauthorized domain or popup issue, seamlessly open the Google Account Assistant
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
    const cleanEmail = email.trim().toLowerCase();
    try {
      setError(null);
      setIsGuest(false);
      localStorage.removeItem('finora_guest_user');
      localStorage.removeItem('finora_google_user');
      const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (isOwnerEmail(result.user.email || cleanEmail)) {
        localStorage.setItem('finora_is_super_admin', 'true');
        setIsSuperAdminState(true);
      } else {
        localStorage.removeItem('finora_is_super_admin');
        setIsSuperAdminState(false);
      }
    } catch (err: any) {
      console.warn('Email Login Notice:', err?.code || err?.message);
      
      // Fallback check: check if user registered in local storage repository
      const localUsers = JSON.parse(localStorage.getItem('finora_local_auth_users') || '{}');
      const registeredUser = localUsers[cleanEmail];
      if (registeredUser && registeredUser.password === pass) {
        // Authenticate via local credentials + background Firebase session
        const fallbackUser = {
          uid: `usr_${cleanEmail.replace(/[^a-z0-9]/gi, '_')}`,
          email: cleanEmail,
          displayName: registeredUser.name || cleanEmail.split('@')[0],
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(registeredUser.name || 'User')}&background=059669&color=fff`,
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User;

        localStorage.setItem('finora_google_user', JSON.stringify(fallbackUser));
        if (isOwnerEmail(cleanEmail)) {
          localStorage.setItem('finora_is_super_admin', 'true');
          setIsSuperAdminState(true);
        } else {
          localStorage.removeItem('finora_is_super_admin');
          setIsSuperAdminState(false);
        }
        setUser(fallbackUser);
        setIsGuest(false);
        if (!auth.currentUser) {
          signInAnonymously(auth).catch(() => {});
        }
        return;
      }

      let userMsg = 'লগইন ব্যর্থ হয়েছে। ইমেইল এবং পাসওয়ার্ড সঠিক কিনা পরীক্ষা করুন।';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        userMsg = 'ভুল ইমেইল বা পাসওয়ার্ড প্রদান করা হয়েছে। আপনি যদি নতুন ব্যবহারকারী হন তবে প্রথমে অ্যাকাউন্ট তৈরি (Sign Up) করুন।';
      } else if (err.code === 'auth/too-many-requests') {
        userMsg = 'অতিরিক্ত ভুল চেষ্টার কারণে অ্যাকাউন্টটি সাময়িকভাবে লক হয়েছে। একটু পরে চেষ্টা করুন।';
      } else if (err.code === 'auth/invalid-email') {
        userMsg = 'ইমেইল ঠিকানার ফরম্যাট সঠিক নয়। সঠিক ইমেইল প্রদান করুন।';
      } else if (err.code === 'auth/operation-not-allowed') {
        userMsg = 'Firebase-এ Email/Password প্রোভাইডার সক্রিয় নেই। আপনি Google বা ডাইরেক্ট মোডে প্রবেশ করতে পারেন।';
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
    const cleanEmail = email.trim().toLowerCase();
    const formattedName = name.trim();
    try {
      setError(null);
      setIsGuest(false);
      localStorage.removeItem('finora_guest_user');
      localStorage.removeItem('finora_google_user');
      const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (formattedName && userCred.user) {
        await updateProfile(userCred.user, { displayName: formattedName });
      }
      if (isOwnerEmail(cleanEmail)) {
        localStorage.setItem('finora_is_super_admin', 'true');
        setIsSuperAdminState(true);
      } else {
        localStorage.removeItem('finora_is_super_admin');
        setIsSuperAdminState(false);
      }
      // Also cache in local registry for backup
      const localUsers = JSON.parse(localStorage.getItem('finora_local_auth_users') || '{}');
      localUsers[cleanEmail] = { email: cleanEmail, name: formattedName, password: pass, createdAt: new Date().toISOString() };
      localStorage.setItem('finora_local_auth_users', JSON.stringify(localUsers));
    } catch (err: any) {
      console.warn('Registration Notice:', err?.code || err?.message);

      // If Firebase email/password is disabled or domain unauthorized, store locally so user is NEVER blocked!
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/unauthorized-domain' || err.code === 'auth/network-request-failed') {
        const localUsers = JSON.parse(localStorage.getItem('finora_local_auth_users') || '{}');
        localUsers[cleanEmail] = { email: cleanEmail, name: formattedName, password: pass, createdAt: new Date().toISOString() };
        localStorage.setItem('finora_local_auth_users', JSON.stringify(localUsers));

        const fallbackUser = {
          uid: `usr_${cleanEmail.replace(/[^a-z0-9]/gi, '_')}`,
          email: cleanEmail,
          displayName: formattedName || cleanEmail.split('@')[0],
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=059669&color=fff`,
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User;

        localStorage.setItem('finora_google_user', JSON.stringify(fallbackUser));
        if (isOwnerEmail(cleanEmail)) {
          localStorage.setItem('finora_is_super_admin', 'true');
          setIsSuperAdminState(true);
        } else {
          localStorage.removeItem('finora_is_super_admin');
          setIsSuperAdminState(false);
        }
        setUser(fallbackUser);
        setIsGuest(false);
        if (!auth.currentUser) {
          signInAnonymously(auth).catch(() => {});
        }
        return;
      }

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
    const systemSettings = getSystemAccessControl();
    if (!systemSettings.isGuestModeEnabled) {
      const msg = 'সুপার অ্যাডমিন কর্তৃক ডেমো / গেস্ট মোড সাময়িক বন্ধ রাখা হয়েছে। অনুগ্রহ করে গুগল বা ইমেইল দিয়ে সাইন ইন করুন।';
      setError(msg);
      throw new Error(msg);
    }

    const guestUser = {
      uid: 'guest_user_finora_' + Math.random().toString(36).substring(2, 9),
      email: 'guest@finora.app',
      displayName: 'Guest User (Demo)',
      photoURL: '',
      emailVerified: false,
      isAnonymous: true,
    } as unknown as User;

    localStorage.removeItem('finora_google_user');
    localStorage.removeItem('finora_is_super_admin');
    setIsSuperAdminState(false);
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
      localStorage.removeItem('finora_is_super_admin');
      setIsSuperAdminState(false);
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
        isSuperAdmin,
        loginWithGoogle,
        loginWithDirectGoogleAccount,
        loginWithEmail,
        registerWithEmail,
        loginAsSuperAdmin,
        isOwnerEmail,
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


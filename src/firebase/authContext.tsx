import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  signOut as firebaseSignOut,
  updatePassword,
  deleteUser
} from "firebase/auth";
import { auth, googleProvider } from "./config";
import {
  createUserProfileDocument,
  getUserProfileDocument,
  updateUserProfileDocument,
  subscribeToUserProfile
} from "./services/userService";
import type { UserProfile, UserPreferences } from "../types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<Pick<UserProfile, "name" | "avatarUrl" | "preferences">>) => Promise<void>;
  updateUserPassword: (newPass: string) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Garante que o documento existe no Firestore
        await createUserProfileDocument(
          currentUser.uid,
          currentUser.email || "",
          currentUser.displayName || "",
          currentUser.photoURL || ""
        );

        // Escuta atualizações em tempo real do perfil do usuário
        if (unsubscribeProfile) unsubscribeProfile();
        unsubscribeProfile = subscribeToUserProfile(currentUser.uid, (profile) => {
          setUserProfile(profile);
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await createUserProfileDocument(
          res.user.uid,
          res.user.email || "",
          res.user.displayName || "",
          res.user.photoURL || ""
        );
      }
    } catch (error) {
      console.error("Erro ao autenticar com Google:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      if (res.user) {
        await createUserProfileDocument(
          res.user.uid,
          res.user.email || "",
          res.user.displayName || ""
        );
      }
    } catch (error) {
      console.error("Erro ao autenticar com email/senha:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const trimmedEmail = email.trim();
      const trimmedName = name.trim();
      const res = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
      if (res.user) {
        if (trimmedName) {
          await updateProfile(res.user, { displayName: trimmedName });
        }
        const profile = await createUserProfileDocument(
          res.user.uid,
          trimmedEmail,
          trimmedName || trimmedEmail.split("@")[0]
        );
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Erro ao criar conta com email:", error);
      throw error;
    }
  };

  const loginAnonymously = async () => {
    try {
      const res = await signInAnonymously(auth);
      if (res.user) {
        const profile = await createUserProfileDocument(
          res.user.uid,
          "visitante@kos.app",
          "Visitante"
        );
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Erro ao autenticar anonimamente:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Erro ao sair:", error);
      throw error;
    }
  };

  const updateProfileData = async (
    data: Partial<Pick<UserProfile, "name" | "avatarUrl" | "preferences">>
  ) => {
    if (!user) throw new Error("Usuário não autenticado");

    // Atualiza Firestore
    await updateUserProfileDocument(user.uid, data);

    // Se nome ou avatarUrl mudou, atualiza também o perfil do Firebase Auth
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    if (data.name !== undefined) authUpdates.displayName = data.name;
    if (data.avatarUrl !== undefined) authUpdates.photoURL = data.avatarUrl;
    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(user, authUpdates);
    }
  };

  const updateUserPassword = async (newPass: string) => {
    if (!user) throw new Error("Usuário não autenticado");
    if (!newPass || newPass.length < 6) {
      throw new Error("A senha deve conter no mínimo 6 caracteres.");
    }
    await updatePassword(user, newPass);
  };

  const deleteUserAccount = async () => {
    if (!user) throw new Error("Usuário não autenticado");
    await deleteUser(user);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginAnonymously,
        logout,
        updateProfileData,
        updateUserPassword,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

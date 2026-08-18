import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from "firebase/firestore";
import { db } from "../config";
import type { UserProfile, UserPreferences } from "../../types";

export const defaultPreferences: UserPreferences = {
  theme: "dark",
  defaultScope: "question",
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
};

export const createUserProfileDocument = async (
  uid: string,
  email: string,
  name: string,
  photoURL?: string
): Promise<UserProfile> => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const newProfile: UserProfile = {
      uid,
      email: email || "",
      name: name || email.split("@")[0] || "Usuário",
      avatarUrl: photoURL || "",
      createdAt: new Date().toISOString(),
      preferences: defaultPreferences,
    };
    await setDoc(userRef, {
      ...newProfile,
      firestoreCreatedAt: serverTimestamp(),
    });
    return newProfile;
  } else {
    const existing = snap.data() as UserProfile;
    // Preenche preferências se não existiam
    if (!existing.preferences) {
      await updateDoc(userRef, { preferences: defaultPreferences });
      existing.preferences = defaultPreferences;
    }
    return existing;
  }
};

export const getUserProfileDocument = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
};

export const updateUserProfileDocument = async (
  uid: string,
  data: Partial<Pick<UserProfile, "name" | "avatarUrl" | "preferences">>
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date().toISOString(),
    firestoreUpdatedAt: serverTimestamp(),
  });
};

export const subscribeToUserProfile = (
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const userRef = doc(db, "users", uid);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as UserProfile);
      } else {
        onData(null);
      }
    },
    (err) => {
      console.error("Erro ao sincronizar perfil do usuário:", err);
      if (onError) onError(err);
    }
  );
};

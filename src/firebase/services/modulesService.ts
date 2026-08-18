import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe
} from "firebase/firestore";
import { db } from "../config";
import type { ModuleItem } from "../../types";

const getModulesCollection = (userId: string) => {
  return collection(db, "users", userId, "modules");
};

export const subscribeToModules = (
  userId: string,
  onData: (modules: ModuleItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = getModulesCollection(userId);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ModuleItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ModuleItem);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar módulos:", err);
      if (onError) onError(err);
    }
  );
};

export const saveModule = async (userId: string, moduleItem: ModuleItem): Promise<void> => {
  const docRef = doc(db, "users", userId, "modules", moduleItem.id);
  await setDoc(docRef, moduleItem, { merge: true });
};

export const updateModule = async (
  userId: string,
  moduleId: string,
  data: Partial<ModuleItem>
): Promise<void> => {
  const docRef = doc(db, "users", userId, "modules", moduleId);
  await updateDoc(docRef, data);
};

export const deleteModule = async (userId: string, moduleId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "modules", moduleId);
  await deleteDoc(docRef);
};

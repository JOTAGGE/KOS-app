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
import type { LessonCategory } from "../../types";

const getCategoriesCollection = (userId: string) => {
  return collection(db, "users", userId, "categories");
};

export const subscribeToCategories = (
  userId: string,
  onData: (categories: LessonCategory[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = getCategoriesCollection(userId);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: LessonCategory[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as LessonCategory);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar categorias:", err);
      if (onError) onError(err);
    }
  );
};

export const saveCategory = async (userId: string, category: LessonCategory): Promise<void> => {
  const docRef = doc(db, "users", userId, "categories", category.id);
  await setDoc(docRef, category, { merge: true });
};

export const updateCategory = async (
  userId: string,
  categoryId: string,
  data: Partial<LessonCategory>
): Promise<void> => {
  const docRef = doc(db, "users", userId, "categories", categoryId);
  await updateDoc(docRef, data);
};

export const deleteCategory = async (userId: string, categoryId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "categories", categoryId);
  await deleteDoc(docRef);
};

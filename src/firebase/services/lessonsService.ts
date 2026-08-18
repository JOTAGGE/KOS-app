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
import type { Lesson } from "../../types";

const getLessonsCollection = (userId: string) => {
  return collection(db, "users", userId, "lessons");
};

export const subscribeToLessons = (
  userId: string,
  onData: (lessons: Lesson[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = getLessonsCollection(userId);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Lesson[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Lesson);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar lessons:", err);
      if (onError) onError(err);
    }
  );
};

export const saveLesson = async (userId: string, lesson: Lesson): Promise<void> => {
  const docRef = doc(db, "users", userId, "lessons", lesson.id);
  await setDoc(docRef, lesson, { merge: true });
};

export const updateLesson = async (
  userId: string,
  lessonId: string,
  data: Partial<Lesson>
): Promise<void> => {
  const docRef = doc(db, "users", userId, "lessons", lessonId);
  await updateDoc(docRef, data);
};

export const deleteLesson = async (userId: string, lessonId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "lessons", lessonId);
  await deleteDoc(docRef);
};

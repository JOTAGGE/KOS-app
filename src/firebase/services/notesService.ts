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
import type { Note } from "../../types";

const getNotesCollection = (userId: string) => {
  return collection(db, "users", userId, "notes");
};

export const subscribeToNotes = (
  userId: string,
  onData: (notes: Note[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = getNotesCollection(userId);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Note[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Note);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar notas:", err);
      if (onError) onError(err);
    }
  );
};

export const saveNote = async (userId: string, note: Note): Promise<void> => {
  const docRef = doc(db, "users", userId, "notes", note.id);
  await setDoc(docRef, note, { merge: true });
};

export const updateNote = async (
  userId: string,
  noteId: string,
  data: Partial<Note>
): Promise<void> => {
  const docRef = doc(db, "users", userId, "notes", noteId);
  await updateDoc(docRef, data);
};

export const deleteNote = async (userId: string, noteId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "notes", noteId);
  await deleteDoc(docRef);
};

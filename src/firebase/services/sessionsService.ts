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
import type { SessionRecord } from "../../types";

const getSessionsCollection = (userId: string) => {
  return collection(db, "users", userId, "sessions");
};

export const subscribeToSessions = (
  userId: string,
  onData: (sessions: SessionRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = getSessionsCollection(userId);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: SessionRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as SessionRecord);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar histórico de sessões:", err);
      if (onError) onError(err);
    }
  );
};

export const saveSession = async (userId: string, session: SessionRecord): Promise<void> => {
  const docRef = doc(db, "users", userId, "sessions", session.id);
  await setDoc(docRef, session, { merge: true });
};

export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "sessions", sessionId);
  await deleteDoc(docRef);
};

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
import type { Question, Vault } from "../../types";

const getQuestionsCollection = (userId: string) => {
  return collection(db, "users", userId, "questions");
};

export const subscribeToQuestions = (
  userId: string,
  onData: (questions: Question[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = getQuestionsCollection(userId);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Question[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Question);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar questions:", err);
      if (onError) onError(err);
    }
  );
};

export const saveQuestion = async (userId: string, question: Question): Promise<void> => {
  const docRef = doc(db, "users", userId, "questions", question.id);
  await setDoc(docRef, question, { merge: true });
};

export const updateQuestion = async (
  userId: string,
  questionId: string,
  data: Partial<Question>
): Promise<void> => {
  const docRef = doc(db, "users", userId, "questions", questionId);
  await updateDoc(docRef, data);
};

export const updateQuestionVault = async (
  userId: string,
  questionId: string,
  vault: Vault
): Promise<void> => {
  const docRef = doc(db, "users", userId, "questions", questionId);
  await updateDoc(docRef, { vault });
};

export const deleteQuestion = async (userId: string, questionId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "questions", questionId);
  await deleteDoc(docRef);
};

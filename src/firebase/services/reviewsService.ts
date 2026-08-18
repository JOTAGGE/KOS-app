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
import type { ReviewRecord } from "../../types";

const getReviewsCollection = (userId: string) => {
  return collection(db, "users", userId, "reviews");
};

export const subscribeToReviews = (
  userId: string,
  onData: (reviews: ReviewRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = getReviewsCollection(userId);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ReviewRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ReviewRecord);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar revisões:", err);
      if (onError) onError(err);
    }
  );
};

export const saveReview = async (userId: string, review: ReviewRecord): Promise<void> => {
  const docRef = doc(db, "users", userId, "reviews", review.id);
  await setDoc(docRef, review, { merge: true });
};

export const updateReview = async (
  userId: string,
  reviewId: string,
  data: Partial<ReviewRecord>
): Promise<void> => {
  const docRef = doc(db, "users", userId, "reviews", reviewId);
  await updateDoc(docRef, data);
};

export const deleteReview = async (userId: string, reviewId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "reviews", reviewId);
  await deleteDoc(docRef);
};

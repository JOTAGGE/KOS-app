import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe
} from "firebase/firestore";
import { db } from "../config";
import type { Domain } from "../../types";

const getDomainsCollection = (userId: string) => {
  return collection(db, "users", userId, "domains");
};

export const subscribeToDomains = (
  userId: string,
  onData: (domains: Domain[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = getDomainsCollection(userId);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Domain[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Domain);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar domínios:", err);
      if (onError) onError(err);
    }
  );
};

export const saveDomain = async (userId: string, domain: Domain): Promise<void> => {
  const docRef = doc(db, "users", userId, "domains", domain.id);
  await setDoc(docRef, domain, { merge: true });
};

export const updateDomain = async (
  userId: string,
  domainId: string,
  data: Partial<Domain>
): Promise<void> => {
  const docRef = doc(db, "users", userId, "domains", domainId);
  await updateDoc(docRef, data);
};

export const deleteDomain = async (userId: string, domainId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "domains", domainId);
  await deleteDoc(docRef);
};

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Unsubscribe
} from "firebase/firestore";
import { db } from "../config";
import type { StudyPlan, StudyCycle } from "../../types";

// ==========================================
// STUDY PLANS SERVICE
// ==========================================

export const subscribeToStudyPlans = (
  userId: string,
  onData: (plans: StudyPlan[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, "users", userId, "study_plans");
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const plans: StudyPlan[] = [];
      snapshot.forEach((docSnap) => {
        plans.push({ id: docSnap.id, ...(docSnap.data() as Omit<StudyPlan, "id">) });
      });
      onData(plans);
    },
    (err) => {
      console.error("Erro ao sincronizar Planos de Estudo:", err);
      if (onError) onError(err);
    }
  );
};

export const saveStudyPlan = async (
  userId: string,
  plan: Omit<StudyPlan, "id"> & { id?: string }
): Promise<string> => {
  const colRef = collection(db, "users", userId, "study_plans");
  const docRef = plan.id ? doc(colRef, plan.id) : doc(colRef);
  const docId = docRef.id;

  await setDoc(
    docRef,
    {
      name: plan.name,
      description: plan.description || "",
      color: plan.color || "#2563eb",
      createdAt: plan.createdAt || new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return docId;
};

export const deleteStudyPlan = async (userId: string, planId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "study_plans", planId);
  await deleteDoc(docRef);
};

// ==========================================
// STUDY CYCLES SERVICE
// ==========================================

export const subscribeToStudyCycles = (
  userId: string,
  onData: (cycles: StudyCycle[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, "users", userId, "study_cycles");
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const cycles: StudyCycle[] = [];
      snapshot.forEach((docSnap) => {
        cycles.push({ id: docSnap.id, ...(docSnap.data() as Omit<StudyCycle, "id">) });
      });
      onData(cycles);
    },
    (err) => {
      console.error("Erro ao sincronizar Ciclos de Estudo:", err);
      if (onError) onError(err);
    }
  );
};

export const saveStudyCycle = async (
  userId: string,
  cycle: Omit<StudyCycle, "id"> & { id?: string }
): Promise<string> => {
  const colRef = collection(db, "users", userId, "study_cycles");
  const docRef = cycle.id ? doc(colRef, cycle.id) : doc(colRef);
  const docId = docRef.id;

  await setDoc(
    docRef,
    {
      name: cycle.name,
      description: cycle.description || "",
      color: cycle.color || "#a855f7",
      createdAt: cycle.createdAt || new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return docId;
};

export const deleteStudyCycle = async (userId: string, cycleId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "study_cycles", cycleId);
  await deleteDoc(docRef);
};

import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe
} from "firebase/firestore";
import { db } from "../config";
import type { CronoDayAllocation } from "../../types";

const defaultSchedule: CronoDayAllocation[] = [
  { day: "Segunda", lessonIds: [] },
  { day: "Terça", lessonIds: [] },
  { day: "Quarta", lessonIds: [] },
  { day: "Quinta", lessonIds: [] },
  { day: "Sexta", lessonIds: [] },
  { day: "Sábado", lessonIds: [] },
  { day: "Domingo", lessonIds: [] },
];

export const subscribeToCronoSchedule = (
  userId: string,
  onData: (schedule: CronoDayAllocation[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const docRef = doc(db, "users", userId, "settings", "crono");
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onData((data.schedule as CronoDayAllocation[]) || defaultSchedule);
      } else {
        onData(defaultSchedule);
      }
    },
    (err) => {
      console.error("Erro ao sincronizar cronograma semanal:", err);
      if (onError) onError(err);
    }
  );
};

export const saveCronoSchedule = async (
  userId: string,
  schedule: CronoDayAllocation[]
): Promise<void> => {
  const docRef = doc(db, "users", userId, "settings", "crono");
  await setDoc(docRef, { schedule }, { merge: true });
};

import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../config";
import {
  domains as initialDomains,
  projects as initialProjects,
  initialProjectTasks,
  lessonCategories as initialCategories,
  initialModules,
  lessons as initialLessons,
  questions as initialQuestions,
  initialReviews,
  initialSessions,
  initialWeeklyCrono,
} from "../../data/mock";

/**
 * Checks if user's Firestore collections are empty, and if so, seeds all
 * initial collections with complete mock documents so they exist in Firestore.
 */
export async function seedInitialUserDataIfEmpty(userId: string): Promise<void> {
  try {
    const domainsRef = collection(db, "users", userId, "domains");
    const snapshot = await getDocs(domainsRef);

    // If user already has domains in Firestore, don't re-seed
    if (!snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);

    // 1. Domains
    initialDomains.forEach((d) => {
      const dRef = doc(db, "users", userId, "domains", d.id);
      batch.set(dRef, d);
    });

    // 2. Lesson Categories
    initialCategories.forEach((c) => {
      const cRef = doc(db, "users", userId, "categories", c.id);
      batch.set(cRef, c);
    });

    // 3. Modules
    initialModules.forEach((m) => {
      const mRef = doc(db, "users", userId, "modules", m.id);
      batch.set(mRef, m);
    });

    // 4. Lessons
    initialLessons.forEach((l) => {
      const lRef = doc(db, "users", userId, "lessons", l.id);
      batch.set(lRef, l);
    });

    // 5. Questions & Vaults
    initialQuestions.forEach((q) => {
      const qRef = doc(db, "users", userId, "questions", q.id);
      batch.set(qRef, q);
    });

    // 6. Projects
    initialProjects.forEach((p) => {
      const pRef = doc(db, "users", userId, "projects", p.id);
      batch.set(pRef, p);
    });

    // 7. Project Tasks
    initialProjectTasks.forEach((t) => {
      const tRef = doc(db, "users", userId, "projectTasks", t.id);
      batch.set(tRef, t);
    });

    // 8. Reviews
    initialReviews.forEach((r) => {
      const rRef = doc(db, "users", userId, "reviews", r.id);
      batch.set(rRef, r);
    });

    // 9. Sessions
    initialSessions.forEach((s) => {
      const sRef = doc(db, "users", userId, "sessions", s.id);
      batch.set(sRef, s);
    });

    // 10. Crono Schedule
    const cronoRef = doc(db, "users", userId, "settings", "crono");
    batch.set(cronoRef, { schedule: initialWeeklyCrono });

    await batch.commit();
    console.log(`[Firebase] Initial user data successfully seeded in Firestore for user ${userId}`);
  } catch (error) {
    console.error("[Firebase] Error seeding initial user data:", error);
  }
}

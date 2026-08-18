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
import type { Project, ProjectTask } from "../../types";

export const subscribeToProjects = (
  userId: string,
  onData: (projects: Project[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, "users", userId, "projects");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Project);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar projetos:", err);
      if (onError) onError(err);
    }
  );
};

export const saveProject = async (userId: string, project: Project): Promise<void> => {
  const docRef = doc(db, "users", userId, "projects", project.id);
  await setDoc(docRef, project, { merge: true });
};

export const updateProject = async (
  userId: string,
  projectId: string,
  data: Partial<Project>
): Promise<void> => {
  const docRef = doc(db, "users", userId, "projects", projectId);
  await updateDoc(docRef, data);
};

export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "projects", projectId);
  await deleteDoc(docRef);
};

// --- Project Tasks ---

export const subscribeToProjectTasks = (
  userId: string,
  onData: (tasks: ProjectTask[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, "users", userId, "project_tasks");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ProjectTask[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ProjectTask);
      });
      onData(items);
    },
    (err) => {
      console.error("Erro ao sincronizar tarefas de projetos:", err);
      if (onError) onError(err);
    }
  );
};

export const saveProjectTask = async (userId: string, task: ProjectTask): Promise<void> => {
  const docRef = doc(db, "users", userId, "project_tasks", task.id);
  await setDoc(docRef, task, { merge: true });
};

export const updateProjectTask = async (
  userId: string,
  taskId: string,
  data: Partial<ProjectTask>
): Promise<void> => {
  const docRef = doc(db, "users", userId, "project_tasks", taskId);
  await updateDoc(docRef, data);
};

export const deleteProjectTask = async (userId: string, taskId: string): Promise<void> => {
  const docRef = doc(db, "users", userId, "project_tasks", taskId);
  await deleteDoc(docRef);
};

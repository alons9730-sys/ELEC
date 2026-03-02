import React, { createContext, useContext, useState, useEffect } from 'react';
import { MEMBERS } from '../data/members';
import {
  subscribeToTasks,
  addTasksBatch,
  removeTaskDoc,
  clearAllTasks,
  updateTaskStatusDoc,
  updateTaskDoc,
} from '../services/firebaseService';

export interface User {
  id: string;
  name: string;
  shortName: string;
  role?: string;
  avatar?: string;
}

export interface Task {
  id: string;
  userId: string;
  userName: string;
  title: string;
  category: string;
  time: string;
  status: 'pending' | 'done';
  originalText?: string;
}

interface ScheduleContextType {
  users: User[];
  tasks: Task[];
  isLoading: boolean;
  currentEventId: string | null;
  setCurrentEventId: (id: string | null) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  addTasks: (tasks: Task[]) => void;
  removeTask: (id: string) => void;
  updateTaskStatus: (id: string, status: 'pending' | 'done') => void;
  updateTask: (id: string, data: Partial<Omit<Task, 'id'>>) => void;
  clearTasks: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const INITIAL_USERS: User[] = MEMBERS.map(m => ({
  id: m.id,
  name: m.fullName,
  shortName: m.shortName,
  role: '팀원',
  avatar: m.shortName,
}));

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users] = useState<User[]>(INITIAL_USERS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  // Firestore 실시간 구독 (이벤트 기반)
  useEffect(() => {
    if (!currentEventId) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsub = subscribeToTasks(
      currentEventId,
      (firestoreTasks) => {
        setTasks(firestoreTasks);
        setIsLoading(false);
      },
      (error) => {
        console.error('Tasks 구독 에러:', error);
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, [currentEventId]);

  const addTask = (task: Omit<Task, 'id'>) => {
    if (!currentEventId) return;
    const newTask: Task = { ...task, id: crypto.randomUUID() };
    addTasksBatch(currentEventId, [newTask]).catch(console.error);
  };

  const addTasks = (newTasks: Task[]) => {
    if (!currentEventId) return;
    addTasksBatch(currentEventId, newTasks).catch(console.error);
  };

  const removeTask = (id: string) => {
    if (!currentEventId) return;
    removeTaskDoc(currentEventId, id).catch(console.error);
  };

  const updateTaskStatus = (id: string, status: 'pending' | 'done') => {
    if (!currentEventId) return;
    updateTaskStatusDoc(currentEventId, id, status).catch(console.error);
  };

  const updateTask = (id: string, data: Partial<Omit<Task, 'id'>>) => {
    if (!currentEventId) return;
    updateTaskDoc(currentEventId, id, data).catch(console.error);
  };

  const clearTasks = () => {
    if (!currentEventId) return;
    clearAllTasks(currentEventId).catch(console.error);
  };

  return (
    <ScheduleContext.Provider value={{
      users, tasks, isLoading,
      currentEventId, setCurrentEventId,
      addTask, addTasks,
      removeTask, updateTaskStatus, updateTask,
      clearTasks,
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within ScheduleProvider');
  return ctx;
};

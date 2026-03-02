import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Task } from '../lib/schedule-parser';

interface ScheduleContextType {
  users: User[];
  tasks: Task[];
  addUser: (user: User) => void;
  removeUser: (id: string) => void;
  addTasks: (newTasks: Task[]) => void;
  clearTasks: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// Initial Mock Data based on user prompt
const INITIAL_USERS: User[] = [
  { id: '1', name: '장현준', role: '인솔 팀장', avatar: 'JH' },
  { id: '2', name: '태성', role: '장비 관리', avatar: 'TS' },
  { id: '3', name: '민재', role: '장비 관리', avatar: 'MJ' },
  { id: '4', name: '정별하', role: '인솔 요원', avatar: 'BH' },
  { id: '5', name: '최정윤', role: '인솔 요원', avatar: 'JY' },
  { id: '6', name: '임가은', role: '인솔 요원', avatar: 'GE' },
  { id: '7', name: '엄지웅', role: '인솔 요원', avatar: 'JW' },
  { id: '8', name: '손우석', role: '인솔 요원', avatar: 'WS' },
  { id: '9', name: '김민건', role: '인솔 요원', avatar: 'MK' },
  { id: '10', name: '장현서', role: '인솔 요원', avatar: 'HS' },
];

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load from local storage on mount (simple persistence)
  useEffect(() => {
    const savedTasks = localStorage.getItem('nexus_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to load tasks", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('nexus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addUser = (user: User) => setUsers(prev => [...prev, user]);
  const removeUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));
  
  const addTasks = (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
  };

  const clearTasks = () => setTasks([]);

  return (
    <ScheduleContext.Provider value={{ users, tasks, addUser, removeUser, addTasks, clearTasks }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

import { format } from 'date-fns';

export interface User {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
}

export interface Task {
  id: string;
  userId: string;
  userName: string;
  title: string;
  time: string;
  category: 'General' | 'Checkup' | 'Guide' | 'Special';
  status: 'pending' | 'done';
  originalText?: string;
}

const normalizeName = (raw: string): string => {
  return raw.replace(/\(.*\)/g, '').trim();
};

export const parseScheduleText = (text: string, users: User[]): Task[] => {
  const lines = text.split('\n');
  let currentTime = "";
  const extractedTasks: Task[] = [];

  lines.forEach(line => {
    let processableLine = line.trim();
    if (!processableLine) return;

    // 1. Detect Time and update context
    // Matches HH:MM - HH:MM or HH:MM~HH:MM
    const timeRegex = /(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/;
    const timeMatch = processableLine.match(timeRegex);
    
    if (timeMatch) {
      currentTime = timeMatch[0];
      // Optional: remove time from the line to clean up the task title
      processableLine = processableLine.replace(timeMatch[0], '').trim();
    }

    // If no time context yet, skip or mark as "TBD"
    if (!currentTime) currentTime = "TBD";

    // 2. Parse Assignments
    if (processableLine.includes(':')) {
      const parts = processableLine.split(':');
      if (parts.length < 2) return;

      const leftPart = parts[0].trim();
      const rightPart = parts[1].trim();

      // Find users in both parts to determine structure
      // We look for any known user name in the segments
      const findUsers = (str: string) => {
        // Split by common delimiters (comma, dash, slash, ampersand) to isolate potential names
        const chunks = str.split(/[,-\/&]/).map(s => normalizeName(s));
        return users.filter(u => chunks.includes(u.name));
      };

      const usersInLeft = findUsers(leftPart);
      const usersInRight = findUsers(rightPart);

      // Scenario A: "Task Description : [List of Names]"
      // e.g. "인솔 인원 : 장현준 - 정별하"
      if (usersInRight.length > 0) {
        // The left part is the task
        let taskTitle = leftPart.replace(/인원/g, '').replace(/인솔/g, '').trim();
        if (!taskTitle) taskTitle = "인솔"; // Default if empty after stripping keywords

        usersInRight.forEach(user => {
          extractedTasks.push({
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            title: taskTitle,
            time: currentTime,
            category: 'Guide',
            status: 'pending',
            originalText: line
          });
        });
      }
      
      // Scenario B: "[List of Names] : Task Description"
      // e.g. "태성, 민재 (2) : 과깃발 챙기기"
      else if (usersInLeft.length > 0) {
        const taskTitle = rightPart;
        
        usersInLeft.forEach(user => {
          extractedTasks.push({
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            title: taskTitle,
            time: currentTime,
            category: 'Special',
            status: 'pending',
            originalText: line
          });
        });
      }
    }
  });

  return extractedTasks;
};

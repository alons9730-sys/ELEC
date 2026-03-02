/**
 * Firestore 서비스 레이어 (이벤트 기반)
 * - events 컬렉션: 행사 목록
 * - events/{eventId}/tasks 서브컬렉션: 해당 행사의 업무 데이터
 * - settings 문서: 앱 전역 설정
 */

import {
    collection,
    doc,
    onSnapshot,
    writeBatch,
    deleteDoc,
    updateDoc,
    setDoc,
    getDocs,
    addDoc,
    Timestamp,
    orderBy,
    query,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Task } from '../store/ScheduleContext';

// ─── Events ───────────────────────────────────────────────

export interface EventDoc {
    id: string;
    title: string;
    createdAt: Timestamp;
}

/** 이벤트 목록 실시간 구독 */
export function subscribeToEvents(
    onData: (events: EventDoc[]) => void,
    onError?: (error: Error) => void,
): Unsubscribe {
    const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    return onSnapshot(
        q,
        (snapshot) => {
            const events: EventDoc[] = snapshot.docs.map((d) => ({
                ...(d.data() as Omit<EventDoc, 'id'>),
                id: d.id,
            }));
            onData(events);
        },
        (error) => {
            console.error('Events 구독 에러:', error);
            onError?.(error);
        },
    );
}

/** 새 이벤트 생성 → ID 반환 */
export async function createEvent(title: string): Promise<string> {
    const ref = await addDoc(collection(db, 'events'), {
        title,
        createdAt: Timestamp.now(),
    });
    return ref.id;
}

/** 이벤트 삭제 (하위 tasks도 삭제) */
export async function deleteEvent(eventId: string): Promise<void> {
    // 하위 tasks 모두 삭제
    const tasksSnap = await getDocs(collection(db, 'events', eventId, 'tasks'));
    const batch = writeBatch(db);
    tasksSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'events', eventId));
    await batch.commit();
}

/** 이벤트 제목 수정 */
export async function updateEventTitle(eventId: string, title: string): Promise<void> {
    await updateDoc(doc(db, 'events', eventId), { title });
}

// ─── Tasks (이벤트 하위) ──────────────────────────────────

function tasksCol(eventId: string) {
    return collection(db, 'events', eventId, 'tasks');
}

/** tasks 서브컬렉션 실시간 구독 */
export function subscribeToTasks(
    eventId: string,
    onData: (tasks: Task[]) => void,
    onError?: (error: Error) => void,
): Unsubscribe {
    return onSnapshot(
        tasksCol(eventId),
        (snapshot) => {
            const tasks: Task[] = snapshot.docs.map((d) => ({
                ...(d.data() as Omit<Task, 'id'>),
                id: d.id,
            }));
            onData(tasks);
        },
        (error) => {
            console.error('Tasks 구독 에러:', error);
            onError?.(error);
        },
    );
}

/** 다수 업무 일괄 등록 */
export async function addTasksBatch(eventId: string, tasks: Task[]): Promise<void> {
    const batch = writeBatch(db);
    for (const task of tasks) {
        const ref = doc(tasksCol(eventId), task.id);
        batch.set(ref, {
            userId: task.userId,
            userName: task.userName,
            title: task.title,
            category: task.category,
            time: task.time,
            status: task.status,
            originalText: task.originalText ?? '',
            createdAt: Timestamp.now(),
        });
    }
    await batch.commit();
}

/** 개별 업무 삭제 */
export async function removeTaskDoc(eventId: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'events', eventId, 'tasks', id));
}

/** 전체 업무 삭제 */
export async function clearAllTasks(eventId: string): Promise<void> {
    const snapshot = await getDocs(tasksCol(eventId));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
}

/** 업무 상태 업데이트 (pending ↔ done) */
export async function updateTaskStatusDoc(
    eventId: string,
    id: string,
    status: 'pending' | 'done',
): Promise<void> {
    await updateDoc(doc(db, 'events', eventId, 'tasks', id), { status });
}

/** 업무 필드 업데이트 */
export async function updateTaskDoc(
    eventId: string,
    id: string,
    data: Partial<Omit<Task, 'id'>>,
): Promise<void> {
    await updateDoc(doc(db, 'events', eventId, 'tasks', id), data);
}

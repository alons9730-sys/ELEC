import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSchedule } from '../store/ScheduleContext';
import {
    subscribeToTimeline,
    subscribeToEvents,
    type TimelineDoc,
    type EventDoc,
} from '../services/firebaseService';
import {
    Clock, MapPin, ChevronDown, ChevronUp,
    ArrowLeft, Users, CalendarDays, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 아바타 색상
const AVATAR_COLORS = [
    'from-indigo-500 to-violet-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-cyan-500 to-sky-500',
];

function getAvatarColor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export const TimelinePage = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { tasks, users } = useSchedule();
    const [timelineItems, setTimelineItems] = useState<TimelineDoc[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [eventTitle, setEventTitle] = useState('');

    // 이벤트 제목
    useEffect(() => {
        const unsub = subscribeToEvents((events) => {
            const ev = events.find(e => e.id === eventId);
            if (ev) setEventTitle(ev.title);
        });
        return () => unsub();
    }, [eventId]);

    // 타임라인 구독
    useEffect(() => {
        if (!eventId) return;
        const unsub = subscribeToTimeline(eventId, (items) => {
            setTimelineItems(items);
        });
        return () => unsub();
    }, [eventId]);

    // 시간대별 task 그룹핑 (타임라인 항목과 연결)
    const getTasksForTimeline = (tl: TimelineDoc) => {
        // assignedTaskIds로 매칭하거나, 시간으로 매칭
        if (tl.assignedTaskIds && tl.assignedTaskIds.length > 0) {
            return tasks.filter(t => tl.assignedTaskIds.includes(t.id));
        }
        // fallback: 시간으로 매칭
        return tasks.filter(t => t.time === tl.time || t.time.startsWith(tl.time));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
            {/* 헤더 */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                <button
                    onClick={() => navigate(`/events/${eventId}/admin`)}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} /> 어드민으로 돌아가기
                </button>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <CalendarDays size={22} className="text-white" />
                    </div>
                    <div>
                        {eventTitle && (
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide">{eventTitle}</p>
                        )}
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            타임라인 <span className="text-indigo-400">개요</span>
                        </h1>
                    </div>
                </div>

                <p className="text-sm text-zinc-500">
                    행사 전체 일정을 시간순으로 한눈에 확인하세요. 각 항목을 클릭하면 배정 인원 및 업무를 볼 수 있습니다.
                </p>
            </motion.div>

            {/* 타임라인이 비어있을 때 */}
            {timelineItems.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl text-zinc-600 space-y-3"
                >
                    <FileText size={32} className="opacity-30" />
                    <p className="text-sm italic">등록된 타임라인이 없습니다.</p>
                    <p className="text-xs text-zinc-700">어드민 페이지에서 스케줄을 등록하면 자동으로 생성됩니다.</p>
                </motion.div>
            ) : (
                <div className="space-y-2">
                    {/* 테이블 헤더 (Desktop) */}
                    <div className="hidden md:grid grid-cols-[80px_100px_1fr_1fr] gap-3 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                        <span>시간</span>
                        <span>장소</span>
                        <span>내용</span>
                        <span>세부사항</span>
                    </div>

                    {/* 타임라인 아이템 */}
                    <AnimatePresence>
                        {timelineItems.map((item, idx) => {
                            const isExpanded = expandedId === item.id;
                            const relatedTasks = getTasksForTimeline(item);

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="group"
                                >
                                    {/* 메인 행 */}
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                        className={`w-full text-left transition-all duration-200 rounded-2xl border ${isExpanded
                                                ? 'bg-indigo-500/5 border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                                            }`}
                                    >
                                        {/* Desktop: Grid */}
                                        <div className="hidden md:grid grid-cols-[80px_100px_1fr_1fr] gap-3 px-5 py-4 items-center">
                                            {/* 시간 */}
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={13} className="text-indigo-400 shrink-0" />
                                                <span className="text-sm font-black text-white tabular-nums">{item.time}</span>
                                            </div>

                                            {/* 장소 */}
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {item.location ? (
                                                    <>
                                                        <MapPin size={12} className="text-emerald-400 shrink-0" />
                                                        <span className="text-xs text-emerald-300 font-medium truncate">{item.location}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-zinc-700">-</span>
                                                )}
                                            </div>

                                            {/* 내용 */}
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{item.title}</p>
                                            </div>

                                            {/* 세부사항 */}
                                            <div className="flex items-center justify-between gap-2 min-w-0">
                                                <p className="text-xs text-zinc-400 truncate flex-1">
                                                    {item.detail || '-'}
                                                </p>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {relatedTasks.length > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                                                            <Users size={10} className="inline mr-1" />
                                                            {relatedTasks.length}
                                                        </span>
                                                    )}
                                                    {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mobile: Card */}
                                        <div className="md:hidden p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={13} className="text-indigo-400" />
                                                    <span className="text-sm font-black text-white tabular-nums">{item.time}</span>
                                                    {item.location && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                            <span className="text-xs text-emerald-400 font-medium">{item.location}</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {relatedTasks.length > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                                                            {relatedTasks.length}명
                                                        </span>
                                                    )}
                                                    {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold text-white">{item.title}</p>
                                            {item.detail && (
                                                <p className="text-xs text-zinc-400">{item.detail}</p>
                                            )}
                                        </div>
                                    </button>

                                    {/* 펼침 영역: 배정 인원 + 역할 */}
                                    <AnimatePresence>
                                        {isExpanded && relatedTasks.length > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="ml-4 md:ml-10 mt-1 mb-3 border-l-2 border-indigo-500/30 pl-4 space-y-2">
                                                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-2">
                                                        배정 인원 및 업무
                                                    </p>
                                                    {relatedTasks.map(task => {
                                                        const user = users.find(u => u.id === task.userId);
                                                        const color = getAvatarColor(task.userId);
                                                        return (
                                                            <div
                                                                key={task.id}
                                                                className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:bg-white/[0.04] transition-colors"
                                                            >
                                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-[10px] font-black text-white shrink-0`}>
                                                                    {user?.shortName?.substring(0, 2) ?? task.userName.substring(0, 1)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-sm font-bold text-white">{task.userName}</span>
                                                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${task.category === '인솔' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                                                                                task.category === '점검' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                                                                    task.category === '준비' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                                                                        task.category === '이동' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                                                                                            'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                                                                            }`}>
                                                                            {task.category}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-zinc-400 mt-0.5">{task.title}</p>
                                                                    {task.memo && (
                                                                        <div className="mt-1.5 text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-1 inline-block">
                                                                            💡 {task.memo}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* 펼침: task 없을때 */}
                                    <AnimatePresence>
                                        {isExpanded && relatedTasks.length === 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="ml-4 md:ml-10 mt-1 mb-3 border-l-2 border-zinc-800 pl-4 py-3">
                                                    <p className="text-xs text-zinc-600 italic">이 시간대에 배정된 학생회 업무가 없습니다.</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

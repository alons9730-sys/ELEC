import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Plus, Trash2, ArrowRight, Loader2, Lock, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    subscribeToEvents,
    createEvent,
    deleteEvent,
    type EventDoc,
} from '../services/firebaseService';

const ADMIN_PASSWORD = '0417';

export const EventListPage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<EventDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState('');
    const [creating, setCreating] = useState(false);

    // 어드민 인증 (이 페이지 내에서만)
    const [adminAuth, setAdminAuth] = useState(
        () => sessionStorage.getItem('admin_auth') === 'true'
    );
    const [pwInput, setPwInput] = useState('');
    const [pwError, setPwError] = useState(false);

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pwInput === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_auth', 'true');
            setAdminAuth(true);
            setPwError(false);
        } else {
            setPwError(true);
            setPwInput('');
        }
    };

    useEffect(() => {
        const unsub = subscribeToEvents(
            (evts) => { setEvents(evts); setLoading(false); },
            () => setLoading(false),
        );
        return () => unsub();
    }, []);

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            await createEvent(newTitle.trim());
            toast.success(`🎉 "${newTitle.trim()}" 행사가 생성되었습니다.`);
            setNewTitle('');
        } catch {
            toast.error('행사 생성에 실패했습니다.');
        }
        setCreating(false);
    };

    const handleDelete = async (e: React.MouseEvent, eventId: string, title: string) => {
        e.stopPropagation();
        if (!confirm(`"${title}" 행사와 모든 스케줄을 삭제하시겠습니까?`)) return;
        try {
            await deleteEvent(eventId);
            toast.success('행사가 삭제되었습니다.');
        } catch {
            toast.error('삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-4">
            {/* 헤더 */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                    행사 <span className="text-indigo-500">목록</span>
                </h1>
                <p className="text-zinc-500 text-sm">행사를 선택하면 해당 스케줄을 확인할 수 있습니다.</p>
            </div>

            {/* ─── 행사 목록 (모두에게 보임) ─── */}
            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/8 rounded-3xl text-zinc-600 space-y-3">
                    <Calendar size={32} className="opacity-30" />
                    <p className="text-sm italic">등록된 행사가 없습니다.</p>
                    <p className="text-xs text-zinc-700">아래 관리자 영역에서 새 행사를 만들어 주세요.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {events.map((event, i) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => navigate(`/events/${event.id}/schedule`)}
                                className="group cursor-pointer bg-white/[0.03] border border-white/8 rounded-2xl p-5 hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                        <Calendar size={20} className="text-indigo-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                                            {event.title}
                                        </h3>
                                        <p className="text-xs text-zinc-600">
                                            {event.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') ?? ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/events/${event.id}/timeline`);
                                        }}
                                        className="px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-[11px] font-bold text-violet-400 hover:text-violet-300 hover:bg-violet-500/20 transition-colors flex items-center gap-1"
                                    >
                                        <ClipboardList size={12} />
                                        타임라인
                                    </button>
                                    {adminAuth && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/events/${event.id}/admin`);
                                                }}
                                                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                            >
                                                관리
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, event.id, event.title)}
                                                className="p-1.5 text-zinc-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                    <ArrowRight size={16} className="text-zinc-700 group-hover:text-indigo-400 transition-colors" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* ─── 구분선 ─── */}
            <div className="border-t border-white/5 pt-6" />

            {/* ─── 관리자 영역 (아래쪽) ─── */}
            {!adminAuth ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm mx-auto space-y-5"
                >
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                            <Lock size={22} className="text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">관리자 영역</h3>
                        <p className="text-xs text-zinc-500">행사를 생성하거나 관리하려면 비밀번호를 입력하세요.</p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-3">
                        <input
                            type="password"
                            value={pwInput}
                            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                            placeholder="비밀번호 입력"
                            className={`w-full bg-white/5 border ${pwError ? 'border-rose-500/50' : 'border-white/10'} rounded-2xl py-3 px-5 text-center text-lg tracking-[0.5em] text-white placeholder:text-zinc-600 placeholder:tracking-normal focus:outline-none focus:border-indigo-500/50 transition-all`}
                        />
                        {pwError && <p className="text-xs text-rose-400 text-center">비밀번호가 올바르지 않습니다.</p>}
                        <button
                            type="submit"
                            disabled={!pwInput}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-bold text-sm transition-all"
                        >
                            입장하기
                        </button>
                    </form>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">✦ 관리자 — 새 행사 추가</h3>
                    <div className="flex gap-3">
                        <input
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="새 행사 이름 입력 (예: 2026 신입생 OT)"
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                        <button
                            onClick={handleCreate}
                            disabled={!newTitle.trim() || creating}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shrink-0"
                        >
                            <Plus size={16} />
                            생성
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

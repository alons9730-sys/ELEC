import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Banknote, Plus, Trash2, ArrowRight, Loader2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    subscribeToPayments,
    createPayment,
    deletePayment,
    type PaymentDoc,
} from '../services/firebaseService';

const ADMIN_PASSWORD = '0417';

export const PaymentListPage = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState<PaymentDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTitle, setNewTitle] = useState('');
    const [creating, setCreating] = useState(false);

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
        const unsub = subscribeToPayments(
            (p) => { setPayments(p); setLoading(false); },
            () => setLoading(false),
        );
        return () => unsub();
    }, []);

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            await createPayment(newTitle.trim());
            toast.success(`💰 "${newTitle.trim()}" 납부 목록이 생성되었습니다.`);
            setNewTitle('');
        } catch {
            toast.error('생성에 실패했습니다.');
        }
        setCreating(false);
    };

    const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
        e.stopPropagation();
        if (!confirm(`"${title}" 납부 목록을 삭제하시겠습니까?`)) return;
        try {
            await deletePayment(id);
            toast.success('삭제되었습니다.');
        } catch {
            toast.error('삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-amber-400" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-4">
            <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                    행사비 <span className="text-amber-500">납부 확인</span>
                </h1>
                <p className="text-zinc-500 text-sm">항목을 선택하면 미납 인원을 확인하고 납부 처리할 수 있습니다.</p>
            </div>

            {/* 납부 목록 */}
            {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/8 rounded-3xl text-zinc-600 space-y-3">
                    <Banknote size={32} className="opacity-30" />
                    <p className="text-sm italic">등록된 납부 목록이 없습니다.</p>
                    <p className="text-xs text-zinc-700">아래 관리자 영역에서 새로 만들어 주세요.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {payments.map((payment, i) => (
                            <motion.div
                                key={payment.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => navigate(`/payments/${payment.id}`)}
                                className="group cursor-pointer bg-white/[0.03] border border-white/8 rounded-2xl p-5 hover:border-amber-500/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                        <Banknote size={20} className="text-amber-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                            {payment.title}
                                        </h3>
                                        <p className="text-xs text-zinc-600">
                                            {payment.createdAt?.toDate?.()?.toLocaleDateString('ko-KR') ?? ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {adminAuth && (
                                        <button
                                            onClick={(e) => handleDelete(e, payment.id, payment.title)}
                                            className="p-1.5 text-zinc-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <ArrowRight size={16} className="text-zinc-700 group-hover:text-amber-400 transition-colors" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* 구분선 */}
            <div className="border-t border-white/5 pt-6" />

            {/* 관리자 영역 */}
            {!adminAuth ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm mx-auto space-y-5"
                >
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
                            <Lock size={22} className="text-amber-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">관리자 영역</h3>
                        <p className="text-xs text-zinc-500">납부 목록을 생성하거나 관리하려면 비밀번호를 입력하세요.</p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-3">
                        <input
                            type="password"
                            value={pwInput}
                            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                            placeholder="비밀번호 입력"
                            className={`w-full bg-white/5 border ${pwError ? 'border-rose-500/50' : 'border-white/10'} rounded-2xl py-3 px-5 text-center text-lg tracking-[0.5em] text-white placeholder:text-zinc-600 placeholder:tracking-normal focus:outline-none focus:border-amber-500/50 transition-all`}
                        />
                        {pwError && <p className="text-xs text-rose-400 text-center">비밀번호가 올바르지 않습니다.</p>}
                        <button
                            type="submit"
                            disabled={!pwInput}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-bold text-sm transition-all"
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
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">✦ 관리자 — 새 납부 목록 추가</h3>
                    <div className="flex gap-3">
                        <input
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="납부 항목 입력 (예: 2026 새터 뒷풀이 회비)"
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all"
                        />
                        <button
                            onClick={handleCreate}
                            disabled={!newTitle.trim() || creating}
                            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shrink-0"
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

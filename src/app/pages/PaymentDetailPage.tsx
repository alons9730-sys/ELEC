import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft, Banknote, UserMinus, Plus, Loader2, Lock, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    subscribeToPayments,
    subscribeToPaymentPeople,
    addPaymentPeopleBatch,
    removePaymentPerson,
    type PaymentPerson,
} from '../services/firebaseService';

const ADMIN_PASSWORD = '0417';

export const PaymentDetailPage = () => {
    const { paymentId } = useParams<{ paymentId: string }>();
    const navigate = useNavigate();
    const [people, setPeople] = useState<PaymentPerson[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');

    // 어드민 인증
    const [adminAuth, setAdminAuth] = useState(
        () => sessionStorage.getItem('admin_auth') === 'true'
    );
    const [pwInput, setPwInput] = useState('');
    const [pwError, setPwError] = useState(false);

    // 인원 추가 입력
    const [namesInput, setNamesInput] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

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

    // 제목 구독
    useEffect(() => {
        const unsub = subscribeToPayments((payments) => {
            const p = payments.find(pp => pp.id === paymentId);
            if (p) setTitle(p.title);
        });
        return () => unsub();
    }, [paymentId]);

    // 인원 구독
    useEffect(() => {
        if (!paymentId) return;
        const unsub = subscribeToPaymentPeople(
            paymentId,
            (p) => { setPeople(p); setLoading(false); },
            () => setLoading(false),
        );
        return () => unsub();
    }, [paymentId]);

    // 인원 추가
    const handleAddPeople = async () => {
        if (!paymentId || !namesInput.trim()) return;
        const names = namesInput
            .split(/[,\s]+/)
            .map(n => n.trim())
            .filter(n => n.length > 0);

        if (names.length === 0) return;

        try {
            await addPaymentPeopleBatch(paymentId, names);
            toast.success(`${names.length}명이 추가되었습니다.`);
            setNamesInput('');
            setShowAddForm(false);
        } catch {
            toast.error('추가에 실패했습니다.');
        }
    };

    // 납부 처리 (이름 삭제)
    const handlePaid = async (person: PaymentPerson) => {
        if (!paymentId) return;
        if (!confirm(`"${person.name}" 님의 납부를 확인하시겠습니까?\n(목록에서 제거됩니다)`)) return;
        try {
            await removePaymentPerson(paymentId, person.id);
            toast.success(`✅ ${person.name} 님 납부 확인 완료`);
        } catch {
            toast.error('처리에 실패했습니다.');
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
        <div className="max-w-2xl mx-auto space-y-6 pb-4">
            {/* 헤더 */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 border-b border-white/5 pb-6"
            >
                <button
                    onClick={() => navigate('/payments')}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors shrink-0"
                >
                    <ArrowLeft size={18} className="text-zinc-400" />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-xl">
                    <Banknote size={24} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white truncate">
                        {title || '납부 확인'}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        미납 인원: <span className="text-amber-400 font-bold">{people.length}명</span>
                    </p>
                </div>
            </motion.div>

            {/* 관리자: 인원 추가 */}
            {adminAuth ? (
                <div className="space-y-3">
                    {!showAddForm ? (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                        >
                            <Plus size={14} /> 인원 추가
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 space-y-3"
                        >
                            <p className="text-xs text-zinc-400">이름을 쉼표(,) 또는 줄바꿈으로 구분하여 입력하세요.</p>
                            <textarea
                                value={namesInput}
                                onChange={e => setNamesInput(e.target.value)}
                                placeholder="홍길동, 김철수, 이영희..."
                                rows={4}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none transition-all"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddPeople}
                                    disabled={!namesInput.trim()}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold text-xs transition-all"
                                >
                                    추가하기
                                </button>
                                <button
                                    onClick={() => { setShowAddForm(false); setNamesInput(''); }}
                                    className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-xl font-bold text-xs hover:bg-zinc-700 transition-all"
                                >
                                    취소
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xs mx-auto space-y-3"
                >
                    <div className="text-center space-y-1">
                        <Lock size={16} className="text-amber-400 mx-auto" />
                        <p className="text-xs text-zinc-500">인원을 추가하려면 비밀번호를 입력하세요.</p>
                    </div>
                    <form onSubmit={handleAdminLogin} className="flex gap-2">
                        <input
                            type="password"
                            value={pwInput}
                            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
                            placeholder="비밀번호"
                            className={`flex-1 bg-white/5 border ${pwError ? 'border-rose-500/50' : 'border-white/10'} rounded-xl py-2 px-3 text-center text-sm tracking-widest text-white placeholder:text-zinc-600 placeholder:tracking-normal focus:outline-none transition-all`}
                        />
                        <button type="submit" disabled={!pwInput} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-bold text-xs transition-all">
                            확인
                        </button>
                    </form>
                    {pwError && <p className="text-[11px] text-rose-400 text-center">비밀번호가 올바르지 않습니다.</p>}
                </motion.div>
            )}

            {/* 인원 목록 */}
            {people.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/8 rounded-3xl text-zinc-600 space-y-3">
                    <Users size={32} className="opacity-30" />
                    <p className="text-sm italic">
                        {adminAuth ? '아직 등록된 인원이 없습니다. 위에서 추가해 주세요.' : '미납 인원이 없습니다. 🎉'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                        미납 인원 ({people.length}명) — 이름을 클릭하면 납부 처리됩니다
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <AnimatePresence>
                            {people.map((person) => (
                                <motion.button
                                    key={person.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -8 }}
                                    layout
                                    onClick={() => handlePaid(person)}
                                    className="group relative bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-left hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-200"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                            {person.name}
                                        </span>
                                        <UserMinus size={14} className="text-zinc-700 group-hover:text-amber-400 transition-colors shrink-0" />
                                    </div>
                                    <p className="text-[10px] text-zinc-700 mt-1 group-hover:text-amber-500/50 transition-colors">
                                        클릭하여 납부 확인
                                    </p>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};

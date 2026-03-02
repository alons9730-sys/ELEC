import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ADMIN_PASSWORD = '0417';

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(
        () => sessionStorage.getItem('admin_auth') === 'true'
    );
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_auth', 'true');
            setAuthenticated(true);
            setError(false);
        } else {
            setError(true);
            setPassword('');
        }
    };

    if (authenticated) return <>{children}</>;

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm space-y-8"
            >
                <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                        <Lock size={28} className="text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white">어드민 접근</h1>
                    <p className="text-sm text-zinc-500">관리자 비밀번호를 입력해 주세요.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(false); }}
                            placeholder="비밀번호 입력"
                            autoFocus
                            className={`w-full bg-white/5 border ${error ? 'border-rose-500/50' : 'border-white/10'
                                } rounded-2xl py-4 px-5 text-center text-lg tracking-[0.5em] text-white placeholder:text-zinc-600 placeholder:tracking-normal focus:outline-none focus:border-indigo-500/50 transition-all`}
                        />
                    </div>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-rose-400"
                        >
                            비밀번호가 올바르지 않습니다.
                        </motion.p>
                    )}
                    <button
                        type="submit"
                        disabled={!password}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all text-sm"
                    >
                        입장하기 <ArrowRight size={16} />
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

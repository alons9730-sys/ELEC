import React from 'react';
import { useNavigate } from 'react-router';
import { CalendarDays, Zap, ArrowRight } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center space-y-10 pb-4">
      <div className="space-y-5 max-w-xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
          <Zap size={13} className="text-yellow-400 fill-yellow-400" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">인원별 스케줄 관리 시스템</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-tight">
          2026 전자공학부 학생회 <br />
          <span className="text-indigo-500">스케줄표</span>
        </h1>

        <p className="text-base text-zinc-500 max-w-sm mx-auto leading-relaxed">
          학생회 인원별 배정된 일일 스케줄과 업무를 간편하게 확인하세요.
        </p>
      </div>

      {/* 메인 액션 버튼 */}
      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        <button
          onClick={() => navigate('/events')}
          className="w-full md:w-2/3 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/25 p-8 text-left hover:scale-[1.02] transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col gap-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <CalendarDays size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">행사 목록 보기</h3>
              <p className="text-sm text-emerald-200/50 leading-relaxed">등록된 행사를 선택하여 스케줄을 조회합니다</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400 group-hover:translate-x-1.5 transition-transform">
              입장하기 <ArrowRight size={14} />
            </div>
          </div>
        </button>
      </div>

      {/* 사용법 힌트 */}
      <div className="max-w-md text-center space-y-2 opacity-60">
        <p className="text-xs text-zinc-600">
          💡 행사를 선택한 뒤 어드민에서 텍스트 분석 후 확정하면 개인 스케줄 페이지에 자동 반영됩니다.
        </p>
        <p className="text-xs text-zinc-700">
          데이터는 서버에 저장되어 모든 사용자에게 실시간으로 공유됩니다.
        </p>
      </div>
    </div>
  );
};

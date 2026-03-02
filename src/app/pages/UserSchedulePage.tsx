import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useSchedule } from '../store/ScheduleContext';
import { Calendar, CheckCircle2, Search, ArrowLeft, Clock, Tag, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { subscribeToEvents } from '../services/firebaseService';

// 카테고리 색상
const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  '인솔': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  '점검': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  '준비': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  '이동': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  '업무': { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
};

function getCategoryStyle(cat: string) {
  return CATEGORY_STYLES[cat] ?? CATEGORY_STYLES['업무'];
}

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

// 시간 문자열을 분 단위로 변환 (정렬용)
function timeToMinutes(time: string): number {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

export const UserSchedulePage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { users, tasks, updateTaskStatus } = useSchedule();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTitle, setEventTitle] = useState('');

  // 이벤트 제목 실시간 구독
  useEffect(() => {
    const unsub = subscribeToEvents((events) => {
      const ev = events.find(e => e.id === eventId);
      if (ev) setEventTitle(ev.title);
    });
    return () => unsub();
  }, [eventId]);

  const filteredUsers = useMemo(() =>
    users.filter(u =>
      u.name.includes(searchQuery) ||
      (u.shortName ?? '').includes(searchQuery)
    ),
    [users, searchQuery]
  );

  const currentUser = useMemo(() => users.find(u => u.id === selectedUserId), [users, selectedUserId]);

  const currentUserTasks = useMemo(() =>
    tasks
      .filter(t => t.userId === selectedUserId)
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)),
    [tasks, selectedUserId]
  );

  // 스케줄이 있는 인원 수
  const usersWithTasks = useMemo(() => {
    const ids = new Set(tasks.map(t => t.userId));
    return ids.size;
  }, [tasks]);

  // ─── 인원 선택 화면 ────────────────────────────────────────
  if (!selectedUserId) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-4">
        {/* 헤더 */}
        <div className="text-center space-y-3">
          {eventTitle && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-bold mb-2">
              <Calendar size={12} />
              {eventTitle}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
            인원 <span className="text-emerald-500">선택</span>
          </h1>
          <p className="text-zinc-500 text-sm">이름을 선택하면 개인 스케줄을 확인할 수 있습니다.</p>
          <div className="flex items-center justify-center gap-4 pt-1">
            <span className="text-[11px] text-zinc-600">전체 {users.length}명</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="text-[11px] text-emerald-600">스케줄 배정 {usersWithTasks}명</span>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative max-w-sm mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-zinc-600" />
          </div>
          <input
            type="text"
            placeholder="이름 또는 호칭으로 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/8 rounded-full py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-all"
          />
        </div>

        {/* 인원 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <AnimatePresence>
            {filteredUsers.map((user, i) => {
              const userTaskCount = tasks.filter(t => t.userId === user.id).length;
              const color = getAvatarColor(user.id);
              return (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedUserId(user.id)}
                  className="group cursor-pointer relative"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl`} />
                  <div className="relative bg-zinc-900/80 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-3 hover:border-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-sm font-black text-white shadow-lg`}>
                      {user.shortName ?? user.name.substring(0, 1)}
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{user.name}</h3>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{user.shortName}</p>
                    </div>
                    {userTaskCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        {userTaskCount}건
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-600 border border-zinc-700/50 text-[10px]">
                        없음
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-zinc-600">
            <p>"{searchQuery}"에 해당하는 인원이 없습니다.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── 개인 스케줄 화면 ─────────────────────────────────────
  const color = getAvatarColor(currentUser?.id ?? '');

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-4">
      {/* 뒤로가기 + 프로필 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 border-b border-white/5 pb-6"
      >
        <button
          onClick={() => setSelectedUserId(null)}
          className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors shrink-0"
        >
          <ArrowLeft size={18} className="text-zinc-400" />
        </button>

        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr ${color} flex items-center justify-center font-black text-white shadow-xl shrink-0`}>
          <span className="text-base md:text-lg">{currentUser?.shortName ?? currentUser?.name.substring(0, 1)}</span>
        </div>

        <div className="flex-1 min-w-0">
          {eventTitle && (
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide mb-0.5">{eventTitle}</p>
          )}
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white truncate">{currentUser?.name}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{currentUser?.shortName} · {currentUser?.role}</p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-3xl font-black text-zinc-700">{currentUserTasks.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">배정 업무</p>
        </div>
      </motion.div>

      {/* 업무 목록 */}
      <div className="space-y-3">
        <AnimatePresence>
          {currentUserTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 border border-dashed border-white/8 rounded-3xl text-zinc-600 space-y-3"
            >
              <Calendar size={32} className="opacity-30" />
              <p className="text-sm italic">배정된 업무가 없습니다.</p>
              <p className="text-xs text-zinc-700">어드민 페이지에서 스케줄을 등록해주세요.</p>
            </motion.div>
          ) : (
            currentUserTasks.map((task, idx) => {
              const catStyle = getCategoryStyle(task.category);
              const startTime = task.time.split('-')[0].trim();
              const endTime = task.time.split('-')[1]?.trim();

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="group bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden hover:border-emerald-500/20 transition-all"
                >
                  <div className="flex items-stretch">
                    {/* 시간 바 */}
                    <div className="w-20 md:w-24 shrink-0 flex flex-col items-center justify-center p-3 border-r border-white/5 bg-black/20">
                      <Clock size={12} className="text-zinc-600 mb-1.5" />
                      <p className="text-base md:text-lg font-black text-zinc-200 tabular-nums">{startTime}</p>
                      {endTime && (
                        <p className="text-[10px] text-zinc-600 tabular-nums mt-0.5">~ {endTime}</p>
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 p-4 flex flex-col justify-center gap-2">
                      <h3 className="font-bold text-white text-sm md:text-base">{task.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                          <Tag size={10} />
                          {task.category}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">{task.time}</span>
                      </div>
                    </div>

                    {/* 완료 토글 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newStatus = task.status === 'done' ? 'pending' : 'done';
                        updateTaskStatus(task.id, newStatus);
                        toast.success(newStatus === 'done' ? '✅ 업무 완료!' : '↩️ 미완료로 변경');
                      }}
                      className="px-4 flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                      title={task.status === 'done' ? '미완료로 변경' : '완료 처리'}
                    >
                      <CheckCircle2
                        size={22}
                        className={task.status === 'done'
                          ? 'text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                          : 'text-zinc-800 group-hover:text-zinc-600 transition-colors'
                        }
                      />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

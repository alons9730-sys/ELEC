import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSchedule } from '../store/ScheduleContext';
import { AdminGuard } from '../components/AdminGuard';
import { updateEventTitle, subscribeToEvents, addTimelineItemsBatch, clearTimeline, type EventDoc } from '../services/firebaseService';
import { parseScheduleFull, type Task, type TimelineItem } from '../utils/parser';
import {
  Upload, FileText, Zap, RefreshCw, CheckCircle2, AlertCircle,
  Trash2, Calendar as CalendarIcon, Users, X, Info, FileSpreadsheet,
  ChevronDown, ChevronUp, Pencil, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// 카테고리 색상 매핑
const CATEGORY_STYLES: Record<string, string> = {
  '인솔': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  '점검': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  '준비': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  '이동': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  '업무': 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
};

function getCategoryStyle(cat: string): string {
  return CATEGORY_STYLES[cat] ?? CATEGORY_STYLES['업무'];
}

// 아바타 이니셜 색상
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

export const AdminPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { users, tasks, addTasks, removeTask, updateTask, clearTasks } = useSchedule();
  const [rawText, setRawText] = useState('');
  const [analyzedTasks, setAnalyzedTasks] = useState<Task[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [eventTitle, setEventTitleLocal] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파서 결과
  const [parsedTimeline, setParsedTimeline] = useState<TimelineItem[]>([]);

  // 인라인 편집 상태
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', time: '', category: '', memo: '' });

  // 이벤트 제목 실시간 구독
  useEffect(() => {
    const unsub = subscribeToEvents((events) => {
      const ev = events.find(e => e.id === eventId);
      if (ev) { setEventTitleLocal(ev.title); setTitleInput(ev.title); }
    });
    return () => unsub();
  }, [eventId]);

  // ─── 파일 업로드 ────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'txt' || ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setRawText(ev.target.result);
          toast.success(`📄 "${file.name}" 파일 로드 완료`);
        }
      };
      reader.readAsText(file, 'utf-8');
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // 시트 전체를 CSV 텍스트로 변환
        const csv = XLSX.utils.sheet_to_csv(sheet);
        setRawText(csv);
        toast.success(`📊 "${file.name}" 엑셀 파일 로드 완료`);
      } catch {
        toast.error('엑셀 파일 읽기에 실패했습니다.');
      }
    } else {
      toast.error('.txt, .csv, .xlsx, .xls 파일만 지원합니다.');
    }

    // input 초기화 (같은 파일 재업로드 가능하도록)
    e.target.value = '';
  };

  // ─── 분석 ────────────────────────────────────────────────
  const handleAnalyze = () => {
    if (!rawText.trim()) {
      toast.error('텍스트를 입력하거나 파일을 업로드하세요.');
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = parseScheduleFull(rawText, users);
      setAnalyzedTasks(result.tasks);
      setParsedTimeline(result.timeline);
      setIsAnalyzing(false);
      if (result.tasks.length > 0) {
        toast.success(`✅ ${result.tasks.length}개의 업무 + ${result.timeline.length}개의 타임라인이 분석되었습니다.`);
      } else if (result.timeline.length > 0) {
        toast.success(`📋 ${result.timeline.length}개의 타임라인 항목이 분석되었습니다. (배정 인원 없음)`);
      } else {
        toast.info('매칭된 인원이 없습니다. 형식과 명단을 확인해주세요.');
      }
    }, 600);
  };

  // ─── 확정 ────────────────────────────────────────────────
  const confirmTasks = async () => {
    addTasks(analyzedTasks);
    // 타임라인도 함께 저장
    if (eventId && parsedTimeline.length > 0) {
      try {
        await clearTimeline(eventId);
        const tlItems = parsedTimeline.map((tl, idx) => ({
          id: tl.id,
          time: tl.time,
          location: tl.location,
          title: tl.title,
          detail: tl.detail,
          assignedTaskIds: tl.assignedTasks.map(t => t.id),
          order: idx,
        }));
        await addTimelineItemsBatch(eventId, tlItems);
        toast.success(`🚀 ${analyzedTasks.length}개 업무 + ${parsedTimeline.length}개 타임라인 등록 완료!`);
      } catch (err) {
        console.error(err);
        toast.success(`🚀 ${analyzedTasks.length}개의 업무가 등록되었습니다.`);
      }
    } else {
      toast.success(`🚀 ${analyzedTasks.length}개의 업무가 등록되었습니다.`);
    }
    setAnalyzedTasks([]);
    setParsedTimeline([]);
    setRawText('');
  };

  // ─── 이벤트 제목 저장 ────────────────────────────────────
  const saveEventTitle = () => {
    if (!eventId) return;
    updateEventTitle(eventId, titleInput.trim()).catch(console.error);
    setEditingTitle(false);
    if (titleInput.trim()) toast.success('이벤트 제목이 저장되었습니다.');
  };

  // 분석 결과 기준 인원별 통계
  const userStats = analyzedTasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.userName] = (acc[t.userName] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminGuard>
      <div className="space-y-6 pb-4">
        {/* ─── 헤더 ─────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-1">
              어드민 <span className="text-indigo-500">허브</span>
            </h1>
            <p className="text-zinc-500 text-sm">스케줄 텍스트를 붙여넣거나 파일을 업로드하여 업무를 자동 배정하세요.</p>
          </div>
          <button
            onClick={clearTasks}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-full text-xs font-bold border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
          >
            <Trash2 size={13} />
            전체 초기화
          </button>
        </header>

        {/* ─── 이벤트 제목 ─────────────────────────────────── */}
        <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/8 rounded-2xl">
          <CalendarIcon size={16} className="text-indigo-400 shrink-0" />
          {editingTitle ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEventTitle()}
                placeholder="이벤트 제목 입력..."
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-all"
                autoFocus
              />
              <button onClick={saveEventTitle} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 transition-colors">저장</button>
              <button onClick={() => { setEditingTitle(false); setTitleInput(eventTitle); }} className="p-1.5 text-zinc-500 hover:text-white">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-sm text-zinc-300 truncate">
                {eventTitle || <span className="text-zinc-600 italic">이벤트 제목 없음</span>}
              </span>
              <button
                onClick={() => { setEditingTitle(true); setTitleInput(eventTitle); }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wide ml-auto shrink-0"
              >
                {eventTitle ? '수정' : '+ 추가'}
              </button>
            </div>
          )}
        </div>

        {/* ─── 메인 그리드 ─────────────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* ── 입력 영역 ─────────────────────────────── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white/[0.03] border border-white/8 p-5 md:p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[60px] rounded-full pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-bold flex items-center gap-2 text-white">
                  <Zap size={16} className="text-indigo-400" />
                  스마트 파서
                </h3>
                <button
                  onClick={() => setShowGuide(v => !v)}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Info size={13} />
                  입력 가이드
                  {showGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {/* 입력 가이드 */}
              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    key="guide"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 relative z-10 overflow-hidden"
                  >
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl space-y-2">
                      <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-wide mb-2">지원 형식</p>
                      {[
                        '16:00 - 16:30 인솔 인원 : 장현준 - 정별하',
                        '인솔 인원 : 이도윤, 제민재, 도훈',
                        '도윤 : 자료 준비하기',
                        '태성, 민재 (2) : 과깃발 챙기기',
                        '현준 - 별하 : 안내 방송',
                      ].map((ex, i) => (
                        <code key={i} className="block text-[11px] text-zinc-400 font-mono bg-black/30 rounded px-2 py-1">{ex}</code>
                      ))}
                      <p className="text-[10px] text-zinc-500 mt-2">
                        성명(이도윤)과 단명(도윤) 모두 인식합니다.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3 relative z-10">
                <div className="relative">
                  <textarea
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder={`스케줄 텍스트를 붙여넣으세요...\n\n예)\n16:00 - 16:30 인솔 인원 : 장현준 - 정별하\n도윤 : 자료 준비하기\n태성, 민재 (2) : 과깃발 챙기기`}
                    className="w-full h-64 md:h-72 bg-black/40 border border-white/8 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500/60 transition-all resize-none font-mono text-zinc-300 placeholder:text-zinc-700 leading-relaxed"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-1.5">
                    {rawText && (
                      <button
                        onClick={() => setRawText('')}
                        className="p-2 bg-zinc-800/80 border border-white/5 rounded-xl hover:bg-zinc-700/80 transition-colors text-zinc-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <label
                      className="cursor-pointer p-2 bg-zinc-800/80 border border-white/5 rounded-xl hover:bg-zinc-700/80 transition-colors text-zinc-400 hover:text-white"
                      title="파일 업로드 (.txt, .csv, .xlsx)"
                    >
                      <FileSpreadsheet size={14} />
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".txt,.csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={!rawText.trim() || isAnalyzing}
                  className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all text-sm ${isAnalyzing
                    ? 'bg-zinc-800 text-zinc-600 cursor-wait'
                    : !rawText.trim()
                      ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-500/20'
                    }`}
                >
                  {isAnalyzing ? (
                    <><RefreshCw size={16} className="animate-spin" /> 분석 중...</>
                  ) : (
                    <><Zap size={16} /> 분석 실행</>
                  )}
                </button>
              </div>
            </div>

            {/* 인원 명단 간단 뷰 */}
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-zinc-500" />
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wide">등록된 명단 ({users.length}명)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {users.map(u => (
                  <span key={u.id} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-[11px] text-zinc-400 font-medium">
                    {u.name}
                    <span className="text-zinc-600 ml-1">({u.shortName})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── 결과 영역 ─────────────────────────────── */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="popLayout">
              {analyzedTasks.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="bg-zinc-900/50 border border-indigo-500/25 p-5 md:p-6 rounded-3xl"
                >
                  {/* 분석 결과 헤더 */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h3 className="font-bold flex items-center gap-2 text-white">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      분석 결과
                      <span className="text-zinc-500 text-sm font-normal">{analyzedTasks.length}건</span>
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAnalyzedTasks([])}
                        className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-full text-[11px] font-bold border border-white/5 hover:bg-zinc-700 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={confirmTasks}
                        className="px-4 py-1.5 bg-emerald-500 text-black rounded-full text-[11px] font-black hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                      >
                        확정 등록
                      </button>
                    </div>
                  </div>

                  {/* 인원 통계 뱃지 */}
                  <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-black/30 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wide self-center mr-1">배정된 인원:</span>
                    {Object.entries(userStats).map(([name, count]) => (
                      <span key={name} className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded-full text-[11px] font-medium">
                        {name} <span className="opacity-60">{count}</span>
                      </span>
                    ))}
                  </div>

                  {/* 태스크 목록 */}
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {analyzedTasks.map((t, i) => {
                      const user = users.find(u => u.id === t.userId);
                      const color = getAvatarColor(t.userId);
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 p-3 bg-black/40 border border-white/5 rounded-2xl hover:border-indigo-500/20 transition-all"
                        >
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-[10px] font-black text-white shrink-0`}>
                            {user?.shortName?.substring(0, 2) ?? t.userName.substring(0, 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                              {t.userName}
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-zinc-400 border border-white/5 shrink-0">
                                {t.time}
                              </span>
                            </p>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">{t.title}</p>
                          </div>
                          <span className={`shrink-0 text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border font-bold ${getCategoryStyle(t.category)}`}>
                            {t.category}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="feed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden flex flex-col"
                  style={{ minHeight: 480 }}
                >
                  <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <h3 className="font-bold flex items-center gap-2 text-white">
                      <CalendarIcon size={16} className="text-zinc-500" />
                      등록된 스케줄
                    </h3>
                    <span className="text-[11px] font-bold text-zinc-500 bg-black/20 px-3 py-1 rounded-full">
                      {tasks.length}건
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[520px]">
                    {tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-zinc-700 space-y-3">
                        <CalendarIcon size={32} className="opacity-30" />
                        <p className="text-sm italic">등록된 스케줄이 없습니다.</p>
                        <p className="text-xs text-zinc-600">왼쪽에서 텍스트를 분석하여 추가하세요.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {tasks.slice().reverse().map(task => {
                          const user = users.find(u => u.id === task.userId);
                          const color = getAvatarColor(task.userId);
                          const isEditing = editingTaskId === task.id;
                          return (
                            <div key={task.id} className="group hover:bg-white/[0.02] p-4 flex items-start justify-between transition-colors gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5`}>
                                  {user?.shortName?.substring(0, 2) ?? task.userName.substring(0, 1)}
                                </div>
                                {isEditing ? (
                                  <div className="flex-1 space-y-2">
                                    <input
                                      value={editForm.title}
                                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                      className="w-full bg-white/5 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                                      placeholder="업무 제목"
                                    />
                                    <input
                                      value={editForm.memo}
                                      onChange={e => setEditForm(f => ({ ...f, memo: e.target.value }))}
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
                                      placeholder="특이사항 메모 (선택)"
                                    />
                                    <div className="flex gap-2">
                                      <input
                                        value={editForm.time}
                                        onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                                        className="w-28 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none"
                                        placeholder="시간"
                                      />
                                      <select
                                        value={editForm.category}
                                        onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none"
                                      >
                                        {['인솔', '점검', '준비', '이동', '업무'].map(c => (
                                          <option key={c} value={c} className="bg-zinc-900">{c}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          updateTask(task.id, editForm);
                                          setEditingTaskId(null);
                                          toast.success('업무가 수정되었습니다.');
                                        }}
                                        className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg font-bold hover:bg-emerald-500 transition-colors flex items-center gap-1"
                                      >
                                        <Check size={12} /> 저장
                                      </button>
                                      <button
                                        onClick={() => setEditingTaskId(null)}
                                        className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs rounded-lg font-bold hover:bg-zinc-700 transition-colors"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white mb-1 truncate">{task.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
                                      <span>{task.userName}</span>
                                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                      <span className="font-mono text-indigo-400">{task.time}</span>
                                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] border font-bold ${getCategoryStyle(task.category)}`}>
                                        {task.category}
                                      </span>
                                    </div>
                                    {task.memo && (
                                      <div className="mt-2 text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-1.5 inline-block">
                                        💡 {task.memo}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {!isEditing && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingTaskId(task.id);
                                      setEditForm({ title: task.title, time: task.time, category: task.category, memo: task.memo || '' });
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-indigo-400 transition-all"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => removeTask(task.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-rose-400 transition-all"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};

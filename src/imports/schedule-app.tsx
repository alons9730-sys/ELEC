import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Calendar, 
  Plus, 
  LayoutDashboard, 
  User, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  Briefcase,
  Search,
  Settings,
  Bell,
  FileText,
  Upload,
  RefreshCw,
  Trash2,
  AlertCircle
} from 'lucide-react';

/**
 * @title Intelligent Schedule Management System with AI Auto-Parser
 * @description Automatically analyzes text/files to assign tasks based on user matching.
 */

const App = () => {
  // State Management
  const [view, setView] = useState('admin'); // 'admin' or 'personal'
  const [selectedUserId, setSelectedUserId] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'bulk'
  
  // Mock Data (Updated with names from the user's example)
  const [users] = useState([
    { id: 1, name: '장현준', role: '인솔 팀장', avatar: 'HJ' },
    { id: 2, name: '태성', role: '장비 관리', avatar: 'TS' },
    { id: 3, name: '민재', role: '장비 관리', avatar: 'MJ' },
    { id: 4, name: '정별하', role: '인솔 요원', avatar: 'BH' },
    { id: 5, name: '최정윤', role: '인솔 요원', avatar: 'JY' },
    { id: 6, name: '임가은', role: '인솔 요원', avatar: 'GE' },
  ]);

  const [tasks, setTasks] = useState([
    { id: 1, userId: 1, title: '오전 현장 점검', category: 'Checkup', time: '09:00 - 10:00', status: 'done' },
  ]);

  // Bulk Analysis State
  const [rawText, setRawText] = useState("");
  const [analyzedTasks, setAnalyzedTasks] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Filtered Data
  const currentUserTasks = useMemo(() => 
    tasks.filter(task => task.userId === selectedUserId),
    [tasks, selectedUserId]
  );

  const currentUser = useMemo(() => 
    users.find(u => u.id === selectedUserId),
    [users, selectedUserId]
  );

  /**
   * Core Logic: Smart Text Parsing
   * Analyzes input text to match names with users and extract time/tasks
   */
  const analyzeScheduleText = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const lines = rawText.split('\n');
      let currentTime = "10:00 - 11:00";
      const newAnalyzed = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // 1. Time Detection (e.g., 16:00 - 16:30)
        const timeMatch = trimmed.match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/);
        if (timeMatch) currentTime = timeMatch[0];

        // 2. Multi-User Assignment (e.g., 인원 : 이름1 - 이름2)
        if (trimmed.includes(':') && (trimmed.includes('인원') || trimmed.includes('인솔'))) {
          const parts = trimmed.split(':');
          const taskName = parts[0].replace('인원', '').replace('인솔', '').trim() || '인솔';
          users.forEach(user => {
            if (parts[1].includes(user.name)) {
              newAnalyzed.push({
                id: Math.random(),
                userId: user.id,
                userName: user.name,
                title: taskName,
                category: '인솔',
                time: currentTime,
                status: 'pending'
              });
            }
          });
        } 
        // 3. Specific Assignment (e.g., 태성, 민재 (2) : 업무)
        else if (trimmed.includes(':')) {
          const parts = trimmed.split(':');
          const userPart = parts[0];
          const taskDetail = parts[1].trim();
          
          users.forEach(user => {
            if (userPart.includes(user.name)) {
              newAnalyzed.push({
                id: Math.random(),
                userId: user.id,
                userName: user.name,
                title: taskDetail,
                category: '특수',
                time: currentTime,
                status: 'pending'
              });
            }
          });
        }
      });

      setAnalyzedTasks(newAnalyzed);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawText(e.target.result);
    };
    reader.readAsText(file);
  };

  const confirmBulkTasks = () => {
    const tasksToAdd = analyzedTasks.map(({userName, ...rest}) => ({
      ...rest,
      id: Date.now() + Math.random()
    }));
    setTasks([...tasks, ...tasksToAdd]);
    setAnalyzedTasks([]);
    setRawText("");
    alert(`${tasksToAdd.length}개의 일정이 성공적으로 배정되었습니다.`);
  };

  // UI Components
  const CategoryBadge = ({ category }) => {
    const colors = {
      '인솔': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      '특수': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'General': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    };
    return (
      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border ${colors[category] || colors.General}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-600 rounded-full blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col hidden lg:flex">
          <div className="p-8 mb-8">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                <Zap size={22} className="text-white fill-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tighter uppercase">Nexus <span className="text-indigo-500">Task</span></h1>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <div onClick={() => setView('admin')} className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all ${view === 'admin' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
              <LayoutDashboard size={20} /> <span className="font-medium">Admin Hub</span>
            </div>
            <div onClick={() => setView('personal')} className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all ${view === 'personal' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
              <User size={20} /> <span className="font-medium">My Schedule</span>
            </div>
            <div className="mt-8 px-8 mb-4 text-[11px] uppercase tracking-[0.2em] text-zinc-600 font-bold">Team</div>
            {users.map(u => (
              <div 
                key={u.id}
                onClick={() => { setSelectedUserId(u.id); setView('personal'); }}
                className={`flex items-center gap-3 px-8 py-3 cursor-pointer hover:bg-white/5 transition-all group ${selectedUserId === u.id && view === 'personal' ? 'text-indigo-400' : 'text-zinc-500'}`}
              >
                <div className={`w-2 h-2 rounded-full ${selectedUserId === u.id ? 'bg-indigo-500' : 'bg-zinc-800'}`} />
                <span className="text-sm font-medium">{u.name}</span>
              </div>
            ))}
          </nav>

          <div className="p-8 mt-auto border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold">JD</div>
              <div><p className="text-xs font-bold">Admin User</p></div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative h-screen custom-scrollbar">
          <header className="sticky top-0 z-30 flex items-center justify-between px-10 py-6 bg-black/40 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold uppercase tracking-widest">{view === 'admin' ? 'Administrator' : 'Personal View'}</h2>
            </div>
            <button 
              onClick={() => setView(view === 'admin' ? 'personal' : 'admin')}
              className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all hover:bg-indigo-500 hover:text-white"
            >
              Switch Mode
            </button>
          </header>

          <div className={`p-10 max-w-7xl mx-auto transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {view === 'admin' ? (
              <div className="space-y-10">
                <section>
                  <h2 className="text-5xl font-black tracking-tighter mb-8 italic">ASSIGNMENT <span className="text-zinc-700 not-italic">ENGINE</span></h2>
                  
                  {/* Tab Navigation */}
                  <div className="flex gap-4 mb-8">
                    <button 
                      onClick={() => setActiveTab('manual')}
                      className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-500 border border-white/5'}`}
                    >
                      Manual Entry
                    </button>
                    <button 
                      onClick={() => setActiveTab('bulk')}
                      className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'bulk' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-500 border border-white/5'}`}
                    >
                      Smart Bulk Upload
                    </button>
                  </div>

                  <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left Side: Input Form */}
                    <div className="lg:col-span-5 space-y-6">
                      {activeTab === 'bulk' ? (
                        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm relative overflow-hidden">
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Upload size={18} className="text-indigo-400" /> Smart Parser
                          </h3>
                          <div className="space-y-4">
                            <div className="relative group">
                              <textarea 
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="여기에 엑셀 내용이나 텍스트를 붙여넣으세요..."
                                className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-5 text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none font-mono leading-relaxed"
                              />
                              <div className="absolute top-4 right-4 flex gap-2">
                                <label className="cursor-pointer p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                  <FileText size={16} />
                                  <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
                                </label>
                              </div>
                            </div>
                            
                            <button 
                              onClick={analyzeScheduleText}
                              disabled={!rawText || isAnalyzing}
                              className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isAnalyzing ? 'bg-zinc-800 text-zinc-600 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                            >
                              {isAnalyzing ? <RefreshCw size={20} className="animate-spin" /> : <Zap size={20} />}
                              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                            </button>
                          </div>
                          <div className="mt-6 flex items-start gap-3 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                            <AlertCircle size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-indigo-300 leading-relaxed uppercase tracking-tight">
                              명단에 있는 이름(장현준, 태성 등)을 자동으로 감지하여 시간대에 맞춰 업무를 슬롯팅합니다.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem]">
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus size={18} className="text-indigo-400" /> Single Assignment</h3>
                           <p className="text-zinc-500 text-sm mb-6 italic">Coming soon: Enhanced manual entry with drag-and-drop.</p>
                           <div className="h-64 border border-dashed border-white/10 rounded-2xl flex items-center justify-center">
                              <span className="text-zinc-600 text-sm">Manual UI Placeholder</span>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Right Side: Results & Feed */}
                    <div className="lg:col-span-7 space-y-6">
                      {analyzedTasks.length > 0 ? (
                        <div className="bg-white/5 border border-indigo-500/30 p-8 rounded-[2rem] animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                              <RefreshCw size={18} className="text-indigo-400" /> Analysis Results
                            </h3>
                            <div className="flex gap-3">
                              <button onClick={() => setAnalyzedTasks([])} className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500/20">Discard All</button>
                              <button onClick={confirmBulkTasks} className="px-6 py-2 bg-emerald-500 text-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform">Confirm & Push</button>
                            </div>
                          </div>
                          
                          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {analyzedTasks.map((t, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black text-indigo-400">
                                    {t.userName.substring(0, 2)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                      {t.userName} <span className="text-[10px] font-normal text-zinc-500">@{t.time}</span>
                                    </p>
                                    <p className="text-xs text-zinc-500 line-clamp-1">{t.title}</p>
                                  </div>
                                </div>
                                <CategoryBadge category={t.category} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col">
                          <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Users size={18} className="text-emerald-400" /> Live Schedule Feed</h3>
                          </div>
                          <div className="p-8 overflow-auto max-h-[600px] custom-scrollbar">
                             {tasks.length === 0 ? (
                               <div className="text-center py-20 text-zinc-600 italic">No schedules active.</div>
                             ) : (
                               <table className="w-full text-left">
                                 <thead>
                                   <tr className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 border-b border-white/5">
                                     <th className="pb-4">User</th>
                                     <th className="pb-4">Task</th>
                                     <th className="pb-4">Timeline</th>
                                   </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5">
                                   {tasks.slice().reverse().map((task, idx) => (
                                     <tr key={idx} className="group hover:bg-white/[0.02]">
                                       <td className="py-4 text-sm font-bold">{users.find(u => u.id === task.userId)?.name}</td>
                                       <td className="py-4 text-xs text-zinc-400">{task.title}</td>
                                       <td className="py-4 text-[10px] font-mono text-zinc-600">{task.time}</td>
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              /* PERSONAL VIEW (Remains high-end and responsive) */
              <div className="max-w-4xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                      {currentUser?.avatar}
                    </div>
                    <div>
                      <h2 className="text-6xl font-black tracking-tighter uppercase">{currentUser?.name}</h2>
                      <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mt-1">{currentUser?.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black text-zinc-800 italic">{currentUserTasks.length}</p>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Today's Missions</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {currentUserTasks.map((task, idx) => (
                    <div key={idx} className="group bg-white/5 border border-white/10 p-10 rounded-[3rem] hover:border-indigo-500/30 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Calendar size={120} />
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-8 relative z-10">
                        <div className="md:w-32">
                           <p className="text-2xl font-black italic group-hover:text-indigo-400 transition-colors">{task.time.split(' - ')[0]}</p>
                           <p className="text-[10px] uppercase font-bold text-zinc-600">Start Time</p>
                        </div>
                        <div className="flex-1">
                           <h3 className="text-2xl font-bold mb-2">{task.title}</h3>
                           <CategoryBadge category={task.category} />
                        </div>
                        <CheckCircle2 size={32} className={task.status === 'done' ? 'text-emerald-500' : 'text-zinc-800'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Space Grotesk', sans-serif; scrollbar-width: none; background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.25; }
        }
        .animate-pulse { animation: pulse 8s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;
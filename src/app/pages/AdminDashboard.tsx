import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Trash2, Zap, ArrowRight, User } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { parseScheduleText, Task } from '../lib/schedule-parser';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const AdminDashboard = () => {
  const { users, addTasks, tasks, clearTasks } = useSchedule();
  const [rawText, setRawText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewTasks, setPreviewTasks] = useState<Task[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      toast.error('Only text files are supported for now.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setRawText(e.target.result as string);
        toast.success('File loaded successfully');
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyze = () => {
    if (!rawText.trim()) {
      toast.error('Please enter text or upload a file');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate processing delay for UX
    setTimeout(() => {
      try {
        const results = parseScheduleText(rawText, users);
        setPreviewTasks(results);
        setStep('preview');
        if (results.length === 0) {
          toast.warning('No tasks were detected. Check the format.');
        } else {
          toast.success(`Found ${results.length} tasks!`);
        }
      } catch (error) {
        console.error(error);
        toast.error('Error parsing text.');
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);
  };

  const handleConfirm = () => {
    addTasks(previewTasks);
    setRawText("");
    setPreviewTasks([]);
    setStep('input');
    toast.success('Schedule updated successfully!');
  };

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase italic">
            Command <span className="text-indigo-500 not-italic">Center</span>
          </h1>
          <p className="mt-2 text-zinc-400 font-mono text-sm tracking-wide">
            Manage team assignments and intelligent parsing.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-zinc-900 px-6 py-3 rounded-xl border border-white/5 flex flex-col items-center">
             <span className="text-2xl font-bold text-white">{users.length}</span>
             <span className="text-[10px] uppercase text-zinc-500 font-bold">Agents</span>
          </div>
          <div className="bg-zinc-900 px-6 py-3 rounded-xl border border-white/5 flex flex-col items-center">
             <span className="text-2xl font-bold text-emerald-400">{tasks.length}</span>
             <span className="text-[10px] uppercase text-zinc-500 font-bold">Active Tasks</span>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-1 overflow-hidden">
            <div className="bg-[#0a0a0a] rounded-[1.3rem] p-6 lg:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Upload size={18} className="text-indigo-400" /> 
                  Source Input
                </h2>
                <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors flex items-center gap-2">
                   <FileText size={14} /> Upload TXT
                   <input type="file" className="hidden" accept=".txt" onChange={handleFileUpload} />
                </label>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none rounded-2xl" />
                <textarea 
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste schedule text here (e.g. 16:00 - 16:30 Team: John, Jane...)"
                  className="w-full h-80 bg-zinc-900/50 border border-white/10 rounded-2xl p-5 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none font-mono leading-relaxed"
                />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !rawText}
                className="w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Zap fill="currentColor" />}
                {isAnalyzing ? 'Processing...' : 'Analyze Text'}
              </button>
              
              <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-xl flex gap-3 items-start">
                <AlertCircle className="text-indigo-400 shrink-0 w-5 h-5" />
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  Supported format: <br/>
                  <code className="bg-black/30 px-1 py-0.5 rounded text-indigo-300">HH:MM - HH:MM Task : Names</code> or <br/>
                  <code className="bg-black/30 px-1 py-0.5 rounded text-indigo-300">Names : Specific Task</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results / Preview Section */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {step === 'preview' && previewTasks.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-zinc-900/30 border border-emerald-500/30 rounded-3xl overflow-hidden"
              >
                <div className="p-8 border-b border-emerald-500/20 flex justify-between items-center bg-emerald-900/10">
                  <div>
                    <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 size={20} /> Analysis Complete
                    </h3>
                    <p className="text-emerald-500/60 text-xs mt-1 uppercase tracking-wider font-bold">
                      {previewTasks.length} tasks ready to assign
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setStep('input')}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleConfirm}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105"
                    >
                      Confirm All
                    </button>
                  </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                  {previewTasks.map((task, idx) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center gap-4 group hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400 shrink-0">
                        {task.userName.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-bold text-sm truncate">{task.userName}</span>
                          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-500 font-mono">
                            {task.time}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs truncate">{task.title}</p>
                      </div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/50 border border-emerald-500/20 px-2 py-1 rounded">
                        {task.category}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 min-h-[400px] flex flex-col justify-center items-center text-center space-y-6">
                 <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <ArrowRight className="text-zinc-600" size={32} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-white mb-2">Ready for Input</h3>
                   <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                     Enter your schedule text on the left to see the parsing magic happen here.
                   </p>
                 </div>
                 
                 {/* Live Feed of Existing Tasks if any */}
                 {tasks.length > 0 && (
                   <div className="w-full mt-8 border-t border-white/5 pt-8">
                     <div className="flex justify-between items-center mb-4">
                       <span className="text-xs uppercase font-bold text-zinc-500 tracking-widest">Current Database</span>
                       <button onClick={clearTasks} className="text-rose-500 text-xs hover:underline flex items-center gap-1"><Trash2 size={12}/> Clear All</button>
                     </div>
                     <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar text-left">
                       {tasks.slice().reverse().slice(0, 5).map(task => (
                         <div key={task.id} className="text-xs text-zinc-400 py-2 border-b border-white/5 flex justify-between">
                            <span>{task.userName} - {task.title}</span>
                            <span className="font-mono opacity-50">{task.time}</span>
                         </div>
                       ))}
                       {tasks.length > 5 && <div className="text-center text-xs text-zinc-600 py-2">...and {tasks.length - 5} more</div>}
                     </div>
                   </div>
                 )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

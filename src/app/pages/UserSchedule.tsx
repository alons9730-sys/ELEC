import React, { useState, useMemo } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, MapPin, Clock, ArrowLeft, User } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export const UserSchedule = () => {
  const { users, tasks } = useSchedule();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentUser = users.find(u => u.id === selectedUserId);
  
  const userTasks = useMemo(() => {
    if (!selectedUserId) return [];
    return tasks
      .filter(t => t.userId === selectedUserId)
      // Sort roughly by time (simple string sort works for HH:MM usually, but better if we parse)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [tasks, selectedUserId]);

  if (!selectedUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full space-y-12"
        >
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
              IDENTITY
            </h1>
            <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">
              Select your profile to access mission data
            </p>
          </div>

          <div className="relative max-w-md mx-auto group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search personnel..."
              className="w-full bg-zinc-900/50 border border-white/10 rounded-full py-4 pl-12 pr-6 text-white focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
            {filteredUsers.map((user) => (
              <motion.button
                key={user.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedUserId(user.id)}
                className="bg-zinc-900/40 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-xl font-bold text-white group-hover:from-indigo-600 group-hover:to-violet-500 transition-all shadow-lg">
                  {user.avatar || user.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-indigo-200">{user.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{user.role}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => setSelectedUserId(null)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Back to Roster</span>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <h2 className="text-lg font-bold text-white leading-none">{currentUser?.name}</h2>
            <p className="text-[10px] uppercase tracking-widest text-indigo-400">{currentUser?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
             {currentUser?.avatar || currentUser?.name.slice(0, 1)}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6 lg:p-12 pb-24">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic mb-4">
            DAILY <span className="text-indigo-500 not-italic">BRIEF</span>
          </h1>
          <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono">
             <Calendar size={16} />
             <span>{format(new Date(), 'EEEE, MMMM do, yyyy')}</span>
          </div>
        </div>

        {userTasks.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
             <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
               <Calendar size={24} />
             </div>
             <p className="text-zinc-400 font-medium">No tasks assigned yet.</p>
             <p className="text-zinc-600 text-xs mt-2">Check back later or contact admin.</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-indigo-500 before:via-zinc-800 before:to-zinc-900 before:content-['']">
            {userTasks.map((task, idx) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-12 group"
              >
                {/* Timeline Dot */}
                <div className="absolute left-0 top-6 w-10 h-10 bg-black rounded-full border-4 border-black flex items-center justify-center z-10">
                   <div className={clsx(
                     "w-3 h-3 rounded-full transition-all duration-500",
                     task.status === 'done' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] group-hover:scale-125"
                   )} />
                </div>

                {/* Card */}
                <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl hover:bg-zinc-900 hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                      <Clock size={100} />
                   </div>
                   
                   <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                      <div className="md:w-32 shrink-0">
                         <div className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/5 text-xs font-mono text-zinc-300 mb-1">
                           {task.time}
                         </div>
                         <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mt-2">
                           {task.category}
                         </p>
                      </div>
                      
                      <div className="flex-1 border-l border-white/5 md:pl-6">
                         <h3 className="text-xl font-bold text-white mb-2 leading-tight">{task.title}</h3>
                         {task.originalText && (
                           <p className="text-xs text-zinc-500 bg-black/20 p-2 rounded border border-white/5 line-clamp-2">
                             Context: "{task.originalText}"
                           </p>
                         )}
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

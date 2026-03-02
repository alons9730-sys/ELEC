import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, Zap, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

import { ScheduleProvider } from '../context/ScheduleContext';
import { Toaster } from 'sonner';

export const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Admin Hub', path: '/admin' },
    { icon: Users, label: 'My Schedule', path: '/' },
    // { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <ScheduleProvider>
      <Toaster position="top-center" theme="dark" />
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30 flex relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl z-20 sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
              <Zap size={22} className="text-white fill-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter uppercase">Nexus <span className="text-indigo-500">Task</span></h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive ? "text-white bg-white/5" : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={clsx("relative z-10 transition-colors", isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                  <span className="relative z-10 font-medium tracking-wide text-sm">{item.label}</span>
                  {isActive && <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-white/5 rounded-xl border border-white/5" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400">JD</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-300">Admin User</span>
              <span className="text-[10px] text-zinc-600">Pro License</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Zap size={20} className="text-indigo-500 fill-indigo-500" />
           <span className="font-bold tracking-tight">NEXUS</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 z-40 bg-black pt-24 px-6 pb-6 flex flex-col gap-4"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => clsx(
                  "flex items-center gap-4 px-6 py-5 rounded-2xl border transition-all",
                  isActive ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-200" : "bg-zinc-900/50 border-white/5 text-zinc-500"
                )}
              >
                <item.icon size={24} />
                <span className="text-lg font-bold">{item.label}</span>
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-y-auto h-screen pt-20 lg:pt-0">
        <Outlet />
      </main>
    </div>
    </ScheduleProvider>
  );
};

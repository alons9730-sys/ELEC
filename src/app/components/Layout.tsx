import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, Users, CalendarDays, Zap, Menu, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarNavClass = ({ isActive }: { isActive: boolean }) =>
    twMerge(
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
      isActive
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
    );

  const bottomNavClass = ({ isActive }: { isActive: boolean }) =>
    twMerge(
      'flex flex-col items-center justify-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200 text-[10px] font-bold uppercase tracking-wide',
      isActive
        ? 'text-indigo-400 bg-indigo-500/15'
        : 'text-zinc-500'
    );

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col hidden lg:flex sticky top-0 h-screen shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase">
              일정 <span className="text-indigo-400">관리</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-3 mt-3">
            메뉴
          </p>
          <NavLink to="/" className={sidebarNavClass} end>
            <LayoutDashboard size={18} />
            <span className="font-medium">홈</span>
          </NavLink>
          <NavLink to="/events" className={sidebarNavClass}>
            <CalendarDays size={18} />
            <span className="font-medium">행사 목록</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">명단</p>
            <p className="text-sm text-zinc-400 font-medium">총 33명</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center">
            <Zap size={15} className="text-white fill-white" />
          </div>
          <h1 className="text-base font-black tracking-tight uppercase">
            일정 <span className="text-indigo-400">관리</span>
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto h-screen scrollbar-hide">
        {/* Background Decor */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-15 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-emerald-600 rounded-full blur-[120px]" />
        </div>

        {/* Scrollable Area */}
        <div className="relative z-10 pt-16 pb-24 lg:pt-0 lg:pb-0 px-4 md:px-8 lg:px-10 py-8 lg:py-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 py-2 safe-area-pb">
        <NavLink to="/" className={bottomNavClass} end>
          <LayoutDashboard size={20} />
          <span>홈</span>
        </NavLink>
        <NavLink to="/events" className={bottomNavClass}>
          <CalendarDays size={20} />
          <span>행사</span>
        </NavLink>
      </nav>
    </div>
  );
};

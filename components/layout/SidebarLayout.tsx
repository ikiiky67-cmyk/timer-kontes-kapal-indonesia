'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, X, LogOut, LayoutDashboard, Users, User, UserCog, Settings, MoreVertical, Clock } from 'lucide-react';
import Image from 'next/image';
import { logoutAction } from '@/app/actions/auth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarLayoutProps {
  children: React.ReactNode;
  role: 'admin' | 'operator';
  division?: string;
}

export default function SidebarLayout({ children, role, division }: SidebarLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Define navigation links based on role
  const navLinks = role === 'admin' 
    ? [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { name: 'Manajemen Tim', icon: Users, href: '/admin/teams' },
        { name: 'Manajemen Operator', icon: UserCog, href: '/admin/operators' },
        { name: 'Riwayat Waktu', icon: Clock, href: '/admin/history' },
      ]
    : [
        { name: 'Dashboard Tim', icon: Users, href: '/operator/dashboard' },
      ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md lg:hidden transition-all duration-500 ease-out"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Floating Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] bg-white/80 backdrop-blur-md
        m-4 h-[calc(100vh-2rem)] rounded-[24px] border border-slate-100/80 shadow-[0_4px_24px_rgba(0,0,0,0.02)]
        transform transition-all duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}
        flex flex-col shrink-0
      `}>
        {/* Sidebar Header */}
        <div className="h-[88px] flex items-center gap-4 px-6 border-b border-slate-100/80 shrink-0">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 p-1.5 shadow-sm border border-slate-100/50">
            <Image src="/assets/img/logo_polbeng.png" alt="Logo" width={40} height={40} className="object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-slate-900 text-[17px] leading-tight truncate">Timer KKI</h1>
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mt-0.5 truncate">
              {role === 'admin' ? 'Administrator' : `Operator ${division}`}
            </p>
          </div>
          
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  relative flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium transition-all group overflow-hidden
                  ${isActive 
                    ? 'bg-slate-50/80 text-slate-900 shadow-sm border border-slate-100/50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent'}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                )}
                <Icon className={`w-5 h-5 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:scale-110 z-10 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="z-10 tracking-tight transition-transform duration-300 ease-out group-hover:translate-x-1">{link.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 shrink-0 relative" ref={profileRef}>
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <form action={logoutAction}>
                <button 
                  type="submit"
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Keluar Sistem
                </button>
              </form>
            </div>
          )}
          
          <div 
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50/80 transition-colors cursor-pointer border border-transparent hover:border-slate-100/50 group/profile"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-slate-900 truncate">
                {role === 'admin' ? 'Super Admin' : `Operator ${division}`}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium truncate mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                <span className="text-emerald-600 font-bold tracking-wide">ONLINE</span>
              </div>
            </div>
            <MoreVertical className="w-5 h-5 text-slate-400 shrink-0 opacity-50 group-hover/profile:opacity-100 transition-opacity" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Seamless Top Header (Mobile Only) */}
        <header className="lg:hidden h-[72px] bg-transparent flex items-center justify-between px-6 shrink-0 mt-2">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 text-slate-500 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-200"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 pb-10 pt-4 lg:pt-4">
          <div className="max-w-[1400px] mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

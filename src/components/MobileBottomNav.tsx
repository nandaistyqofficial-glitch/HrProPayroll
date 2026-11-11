import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Award, 
  Users, 
  Wallet, 
  Menu,
  BookOpen
} from 'lucide-react';
import { Employee } from '../types/hr';

interface MobileBottomNavProps {
  currentView: string;
  onSelectView: (view: string) => void;
  activeUser: Employee;
  pendingLeavesCount: number;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  activeUser,
  pendingLeavesCount,
  onOpenMobileMenu,
}) => {
  const isManagerOrHR = activeUser.role === 'HRD' || activeUser.role === 'Director';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Utama',
      icon: LayoutDashboard,
    },
    {
      id: 'attendance',
      label: 'Presensi',
      icon: CalendarCheck,
      badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined,
    },
    {
      id: 'kpi',
      label: 'KPI',
      icon: Award,
    },
    {
      id: isManagerOrHR ? 'payroll' : 'employees',
      label: isManagerOrHR ? 'Gaji' : 'Profil',
      icon: isManagerOrHR ? Wallet : Users,
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: Menu,
      action: onOpenMobileMenu,
    },
  ];

  return (
    <nav 
      aria-label="Bottom Navigation" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 safe-area-bottom shadow-lg"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  onSelectView(item.id);
                }
              }}
              className={`min-h-[48px] min-w-[48px] flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative cursor-pointer active:scale-95 touch-manipulation ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : ''}`} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 leading-none tracking-tight truncate max-w-[60px]">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

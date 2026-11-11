import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Wallet, 
  Users, 
  Smartphone, 
  LogOut,
  Building2,
  Filter,
  Lock,
  Database,
  Layers,
  ChevronRight,
  BookOpen,
  Award,
  X,
  Calendar,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { Employee, CompanyName } from '../types/hr';
import { Language, getTranslation } from '../utils/translations';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  activeUser: Employee;
  pendingLeavesCount: number;
  currentLang: Language;
  onOpenMobileAPK: () => void;
  onLogout: () => void;
  selectedCompanyFilter: string;
  onSelectCompanyFilter: (company: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  activeUser,
  pendingLeavesCount,
  currentLang,
  onOpenMobileAPK,
  onLogout,
  selectedCompanyFilter,
  onSelectCompanyFilter,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const isManagerOrHR = activeUser.role === 'HRD' || activeUser.role === 'Director';

  // Core Streamlined Modules
  const coreModules = [
    { 
      id: 'dashboard', 
      label: currentLang === 'ms' ? 'Dashboard Utama' : 'Main Dashboard', 
      icon: LayoutDashboard,
      description: 'Check-In/Out & Ringkasan Gaji'
    },
    { 
      id: 'attendance', 
      label: currentLang === 'ms' ? 'Presensi & Absensi (26-25)' : 'Attendance & Leaves', 
      icon: CalendarCheck, 
      badge: pendingLeavesCount,
      description: 'Log Harian & Kunci Kitaran'
    },
    { 
      id: 'payroll', 
      label: currentLang === 'ms' ? 'Penggajian & Statutori' : 'Payroll & Statutory', 
      icon: Wallet,
      hrOnly: true,
      description: 'KWSP, SOCSO, EIS & Slip Gaji'
    },
    { 
      id: 'employees', 
      label: isManagerOrHR 
        ? (currentLang === 'ms' ? 'Direktori Karyawan' : 'Employees Directory') 
        : (currentLang === 'ms' ? 'Biodata Saya' : 'My Profile'), 
      icon: Users,
      hrOnly: false,
      description: 'Kontrak, Offering & Resign'
    },
    { 
      id: 'training', 
      label: currentLang === 'ms' ? 'Materi Training & SOP' : 'Training & Learning SOP', 
      icon: BookOpen,
      hrOnly: false,
      description: 'Retail, CS, Admin & Akta 1955'
    },
    { 
      id: 'kpi', 
      label: currentLang === 'ms' ? 'Penilaian Prestasi & KPI' : 'KPI & Performance', 
      icon: Award,
      hrOnly: false,
      description: 'Skor Kuantitatif & Gred (Malaysia)'
    },
    {
      id: 'teamCalendar',
      label: currentLang === 'ms' ? 'Kalender Kerja Tim' : 'Team Work Calendar',
      icon: Calendar,
      hrOnly: false,
      description: 'Semak Cuti & Luar Kota Pasukan'
    },
    {
      id: 'loans',
      label: currentLang === 'ms' ? 'Pinjaman & Advance' : 'Loan Tracker & Advance',
      icon: CreditCard,
      hrOnly: false,
      description: 'Had 50% Akta 1955 & Pelunasan'
    },
    {
      id: 'holidays',
      label: currentLang === 'ms' ? 'Cuti Umum Tempatan' : 'Malaysia Public Holidays',
      icon: Sparkles,
      hrOnly: false,
      description: 'Selangor, Kedah & Kebangsaan'
    },
    {
      id: 'schema',
      label: currentLang === 'ms' ? 'Skema & Arsitektur DB' : 'DB Schema & API Docs',
      icon: Database,
      hrOnly: false,
      description: 'ERD Relasional & API Live'
    }
  ];

  const sidebarElement = (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 transition-all select-none">
      
      {/* Brand & System Title */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3 truncate">
          <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h2 className="text-xs font-bold text-white tracking-tight truncate">
              HRPro Enterprise
            </h2>
            <p className="text-[10px] text-sky-400 font-medium truncate">
              {activeUser.company}
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Syarikat Switcher / Filter (for HR & Director) */}
      {isManagerOrHR && (
        <div className="px-4 pt-3 pb-2">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-sky-400" />
            <span>{currentLang === 'ms' ? 'Tapis Syarikat:' : 'Filter Company:'}</span>
          </label>
          <select
            value={selectedCompanyFilter}
            onChange={(e) => onSelectCompanyFilter(e.target.value)}
            className="w-full text-xs bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
          >
            <option value="all">{getTranslation(currentLang, 'allCompanies')}</option>
            <option value="Pustaka Union">Pustaka Union (16)</option>
            <option value="Solusi Serumpun Senusantara SDN. BHD">Solusi Serumpun (3)</option>
          </select>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
          {currentLang === 'ms' ? 'Modul Teras Terintegrasi' : 'Core Integrated Modules'}
        </p>

        {coreModules.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isLocked = item.hrOnly && !isManagerOrHR;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isLocked) {
                  return;
                }
                onSelectView(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              disabled={isLocked}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left group ${
                isLocked
                  ? 'text-slate-600 opacity-50 cursor-not-allowed'
                  : isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <div className="truncate">
                  <div className="truncate leading-tight">{item.label}</div>
                  <div className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-sky-200' : 'text-slate-500'}`}>
                    {item.description}
                  </div>
                </div>
              </div>

              {item.badge !== undefined && item.badge > 0 && isManagerOrHR && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {item.badge}
                </span>
              )}

              {isLocked && <Lock className="w-3 h-3 text-slate-600 shrink-0" />}
            </button>
          );
        })}

        <div className="pt-3 border-t border-slate-800/80 my-2"></div>

        {/* Mobile APK Simulator button */}
        <button
          onClick={onOpenMobileAPK}
          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{getTranslation(currentLang, 'mobileSimulator')}</span>
        </button>
      </nav>

      {/* User Info & Logout footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          {activeUser.avatarUrl ? (
            <img
              src={activeUser.avatarUrl}
              alt={activeUser.namaLengkap}
              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-800 text-indigo-200 text-xs font-bold flex items-center justify-center shrink-0">
              {activeUser.namaLengkap.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="truncate text-left text-xs">
            <p className="font-semibold text-white truncate max-w-[110px]">
              {activeUser.namaLengkap}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {activeUser.role}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          title={getTranslation(currentLang, 'logout')}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex shrink-0">
        {sidebarElement}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 shadow-2xl">
            {sidebarElement}
          </div>
        </div>
      )}
    </>
  );
};


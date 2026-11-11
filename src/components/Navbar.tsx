import React, { useState } from 'react';
import { 
  Building2, 
  Smartphone, 
  Sun, 
  Moon, 
  LogOut, 
  Globe2, 
  ShieldCheck, 
  Briefcase,
  Menu,
  Clock,
  CheckCircle2,
  ChevronDown,
  Coffee,
  MapPin,
  Check,
  Bell,
  Camera,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Employee, AttendanceRecord, AppNotification } from '../types/hr';
import { Language, getTranslation } from '../utils/translations';

interface NavbarProps {
  activeUser: Employee;
  currentLang: Language;
  onToggleLang: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMobileAPK: () => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
  // Quick Attendance Actions
  userTodayAttendance?: AttendanceRecord;
  onQuickClockIn?: (location: string) => void;
  onQuickClockOut?: (otHours: number) => void;
  onQuickBreakOut?: () => void;
  onQuickBreakIn?: () => void;
  onNavigateToAttendance?: () => void;
  // Notifications & Profile
  notifications?: AppNotification[];
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onOpenProfilePhotoModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeUser,
  currentLang,
  onToggleLang,
  isDarkMode,
  onToggleDarkMode,
  onOpenMobileAPK,
  onLogout,
  onToggleMobileMenu,
  userTodayAttendance,
  onQuickClockIn,
  onQuickClockOut,
  onQuickBreakOut,
  onQuickBreakIn,
  onNavigateToAttendance,
  notifications = [],
  onMarkAllNotificationsRead,
  onClearNotifications,
  onOpenProfilePhotoModal,
}) => {
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const isClockedIn = Boolean(userTodayAttendance && userTodayAttendance.jamMasuk && userTodayAttendance.jamMasuk !== '-');
  const isClockedOut = Boolean(userTodayAttendance && userTodayAttendance.jamKeluar);
  const isOnBreak = Boolean(userTodayAttendance && userTodayAttendance.isOnBreak);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  return (
    <header className="bg-indigo-900 text-white shadow-md flex justify-between items-center px-4 sm:px-6 py-3.5 z-40 transition-colors">
      
      {/* Brand Zone */}
      <div className="flex items-center space-x-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-indigo-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <Briefcase className="w-5 h-5 text-indigo-200" />
        </div>

        <div className="truncate">
          <span className="text-base sm:text-lg font-bold tracking-tight text-white block truncate">
            {getTranslation(currentLang, 'brand')}
          </span>
          <span className="text-[10px] text-indigo-300 font-normal hidden sm:block">
            {getTranslation(currentLang, 'brandSub')}
          </span>
        </div>
      </div>

      {/* Control & Profile Zone */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        
        {/* ATTENDANCE BUTTON FOR CHECK IN & CHECK OUT */}
        <div className="relative flex items-center">
          {!isClockedIn ? (
            <div className="flex items-center">
              <button
                onClick={() => onQuickClockIn && onQuickClockIn(activeUser.isRemoteOutsideMalaysia ? 'Luar Negara (Remote International)' : 'Ibu Pejabat Pustaka Union (KL)')}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-3.5 py-1.5 rounded-l-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
                title="Picit untuk Check In Masuk Bertugas Hari Ini"
              >
                <Clock className="w-3.5 h-3.5 text-white" />
                <span>Check In</span>
              </button>
              <button
                onClick={() => setIsLocationDropdownOpen(prev => !prev)}
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1.5 rounded-r-lg border-l border-emerald-500/80 transition-colors text-xs"
                title="Pilih Lokasi Check In (Pejabat / Remote)"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isLocationDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1 text-slate-800 dark:text-slate-100">
                  <p className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">Pilih Lokasi Check In</p>
                  <button
                    onClick={() => {
                      onQuickClockIn && onQuickClockIn(activeUser.company.includes('Pustaka') ? 'Ibu Pejabat Pustaka Union (KL)' : 'Pejabat Solusi Serumpun Senusantara (KL)');
                      setIsLocationDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Pejabat Rasmi KL</p>
                      <p className="text-[10px] text-slate-400">Geolokasi GPS Pejabat Sah</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      onQuickClockIn && onQuickClockIn(activeUser.isRemoteOutsideMalaysia ? 'Luar Negara (Remote International)' : 'Remote Rumah / WFH');
                      setIsLocationDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
                  >
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Remote / WFH</p>
                      <p className="text-[10px] text-slate-400">Kerja dari Rumah / Luar Negara</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : !isClockedOut ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-300 bg-indigo-950/90 px-2.5 py-1 rounded-md border border-indigo-700/70">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>In: {userTodayAttendance?.jamMasuk}</span>
              </span>

              {/* Break toggle button */}
              {isOnBreak ? (
                <button
                  onClick={() => onQuickBreakIn && onQuickBreakIn()}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  title="Tamat Rehat & Masuk Semula"
                >
                  <Coffee className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">Tamat Rehat</span>
                  <span className="sm:hidden">Rehat</span>
                </button>
              ) : (
                <button
                  onClick={() => onQuickBreakOut && onQuickBreakOut()}
                  className="hidden md:flex items-center gap-1 bg-indigo-800 hover:bg-indigo-700 text-amber-200 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  title="Mula Rehat 1 Jam (Seksyen 60A)"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-300" />
                  <span>Rehat 1j</span>
                </button>
              )}

              {/* Check Out Button */}
              <button
                onClick={() => onQuickClockOut && onQuickClockOut(0)}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
                title="Picit untuk Check Out (Pulang Bertugas)"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Check Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-indigo-950/80 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pulang: {userTodayAttendance?.jamKeluar} (Selesai)</span>
            </div>
          )}
        </div>

        {/* Notification Center Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationDropdownOpen(prev => !prev);
              if (!isNotificationDropdownOpen && onMarkAllNotificationsRead) {
                // mark as seen when opening
              }
            }}
            className="p-1.5 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors relative cursor-pointer"
            title="Pusat Notifikasi Kelulusan Cuti & Status HR"
            aria-label="Pusat Notifikasi"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {isNotificationDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-800 dark:text-slate-100 text-xs animate-in fade-in duration-150">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    Notifikasi Kelulusan Cuti
                  </span>
                </div>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    {unreadNotificationsCount > 0 && onMarkAllNotificationsRead && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                      >
                        Tanda Dibaca
                      </button>
                    )}
                    {onClearNotifications && (
                      <button
                        onClick={onClearNotifications}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <p className="font-medium">Tiada notifikasi baru</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Status cuti yang diluluskan atau ditolak oleh atasan akan dipaparkan di sini.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-2.5 ${
                        !notif.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : notif.type === 'error' ? (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-sky-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {notif.title}
                          </p>
                          <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                            {notif.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher Button */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1.5 bg-indigo-800 hover:bg-indigo-700 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
          title="Tukar Bahasa / Switch Language"
        >
          <Globe2 className="w-3.5 h-3.5 text-indigo-300" />
          <span>{currentLang === 'ms' ? '🇺🇸 EN' : '🇲🇾 MS'}</span>
        </button>

        {/* Mobile APK Simulator shortcut */}
        <button
          onClick={onOpenMobileAPK}
          className="hidden sm:flex items-center gap-1.5 bg-indigo-800/80 hover:bg-indigo-700 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 transition-colors cursor-pointer"
          title="Pratinjau APK Mobile Employee Self-Service"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>APK ESS</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Lockup & Avatar Photo Upload Trigger */}
        <div className="flex items-center space-x-2.5 border-l pl-3 sm:pl-4 border-indigo-700">
          <div 
            onClick={onOpenProfilePhotoModal}
            className="relative cursor-pointer group"
            title="Klik untuk muat naik / tukar foto profil avatar anda"
          >
            {activeUser.avatarUrl ? (
              <img
                src={activeUser.avatarUrl}
                alt={activeUser.namaLengkap}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-indigo-400 group-hover:border-white transition-all shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center border-2 border-indigo-400 group-hover:border-white transition-all shrink-0">
                {activeUser.namaLengkap.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div 
            onClick={onOpenProfilePhotoModal}
            className="text-left text-xs hidden md:block cursor-pointer group"
            title="Klik untuk kemaskini profil / avatar"
          >
            <p className="font-semibold text-white truncate max-w-[140px] leading-snug group-hover:text-indigo-200 transition-colors">
              {activeUser.namaLengkap}
            </p>
            <p className="text-[10px] text-indigo-300 leading-none">
              {activeUser.role} · {activeUser.company.includes('Pustaka') ? 'Pustaka Union' : 'Serumpun'}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 text-indigo-300 hover:text-rose-300 hover:bg-indigo-800 rounded-lg transition-colors ml-1 cursor-pointer"
            title={getTranslation(currentLang, 'logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

    </header>
  );
};

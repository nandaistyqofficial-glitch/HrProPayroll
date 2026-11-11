import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CalendarCheck, 
  Calendar,
  ArrowUpRight, 
  Check, 
  X, 
  MapPin, 
  Building2, 
  Download, 
  UserPlus, 
  Paperclip,
  Eye,
  FileSpreadsheet,
  Globe2, 
  FileText,
  DollarSign,
  Coffee,
  LogOut,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Database,
  AlertTriangle,
  Layers,
  BookOpen,
  Settings,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  CompanyName 
} from '../types/hr';
import { formatDateIndo } from '../utils/formatters';
import { 
  formatMYR, 
  calculatePayrollForEmployee, 
  exportSalarySummaryCSV,
  exportEpfContributionCSV,
  exportSocsoContributionCSV,
  exportEisContributionCSV
} from '../utils/statutoryCalculations';
import { DEFAULT_OFFICE_SHIFT } from '../types/databaseSchema';
import { AttendanceEfficiencyCard } from './AttendanceEfficiencyCard';
import { InteractivePresenceCard } from './InteractivePresenceCard';
import { CompanyNoticeBoard } from './CompanyNoticeBoard';
import { CompanyAnnouncement, EmployeeLoan } from '../types/hr';
import { INITIAL_ANNOUNCEMENTS } from '../data/mockData';

interface DashboardOverviewProps {
  employees: Employee[];
  attendanceToday: AttendanceRecord[];
  allAttendanceRecords?: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onNavigateTab: (tab: string) => void;
  onApproveLeave: (id: string, notes?: string) => void;
  onRejectLeave: (id: string, notes?: string) => void;
  onOpenNewLeaveModal: () => void;
  onOpenNewEmployeeModal: () => void;
  onQuickClockIn: (location: string) => void;
  onQuickClockOut?: (otHours: number) => void;
  onQuickBreakOut?: () => void;
  onQuickBreakIn?: () => void;
  onViewPayslip: (emp: Employee) => void;
  activeUser: Employee;
  hasClockedInToday: boolean;
  userTodayAttendance?: AttendanceRecord;
  onOpenShiftModal?: () => void;
  onOpenWeeklyOffModal?: () => void;
  onOpenEditOvertimeModal?: (record?: AttendanceRecord) => void;
  onApproveOvertime?: (recordId: string) => void;
  onRemoveOvertime?: (recordId: string) => void;
  announcements?: CompanyAnnouncement[];
  loans?: EmployeeLoan[];
  onAddAnnouncement?: (newAnnouncement: CompanyAnnouncement) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  employees,
  attendanceToday,
  leaveRequests,
  onNavigateTab,
  onApproveLeave,
  onRejectLeave,
  onOpenNewLeaveModal,
  onOpenNewEmployeeModal,
  onQuickClockIn,
  onQuickClockOut,
  onQuickBreakOut,
  onQuickBreakIn,
  onViewPayslip,
  activeUser,
  hasClockedInToday,
  userTodayAttendance,
  onOpenShiftModal,
  allAttendanceRecords,
  onOpenWeeklyOffModal,
  onOpenEditOvertimeModal,
  onApproveOvertime,
  onRemoveOvertime,
  announcements = INITIAL_ANNOUNCEMENTS,
  loans = [],
  onAddAnnouncement,
}) => {
  const isManagerOrHR = activeUser.role === 'HRD' || activeUser.role === 'Director';
  const [dashboardOtHours, setDashboardOtHours] = useState<number>(0);
  const [selectedLocation, setSelectedLocation] = useState<string>(
    activeUser.company.includes('Pustaka') 
      ? 'Pejabat Rasmi Pustaka Union (KL)' 
      : 'Pejabat Solusi Serumpun Senusantara (KL)'
  );

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateString, setCurrentDateString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' MYT'
      );
      setCurrentDateString(
        now.toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute metrics
  const totalEmployees = employees.length;
  const pustakaUnionCount = employees.filter(e => e.company === 'Pustaka Union').length;
  const serumpunCount = employees.filter(e => e.company === 'Solusi Serumpun Senusantara SDN. BHD').length;
  
  const hadirCount = attendanceToday.filter(a => a.status === 'Hadir').length;
  const lewatCount = attendanceToday.filter(a => a.status === 'Lewat').length;
  const attendancePercentage = totalEmployees > 0 
    ? Math.round(((hadirCount + lewatCount) / totalEmployees) * 100) 
    : 0;

  const pendingLeaves = leaveRequests.filter(l => l.status === 'Menunggu Kelulusan');

  // Total payroll estimation
  const totalNetPayroll = employees.reduce((sum, emp) => {
    const p = calculatePayrollForEmployee(emp);
    return sum + p.gajiBersihMYR;
  }, 0);

  // Status flags for the logged in user
  const isClockedIn = hasClockedInToday && !!userTodayAttendance?.jamMasuk;
  const isClockedOut = isClockedIn && !!userTodayAttendance?.jamKeluar;

  // Hourly Rate calculation for live alignment
  const hourlyRate = (activeUser.baseSalary || 3000) / 26 / 8;
  const lateMinutes = userTodayAttendance?.lateMinutes || 0;
  const lateDeduction = lateMinutes > 0 ? (lateMinutes / 60) * hourlyRate : 0;
  const otMinutes = (userTodayAttendance?.otHours || 0) * 60;
  const otAllowance = otMinutes > 0 ? (otMinutes / 60) * 1.5 * hourlyRate : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 0. HERO SECTION: WIDGET PRESENSI UTAMA & TOMBOL INTERAKTIF (Attendance In / Attendance Out) */}
      <div className="w-full">
        <InteractivePresenceCard
          activeUser={activeUser}
          userTodayAttendance={userTodayAttendance}
          recentAttendanceRecords={allAttendanceRecords && allAttendanceRecords.length > 0 ? allAttendanceRecords : attendanceToday}
          onClockIn={onQuickClockIn}
          onClockOut={onQuickClockOut || (() => {})}
          onBreakOut={onQuickBreakOut}
          onBreakIn={onQuickBreakIn}
          onOpenShiftModal={onOpenShiftModal}
          onApproveOvertime={onApproveOvertime}
          onRemoveOvertime={onRemoveOvertime}
          onOpenEditOvertimeModal={onOpenEditOvertimeModal}
          isManagerOrHR={isManagerOrHR}
        />
      </div>

      {/* 1. PAPAN KENYATAAN SYARIKAT (Company Notice Board: Pengumuman, Ucapan Hari Lahir, Polisi 50% & 45 Jam) */}
      <CompanyNoticeBoard
        activeUser={activeUser}
        employees={employees}
        announcements={announcements}
        onAddAnnouncement={onAddAnnouncement}
        currentMonth={5}
      />

      {/* 2. QUICK ACTION HUB (Kalender Kerja Tim, Rekod Pinjaman, Cuti Umum Tempatan) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('teamCalendar')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Kalender Kerja Tim
              </p>
              <p className="text-[11px] text-slate-500">Semak Cuti &amp; Luar Kota Pasukan</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('loans')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 transition-all text-left flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Rekod Pinjaman (Loan Tracker)
              </p>
              <p className="text-[11px] text-slate-500">Had 50% Akta 1955 &amp; Pelunasan</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('holidays')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 transition-all text-left flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Cuti Umum Tempatan
              </p>
              <p className="text-[11px] text-slate-500">Selangor, Kedah &amp; Kebangsaan</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Sistem Operasi Presensi &amp; Penggajian
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
              {activeUser.company}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Selamat datang, <strong className="text-slate-800 dark:text-slate-200">{activeUser.namaLengkap}</strong> ({activeUser.role}). Rekod absensi diselaraskan terus ke gaji kitaran 26hb–25hb.
          </p>
        </div>

        {/* Live Clock Card */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {currentDateString}
            </p>
            <p className="text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {currentTime || '08:30:00 MYT'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Learning & Training SOP Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-sky-900 rounded-2xl p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
            <BookOpen className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">
                Modul Latihan &amp; SOP Calon Baru
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Retail · CS · Admin · Akta 1955
              </span>
            </div>
            <p className="text-xs text-sky-100/80 mt-0.5">
              Panduan standard operasi juruwang, susunan rak buku, khidmat pelanggan WhatsApp, dan pentadbiran pejabat.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('training')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-sky-50 shadow-sm transition-all shrink-0 active:scale-98 cursor-pointer"
        >
          <span>Buka Materi Belajar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4-Card Primary KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Karyawan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500">
              Jumlah Pekerja Berdaftar
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {totalEmployees}
            </span>
            <span className="text-xs text-slate-500">orang pekerja</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>PU: {pustakaUnionCount} · SSS: {serumpunCount}</span>
            <button 
              onClick={() => onNavigateTab('employees')}
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              Biodata <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Kehadiran Hari Ini */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500">
              Kehadiran Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {attendancePercentage}%
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {hadirCount + lewatCount} Hadir
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Tepat: {hadirCount} · Lewat: {lewatCount}</span>
            <button 
              onClick={() => onNavigateTab('attendance')}
              className="font-medium text-emerald-600 hover:underline flex items-center gap-0.5"
            >
              Log Absensi <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Cuti Menunggu */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500">
              Permohonan Cuti Menunggu
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {pendingLeaves.length}
            </span>
            <span className="text-xs text-amber-600 font-medium">menunggu semakan</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Kelulusan Pengurus/HR</span>
            <button 
              onClick={() => onNavigateTab('attendance')}
              className="font-medium text-amber-600 hover:underline flex items-center gap-0.5"
            >
              Semak Cuti <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Anggaran Gaji Bersih */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-500">
              {isManagerOrHR ? 'Anggaran Bersih Kumpulan (MYR)' : 'Gaji Bersih Anda (MYR)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {isManagerOrHR
                ? formatMYR(totalNetPayroll)
                : formatMYR(calculatePayrollForEmployee(activeUser).gajiBersihMYR)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Kitaran 26hb–25hb</span>
            <button 
              onClick={() => onNavigateTab('payroll')}
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              Modul Gaji <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ATTENDANCE EFFICIENCY D3 VISUALIZER (RATIO ON-TIME VS LATE CHECK-INS)     */}
      {/* ========================================================================= */}
      <AttendanceEfficiencyCard
        attendanceRecords={allAttendanceRecords && allAttendanceRecords.length > 0 ? allAttendanceRecords : attendanceToday}
        employees={employees}
        activeUser={activeUser}
        onNavigateToAttendance={() => onNavigateTab('attendance')}
      />

      {/* ========================================================================= */}
      {/* 2-COLUMN SPLIT: CORE CHECK-IN / CHECK-OUT TERMINAL & PAYROLL ALIGNMENT    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (6 cols): Dedicated Interactive Presence Card with Color Transition & History */}
        <div className="lg:col-span-6 space-y-6">
          {/* Ringkasan Status Presensi Hari Ini */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>Status Kehadiran Hari Ini (12 Mei 2025)</span>
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                hasClockedInToday
                  ? userTodayAttendance?.jamKeluar
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {hasClockedInToday 
                  ? userTodayAttendance?.jamKeluar ? '✓ Presensi Selesai' : '● Sedang Bekerja' 
                  : 'Belum Masuk'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500">Waktu Masuk</span>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                  {userTodayAttendance?.jamMasuk || '-'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500">Waktu Pulang</span>
                <p className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm mt-0.5">
                  {userTodayAttendance?.jamKeluar || '-'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500">Jam Kerja &amp; OT</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {userTodayAttendance?.workHours || 0}j {userTodayAttendance?.otHours ? `(+${userTodayAttendance.otHours}j OT)` : ''}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Gunakan terminal presensi di bahagian paling atas skrin untuk merekodkan <strong>Attendance In</strong> dan <strong>Attendance Out</strong>.
            </p>
          </div>

          {/* Syarikat Overview Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>Entiti Syarikat Di Bawah Sistem</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white">Pustaka Union</p>
                <p className="text-[11px] text-slate-500">16 Pekerja (KL HQ)</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white">Solusi Serumpun</p>
                <p className="text-[11px] text-slate-500">3 Pekerja (KL &amp; Remote)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Live Payroll Alignment & Queue */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Real-time Payroll Alignment Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-950 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                  <DollarSign className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Penyelarasan Presensi &amp; Penggajian Masa-Nyata
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Kitaran 26hb–25hb
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Setiap catatan waktu masuk dan pulang dikira secara automatik untuk potongan keterlambatan dan elaun kerja lebih masa (OT).
            </p>

            {/* Calculations Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Kadar Sejam (Hourly Rate)</span>
                <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {formatMYR(hourlyRate)}/j
                </p>
                <span className="text-[10px] text-slate-400 font-mono">(Gaji Asas / 26 / 8)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Keterlambatan Hari Ini</span>
                <p className={`text-lg font-bold font-mono ${lateMinutes > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {lateMinutes > 0 ? `${lateMinutes} minit` : '0 minit'}
                </p>
                <span className="text-[10px] text-rose-500 font-mono">
                  {lateMinutes > 0 ? `Potongan: -${formatMYR(lateDeduction)}` : 'Tiada penalti'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Jam Lembur (OT) Hari Ini</span>
                <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {userTodayAttendance?.otHours || dashboardOtHours || 0} jam
                </p>
                <span className="text-[10px] text-indigo-500 font-mono">
                  Elaun 1.5x: +{formatMYR(otAllowance)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">Status Kunci Kitaran Gaji</span>
                <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sedia Dikira HR</span>
                </p>
                <span className="text-[10px] text-slate-400 font-mono">Bebas selaras</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('schema')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Lihat Skema Database Relasional &amp; Penguji API Live</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Permohonan Cuti Menunggu Tindakan */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Permohonan Cuti Menunggu Kelulusan
                </h3>
                <p className="text-xs text-slate-500">
                  Semak &amp; selaras dengan kalendar gaji
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Buka Cuti ({leaveRequests.length})
              </button>
            </div>

            <div className="space-y-3">
              {pendingLeaves.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Tiada permohonan cuti tertunda pada masa ini.
                </div>
              ) : (
                pendingLeaves.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {req.employeeName}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        <strong className="text-indigo-600">{req.tipeCuti}</strong> ({req.durasiHari} Hari) · {req.alasan}
                      </p>
                    </div>

                    {isManagerOrHR && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onApproveLeave(req.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                        >
                          Lulus
                        </button>
                        <button
                          onClick={() => onRejectLeave(req.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-rose-600 dark:text-slate-300"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overtime (OT) Approval & Removal Queue for HR / HRD */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-950/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Kelulusan &amp; Pengurusan Jam Lebih Masa (OT)
                  </h3>
                  <p className="text-xs text-slate-500">
                    HR/HRD boleh meluluskan atau menghapuskan jam OT pekerja
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Kadar 1.5x / 2.0x
              </span>
            </div>

            <div className="space-y-3">
              {(() => {
                const sourceRecords = allAttendanceRecords && allAttendanceRecords.length > 0 ? allAttendanceRecords : attendanceToday;
                const recordsWithOt = sourceRecords.filter(r => (r.otHours && r.otHours > 0) || r.otStatus === 'Pending' || r.otStatus === 'Approved');

                if (recordsWithOt.length === 0) {
                  return (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Tiada rekod jam lebih masa (OT) yang aktif pada masa ini.
                    </div>
                  );
                }

                return recordsWithOt.slice(0, 4).map((rec) => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  const rate = (emp?.baseSalary || 3000) / 26 / 8;
                  const estimatedPay = (rec.otHours || 0) * 1.5 * rate;

                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {rec.employeeName}
                          </p>
                          <span className="font-mono text-[10px] text-slate-400">
                            ({rec.nik})
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Tarikh: <strong className="font-mono">{rec.tanggal}</strong> · Masuk: {rec.jamMasuk} · Keluar: {rec.jamKeluar || '-'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            +{rec.otHours} Jam OT
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            (Anggaran: {formatMYR(estimatedPay)})
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            rec.otStatus === 'Approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : rec.otStatus === 'Rejected'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {rec.otStatus === 'Approved' ? '✓ Diluluskan HR' : rec.otStatus === 'Rejected' ? '✕ Dihapus' : '⏳ Menunggu Kelulusan'}
                          </span>
                        </div>
                      </div>

                      {isManagerOrHR && (
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {rec.otStatus !== 'Approved' && onApproveOvertime && (
                            <button
                              type="button"
                              onClick={() => onApproveOvertime(rec.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs cursor-pointer"
                              title="Luluskan Jam Lebih Masa Ini"
                            >
                              ✓ Luluskan OT
                            </button>
                          )}
                          {onRemoveOvertime && (
                            <button
                              type="button"
                              onClick={() => onRemoveOvertime(rec.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg cursor-pointer"
                              title="Hapus Jam Lebih Masa Ini (Set ke 0j)"
                            >
                              ✕ Hapus OT
                            </button>
                          )}
                          {onOpenEditOvertimeModal && (
                            <button
                              type="button"
                              onClick={() => onOpenEditOvertimeModal(rec)}
                              className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 cursor-pointer"
                              title="Ubah Suai Jam OT"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};


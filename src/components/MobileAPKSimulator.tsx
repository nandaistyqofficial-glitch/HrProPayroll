import React, { useState } from 'react';
import { 
  X, 
  Wifi, 
  BatteryMedium, 
  MapPin, 
  Clock, 
  Calendar, 
  FileText, 
  User, 
  Home, 
  CheckCircle2, 
  Building2,
  DollarSign,
  Camera
} from 'lucide-react';
import { Employee, AttendanceRecord, LeaveRequest } from '../types/hr';
import { formatMYR, formatCurrencyAmount } from '../utils/statutoryCalculations';

interface MobileAPKSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: Employee;
  attendanceToday: AttendanceRecord[];
  onClockIn: (record: AttendanceRecord) => void;
  onClockOut?: (employeeId: string, jamKeluar: string, otHours: number) => void;
  onOpenLeaveModal: () => void;
  onViewPayslip: (employee: Employee) => void;
}

export const MobileAPKSimulator: React.FC<MobileAPKSimulatorProps> = ({
  isOpen,
  onClose,
  activeUser,
  attendanceToday,
  onClockIn,
  onClockOut,
  onOpenLeaveModal,
  onViewPayslip,
}) => {
  if (!isOpen) return null;

  const [activeBottomNav, setActiveBottomNav] = useState<'home' | 'absen' | 'cuti' | 'profil'>('home');
  const myTodayAttendance = attendanceToday.find(a => a.employeeId === activeUser.id);

  const handleMobileClockIn = () => {
    const now = new Date();
    const jamMasuk = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newRecord: AttendanceRecord = {
      id: `att-mob-${Date.now()}`,
      employeeId: activeUser.id,
      employeeName: activeUser.namaLengkap,
      company: activeUser.company,
      nik: activeUser.nik,
      departemen: activeUser.departemen,
      tanggal: '2025-05-12',
      jamMasuk: jamMasuk,
      jamKeluar: null,
      status: 'Hadir',
      workHours: 8.0,
      lokasi: activeUser.isRemoteOutsideMalaysia ? 'Luar Negara (Remote International)' : 'Ibu Pejabat Pustaka Union (KL)',
      koordinat: activeUser.isRemoteOutsideMalaysia ? '-6.3728, 106.8331' : '3.1390, 101.6869',
      jarakMeter: activeUser.isRemoteOutsideMalaysia ? 0 : 12,
      otHours: 0,
      catatan: 'Presensi Masuk dari APK Mobile ESS'
    };
    onClockIn(newRecord);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      
      <div className="relative flex flex-col items-center">
        
        {/* Floating Header info */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-xs font-semibold text-white/95 bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/20">
            Pratinjau APK Android / iOS: {activeUser.company} ESS
          </span>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Smartphone Shell */}
        <div className="w-[340px] sm:w-[370px] h-[680px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700 ring-1 ring-white/20 flex flex-col relative overflow-hidden select-none">
          
          {/* Top Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700"></div>
          </div>

          {/* Internal Mobile Screen */}
          <div className="w-full h-full bg-slate-50 dark:bg-slate-950 rounded-[34px] overflow-hidden flex flex-col text-slate-900 dark:text-white relative">
            
            {/* Mobile Status Bar */}
            <div className="pt-3 px-6 pb-2 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 z-20">
              <span className="font-mono">08:30</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">5G</span>
                <BatteryMedium className="w-4 h-4" />
              </div>
            </div>

            {/* Mobile Scrollable Viewport */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4 pt-2 text-xs">
              
              {/* Profile Card */}
              <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {activeUser.avatarUrl ? (
                    <img
                      src={activeUser.avatarUrl}
                      alt={activeUser.namaLengkap}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 font-bold text-xs flex items-center justify-center">
                      {activeUser.namaLengkap.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-xs truncate max-w-[150px]">
                      {activeUser.namaLengkap}
                    </p>
                    <p className="text-[10px] text-indigo-100 font-mono">
                      {activeUser.nik} · {activeUser.role}
                    </p>
                    <p className="text-[10px] text-indigo-200 truncate max-w-[150px]">
                      {activeUser.company}
                    </p>
                  </div>
                </div>

                <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                  ESS APK
                </span>
              </div>

              {/* Live Attendance Clock-In Widget */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-2.5">
                <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {activeUser.isRemoteOutsideMalaysia ? 'Remote Luar Negara (Disahkan)' : 'Pejabat Rasmi KL (Radius 12m)'}
                  </span>
                </div>

                <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  08:30:15 <span className="text-xs font-normal text-slate-400">MYT</span>
                </p>

                {myTodayAttendance ? (
                  myTodayAttendance.jamKeluar ? (
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <p className="font-bold text-[11px] flex items-center justify-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tugasan Hari Ini Selesai
                      </p>
                      <p className="text-[10px] mt-0.5 font-mono">
                        Masuk: {myTodayAttendance.jamMasuk} · Keluar: {myTodayAttendance.jamKeluar}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                        <p className="font-bold text-[11px] flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Presensi Masuk Tercatat
                        </p>
                        <p className="text-[10px] mt-0.5 font-mono">
                          Waktu: {myTodayAttendance.jamMasuk} ({myTodayAttendance.status})
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          const now = new Date();
                          const jamKeluar = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          if (onClockOut) onClockOut(activeUser.id, jamKeluar, 0);
                        }}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-4 h-4" />
                        <span>TAP UNTUK CLOCK-OUT PULANG</span>
                      </button>
                    </div>
                  )
                ) : (
                  <button
                    onClick={handleMobileClockIn}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>TAP UNTUK CLOCK-IN MASUK</span>
                  </button>
                )}
              </div>

              {/* Baki Cuti Saya */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] text-slate-400">Baki Cuti Tahunan</p>
                  <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {activeUser.leaveBalances.annualQuota - activeUser.leaveBalances.annualUsed} Hari
                  </p>
                  <p className="text-[9px] text-slate-400">Tahun 2025</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-[10px] text-slate-400">Baki Cuti Sakit (MC)</p>
                  <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {activeUser.leaveBalances.medicalQuota - activeUser.leaveBalances.medicalUsed} Hari
                  </p>
                  <p className="text-[9px] text-slate-400">Dengan Sijil Doktor</p>
                </div>
              </div>

              {/* Shortcuts */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Layanan ESS Pantas
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={onOpenLeaveModal}
                    className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-1.5"
                  >
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <span className="text-[10px] font-semibold leading-tight">Mohon Cuti</span>
                  </button>

                  <button
                    onClick={() => onViewPayslip(activeUser)}
                    className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-1.5"
                  >
                    <FileText className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-semibold leading-tight">Slip Gaji</span>
                  </button>

                  <button
                    onClick={() => alert(`Status Statutori: ${activeUser.isRemoteOutsideMalaysia ? 'Dikecualikan (Remote Luar Negara)' : 'KWSP & PERKESO Aktif'}`)}
                    className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-1.5"
                  >
                    <DollarSign className="w-5 h-5 text-amber-500" />
                    <span className="text-[10px] font-semibold leading-tight">Statutori</span>
                  </button>
                </div>
              </div>

              {/* Statutori Info */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gaji Pokok:</span>
                  <strong className="font-mono">{formatCurrencyAmount(activeUser.baseSalary, activeUser.originalCurrency)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Akaun Bank:</span>
                  <span className="font-mono">{activeUser.namaBank}</span>
                </div>
              </div>

            </div>

            {/* Bottom Nav */}
            <div className="absolute bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between z-20">
              <button
                onClick={() => setActiveBottomNav('home')}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${
                  activeBottomNav === 'home' ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Utama</span>
              </button>

              <button
                onClick={() => {
                  setActiveBottomNav('absen');
                  handleMobileClockIn();
                }}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${
                  activeBottomNav === 'absen' ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Absen</span>
              </button>

              <button
                onClick={() => {
                  setActiveBottomNav('cuti');
                  onOpenLeaveModal();
                }}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${
                  activeBottomNav === 'cuti' ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Cuti</span>
              </button>

              <button
                onClick={() => {
                  setActiveBottomNav('profil');
                  onViewPayslip(activeUser);
                }}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold ${
                  activeBottomNav === 'profil' ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Slip</span>
              </button>
            </div>

            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full z-30"></div>

          </div>

        </div>

      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Building2, 
  LogOut, 
  CheckCircle2, 
  Coffee, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { Employee, AttendanceRecord } from '../types/hr';

interface InteractivePresenceCardProps {
  activeUser: Employee;
  userTodayAttendance?: AttendanceRecord;
  recentAttendanceRecords: AttendanceRecord[];
  onClockIn: (location: string) => void;
  onClockOut: (otHours: number) => void;
  onBreakOut?: () => void;
  onBreakIn?: () => void;
  onOpenShiftModal?: () => void;
  onApproveOvertime?: (recordId: string) => void;
  onRemoveOvertime?: (recordId: string) => void;
  onOpenEditOvertimeModal?: (record: AttendanceRecord) => void;
  isManagerOrHR?: boolean;
}

export const InteractivePresenceCard: React.FC<InteractivePresenceCardProps> = ({
  activeUser,
  userTodayAttendance,
  recentAttendanceRecords,
  onClockIn,
  onClockOut,
  onBreakOut,
  onBreakIn,
  onOpenShiftModal,
  onApproveOvertime,
  onRemoveOvertime,
  onOpenEditOvertimeModal,
  isManagerOrHR,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(
    activeUser.company.includes('Pustaka')
      ? 'Ibu Pejabat Pustaka Union (KL)'
      : 'Pejabat Solusi Serumpun Senusantara (KL)'
  );
  const [otHours, setOtHours] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [elapsedDuration, setElapsedDuration] = useState<string>('00:00:00');

  // Real-time clock and live shift duration
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDateStr(
        now.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      );

      // If user has clocked in today and not clocked out yet, compute live elapsed time
      if (userTodayAttendance?.jamMasuk && !userTodayAttendance.jamKeluar && userTodayAttendance.jamMasuk !== '-') {
        const [inH, inM, inS] = userTodayAttendance.jamMasuk.split(':').map(Number);
        const startTime = new Date();
        startTime.setHours(inH || 9, inM || 0, inS || 0, 0);

        const diffMs = Math.max(0, now.getTime() - startTime.getTime());
        const totalSeconds = Math.floor(diffMs / 1000);
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        setElapsedDuration(
          `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [userTodayAttendance]);

  const isClockedIn = Boolean(
    userTodayAttendance && userTodayAttendance.jamMasuk && userTodayAttendance.jamMasuk !== '-'
  );
  const isClockedOut = Boolean(userTodayAttendance && userTodayAttendance.jamKeluar);
  const isOnBreak = Boolean(userTodayAttendance && userTodayAttendance.isOnBreak);

  // Filter 4 recent records for the logged-in user
  const userHistory = recentAttendanceRecords
    .filter(r => r.employeeId === activeUser.id)
    .slice(0, 4);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      
      {/* Header Bar */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            !isClockedIn 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
              : !isClockedOut 
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
              : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Terminal Presensi Pintar</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Masa Nyata (Live)
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentDateStr} · <strong className="font-mono text-slate-700 dark:text-slate-300">{currentTime} MYT</strong>
            </p>
          </div>
        </div>

        {/* Dynamic Status Badge */}
        <div>
          {!isClockedIn ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Belum Clock-In / Off Duty</span>
            </div>
          ) : !isClockedOut ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-extrabold shadow-xs ring-2 ring-emerald-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sedang Bekerja / On Duty ({elapsedDuration})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Presensi Selesai / Shift Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Action Zone */}
      <div className="p-5 sm:p-6 space-y-5">
        
        {/* Shift Specification Strip & Precise Timestamps */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {activeUser.shiftName || 'Shift Standard Korporat (09:00 - 18:00)'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({activeUser.shiftStartTime || '09:00'} - {activeUser.shiftEndTime || '18:00'} · Toleransi: {activeUser.shiftGraceMinutes ?? 15}m)
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            {userTodayAttendance?.jamMasuk && userTodayAttendance.jamMasuk !== '-' && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                In: {userTodayAttendance.jamMasuk}
              </span>
            )}
            {userTodayAttendance?.jamKeluar && (
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                Out: {userTodayAttendance.jamKeluar}
              </span>
            )}
            {isManagerOrHR && onOpenShiftModal && (
              <button
                type="button"
                onClick={onOpenShiftModal}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Shift</span>
              </button>
            )}
          </div>
        </div>

        {/* Location Selector (when not clocked in yet) */}
        {!isClockedIn && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pilih Lokasi &amp; Sahkan GPS:</span>
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            >
              <option value="Ibu Pejabat Pustaka Union (KL)">Ibu Pejabat Pustaka Union (KL) - GPS Pejabat</option>
              <option value="Pejabat Solusi Serumpun Senusantara (KL)">Pejabat Solusi Serumpun Senusantara (KL) - GPS Mont Kiara</option>
              <option value="Remote Rumah / WFH">Remote Rumah / Bekerja Dari Rumah (WFH)</option>
              <option value="Luar Negara (Remote International)">Luar Negara (Remote International / Indonesia)</option>
            </select>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* THE CORE INTERACTIVE PRESENCE BUTTON (GREEN -> RED/ORANGE)     */}
        {/* ------------------------------------------------------------- */}
        <div>
          {!isClockedIn ? (
            /* DEFAULT CONDITION: SOLID GREEN (ATTENDANCE IN) */
            <button
              type="button"
              onClick={() => onClockIn(selectedLocation)}
              className="w-full min-h-[58px] py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-600/25 ring-4 ring-emerald-500/20 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group hover:ring-emerald-500/40"
              title="Tekan untuk Attendance In (Masuk Bertugas)"
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="leading-tight text-white tracking-wide font-black">
                  Attendance In
                </p>
                <p className="text-[11px] font-normal text-emerald-100/90 leading-tight mt-0.5">
                  Waktu: {currentTime || '09:00:00'} MYT · Lokasi: {selectedLocation}
                </p>
              </div>
            </button>
          ) : !isClockedOut ? (
            /* ALREADY CLOCKED IN: VIBRANT RED/ORANGE ACTIVE GLOW (ATTENDANCE OUT) */
            <div className="space-y-3">
              {/* Overtime Selector & Break Toggle Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Jam Lebih Masa (OT):</span>
                  <select
                    value={otHours}
                    onChange={(e) => setOtHours(Number(e.target.value))}
                    className="font-mono font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white"
                  >
                    <option value="0">0 Jam (Standard 8j)</option>
                    <option value="1">1 Jam OT (+1.5x upah)</option>
                    <option value="1.5">1.5 Jam OT</option>
                    <option value="2">2 Jam OT (+1.5x upah)</option>
                    <option value="3">3 Jam OT</option>
                  </select>
                </div>

                {/* Rehat 1 jam toggle */}
                {isOnBreak ? (
                  <button
                    type="button"
                    onClick={onBreakIn}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Coffee className="w-3.5 h-3.5 animate-pulse" />
                    <span>Tamat Rehat</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onBreakOut}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Coffee className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mula Rehat 1j</span>
                  </button>
                )}
              </div>

              {/* Red / Orange Active Glow Attendance Out Button */}
              <button
                type="button"
                onClick={() => onClockOut(otHours)}
                className="w-full min-h-[58px] py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-[0.98] text-white font-extrabold text-base sm:text-lg shadow-2xl shadow-rose-600/40 ring-4 ring-rose-500/40 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group"
                title="Tekan untuk Attendance Out (Pulang Bertugas)"
              >
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <LogOut className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="leading-tight text-white tracking-wide font-black flex items-center gap-2">
                    <span>Attendance Out</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
                  </p>
                  <p className="text-[11px] font-normal text-rose-100 leading-tight mt-0.5">
                    Waktu Masuk: <strong>{userTodayAttendance?.jamMasuk}</strong> · Masa Bertugas: <strong className="font-mono text-white">{elapsedDuration}</strong> {otHours > 0 && `· (+${otHours}j OT)`}
                  </p>
                </div>
              </button>
            </div>
          ) : (
            /* COMPLETED CLOCK OUT */
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border-2 border-sky-300 dark:border-sky-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sky-900 dark:text-sky-200 text-sm">
                    Presensi Hari Ini Selesai
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    Masuk: <strong className="font-mono">{userTodayAttendance?.jamMasuk}</strong> · Pulang: <strong className="font-mono">{userTodayAttendance?.jamKeluar}</strong> · Jumlah Kerja: <strong className="font-mono">{userTodayAttendance?.workHours}j</strong>
                  </p>
                  {userTodayAttendance && userTodayAttendance.otHours > 0 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                      <span>Jam Lebih Masa (OT): {userTodayAttendance.otHours} jam</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-[10px]">
                        {userTodayAttendance.otStatus === 'Approved' ? '✓ Diluluskan HR' : userTodayAttendance.otStatus === 'Rejected' ? '✕ Dihapus' : '⏳ Menunggu Kelulusan'}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isManagerOrHR && userTodayAttendance && userTodayAttendance.otHours > 0 && (
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {userTodayAttendance.otStatus !== 'Approved' && onApproveOvertime && (
                      <button
                        type="button"
                        onClick={() => onApproveOvertime(userTodayAttendance.id)}
                        className="px-2 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                        title="Luluskan Jam Lembur Hari Ini"
                      >
                        ✓ Lulus OT
                      </button>
                    )}
                    {onRemoveOvertime && (
                      <button
                        type="button"
                        onClick={() => onRemoveOvertime(userTodayAttendance.id)}
                        className="px-2 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-800 cursor-pointer"
                        title="Hapus Jam Lembur Hari Ini"
                      >
                        ✕ Hapus OT
                      </button>
                    )}
                  </div>
                )}
                <span className="px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold font-mono">
                  {userTodayAttendance?.status || 'Hadir'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LOG / RIWAYAT PRESENSI SINGKAT DI BAWAHNYA                    */}
        {/* ------------------------------------------------------------- */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Log &amp; Riwayat Presensi Singkat</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Kakitangan: {activeUser.namaLengkap}
            </span>
          </div>

          {/* 4-Metric Grid for today */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Waktu Masuk</p>
              <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {userTodayAttendance?.jamMasuk || '-'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Waktu Keluar</p>
              <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {userTodayAttendance?.jamKeluar || (isClockedIn ? 'Sedang Bertugas' : '-')}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Tempoh Kerja</p>
              <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">
                {isClockedOut ? `${userTodayAttendance?.workHours} jam` : isClockedIn ? elapsedDuration : '-'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Status Presensi</p>
              <p className="font-bold text-sm mt-0.5">
                {userTodayAttendance?.status === 'Hadir' ? (
                  <span className="text-emerald-600 dark:text-emerald-400">✓ Hadir</span>
                ) : userTodayAttendance?.status === 'Lewat' ? (
                  <span className="text-amber-600 dark:text-amber-400">⚠ Lewat ({userTodayAttendance.lateMinutes}m)</span>
                ) : userTodayAttendance?.status ? (
                  <span className="text-sky-600 dark:text-sky-400">{userTodayAttendance.status}</span>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </p>
            </div>
          </div>

          {/* Mini Table of Recent History with Overtime and HR Actions */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-3 py-2">Tarikh</th>
                  <th className="px-3 py-2">Jam Masuk</th>
                  <th className="px-3 py-2">Jam Keluar</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Lembur (OT)</th>
                  {isManagerOrHR && <th className="px-3 py-2 text-right">Tindakan HR</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {userHistory.length === 0 ? (
                  <tr>
                    <td colSpan={isManagerOrHR ? 6 : 5} className="px-3 py-4 text-center text-slate-400">
                      Tiada log kehadiran terdahulu direkodkan.
                    </td>
                  </tr>
                ) : (
                  userHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-3 py-2 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {rec.tanggal}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-900 dark:text-white">
                        {rec.jamMasuk}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                        {rec.jamKeluar || (rec.tanggal === '2025-05-12' && isClockedIn ? 'Aktif' : '-')}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'Hadir'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : rec.status === 'Lewat'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {rec.otHours && rec.otHours > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                              +{rec.otHours}j OT
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              rec.otStatus === 'Approved'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : rec.otStatus === 'Rejected'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                            }`}>
                              {rec.otStatus === 'Approved' ? 'Diluluskan' : rec.otStatus === 'Rejected' ? 'Dihapus' : 'Menunggu'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      {isManagerOrHR && (
                        <td className="px-3 py-2 text-right">
                          {rec.otHours && rec.otHours > 0 ? (
                            <div className="inline-flex items-center gap-1">
                              {rec.otStatus !== 'Approved' && onApproveOvertime && (
                                <button
                                  type="button"
                                  onClick={() => onApproveOvertime(rec.id)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer transition-colors"
                                  title="Luluskan OT ini"
                                >
                                  Luluskan
                                </button>
                              )}
                              {onRemoveOvertime && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveOvertime(rec.id)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-800 cursor-pointer transition-colors"
                                  title="Hapus jam OT ini (Set ke 0j)"
                                >
                                  Hapus
                                </button>
                              )}
                              {onOpenEditOvertimeModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenEditOvertimeModal(rec)}
                                  className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-indigo-600 cursor-pointer"
                                  title="Edit Masa OT"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};


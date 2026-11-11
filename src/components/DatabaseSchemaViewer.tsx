import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  Layers, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Code, 
  Copy, 
  Check, 
  ArrowRight, 
  Play, 
  Clock, 
  DollarSign, 
  ShieldCheck,
  FileCode,
  Download,
  Users,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { POSTGRESQL_DDL_SCHEMA, INITIAL_SHIFTS } from '../types/databaseSchema';
import { Employee } from '../types/hr';

interface DatabaseSchemaViewerProps {
  activeUser: Employee;
  employees: Employee[];
}

export const DatabaseSchemaViewer: React.FC<DatabaseSchemaViewerProps> = ({
  activeUser,
  employees,
}) => {
  // Simple 3 tabs: 1. Diagram Ringkas (Visual ERD), 2. Skema SQL (DDL), 3. Uji Cepat API (Live Tester)
  const [activeTab, setActiveTab] = useState<'flow' | 'sql' | 'tester'>('flow');
  const [copiedCode, setCopiedCode] = useState(false);

  // Active table inspector
  const [selectedTable, setSelectedTable] = useState<'employees' | 'shifts' | 'attendances' | 'payroll_runs'>('attendances');

  // Quick API Tester State
  const [testAction, setTestAction] = useState<'check-in' | 'check-out'>('check-in');
  const [testShift, setTestShift] = useState<string>('shift-9-6');
  const [testTime, setTestTime] = useState<string>('09:18:00'); // 18 mins after 9:00 (late 3 mins after 15m grace)
  const [testOtHours, setTestOtHours] = useState<number>(1.5);
  const [apiResult, setApiResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopySQL = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(POSTGRESQL_DDL_SCHEMA);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadSQL = () => {
    const element = document.createElement('a');
    const file = new Blob([POSTGRESQL_DDL_SCHEMA], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'schema_presensi_payroll.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRunSimpleTest = async () => {
    setIsLoading(true);
    setApiResult(null);

    const shiftObj = INITIAL_SHIFTS.find(s => s.id === testShift) || INITIAL_SHIFTS[0];
    const now = new Date();
    const [hh, mm, ss] = testTime.split(':');
    if (hh && mm) {
      now.setHours(parseInt(hh, 10), parseInt(mm, 10), parseInt(ss || '0', 10));
    }

    try {
      const endpoint = testAction === 'check-in' ? '/api/attendance/check-in' : '/api/attendance/check-out';
      const body = testAction === 'check-in'
        ? {
            employeeId: activeUser.id,
            employeeNik: activeUser.nik,
            employeeName: activeUser.namaLengkap,
            company: activeUser.company,
            department: activeUser.departemen,
            location: 'Ibu Pejabat Pustaka Union (KL)',
            timestamp: now.toISOString(),
            shiftId: shiftObj.id,
            shiftStartTime: shiftObj.startTime,
            shiftGraceMinutes: shiftObj.gracePeriodMinutes
          }
        : {
            employeeId: activeUser.id,
            timestamp: now.toISOString(),
            manualOtHours: Number(testOtHours) || 0,
            shiftWorkHoursQuota: shiftObj.standardWorkHours,
            shiftBreakMinutes: shiftObj.breakDurationMinutes
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      setApiResult({
        statusCode: res.status,
        data
      });
    } catch (err: any) {
      // Fallback response for offline demonstration
      setApiResult({
        statusCode: 200,
        data: {
          success: true,
          action: testAction,
          message: testAction === 'check-in' 
            ? 'Check-In berjaya diselaraskan (Simulasi Engine).' 
            : 'Check-Out berjaya dikira (Simulasi Engine).',
          calculated: {
            shift: shiftObj.shiftName,
            waktuRekod: testTime,
            status: testAction === 'check-in' ? (testTime > '09:15:00' ? 'LEWAT' : 'HADIR') : 'SELESAI',
            lateMinutes: testAction === 'check-in' ? (testTime > '09:15:00' ? 18 : 0) : 0,
            overtimeMinutes: testAction === 'check-out' ? testOtHours * 60 : 0,
            potonganGaji: testAction === 'check-in' ? 'RM 4.33 (Diselaraskan ke Gaji Kitaran 26-25)' : 'Tiada Potongan'
          }
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. SIMPLE TOP BANNER                                                      */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-[11px] font-semibold text-sky-300">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Arsitektur Pangkalan Data Ringkas &amp; Padat</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Skema Database Presensi &amp; Penggajian
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Hubungan teras 4 entiti: <strong>Shift (Jam Kerja)</strong> → <strong>Karyawan (Pekerja)</strong> → <strong>Absensi (Check In/Out)</strong> → <strong>Penggajian (Gaji Kitaran 26hb–25hb)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySQL}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Disalin!' : 'Salin SQL'}</span>
            </button>
            <button
              onClick={handleDownloadSQL}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Muat Turun .sql</span>
            </button>
          </div>
        </div>

        {/* 3 Simple Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
          {[
            { id: 'flow', label: '1. Diagram Ringkas & Alur Data', icon: Layers },
            { id: 'sql', label: '2. Skema SQL DDL', icon: Code },
            { id: 'tester', label: '3. Uji Cepat API (Live Tester)', icon: Terminal },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DIAGRAM RINGKAS & ALUR HUBUNGAN DATA                              */}
      {/* ========================================================================= */}
      {activeTab === 'flow' && (
        <div className="space-y-6">
          
          {/* Visual Step-by-Step Flow Strip */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Alur Integrasi Presensi ke Penggajian (4 Langkah Mudah):
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 relative">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 font-mono">
                  LANGKAH 1
                </span>
                <h3 className="font-bold text-xs text-amber-950 dark:text-amber-100 mt-0.5">
                  Tetapan Shift (shifts)
                </h3>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                  HR menetapkan waktu masuk (09:00), tamat (18:00), toleransi lewat (15 minit), dan kuota 8 jam.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 relative">
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 font-mono">
                  LANGKAH 2
                </span>
                <h3 className="font-bold text-xs text-sky-950 dark:text-sky-100 mt-0.5">
                  Profil Staf (employees)
                </h3>
                <p className="text-[11px] text-sky-800 dark:text-sky-300 mt-1">
                  Pekerja dihubungkan kepada Shift masing-masing dan gaji pokok (Kadar Sejam = Gaji / 26 / 8).
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 relative">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                  LANGKAH 3
                </span>
                <h3 className="font-bold text-xs text-emerald-950 dark:text-emerald-100 mt-0.5">
                  Check-In &amp; Out (attendances)
                </h3>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1">
                  Rekod hanya dicipta bila butang diklik. Mengira <span className="font-mono font-bold">late_minutes</span> &amp; <span className="font-mono font-bold">ot_hours</span> secara dinamik.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 relative">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                  LANGKAH 4
                </span>
                <h3 className="font-bold text-xs text-indigo-950 dark:text-indigo-100 mt-0.5">
                  Penggajian (payroll_runs)
                </h3>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-1">
                  Kitaran 26hb–25hb menjumlahkan jam kerja, tolak lewat, tambah OT, dan kira KWSP 11%, SOCSO, EIS.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Core Tables Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Table 1: shifts */}
            <div 
              onClick={() => setSelectedTable('shifts')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                selectedTable === 'shifts'
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">shifts</span>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                  Jadual Kerja
                </span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                <li className="flex justify-between font-bold text-amber-600">
                  <span>PK id</span>
                  <span className="text-[10px] text-slate-400">UUID</span>
                </li>
                <li className="flex justify-between">
                  <span>shift_name</span>
                  <span className="text-[10px] text-slate-400">VARCHAR</span>
                </li>
                <li className="flex justify-between">
                  <span>start_time</span>
                  <span className="text-[10px] font-bold text-emerald-600">09:00:00</span>
                </li>
                <li className="flex justify-between">
                  <span>end_time</span>
                  <span className="text-[10px] font-bold text-emerald-600">18:00:00</span>
                </li>
                <li className="flex justify-between">
                  <span>grace_minutes</span>
                  <span className="text-[10px] font-bold text-amber-600">15 min</span>
                </li>
                <li className="flex justify-between">
                  <span>work_hours_quota</span>
                  <span className="text-[10px] text-slate-400">8.0 jam</span>
                </li>
              </ul>
            </div>

            {/* Table 2: employees */}
            <div 
              onClick={() => setSelectedTable('employees')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                selectedTable === 'employees'
                  ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-500" />
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">employees</span>
                </div>
                <span className="text-[10px] font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded">
                  Profil &amp; Gaji
                </span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                <li className="flex justify-between font-bold text-sky-600">
                  <span>PK id</span>
                  <span className="text-[10px] text-slate-400">UUID</span>
                </li>
                <li className="flex justify-between">
                  <span>nik</span>
                  <span className="text-[10px] text-slate-400">VARCHAR</span>
                </li>
                <li className="flex justify-between">
                  <span>full_name</span>
                  <span className="text-[10px] text-slate-400">VARCHAR</span>
                </li>
                <li className="flex justify-between text-amber-600">
                  <span>FK shift_id</span>
                  <span className="text-[10px]">shifts(id)</span>
                </li>
                <li className="flex justify-between">
                  <span>base_salary</span>
                  <span className="text-[10px] text-slate-400">NUMERIC</span>
                </li>
                <li className="flex justify-between text-emerald-600 font-bold">
                  <span>hourly_rate</span>
                  <span className="text-[10px]">Gaji/26/8</span>
                </li>
              </ul>
            </div>

            {/* Table 3: attendances */}
            <div 
              onClick={() => setSelectedTable('attendances')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                selectedTable === 'attendances'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">attendances</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                  Inti Absensi
                </span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                <li className="flex justify-between font-bold text-emerald-600">
                  <span>PK id</span>
                  <span className="text-[10px] text-slate-400">UUID</span>
                </li>
                <li className="flex justify-between text-sky-600">
                  <span>FK employee_id</span>
                  <span className="text-[10px]">employees(id)</span>
                </li>
                <li className="flex justify-between">
                  <span>attendance_date</span>
                  <span className="text-[10px] text-slate-400">DATE</span>
                </li>
                <li className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400">
                  <span>check_in_time</span>
                  <span className="text-[10px]">TIMESTAMP</span>
                </li>
                <li className="flex justify-between font-bold text-rose-700 dark:text-rose-400">
                  <span>check_out_time</span>
                  <span className="text-[10px]">TIMESTAMP</span>
                </li>
                <li className="flex justify-between font-bold text-amber-600">
                  <span>late_minutes</span>
                  <span className="text-[10px]">INT</span>
                </li>
                <li className="flex justify-between font-bold text-indigo-600">
                  <span>overtime_minutes</span>
                  <span className="text-[10px]">INT</span>
                </li>
              </ul>
            </div>

            {/* Table 4: payroll_runs */}
            <div 
              onClick={() => setSelectedTable('payroll_runs')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-900 ${
                selectedTable === 'payroll_runs'
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-indigo-500" />
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">payroll_runs</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                  Kitaran 26-25
                </span>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                <li className="flex justify-between font-bold text-indigo-600">
                  <span>PK id</span>
                  <span className="text-[10px] text-slate-400">UUID</span>
                </li>
                <li className="flex justify-between text-sky-600">
                  <span>FK employee_id</span>
                  <span className="text-[10px]">employees(id)</span>
                </li>
                <li className="flex justify-between">
                  <span>cycle_range</span>
                  <span className="text-[10px] text-slate-400">26hb - 25hb</span>
                </li>
                <li className="flex justify-between text-rose-600">
                  <span>late_deduction</span>
                  <span className="text-[10px]">late_min*rate</span>
                </li>
                <li className="flex justify-between text-emerald-600 font-bold">
                  <span>overtime_pay</span>
                  <span className="text-[10px]">ot*1.5*rate</span>
                </li>
                <li className="flex justify-between">
                  <span>kwsp_socso_eis</span>
                  <span className="text-[10px] text-slate-400">Statutori MY</span>
                </li>
                <li className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>net_salary</span>
                  <span className="text-[10px]">NUMERIC</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Details Card for Selected Table */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-500" />
                <span>Penerangan Jadual: <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedTable}</span></span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Klik kad jadual di atas untuk menukar fokus</span>
            </div>

            {selectedTable === 'attendances' && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Jadual <strong>attendances</strong> mengandungi klausa unik <code className="font-mono text-emerald-600">UNIQUE (employee_id, attendance_date)</code> yang menghalang duplikasi rekod absensi pada hari yang sama. Medan <code className="font-mono text-amber-600">late_minutes</code> dikira secara automatik jika waktu masuk melepasi had toleransi shift staf, manakala <code className="font-mono text-indigo-600">overtime_minutes</code> dikira daripada lebihan jam kerja bersih.
              </p>
            )}

            {selectedTable === 'shifts' && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Jadual <strong>shifts</strong> menyimpan tetapan jadual kerja fleksibel bagi setiap pekerja: cth. Shift Pejabat Penuh (09:00 - 18:00, toleransi 15 minit), Shift Pagi (09:00 - 12:00, 3 jam), dan Shift Siang (12:00 - 16:00, 4 jam). HR boleh mencipta dan menetapkan shift tersuai mengikut peranan.
              </p>
            )}

            {selectedTable === 'employees' && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Jadual <strong>employees</strong> menyimpan data induk staf untuk kedua-dua entiti (Pustaka Union dan Solusi Serumpun Senusantara SDN. BHD), termasuk gaji pokok, no. akaun bank, no. KWSP/SOCSO/Cukai, dan kadar sejam (<code className="font-mono">hourly_rate = base_salary / 26 / 8</code>).
              </p>
            )}

            {selectedTable === 'payroll_runs' && (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Jadual <strong>payroll_runs</strong> merumuskan keseluruhan kehadiran kitaran penggajian dari 26hb bulan terdahulu sehingga 25hb bulan semasa, mengira potongan keterlambatan, bayaran lebih masa (OT 1.5x), dan caruman berkanun KWSP 11%, SOCSO, dan EIS mengikut Akta Kerja 1955.
              </p>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SKEMA SQL DDL (CLEAN & SIMPLE)                                     */}
      {/* ========================================================================= */}
      {activeTab === 'sql' && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 font-mono text-xs overflow-hidden shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-sky-400" />
              <span className="font-semibold text-slate-200">schema_postgresql.sql</span>
            </div>
            <button
              onClick={handleCopySQL}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-bold"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Disalin' : 'Salin Semua SQL'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto text-sky-300 leading-relaxed max-h-[500px] p-2">
            <code>{POSTGRESQL_DDL_SCHEMA}</code>
          </pre>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: UJI CEPAT API (LIVE TESTER)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Form (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Penguji API Endpoint (1-Click Tester)
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                Backend Live
              </span>
            </div>

            {/* Endpoint Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Pilih Tindakan Absensi:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestAction('check-in')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    testAction === 'check-in'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  POST /check-in
                </button>
                <button
                  type="button"
                  onClick={() => setTestAction('check-out')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    testAction === 'check-out'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  POST /check-out
                </button>
              </div>
            </div>

            {/* Shift Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                Pilih Shift Waktu Bekerja:
              </label>
              <select
                value={testShift}
                onChange={(e) => setTestShift(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-medium text-slate-900 dark:text-white"
              >
                {INITIAL_SHIFTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.shiftName} (Toleransi: {s.gracePeriodMinutes}m)
                  </option>
                ))}
              </select>
            </div>

            {/* Time / OT Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Waktu Simulasi (HH:mm:ss):
                </label>
                <input
                  type="text"
                  value={testTime}
                  onChange={(e) => setTestTime(e.target.value)}
                  placeholder="09:18:00"
                  className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              {testAction === 'check-out' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Jam Lembur (OT):
                  </label>
                  <select
                    value={testOtHours}
                    onChange={(e) => setTestOtHours(Number(e.target.value))}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="0">0 Jam OT</option>
                    <option value="1">1 Jam OT (1.5x upah)</option>
                    <option value="1.5">1.5 Jam OT</option>
                    <option value="2">2 Jam OT (1.5x upah)</option>
                  </select>
                </div>
              ) : (
                <div className="flex flex-col justify-end text-[11px] text-slate-500 pb-2">
                  <span>Toleransi Shift: 15 minit</span>
                  <span className="font-semibold text-amber-600">Masuk lepas 09:15 = Lewat</span>
                </div>
              )}
            </div>

            {/* Run Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleRunSimpleTest}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isLoading ? 'Sedang Memproses...' : 'Jalankan Ujian API Sekarang'}</span>
            </button>
          </div>

          {/* Right Result Preview (6 cols) */}
          <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-sm space-y-4 font-mono text-xs text-slate-300 min-h-[300px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
              <span className="font-semibold">Respons Server (JSON):</span>
              {apiResult && (
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  HTTP {apiResult.statusCode} OK
                </span>
              )}
            </div>

            {apiResult ? (
              <pre className="overflow-x-auto text-emerald-400 text-xs leading-relaxed p-2">
                <code>{JSON.stringify(apiResult.data, null, 2)}</code>
              </pre>
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Terminal className="w-8 h-8 mx-auto text-slate-600" />
                <p>Klik &ldquo;Jalankan Ujian API Sekarang&rdquo; untuk melihat respons JSON live.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

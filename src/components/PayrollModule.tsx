import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Download, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Lock,
  Unlock,
  Play,
  RotateCcw,
  Printer,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Calendar,
  Layers,
  HelpCircle,
  Plus
} from 'lucide-react';
import { 
  Employee, 
  PayrollRecord, 
  CompanyName, 
  AttendanceRecord,
  LeaveRequest,
  AttendanceStatus,
  WorkLocation
} from '../types/hr';
import { 
  calculatePayrollForEmployee, 
  formatMYR, 
  formatCurrencyAmount,
  getCutOffDateRange,
  MONTH_NAMES_MS,
  AVAILABLE_YEARS,
  isSuperAdminOrHR,
  isSuperAttendanceEditor,
  exportRHBBankCSV,
  exportSalarySummaryCSV,
  exportEpfContributionCSV,
  exportSocsoContributionCSV,
  exportEisContributionCSV
} from '../utils/statutoryCalculations';

interface PayrollModuleProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  activeUser: Employee;
  onUpdateAttendanceRecord?: (record: AttendanceRecord) => void;
  onAddAttendanceRecord?: (record: AttendanceRecord) => void;
  onNavigateToAttendance?: () => void;
  onViewPayslip: (employee: Employee, selectedCompanyOverride?: CompanyName) => void;
}

export type PipelineStep = 1 | 2 | 3 | 4 | 5;

export const PayrollModule: React.FC<PayrollModuleProps> = ({
  employees,
  attendanceRecords,
  leaveRequests,
  activeUser,
  onUpdateAttendanceRecord,
  onAddAttendanceRecord,
  onNavigateToAttendance,
  onViewPayslip,
}) => {
  // Kerahsiaan Gaji: Hanya Ananda Istiqomah, Cheah Leong Tim, dan Siti Fatimah
  // Karyawan lain tidak dapat akses data milik karyawan lainnya (Rahsia Sulit)
  const isSuperAdmin = isSuperAdminOrHR(activeUser);
  const isSuperEditor = isSuperAttendanceEditor(activeUser);
  const canManagePayroll = isSuperAdmin || isSuperEditor;

  // Multi-Month & Cut-off Date Filter State (No new database table needed)
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // 5 = Mei
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  // Interactive 5-Step Pipeline Progress State
  // 1: Cek Absensi -> 2: Lock -> 3: Run Calculation Salary -> 4: CSV to RHB -> 5: Slip Salary
  const [currentStep, setCurrentStep] = useState<PipelineStep>(1);

  // Lock status per period (key: "2025-5")
  const [periodLocks, setPeriodLocks] = useState<Record<string, { isLocked: boolean; lockedBy: string; lockedAt: string }>>({
    '2025-5': { isLocked: false, lockedBy: '', lockedAt: '' }
  });

  // Salary calculation execution flag per period
  const [calculatedPeriods, setCalculatedPeriods] = useState<Record<string, boolean>>({
    '2025-5': true
  });

  // Manual Attendance Entry Modal State (For employees who forgot to clock in)
  const [isQuickAttendanceModalOpen, setIsQuickAttendanceModalOpen] = useState(false);
  const [quickAttendanceData, setQuickAttendanceData] = useState({
    employeeId: employees[0]?.id || '',
    tanggal: '2025-05-12',
    jamMasuk: '08:30:00',
    jamKeluar: '17:30:00',
    workHours: 8.0,
    otHours: 0.0,
    status: 'Hadir' as AttendanceStatus,
    catatan: 'Kakitangan terlupa clock-in terminal pagi, disahkan oleh Pengurus/HR'
  });

  // Calculate cut-off range: strictly 26th of previous month to 25th of selected month
  const cutOff = useMemo(() => {
    return getCutOffDateRange(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const currentPeriodKey = `${selectedYear}-${selectedMonth}`;
  const isPeriodLocked = periodLocks[currentPeriodKey]?.isLocked || false;
  const isPeriodCalculated = calculatedPeriods[currentPeriodKey] || false;

  // Filter attendance records falling within the cut-off date range (startDate <= tanggal <= endDate)
  const cutOffAttendance = useMemo(() => {
    return attendanceRecords.filter(a => {
      return a.tanggal >= cutOff.startDate && a.tanggal <= cutOff.endDate;
    });
  }, [attendanceRecords, cutOff.startDate, cutOff.endDate]);

  // Compute dual scheme payroll records dynamically for all employees
  const payrollRecords: PayrollRecord[] = useMemo(() => {
    return employees.map(emp => {
      // Find all attendance records in this cut-off window for this employee
      const empAttendance = cutOffAttendance.filter(a => a.employeeId === emp.id);

      // Sum regular work hours & overtime hours
      const recordedWorkHours = empAttendance.reduce((sum, a) => sum + (a.workHours || 8.0), 0);
      const recordedOtHours = empAttendance.reduce((sum, a) => sum + (a.otHours || 0), 0);

      // If employee is Hourly (e.g. Diyana Shazwany) and has recorded hours, use recordedWorkHours.
      // If none recorded yet, fallback to standard 160 regular hours for monthly representation.
      const totalHoursWorked = recordedWorkHours > 0 
        ? recordedWorkHours 
        : (emp.salaryScheme === 'Per Jam (Hourly)' ? 160 : 160);

      // Unpaid leave days deduction
      const unpaidLeaves = leaveRequests.filter(
        l => l.employeeId === emp.id && 
             l.status === 'Diluluskan' && 
             l.tipeCuti.includes('Tanpa Gaji') &&
             l.tanggalMulai >= cutOff.startDate &&
             l.tanggalMulai <= cutOff.endDate
      );
      const totalUnpaidDays = unpaidLeaves.reduce((sum, l) => sum + l.durasiHari, 0);

      return calculatePayrollForEmployee(
        emp, 
        totalHoursWorked, 
        recordedOtHours, 
        totalUnpaidDays, 
        selectedYear, 
        selectedMonth
      );
    });
  }, [employees, cutOffAttendance, leaveRequests, cutOff.startDate, cutOff.endDate, selectedYear, selectedMonth]);

  // Permission access filter: HR/Director and Super Editors can view all; regular employees view only their own
  const accessiblePayroll = useMemo(() => {
    if (!canManagePayroll) {
      return payrollRecords.filter(p => p.employeeId === activeUser.id);
    }
    return payrollRecords;
  }, [payrollRecords, canManagePayroll, activeUser.id]);

  const filteredPayroll = useMemo(() => {
    return accessiblePayroll.filter(p => {
      if (selectedCompany === 'all') return true;
      return p.company === selectedCompany;
    });
  }, [accessiblePayroll, selectedCompany]);

  // Aggregate metrics
  const totalGajiKasar = filteredPayroll.reduce((sum, p) => sum + p.gajiKasarMYR, 0);
  const totalGajiBersih = filteredPayroll.reduce((sum, p) => sum + p.gajiBersihMYR, 0);
  const totalEpfMajikan = filteredPayroll.reduce((sum, p) => sum + p.epfMajikan, 0);
  const totalSocsoMajikan = filteredPayroll.reduce((sum, p) => sum + p.socsoMajikan, 0);
  const totalEisMajikan = filteredPayroll.reduce((sum, p) => sum + p.eisMajikan, 0);
  const totalCarumanStatutori = totalEpfMajikan + totalSocsoMajikan + totalEisMajikan;

  // Toggle Lock Attendance Handler
  const handleToggleLock = () => {
    if (!canManagePayroll) {
      alert('Hanya Pengurus (Cheah Leong Tim, Siti Fatimah, Ananda Istiqomah) dibenarkan mengunci absensi.');
      return;
    }
    setPeriodLocks(prev => ({
      ...prev,
      [currentPeriodKey]: {
        isLocked: !isPeriodLocked,
        lockedBy: activeUser.namaLengkap,
        lockedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' MYT'
      }
    }));
    if (!isPeriodLocked) {
      // Advance to step 3 when locked
      setCurrentStep(3);
    }
  };

  // Run Calculation Salary Handler
  const handleRunCalculation = () => {
    setCalculatedPeriods(prev => ({
      ...prev,
      [currentPeriodKey]: true
    }));
    setCurrentStep(4);
  };

  // Quick Attendance Record submission (for forgotten clock-ins)
  const handleSaveQuickAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === quickAttendanceData.employeeId);
    if (!emp) return;

    const newRecord: AttendanceRecord = {
      id: `att-manual-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.namaLengkap,
      company: emp.company,
      nik: emp.nik,
      departemen: emp.departemen,
      tanggal: quickAttendanceData.tanggal,
      jamMasuk: quickAttendanceData.jamMasuk,
      jamKeluar: quickAttendanceData.jamKeluar,
      workHours: Number(quickAttendanceData.workHours) || 8.0,
      otHours: Number(quickAttendanceData.otHours) || 0,
      status: quickAttendanceData.status,
      lokasi: emp.company.includes('Pustaka') 
        ? 'Ibu Pejabat Pustaka Union (KL)' 
        : 'Pejabat Solusi Serumpun Senusantara (KL)',
      koordinat: '3.1390, 101.6869',
      jarakMeter: 10,
      catatan: quickAttendanceData.catatan || 'Presensi manual disahkan oleh Pengurusan (terlupa absen)'
    };

    if (onAddAttendanceRecord) {
      onAddAttendanceRecord(newRecord);
    }
    setIsQuickAttendanceModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Title & Cut-Off Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sistem Penggajian Ganda & RHB AutoPay
            </h1>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Skema Bulanan & Per Jam
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kiraan gaji automatik berasaskan tutup buku tarikh 26hb hingga 25hb tanpa perlu mencipta timeframe baru setiap bulan.
          </p>
        </div>

        {/* Super Editor Badge */}
        {isSuperEditor && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Akses Penuh Pengurusan ({activeUser.namaLengkap})</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Diberikan hak penuh menyunting absensi & menjalankan penggajian.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5-STEP PIPELINE BAR (Cek Absensi -> Lock -> Run Calculation -> CSV -> Slip) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aliran Kerja Penggajian (Payroll Pipeline Workflow)
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Periode: <strong className="text-indigo-600 dark:text-indigo-400">{cutOff.label}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
          
          {/* Step 1: Cek Absensi */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              currentStep === 1
                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">01</span>
              <Clock className={`w-3.5 h-3.5 ${currentStep === 1 ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <p className="font-bold text-xs text-slate-900 dark:text-white mt-1">Cek Absensi</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">Semak kehadiran 26hb - 25hb</p>
          </button>

          {/* Step 2: Lock Absensi */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              currentStep === 2
                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">02</span>
              {isPeriodLocked ? (
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-amber-500" />
              )}
            </div>
            <p className="font-bold text-xs text-slate-900 dark:text-white mt-1">Lock Absensi</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">
              {isPeriodLocked ? 'Terkunci (Final)' : 'Buka / Belum Kunci'}
            </p>
          </button>

          {/* Step 3: Run Calculation Salary */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              currentStep === 3
                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">03</span>
              <Play className={`w-3.5 h-3.5 ${currentStep === 3 ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <p className="font-bold text-xs text-slate-900 dark:text-white mt-1">Run Calculation</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">Kira Bulanan & Per Jam</p>
          </button>

          {/* Step 4: CSV too RHB */}
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              currentStep === 4
                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">04</span>
              <FileSpreadsheet className={`w-3.5 h-3.5 ${currentStep === 4 ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <p className="font-bold text-xs text-slate-900 dark:text-white mt-1">CSV to RHB</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">AutoPay & Statutori CSV</p>
          </button>

          {/* Step 5: Slip Salary */}
          <button
            type="button"
            onClick={() => setCurrentStep(5)}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              currentStep === 5
                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">05</span>
              <FileText className={`w-3.5 h-3.5 ${currentStep === 5 ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <p className="font-bold text-xs text-slate-900 dark:text-white mt-1">Slip Salary</p>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">Penyata Rasmi Cetakan</p>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER CONTROLS: BULAN & TAHUN DROPDOWNS + SYARIKAT */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Bulan Gaji:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5"
          >
            {MONTH_NAMES_MS.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
            <span>Tahun:</span>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono"
          >
            {AVAILABLE_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Company Filter */}
          {canManagePayroll && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-2 border-l border-slate-200 dark:border-slate-700">
                <Filter className="w-3.5 h-3.5" />
                <span>Syarikat:</span>
              </div>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-medium"
              >
                <option value="all">Semua Syarikat (19 Kakitangan)</option>
                <option value="Pustaka Union">Pustaka Union (16 Pekerja)</option>
                <option value="Solusi Serumpun Senusantara SDN. BHD">Solusi Serumpun Senusantara SDN. BHD (3 Pekerja)</option>
              </select>
            </>
          )}
        </div>

        {/* Dynamic Cut-Off Range Indicator */}
        <div className="text-right text-xs">
          <span className="text-slate-400">Rentang Cut-off Penggajian: </span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
            {cutOff.startDate} hingga {cutOff.endDate}
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* STEP 1: CEK ABSENSI INTERACTIVE PANEL */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Langkah 1: Semakan Absensi & Kehadiran ({cutOff.label})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan seluruh staf telah mempunyai log kehadiran yang lengkap sebelum absensi dikunci.
              </p>
            </div>

            {canManagePayroll && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAttendanceModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Rekod Terlupa Absen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  <span>Seterusnya: Kunci Absensi (Lock)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Notice regarding DIYANA SHAZWANY & Super Editors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Skema Gaji Per Jam & Bebas Statutori:
              </p>
              <p className="mt-1">
                <strong>DIYANA SHAZWANY BT MOHAMAD ZUBER</strong> (Temp Worker dari Pustaka Union) dikira berdasarkan jam kerja aktual @ RM 18.00/jam dan <strong>TIDAK DIKENAKAN SOSCO, EIS, & EPF</strong>.
              </p>
            </div>

            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200">
              <p className="font-bold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                Kebenaran Menyunting Khas:
              </p>
              <p className="mt-1">
                <strong>ANANDA ISTIQOMAH, CHEAH LEONG TIM, & SITI FATIMAH</strong> mempunyai akses penuh menyunting absensi bagi mana-mana staf yang terlupa jam masuk/keluar.
              </p>
            </div>
          </div>

          {/* Attendance Summary Grid for Cut-Off */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="py-2.5 px-3">Kakitangan</th>
                  <th className="py-2.5 px-3">Skema Gaji</th>
                  <th className="py-2.5 px-3">Log Presensi Cut-off</th>
                  <th className="py-2.5 px-3">Total Jam Biasa</th>
                  <th className="py-2.5 px-3">Jam OT</th>
                  <th className="py-2.5 px-3">Status Statutori</th>
                  <th className="py-2.5 px-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredPayroll.map(p => {
                  const emp = employees.find(e => e.id === p.employeeId);
                  const isHourly = p.salaryScheme === 'Per Jam (Hourly)';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{p.employeeName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{p.company} · {p.nik}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isHourly 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {p.salaryScheme}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {cutOffAttendance.filter(a => a.employeeId === p.employeeId).length} rekod
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {p.totalRegularHours} jam {isHourly && `@ RM ${p.hourlyRateMYR}/j`}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {p.otHours > 0 ? `${p.otHours} jam` : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        {p.isExemptStatutory ? (
                          <span className="text-amber-600 font-bold text-[10px]">
                            Bebas Statutori (0%)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[10px]">
                            Caruman Biasa (EPF/SOCSO/EIS)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {canManagePayroll && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickAttendanceData(prev => ({
                                ...prev,
                                employeeId: p.employeeId
                              }));
                              setIsQuickAttendanceModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950 rounded border border-indigo-200 dark:border-indigo-900"
                          >
                            + Tambah Absen
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: LOCK ABSENSI PANEL */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isPeriodLocked ? (
                  <Lock className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Unlock className="w-4 h-4 text-amber-500" />
                )}
                <span>Langkah 2: Kunci Rekod Absensi (Lock Periode Cut-off)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mengunci rekod absensi menghalang sebarang suntingan sebelum pengiraan gaji dijalankan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
            >
              <span>Seterusnya: Jalankan Kalkulasi (Run)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
              {isPeriodLocked ? (
                <Lock className="w-6 h-6 text-emerald-600" />
              ) : (
                <Unlock className="w-6 h-6 text-amber-500" />
              )}
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Status Absensi Periode {MONTH_NAMES_MS[selectedMonth - 1]} {selectedYear}:{' '}
                <span className={isPeriodLocked ? 'text-emerald-600' : 'text-amber-500'}>
                  {isPeriodLocked ? 'TERKUNCI (LOCKED)' : 'TERBUKA (UNLOCKED)'}
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {cutOff.startDate} hingga {cutOff.endDate} (Tutup Buku 25hb)
              </p>
              {isPeriodLocked && periodLocks[currentPeriodKey]?.lockedBy && (
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  Dikunci oleh: <strong>{periodLocks[currentPeriodKey]?.lockedBy}</strong> pada {periodLocks[currentPeriodKey]?.lockedAt}
                </p>
              )}
            </div>

            {canManagePayroll && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleToggleLock}
                  className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow transition-colors flex items-center gap-2 mx-auto ${
                    isPeriodLocked 
                      ? 'bg-slate-700 hover:bg-slate-800' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isPeriodLocked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Buka Kunci Absensi (Unlock)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Kunci Absensi Periode Ini (Lock)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: RUN CALCULATION SALARY PANEL */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-600" />
                <span>Langkah 3: Jalankan Kalkulasi Gaji (Dual Scheme: Bulanan & Per Jam)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiraan automatik gaji pokok tetap, upah jam kerja, elaun, bayaran OT, serta potongan statutori Malaysia.
              </p>
            </div>

            {canManagePayroll && (
              <button
                type="button"
                onClick={handleRunCalculation}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors self-start sm:self-auto"
              >
                <Play className="w-4 h-4" />
                <span>Run Calculation Salary</span>
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">Jumlah Gaji Kasar (Semua Staf)</p>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {formatMYR(totalGajiKasar)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">Jumlah Gaji Bersih Dibayar (Net Pay)</p>
              <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                {formatMYR(totalGajiBersih)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500">Caruman Statutori Majikan</p>
              <p className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                {formatMYR(totalCarumanStatutori)}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
            >
              <span>Seterusnya: Eksport CSV Bank RHB</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: CSV TO RHB BANK PANEL */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Langkah 4: Eksport Fail CSV RHB Reflex / AutoPay Bulk Payment</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Muat turun fail pemindahan gaji massal rasmi terus ke RHB Bank Reflex serta fail borang caruman berkanun.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm self-start sm:self-auto"
            >
              <span>Seterusnya: Cetak Slip Gaji</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary RHB Button Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/20 rounded-full text-blue-100">
                RHB Bank Bulk AutoPay
              </span>
              <h4 className="text-lg font-extrabold mt-1">
                Fail Pindahan Gaji Berkelompok RHB (Reflex Format)
              </h4>
              <p className="text-xs text-blue-100 mt-1 max-w-xl">
                Format CSV lengkap dengan nombor akaun benefisiari, nama penerima, no. IC/Pasport, dan jumlah gaji bersih MYR untuk periode cut-off {cutOff.label}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => exportRHBBankCSV(filteredPayroll, selectedCompany, cutOff.label)}
              className="px-6 py-3 text-xs font-extrabold text-blue-950 bg-white hover:bg-blue-50 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4 text-blue-900" />
              <span>MUAT TURUN CSV TO RHB</span>
            </button>
          </div>

          {/* Secondary Statutory CSV Buttons */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Fail CSV Statutori Berkanun & Audit Tambahan:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => exportSalarySummaryCSV(filteredPayroll, selectedCompany)}
                className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">CSV Gaji Penuh</span>
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Semua lajur gaji, elaun, bank & potongan</p>
              </button>

              <button
                type="button"
                onClick={() => exportEpfContributionCSV(filteredPayroll, selectedCompany)}
                className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">CSV KWSP (EPF)</span>
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Format Borang A Caruman 11% & 12%/13%</p>
              </button>

              <button
                type="button"
                onClick={() => exportSocsoContributionCSV(filteredPayroll, selectedCompany)}
                className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">CSV PERKESO (SOCSO)</span>
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Format Borang 8A Skim Bencana Pekerjaan</p>
              </button>

              <button
                type="button"
                onClick={() => exportEisContributionCSV(filteredPayroll, selectedCompany)}
                className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">CSV EIS (SIP)</span>
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Sistem Insurans Pekerjaan 0.2% + 0.2%</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5 / MAIN RECAP TABLE: SLIP SALARY & PENYATA GAJI */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Title Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Jadual Rekapitulasi Gaji ({MONTH_NAMES_MS[selectedMonth - 1]} {selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cut-off: <strong>{cutOff.startDate}</strong> hingga <strong>{cutOff.endDate}</strong> ({filteredPayroll.length} rekod kakitangan)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Tarikh Bayaran:</span>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
              28 {MONTH_NAMES_MS[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                <th className="py-3 px-4">Kakitangan & Syarikat</th>
                <th className="py-3 px-4">Skema Gaji</th>
                <th className="py-3 px-4">Gaji Pokok / Upah Jam</th>
                <th className="py-3 px-4">Jam OT</th>
                <th className="py-3 px-4">KWSP 11%</th>
                <th className="py-3 px-4">PERKESO</th>
                <th className="py-3 px-4">EIS 0.2%</th>
                <th className="py-3 px-4 text-right">Gaji Bersih (MYR)</th>
                <th className="py-3 px-4 text-right">Slip Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredPayroll.map(p => {
                const empObj = employees.find(e => e.id === p.employeeId);
                const isHourly = p.salaryScheme === 'Per Jam (Hourly)';
                const isDiyana = p.employeeName.toLowerCase().includes('diyana');

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    
                    {/* Employee & Company */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {p.employeeName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {p.company} · {p.nik}
                          </p>
                          {isDiyana && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 rounded">
                              Temp Worker (Pustaka Union) · Bebas Caruman
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Scheme */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isHourly 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' 
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {p.salaryScheme}
                      </span>
                    </td>

                    {/* Base or Hourly Calculation */}
                    <td className="py-3 px-4 font-mono font-medium">
                      {isHourly ? (
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {formatMYR(p.gajiPokokMYR)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {p.totalRegularHours}j @ RM {p.hourlyRateMYR.toFixed(2)}/j
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {formatMYR(p.gajiPokokMYR)}
                          </p>
                          {p.originalCurrency !== 'MYR' && (
                            <p className="text-[10px] text-slate-500">
                              Asal: {formatCurrencyAmount(p.originalSalary, p.originalCurrency)}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* OT Hours & Pay */}
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {p.otHours > 0 ? (
                        <span>{p.otHours}j (+{formatMYR(p.otPayMYR)})</span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* KWSP (EPF) */}
                    <td className="py-3 px-4 font-mono">
                      {p.isExemptStatutory ? (
                        <span className="text-amber-600 text-[10px] font-bold">RM 0.00 (Bebas)</span>
                      ) : (
                        <span>{formatMYR(p.epfPekerja)}</span>
                      )}
                    </td>

                    {/* PERKESO (SOCSO) */}
                    <td className="py-3 px-4 font-mono">
                      {p.isExemptStatutory ? (
                        <span className="text-amber-600 text-[10px] font-bold">RM 0.00 (Bebas)</span>
                      ) : (
                        <span>{formatMYR(p.socsoPekerja)}</span>
                      )}
                    </td>

                    {/* EIS */}
                    <td className="py-3 px-4 font-mono">
                      {p.isExemptStatutory ? (
                        <span className="text-amber-600 text-[10px] font-bold">RM 0.00 (Bebas)</span>
                      ) : (
                        <span>{formatMYR(p.eisPekerja)}</span>
                      )}
                    </td>

                    {/* Net Pay */}
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-sm text-emerald-600 tabular-nums">
                      {formatMYR(p.gajiBersihMYR)}
                    </td>

                    {/* Slip Salary Action */}
                    <td className="py-3 px-4 text-right">
                      {empObj && (
                        <button
                          type="button"
                          onClick={() => onViewPayslip(empObj)}
                          className="px-3 py-1 text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                        >
                          Slip Gaji
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK ATTENDANCE ENTRY MODAL (FOR FORGOTTEN CLOCK-INS) */}
      {/* ========================================================================= */}
      {isQuickAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rekod Kehadiran Terlupa (Manual Entry)
                </h3>
                <p className="text-xs text-slate-500">
                  Dibenarkan untuk Ananda Istiqomah, Cheah Leong Tim, & Siti Fatimah bagi staf terlupa absen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAttendanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickAttendance} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Kakitangan:
                </label>
                <select
                  value={quickAttendanceData.employeeId}
                  onChange={(e) => setQuickAttendanceData({ ...quickAttendanceData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.namaLengkap} ({emp.company}) · {emp.salaryScheme}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tarikh:
                  </label>
                  <input
                    type="date"
                    value={quickAttendanceData.tanggal}
                    onChange={(e) => setQuickAttendanceData({ ...quickAttendanceData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status:
                  </label>
                  <select
                    value={quickAttendanceData.status}
                    onChange={(e) => setQuickAttendanceData({ ...quickAttendanceData, status: e.target.value as AttendanceStatus })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                  >
                    <option value="Hadir">Hadir</option>
                    <option value="Lewat">Lewat</option>
                    <option value="Bercuti">Bercuti</option>
                    <option value="Sakit (MC)">Sakit (MC)</option>
                    <option value="Alpa">Alpa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Waktu Masuk:
                  </label>
                  <input
                    type="text"
                    value={quickAttendanceData.jamMasuk}
                    onChange={(e) => setQuickAttendanceData({ ...quickAttendanceData, jamMasuk: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Waktu Keluar:
                  </label>
                  <input
                    type="text"
                    value={quickAttendanceData.jamKeluar}
                    onChange={(e) => setQuickAttendanceData({ ...quickAttendanceData, jamKeluar: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Jam Bekerja Biasa (Work Hours):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="12"
                    value={quickAttendanceData.workHours}
                    onChange={(e) => setQuickAttendanceData({ ...quickAttendanceData, workHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Jam Lebih Masa (OT):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="8"
                    value={quickAttendanceData.otHours}
                    onChange={(e) => setQuickAttendanceData({ ...quickAttendanceData, otHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pengesahan:
                </label>
                <input
                  type="text"
                  value={quickAttendanceData.catatan}
                  onChange={(e) => setQuickAttendanceData({ ...quickAttendanceData, catatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  placeholder="cth: Kakitangan terlupa imbas kad, disahkan oleh Penyelia"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickAttendanceModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Simpan Rekod Absensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

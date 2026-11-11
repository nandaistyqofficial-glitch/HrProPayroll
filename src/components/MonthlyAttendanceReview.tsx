import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Lock, 
  Unlock, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Printer, 
  Filter, 
  Search, 
  User, 
  Building2, 
  Coffee, 
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Plus,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  AttendanceStatus, 
  WorkLocation,
  CompanyName,
  MonthlyAttendanceLock
} from '../types/hr';
import { 
  getCutOffDateRange, 
  MONTH_NAMES_MS, 
  AVAILABLE_YEARS,
  isSuperAdminOrHR
} from '../utils/statutoryCalculations';
import { formatDateIndo } from '../utils/formatters';

interface MonthlyAttendanceReviewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  activeUser: Employee;
  onUpdateAttendanceRecord?: (record: AttendanceRecord) => void;
  onAddAttendanceRecord: (record: AttendanceRecord) => void;
  selectedCompanyFilter?: string;
  onNavigateToPayroll?: (emp: Employee) => void;
  currentLang?: 'ms' | 'en';
}

interface DailyRowData {
  date: string;
  dayName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  record?: AttendanceRecord;
  status: AttendanceStatus;
  jamMasuk: string;
  jamKeluarRehat: string | null;
  jamMasukRehat: string | null;
  jamKeluar: string | null;
  workHours: number;
  otHours: number;
  catatan: string;
  lokasi: string;
  isDerived: boolean;
}

export const MonthlyAttendanceReview: React.FC<MonthlyAttendanceReviewProps> = ({
  employees,
  attendanceRecords,
  leaveRequests,
  activeUser,
  onUpdateAttendanceRecord,
  onAddAttendanceRecord,
  selectedCompanyFilter = 'all',
  onNavigateToPayroll,
  currentLang = 'ms',
}) => {
  const isSuperUser = isSuperAdminOrHR(activeUser);

  // Period state
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Mei 2025: 26 Apr - 25 Mei

  // Selected Employee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || activeUser.id);
  const [empSearchTerm, setEmpSearchTerm] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>(selectedCompanyFilter || 'all');

  // Locks map: key = `${employeeId}_${year}_${month}`
  const [locks, setLocks] = useState<Record<string, {
    isLocked: boolean;
    lockedBy: string;
    lockedAt: string;
    notes?: string;
  }>>({
    'emp-pu-01_2025_5': {
      isLocked: true,
      lockedBy: 'SITI FATIMAH BINTI HARON',
      lockedAt: '2025-05-25 17:30',
      notes: 'Disahkan lengkap 100% tiada alpa untuk pemprosesan slip gaji.'
    },
    'emp-pu-02_2025_5': {
      isLocked: true,
      lockedBy: 'CHEAH LEONG TIM',
      lockedAt: '2025-05-25 18:00',
      notes: 'Rekod disahkan oleh Pengarah.'
    }
  });

  // Inline editing state for a day
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('Hadir');
  const [editJamMasuk, setEditJamMasuk] = useState<string>('08:30:00');
  const [editJamKeluar, setEditJamKeluar] = useState<string>('17:30:00');
  const [editJamKeluarRehat, setEditJamKeluarRehat] = useState<string>('13:00:00');
  const [editJamMasukRehat, setEditJamMasukRehat] = useState<string>('14:00:00');
  const [editWorkHours, setEditWorkHours] = useState<number>(8.0);
  const [editOtHours, setEditOtHours] = useState<number>(0);
  const [editCatatan, setEditCatatan] = useState<string>('');
  const [editLokasi, setEditLokasi] = useState<string>('Ibu Pejabat Pustaka Union (KL)');

  // Lock Confirmation Modal state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockNotesInput, setLockNotesInput] = useState('Disemak dan disahkan lengkap tanpa sebarang alpa.');
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReasonInput, setUnlockReasonInput] = useState('');

  // Selected Employee object
  const currentEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId) || employees[0];
  }, [employees, selectedEmployeeId]);

  // Cut-off date range details
  const cutOff = useMemo(() => {
    return getCutOffDateRange(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Lock status key
  const lockKey = `${selectedEmployeeId}_${selectedYear}_${selectedMonth}`;
  const currentLockInfo = locks[lockKey];
  const isPeriodLocked = Boolean(currentLockInfo?.isLocked);

  // List of all dates in the 26th-25th range
  const allDatesInRange = useMemo(() => {
    const dates: string[] = [];
    const current = new Date(cutOff.startDate);
    const end = new Date(cutOff.endDate);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [cutOff.startDate, cutOff.endDate]);

  // Compute daily rows for the selected employee
  const dailyRows: DailyRowData[] = useMemo(() => {
    if (!currentEmployee) return [];

    const dayNamesMs = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

    return allDatesInRange.map(dateStr => {
      const d = new Date(dateStr);
      const dayIndex = d.getDay();
      const dayName = dayNamesMs[dayIndex];
      const isWeekend = dayIndex === 0 || dayIndex === 6; // Sunday or Saturday

      // Check official Malaysian public holiday (e.g. 1 Mei - Hari Pekerja)
      const isLabourDay = dateStr === '2025-05-01';
      const isWesak = dateStr === '2025-05-12';
      const isHoliday = isLabourDay || isWesak;
      const holidayName = isLabourDay ? 'Hari Pekerja (Labour Day)' : isWesak ? 'Hari Wesak' : undefined;

      // Existing record in attendanceRecords
      const existing = attendanceRecords.find(
        r => r.employeeId === currentEmployee.id && r.tanggal === dateStr
      );

      // Check approved leave request
      const leave = leaveRequests.find(
        l => l.employeeId === currentEmployee.id && 
             l.status === 'Diluluskan' && 
             dateStr >= l.tanggalMulai && 
             dateStr <= l.tanggalSelesai
      );

      if (existing) {
        return {
          date: dateStr,
          dayName,
          isWeekend,
          isHoliday,
          holidayName,
          record: existing,
          status: existing.status,
          jamMasuk: existing.jamMasuk || '-',
          jamKeluarRehat: existing.jamKeluarRehat || null,
          jamMasukRehat: existing.jamMasukRehat || null,
          jamKeluar: existing.jamKeluar || '-',
          workHours: existing.workHours || 0,
          otHours: existing.otHours || 0,
          catatan: existing.catatan || (existing.status === 'Hadir' ? 'Hadir bertugas' : ''),
          lokasi: existing.lokasi || (currentEmployee.isRemoteOutsideMalaysia ? 'Remote Antarabangsa' : 'Pejabat KL'),
          isDerived: false
        };
      }

      if (leave) {
        const isMc = leave.tipeCuti.includes('Sakit');
        return {
          date: dateStr,
          dayName,
          isWeekend,
          isHoliday,
          holidayName,
          status: isMc ? 'Sakit (MC)' : 'Bercuti',
          jamMasuk: '-',
          jamKeluarRehat: null,
          jamMasukRehat: null,
          jamKeluar: '-',
          workHours: 8.0,
          otHours: 0,
          catatan: `Cuti Diluluskan: ${leave.tipeCuti} (${leave.alasan})`,
          lokasi: 'Remote Rumah / WFH',
          isDerived: true
        };
      }

      if (isHoliday) {
        return {
          date: dateStr,
          dayName,
          isWeekend,
          isHoliday: true,
          holidayName,
          status: 'Cuti Am',
          jamMasuk: '-',
          jamKeluarRehat: null,
          jamMasukRehat: null,
          jamKeluar: '-',
          workHours: 8.0,
          otHours: 0,
          catatan: `Warta Cuti Am Rasmi: ${holidayName}`,
          lokasi: 'Cuti Persekutuan / Negeri',
          isDerived: true
        };
      }

      if (isWeekend) {
        return {
          date: dateStr,
          dayName,
          isWeekend: true,
          isHoliday: false,
          status: 'Hari Rehat (Off)',
          jamMasuk: '-',
          jamKeluarRehat: null,
          jamMasukRehat: null,
          jamKeluar: '-',
          workHours: 0,
          otHours: 0,
          catatan: 'Hari Rehat Mingguan (Hujung Minggu)',
          lokasi: '-',
          isDerived: true
        };
      }

      // Weekday standard attendance if date is today or in the past
      const todayStr = '2025-05-12';
      if (dateStr <= todayStr) {
        return {
          date: dateStr,
          dayName,
          isWeekend: false,
          isHoliday: false,
          status: 'Hadir',
          jamMasuk: '08:30:00',
          jamKeluarRehat: '13:00:00',
          jamMasukRehat: '14:00:00',
          jamKeluar: '17:30:00',
          workHours: 8.0,
          otHours: 0,
          catatan: 'Presensi Standard Disahkan Pengurusan',
          lokasi: currentEmployee.isRemoteOutsideMalaysia ? 'Luar Negara (Remote International)' : 'Ibu Pejabat Pustaka Union (KL)',
          isDerived: true
        };
      }

      // Future date in the cycle
      return {
        date: dateStr,
        dayName,
        isWeekend: false,
        isHoliday: false,
        status: 'Hadir',
        jamMasuk: '-',
        jamKeluarRehat: null,
        jamMasukRehat: null,
        jamKeluar: '-',
        workHours: 8.0,
        otHours: 0,
        catatan: 'Dijadualkan Bertugas',
        lokasi: currentEmployee.isRemoteOutsideMalaysia ? 'Remote Luar Negara' : 'Pejabat KL',
        isDerived: true
      };
    });
  }, [allDatesInRange, currentEmployee, attendanceRecords, leaveRequests]);

  // Aggregated KPI Stats
  const stats = useMemo(() => {
    let daysPresent = 0;
    let daysLate = 0;
    let daysLeave = 0;
    let daysMc = 0;
    let daysOff = 0;
    let daysHoliday = 0;
    let daysAbsent = 0;
    let totalWorkHours = 0;
    let totalOtHours = 0;

    dailyRows.forEach(r => {
      if (r.status === 'Hadir') daysPresent++;
      else if (r.status === 'Lewat') daysLate++;
      else if (r.status === 'Bercuti') daysLeave++;
      else if (r.status === 'Sakit (MC)') daysMc++;
      else if (r.status === 'Hari Rehat (Off)') daysOff++;
      else if (r.status === 'Cuti Am') daysHoliday++;
      else if (r.status === 'Alpa') daysAbsent++;

      totalWorkHours += r.workHours || 0;
      totalOtHours += r.otHours || 0;
    });

    const totalWorkingDays = daysPresent + daysLate + daysLeave + daysMc + daysHoliday;

    return {
      daysPresent,
      daysLate,
      daysLeave,
      daysMc,
      daysOff,
      daysHoliday,
      daysAbsent,
      totalWorkingDays,
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
      totalOtHours: Math.round(totalOtHours * 10) / 10,
    };
  }, [dailyRows]);

  // Handler: Start Editing row
  const handleStartEditRow = (row: DailyRowData) => {
    if (isPeriodLocked) {
      alert('Perhatian: Rekod absensi bulan ini telah DIKUNCI oleh HRD. Sila buka kunci (Unlock) terlebih dahulu untuk membuat sebarang pindaan.');
      return;
    }

    setEditingDate(row.date);
    setEditStatus(row.status);
    setEditJamMasuk(row.jamMasuk !== '-' ? row.jamMasuk : '08:30:00');
    setEditJamKeluar(row.jamKeluar !== '-' ? (row.jamKeluar || '17:30:00') : '17:30:00');
    setEditJamKeluarRehat(row.jamKeluarRehat || '13:00:00');
    setEditJamMasukRehat(row.jamMasukRehat || '14:00:00');
    setEditWorkHours(row.workHours || 8.0);
    setEditOtHours(row.otHours || 0);
    setEditCatatan(row.catatan || '');
    setEditLokasi(row.lokasi || 'Ibu Pejabat Pustaka Union (KL)');
  };

  // Handler: Save Row
  const handleSaveRow = (row: DailyRowData) => {
    const targetRecord = row.record;
    const nowIso = new Date().toISOString();

    if (targetRecord && onUpdateAttendanceRecord) {
      onUpdateAttendanceRecord({
        ...targetRecord,
        status: editStatus,
        jamMasuk: editJamMasuk,
        jamKeluar: editJamKeluar,
        jamKeluarRehat: editJamKeluarRehat || null,
        jamMasukRehat: editJamMasukRehat || null,
        workHours: Number(editWorkHours) || 8.0,
        otHours: Number(editOtHours) || 0,
        catatan: (editCatatan ? editCatatan + ' · ' : '') + `Disunting HRD (${activeUser.namaLengkap})`,
        lokasi: editLokasi as any
      });
    } else {
      onAddAttendanceRecord({
        id: `att-edit-${Date.now()}`,
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.namaLengkap,
        company: currentEmployee.company,
        nik: currentEmployee.nik,
        departemen: currentEmployee.departemen,
        tanggal: row.date,
        jamMasuk: editJamMasuk,
        jamKeluar: editJamKeluar,
        jamKeluarRehat: editJamKeluarRehat || null,
        jamMasukRehat: editJamMasukRehat || null,
        status: editStatus,
        workHours: Number(editWorkHours) || 8.0,
        otHours: Number(editOtHours) || 0,
        lokasi: editLokasi as any,
        koordinat: currentEmployee.isRemoteOutsideMalaysia ? '-6.3728, 106.8331' : '3.1390, 101.6869',
        jarakMeter: 10,
        catatan: (editCatatan ? editCatatan + ' · ' : '') + `Direkod oleh HRD (${activeUser.namaLengkap})`
      });
    }

    setEditingDate(null);
  };

  // Handler: Lock Period
  const handleConfirmLock = () => {
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    setLocks(prev => ({
      ...prev,
      [lockKey]: {
        isLocked: true,
        lockedBy: activeUser.namaLengkap,
        lockedAt: dateFormatted,
        notes: lockNotesInput || 'Disahkan lengkap oleh HRD'
      }
    }));
    setIsLockModalOpen(false);
  };

  // Handler: Unlock Period
  const handleConfirmUnlock = () => {
    setLocks(prev => {
      const copy = { ...prev };
      delete copy[lockKey];
      return copy;
    });
    setIsUnlockModalOpen(false);
    setUnlockReasonInput('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Tarikh',
      'Hari',
      'Nama Pekerja',
      'NIK',
      'Syarikat',
      'Jabatan',
      'Status Kehadiran',
      'Masuk (Punch 1)',
      'Keluar Rehat (Punch 2)',
      'Masuk Rehat (Punch 3)',
      'Pulang (Punch 4)',
      'Jam Biasa',
      'Jam OT',
      'Lokasi',
      'Catatan HR'
    ];

    const rows = dailyRows.map(r => [
      r.date,
      r.dayName,
      currentEmployee.namaLengkap,
      currentEmployee.nik,
      currentEmployee.company,
      currentEmployee.departemen,
      r.status,
      r.jamMasuk,
      r.jamKeluarRehat || '-',
      r.jamMasukRehat || '-',
      r.jamKeluar || '-',
      r.workHours.toString(),
      r.otHours.toString(),
      r.lokasi,
      r.catatan
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Absensi_Bulan_${currentEmployee.nik}_${cutOff.startDate}_ke_${cutOff.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered employees for selector
  const eligibleEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchComp = companyFilter === 'all' || e.company === companyFilter;
      const matchSearch = e.namaLengkap.toLowerCase().includes(empSearchTerm.toLowerCase()) ||
                          e.nik.toLowerCase().includes(empSearchTerm.toLowerCase()) ||
                          e.jabatan.toLowerCase().includes(empSearchTerm.toLowerCase());
      return matchComp && matchSearch;
    });
  }, [employees, companyFilter, empSearchTerm]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Explanation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-600/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  Modul Semakan Absensi Sebulan Penuh (Kitaran 26hb - 25hb)
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-mono text-slate-500 font-bold">HR / HRD Exclusive</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Semakan &amp; Penguncian Kehadiran Bulanan Pekerja
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                HR/HRD dapat melihat seluruh rekod absensi dari 26hb bulan lepas hingga 25hb bulan semasa bagi setiap pekerja. Anda berhak menyunting kehadiran, jam OT, dan mengunci (Lock) rekod apabila selesai disemak untuk kelulusan penggajian.
              </p>
            </div>
          </div>

          {/* Quick Period & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="Eksport lembaran kehadiran pekerja ini ke fail CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Eksport CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="Cetak lembaran kehadiran bulanan untuk fail fizikal audit"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            {onNavigateToPayroll && (
              <button
                onClick={() => onNavigateToPayroll(currentEmployee)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                title="Buka pemprosesan gaji & slip gaji pekerja ini"
              >
                <span>Proses Gaji</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Panel: Employee Selector & Period Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Employee Dropdown / Filter (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Pilih Karyawan ({eligibleEmployees.length} staf):</span>
              <span className="text-[10px] text-slate-400 font-normal">Pustaka Union &amp; Solusi Serumpun</span>
            </label>
            <div className="relative">
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  setEditingDate(null);
                }}
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {eligibleEmployees.map(emp => {
                  const empKey = `${emp.id}_${selectedYear}_${selectedMonth}`;
                  const isEmpLocked = Boolean(locks[empKey]?.isLocked);
                  return (
                    <option key={emp.id} value={emp.id}>
                      {isEmpLocked ? '🔒 [KUNCI] ' : '🔓 [BUKA] '}
                      {emp.namaLengkap} ({emp.nik}) - {emp.company.includes('Pustaka') ? 'PU' : 'SSS'} · {emp.jabatan}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Month & Year Cutoff Selector (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Kitaran Cut-Off (26hb - 25hb):</span>
              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">Standard Payroll</span>
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setEditingDate(null);
                }}
                className="flex-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {MONTH_NAMES_MS.map((name, idx) => (
                  <option key={name} value={idx + 1}>{name}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setEditingDate(null);
                }}
                className="w-24 text-xs font-semibold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {AVAILABLE_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Company Quick Filter (3 cols) */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Tapis Entiti Syarikat:
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Semua Syarikat (19 Pekerja)</option>
              <option value="Pustaka Union">Pustaka Union (16 Pekerja)</option>
              <option value="Solusi Serumpun Senusantara SDN. BHD">Solusi Serumpun (3 Pekerja)</option>
            </select>
          </div>

        </div>

        {/* Date Range Badge */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span className="text-slate-600 dark:text-slate-400">Tempoh Kitaran Semakan:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-lg border border-sky-200 dark:border-sky-900">
              {cutOff.startDate} (26hb {cutOff.prevMonthName}) — {cutOff.endDate} (25hb {cutOff.currMonthName} {selectedYear})
            </span>
          </div>

          <div className="text-slate-500 text-xs font-medium">
            Jumlah Hari Kalendar: <strong>{dailyRows.length} hari</strong> ({stats.totalWorkingDays} Hari Bekerja)
          </div>
        </div>
      </div>

      {/* LOCK / UNLOCK STATUS HERO CARD */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isPeriodLocked 
          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
          : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isPeriodLocked
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {isPeriodLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md ${
                  isPeriodLocked 
                    ? 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200' 
                    : 'bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                }`}>
                  {isPeriodLocked ? 'STATUS: REKOD DIKUNCI (LOCKED)' : 'STATUS: TERBUKA UNTUK SUNTINGAN (UNLOCKED)'}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {currentEmployee?.namaLengkap} ({currentEmployee?.nik})
                </span>
              </div>

              {isPeriodLocked ? (
                <div className="mt-1">
                  <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                    Rekod kehadiran sebulan penuh pekerja ini telah <strong>DIKUNCI</strong> oleh <strong>{currentLockInfo?.lockedBy}</strong> pada <strong>{currentLockInfo?.lockedAt}</strong>.
                  </p>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70 mt-0.5">
                    Nota Pengesahan HR: &quot;{currentLockInfo?.notes || 'Tiada sebarang isu alpa. Sedia untuk kiraan gaji.'}&quot;
                  </p>
                </div>
              ) : (
                <div className="mt-1">
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                    Rekod masih dalam semakan. HR berhak menyunting jam masuk/keluar, menambah hari bekerja, atau melaraskan OT.
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 mt-0.5">
                    Sila tekan butang <strong>&quot;Kunci Rekod (Lock)&quot;</strong> setelah berpuas hati agar pekerja tidak boleh menukar log kehadiran.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lock / Unlock Toggle Button */}
          <div className="shrink-0 flex items-center gap-2">
            {isPeriodLocked ? (
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs transition-colors"
                title="Buka kunci rekod untuk membuat pembetulan kecemasan"
              >
                <Unlock className="w-4 h-4 text-amber-600" />
                <span>BUKA KUNCI (UNLOCK)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLockModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                title="Kunci rekod absensi pekerja ini bagi kitaran 26hb-25hb"
              >
                <Lock className="w-4 h-4" />
                <span>KUNCI REKOD SEBULAN (LOCK)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* METRIC CARDS FOR SELECTED EMPLOYEE */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] text-slate-500 font-medium">Hadir Tepat Masa</p>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{stats.daysPresent} hari</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Punch tepat waktu</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] text-slate-500 font-medium">Hadir Lewat</p>
          <p className="text-xl font-bold font-mono text-amber-600 mt-1">{stats.daysLate} hari</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Selepas 08:30 pagi</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] text-slate-500 font-medium">Cuti Diluluskan</p>
          <p className="text-xl font-bold font-mono text-indigo-600 mt-1">{stats.daysLeave + stats.daysMc} hari</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Tahunan &amp; MC Sah</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] text-slate-500 font-medium">Hari Rehat &amp; Cuti Am</p>
          <p className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-1">{stats.daysOff + stats.daysHoliday} hari</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Hujung minggu &amp; Warta</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] text-slate-500 font-medium">Jumlah Jam Biasa</p>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">{stats.totalWorkHours}j</p>
          <p className="text-[10px] text-slate-400 mt-0.5">8 jam/hari standard</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] text-slate-500 font-medium">Jumlah Jam OT</p>
          <p className="text-xl font-bold font-mono text-rose-600 mt-1">{stats.totalOtHours}j</p>
          <p className="text-[10px] text-rose-500 mt-0.5">Tuntutan Lebih Masa</p>
        </div>
      </div>

      {/* FULL MONTHLY ATTENDANCE TABLE (ALL 30/31 DAYS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Jadual Kehadiran Harian Lengkap (26hb {cutOff.prevMonthName} — 25hb {cutOff.currMonthName})</span>
              {isPeriodLocked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Lock className="w-3 h-3" /> Dikunci
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Setiap baris memaparkan Masuk (P1), Rehat (P2/P3), Pulang (P4), Jam Kerja, Jam OT dan Catatan rasmi.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            {dailyRows.length} rekod hari penuh
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3.5">Tarikh &amp; Hari</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Masuk (P1)</th>
                <th className="py-3 px-3">Rehat 1j (P2 &amp; P3)</th>
                <th className="py-3 px-3">Pulang (P4)</th>
                <th className="py-3 px-2.5 text-center">Jam Kerja</th>
                <th className="py-3 px-2.5 text-center">Jam OT</th>
                <th className="py-3 px-3">Lokasi</th>
                <th className="py-3 px-3">Catatan / Semakan</th>
                <th className="py-3 px-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dailyRows.map(row => {
                const isEditingThisRow = editingDate === row.date;
                const isWeekend = row.isWeekend;

                return (
                  <tr 
                    key={row.date}
                    className={`transition-colors ${
                      isEditingThisRow
                        ? 'bg-sky-50/80 dark:bg-sky-950/40'
                        : isWeekend
                        ? 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Tarikh & Hari */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                          {row.date}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isWeekend 
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' 
                            : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {row.dayName}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isEditingThisRow ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                          className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 font-bold"
                        >
                          <option value="Hadir">Hadir</option>
                          <option value="Lewat">Lewat</option>
                          <option value="Bercuti">Bercuti</option>
                          <option value="Sakit (MC)">Sakit (MC)</option>
                          <option value="Hari Rehat (Off)">Hari Rehat (Off)</option>
                          <option value="Cuti Am">Cuti Am</option>
                          <option value="Alpa">Alpa</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          row.status === 'Hadir'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : row.status === 'Lewat'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : row.status === 'Bercuti' || row.status === 'Sakit (MC)'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : row.status === 'Cuti Am'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : row.status === 'Hari Rehat (Off)'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}>
                          {row.status}
                        </span>
                      )}
                    </td>

                    {/* Masuk (P1) */}
                    <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                      {isEditingThisRow ? (
                        <input
                          type="text"
                          value={editJamMasuk}
                          onChange={(e) => setEditJamMasuk(e.target.value)}
                          className="w-20 px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono font-bold"
                          placeholder="08:30:00"
                        />
                      ) : (
                        <span className={row.jamMasuk !== '-' ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-400'}>
                          {row.jamMasuk}
                        </span>
                      )}
                    </td>

                    {/* Rehat 1j (P2 & P3) */}
                    <td className="py-3 px-3 font-mono text-[11px] tabular-nums whitespace-nowrap">
                      {isEditingThisRow ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editJamKeluarRehat}
                            onChange={(e) => setEditJamKeluarRehat(e.target.value)}
                            className="w-16 px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[10px]"
                            placeholder="Mula"
                          />
                          <span>-</span>
                          <input
                            type="text"
                            value={editJamMasukRehat}
                            onChange={(e) => setEditJamMasukRehat(e.target.value)}
                            className="w-16 px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[10px]"
                            placeholder="Tamat"
                          />
                        </div>
                      ) : row.jamKeluarRehat ? (
                        <span className="text-slate-600 dark:text-slate-300">
                          {row.jamKeluarRehat} - {row.jamMasukRehat || '-'}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Pulang (P4) */}
                    <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                      {isEditingThisRow ? (
                        <input
                          type="text"
                          value={editJamKeluar}
                          onChange={(e) => setEditJamKeluar(e.target.value)}
                          className="w-20 px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono"
                          placeholder="17:30:00"
                        />
                      ) : (
                        <span className={row.jamKeluar !== '-' ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}>
                          {row.jamKeluar || '-'}
                        </span>
                      )}
                    </td>

                    {/* Jam Biasa */}
                    <td className="py-3 px-2.5 text-center font-mono font-bold tabular-nums">
                      {isEditingThisRow ? (
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="12"
                          value={editWorkHours}
                          onChange={(e) => setEditWorkHours(Number(e.target.value))}
                          className="w-14 px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-center"
                        />
                      ) : (
                        <span className={row.workHours > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                          {row.workHours > 0 ? `${row.workHours}j` : '-'}
                        </span>
                      )}
                    </td>

                    {/* Jam OT */}
                    <td className="py-3 px-2.5 text-center font-mono font-bold tabular-nums">
                      {isEditingThisRow ? (
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="8"
                          value={editOtHours}
                          onChange={(e) => setEditOtHours(Number(e.target.value))}
                          className="w-14 px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-center text-rose-600"
                        />
                      ) : (
                        <span className={row.otHours > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                          {row.otHours > 0 ? `${row.otHours}j` : '-'}
                        </span>
                      )}
                    </td>

                    {/* Lokasi */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                      {isEditingThisRow ? (
                        <input
                          type="text"
                          value={editLokasi}
                          onChange={(e) => setEditLokasi(e.target.value)}
                          className="w-28 px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[11px]"
                        />
                      ) : (
                        <span title={row.lokasi}>{row.lokasi}</span>
                      )}
                    </td>

                    {/* Catatan */}
                    <td className="py-3 px-3 text-slate-500 max-w-[160px] truncate">
                      {isEditingThisRow ? (
                        <input
                          type="text"
                          value={editCatatan}
                          onChange={(e) => setEditCatatan(e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs"
                          placeholder="Nota semakan / audit..."
                        />
                      ) : (
                        <span title={row.catatan}>{row.catatan || '-'}</span>
                      )}
                    </td>

                    {/* Tindakan (Edit / Save / Lock Badge) */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      {isEditingThisRow ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(row)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs"
                          >
                            Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDate(null)}
                            className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {isPeriodLocked ? (
                            <span 
                              className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1 cursor-not-allowed"
                              title="Bulan ini telah dikunci oleh HRD"
                            >
                              <Lock className="w-3 h-3 text-emerald-600" />
                              <span>Dikunci</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEditRow(row)}
                              className="px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded border border-sky-200 dark:border-sky-900 transition-colors flex items-center gap-1"
                              title="Sunting kehadiran, jam kerja, atau OT hari ini"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sunting</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: KUNCI REKOD (LOCK CONFIRMATION) */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Kunci Rekod Absensi Bulanan (Lock)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pengesahan muktamad kehadiran pekerja bagi kitaran penggajian rasmi 26hb - 25hb.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between font-semibold">
                <span>Pekerja:</span>
                <span className="text-slate-900 dark:text-white">{currentEmployee.namaLengkap} ({currentEmployee.nik})</span>
              </div>
              <div className="flex justify-between">
                <span>Tempoh Kitaran:</span>
                <span className="font-mono">{cutOff.startDate} s/d {cutOff.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Jumlah Hari Bekerja:</span>
                <span className="font-bold text-emerald-600">{stats.totalWorkingDays} hari</span>
              </div>
              <div className="flex justify-between">
                <span>Tuntutan OT:</span>
                <span className="font-bold text-rose-600">{stats.totalOtHours} jam</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nota Pengesahan / Catatan HR Lead:
              </label>
              <textarea
                value={lockNotesInput}
                onChange={(e) => setLockNotesInput(e.target.value)}
                rows={2}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Cth: Semakan kehadiran lengkap 100% tiada alpa. Diluluskan untuk pemprosesan slip gaji..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLock}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sahkan &amp; Kunci Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BUKA KUNCI (UNLOCK CONFIRMATION) */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Buka Kunci Rekod Absensi (Unlock)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Membuka kunci membolehkan pindaan semula jam kehadiran sebelum gaji diproses.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-200">
              Perhatian: Hanya HR Lead (Siti Fatimah / Cheah Leong Tim) yang diberi kuasa membuka semula rekod absensi yang telah disahkan.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sebab Pembukaan Kunci:
              </label>
              <input
                type="text"
                value={unlockReasonInput}
                onChange={(e) => setUnlockReasonInput(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Cth: Pembetulan tuntutan lebih masa (OT) hari Jumaat..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Buka Kunci Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

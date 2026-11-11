import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Check, 
  X, 
  Filter, 
  Download, 
  FileText, 
  CalendarCheck,
  Building2,
  Home,
  Briefcase,
  Paperclip,
  Eye,
  FileCheck,
  Trash2,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Coffee,
  Utensils,
  Timer,
  PlayCircle,
  PauseCircle,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  LeaveType, 
  AttendanceStatus, 
  WorkLocation, 
  Department,
  CompanyName,
  LeaveAttachment
} from '../types/hr';
import { formatDateIndo, formatDateTimeIndo } from '../utils/formatters';
import { 
  exportLeaveRequestsCSV, 
  exportSocsoContributionCSV,
  getCutOffDateRange,
  isSuperAttendanceEditor,
  MONTH_NAMES_MS,
  AVAILABLE_YEARS
} from '../utils/statutoryCalculations';
import { MonthlyAttendanceReview } from './MonthlyAttendanceReview';

interface AttendanceAndLeaveProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  activeUser: Employee;
  onClockIn: (record: AttendanceRecord) => void;
  onBreakOut?: (employeeId: string, jamKeluarRehat: string) => void;
  onBreakIn?: (employeeId: string, jamMasukRehat: string) => void;
  onClockOut: (employeeId: string, jamKeluar: string, otHours: number) => void;
  onUpdateAttendanceRecord?: (record: AttendanceRecord) => void;
  onSubmitLeaveRequest: (newRequest: LeaveRequest) => void;
  onApproveLeave: (id: string, notes?: string) => void;
  onRejectLeave: (id: string, notes?: string) => void;
  onApproveOvertime?: (recordId: string) => void;
  onRemoveOvertime?: (recordId: string) => void;
  initialSubTab?: 'absensi' | 'cuti' | 'semakanBulanan';
  currentLang?: 'ms' | 'en';
}

const LEAVE_TYPES: LeaveType[] = [
  'Cuti Tahunan (Annual Leave)',
  'Cuti Sakit (Medical Leave / MC)',
  'Cuti Kecemasan (Emergency Leave)',
  'Cuti Tanpa Gaji (Unpaid Leave)',
  'Cuti Bersalin (Maternity Leave)',
  'Cuti Khas / Ihsan',
];

export const AttendanceAndLeave: React.FC<AttendanceAndLeaveProps> = ({
  employees,
  attendanceRecords,
  leaveRequests,
  activeUser,
  onClockIn,
  onBreakOut,
  onBreakIn,
  onClockOut,
  onUpdateAttendanceRecord,
  onSubmitLeaveRequest,
  onApproveLeave,
  onRejectLeave,
  onApproveOvertime,
  onRemoveOvertime,
  initialSubTab = 'absensi',
  currentLang = 'ms',
}) => {
  const isManagerOrHR = activeUser.role === 'HRD' || activeUser.role === 'Director';
  const isSuperEditor = isSuperAttendanceEditor(activeUser);
  const canEditAllAttendance = isManagerOrHR || isSuperEditor;

  const [activeSubTab, setActiveSubTab] = useState<'absensi' | 'cuti' | 'semakanBulanan'>(initialSubTab);

  // Cut-off period selection (26th prev month to 25th curr month)
  const [filterPeriodYear, setFilterPeriodYear] = useState<number>(2025);
  const [filterPeriodMonth, setFilterPeriodMonth] = useState<number>(5);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'cutoff' | 'singleDate'>('cutoff');

  const cutOff = useMemo(() => {
    return getCutOffDateRange(filterPeriodYear, filterPeriodMonth);
  }, [filterPeriodYear, filterPeriodMonth]);

  // Inline editing state for attendance
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [editClockIn, setEditClockIn] = useState<string>('08:30');
  const [editClockOut, setEditClockOut] = useState<string>('17:30');
  const [editWorkHours, setEditWorkHours] = useState<number>(8.0);
  const [editOtHours, setEditOtHours] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('Hadir');
  const [editCatatan, setEditCatatan] = useState<string>('');

  // Manual Attendance Entry Modal State (For employees who forgot to clock in)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualRecordForm, setManualRecordForm] = useState({
    employeeId: employees[0]?.id || activeUser.id,
    tanggal: '2025-05-12',
    jamMasuk: '08:30:00',
    jamKeluar: '17:30:00',
    workHours: 8.0,
    otHours: 0.0,
    status: 'Hadir' as AttendanceStatus,
    lokasi: 'Ibu Pejabat Pustaka Union (KL)' as WorkLocation,
    catatan: 'Kakitangan terlupa clock-in terminal pagi, disahkan oleh Pengurusan'
  });

  // Live Clock
  const [liveClock, setLiveClock] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveClock(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' MYT'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- SUBTAB 1: ABSENSI ---
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation>(
    activeUser.isRemoteOutsideMalaysia ? 'Luar Negara (Remote International)' : 'Ibu Pejabat Pustaka Union (KL)'
  );
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [otHoursInput, setOtHoursInput] = useState<number>(0);
  const [filterAttendanceCompany, setFilterAttendanceCompany] = useState<string>('all');
  const [filterAttendanceDate, setFilterAttendanceDate] = useState<string>('2025-05-12');

  // Check if active user already clocked in for selected date
  const userTodayAttendance = useMemo(() => {
    return attendanceRecords.find(
      r => r.employeeId === activeUser.id && r.tanggal === filterAttendanceDate
    );
  }, [attendanceRecords, activeUser.id, filterAttendanceDate]);

  const handleRecordClockIn = () => {
    const now = new Date();
    const jamMasuk = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isLate = (currentHour > 8) || (currentHour === 8 && currentMinute > 30);

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: activeUser.id,
      employeeName: activeUser.namaLengkap,
      company: activeUser.company,
      nik: activeUser.nik,
      departemen: activeUser.departemen,
      tanggal: filterAttendanceDate,
      jamMasuk: jamMasuk,
      jamKeluar: null,
      status: isLate ? 'Lewat' : 'Hadir',
      workHours: 8.0,
      lokasi: selectedLocation,
      koordinat: activeUser.isRemoteOutsideMalaysia ? '-6.3728, 106.8331' : '3.1390, 101.6869',
      jarakMeter: activeUser.isRemoteOutsideMalaysia ? 0 : 12,
      otHours: 0,
      catatan: attendanceNotes || (activeUser.isRemoteOutsideMalaysia ? 'Clock-in Remote Luar Negara Sah' : 'Presensi Pejabat Disahkan')
    };

    onClockIn(newRecord);
    setAttendanceNotes('');
  };

  const handleRecordBreakOut = () => {
    const now = new Date();
    const jamKeluarRehat = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (onBreakOut) {
      onBreakOut(activeUser.id, jamKeluarRehat);
    } else if (onUpdateAttendanceRecord && userTodayAttendance) {
      onUpdateAttendanceRecord({
        ...userTodayAttendance,
        jamKeluarRehat,
        isOnBreak: true,
        catatan: (userTodayAttendance.catatan ? userTodayAttendance.catatan + ' · ' : '') + `Mula Rehat: ${jamKeluarRehat}`
      });
    }
  };

  const handleRecordBreakIn = () => {
    const now = new Date();
    const jamMasukRehat = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (onBreakIn) {
      onBreakIn(activeUser.id, jamMasukRehat);
    } else if (onUpdateAttendanceRecord && userTodayAttendance) {
      onUpdateAttendanceRecord({
        ...userTodayAttendance,
        jamMasukRehat,
        isOnBreak: false,
        breakDurationMinutes: 60,
        catatan: (userTodayAttendance.catatan ? userTodayAttendance.catatan + ' · ' : '') + `Tamat Rehat: ${jamMasukRehat}`
      });
    }
  };

  const handleRecordClockOut = () => {
    const now = new Date();
    const jamKeluar = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    onClockOut(activeUser.id, jamKeluar, otHoursInput);
  };

  // Live Break Tracker: Staff currently taking their 1-hour break
  const staffCurrentlyOnBreak = useMemo(() => {
    return attendanceRecords.filter(r => r.tanggal === filterAttendanceDate && r.isOnBreak === true);
  }, [attendanceRecords, filterAttendanceDate]);

  const handleSaveManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(emp => emp.id === manualRecordForm.employeeId);
    if (!targetEmp) return;

    const manualRecord: AttendanceRecord = {
      id: `att-manual-${Date.now()}`,
      employeeId: targetEmp.id,
      employeeName: targetEmp.namaLengkap,
      company: targetEmp.company,
      nik: targetEmp.nik,
      departemen: targetEmp.departemen,
      tanggal: manualRecordForm.tanggal,
      jamMasuk: manualRecordForm.jamMasuk,
      jamKeluar: manualRecordForm.jamKeluar,
      workHours: Number(manualRecordForm.workHours) || 8.0,
      otHours: Number(manualRecordForm.otHours) || 0,
      status: manualRecordForm.status,
      lokasi: manualRecordForm.lokasi,
      koordinat: '3.1390, 101.6869',
      jarakMeter: 10,
      catatan: manualRecordForm.catatan || 'Presensi manual disahkan oleh Pengurusan (staf terlupa absen)'
    };

    onClockIn(manualRecord);
    setIsManualModalOpen(false);
  };

  // Filter attendance records by permission: Super Editors & HR see all
  const accessibleAttendance = useMemo(() => {
    if (!canEditAllAttendance) {
      return attendanceRecords.filter(r => r.employeeId === activeUser.id);
    }
    return attendanceRecords;
  }, [attendanceRecords, canEditAllAttendance, activeUser.id]);

  const filteredAttendance = useMemo(() => {
    return accessibleAttendance.filter(r => {
      const matchCompany = filterAttendanceCompany === 'all' || r.company === filterAttendanceCompany;
      let matchDate = true;
      if (attendanceViewMode === 'cutoff') {
        matchDate = r.tanggal >= cutOff.startDate && r.tanggal <= cutOff.endDate;
      } else {
        matchDate = !filterAttendanceDate || r.tanggal === filterAttendanceDate;
      }
      return matchCompany && matchDate;
    });
  }, [accessibleAttendance, filterAttendanceCompany, attendanceViewMode, filterAttendanceDate, cutOff.startDate, cutOff.endDate]);

  // --- SUBTAB 2: CUTI & LAMPIRAN DOKUMEN ---
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [filterLeaveStatus, setFilterLeaveStatus] = useState<string>('all');
  const [viewingAttachmentModal, setViewingAttachmentModal] = useState<LeaveRequest | null>(null);

  // Leave Form State with Attachment
  const [leaveFormData, setLeaveFormData] = useState({
    employeeId: activeUser.id,
    tipeCuti: 'Cuti Tahunan (Annual Leave)' as LeaveType,
    isHalfDay: false,
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date().toISOString().split('T')[0],
    alasan: '',
    attachment: null as LeaveAttachment | null,
  });

  const leaveFileInputRef = useRef<HTMLInputElement>(null);

  // Calculate duration days
  const computedDuration = useMemo(() => {
    if (leaveFormData.isHalfDay) return 0.5;
    try {
      const d1 = new Date(leaveFormData.tanggalMulai);
      const d2 = new Date(leaveFormData.tanggalSelesai);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  }, [leaveFormData.tanggalMulai, leaveFormData.tanggalSelesai, leaveFormData.isHalfDay]);

  // File upload handler for Leave Request
  const handleLeaveFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Saiz fail melebihi had 5MB. Sila muat naik fail yang lebih kecil.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLeaveFormData(prev => ({
        ...prev,
        attachment: {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result as string
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setLeaveFormData(prev => ({ ...prev, attachment: null }));
    if (leaveFileInputRef.current) {
      leaveFileInputRef.current.value = '';
    }
  };

  const handleSaveLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFormData.alasan) {
      alert('Sila nyatakan alasan permohonan cuti.');
      return;
    }

    const applicant = employees.find(e => e.id === leaveFormData.employeeId) || activeUser;

    // Check quota
    if (leaveFormData.tipeCuti.includes('Tahunan')) {
      const remaining = applicant.leaveBalances.annualQuota - applicant.leaveBalances.annualUsed;
      if (computedDuration > remaining) {
        alert(`Baki cuti tahunan tidak mencukupi. Baki semasa: ${remaining} hari, permohonan: ${computedDuration} hari.`);
        return;
      }
    }

    const newReq: LeaveRequest = {
      id: `cuti-${Date.now()}`,
      employeeId: applicant.id,
      employeeName: applicant.namaLengkap,
      company: applicant.company,
      jabatan: applicant.jabatan,
      departemen: applicant.departemen,
      avatarUrl: applicant.avatarUrl,
      tipeCuti: leaveFormData.tipeCuti,
      isHalfDay: leaveFormData.isHalfDay,
      tanggalMulai: leaveFormData.tanggalMulai,
      tanggalSelesai: leaveFormData.isHalfDay ? leaveFormData.tanggalMulai : leaveFormData.tanggalSelesai,
      durasiHari: computedDuration,
      alasan: leaveFormData.alasan,
      attachment: leaveFormData.attachment || undefined,
      status: 'Menunggu Kelulusan',
      diajukanPada: new Date().toISOString().replace('T', ' ').slice(0, 16),
      approverNama: 'SITI FATIMAH BINTI HARON',
    };

    onSubmitLeaveRequest(newReq);
    setIsLeaveModalOpen(false);
    setLeaveFormData({
      employeeId: activeUser.id,
      tipeCuti: 'Cuti Tahunan (Annual Leave)',
      isHalfDay: false,
      tanggalMulai: new Date().toISOString().split('T')[0],
      tanggalSelesai: new Date().toISOString().split('T')[0],
      alasan: '',
      attachment: null,
    });
  };

  // Filter leave requests according to permissions
  const accessibleLeaves = useMemo(() => {
    if (!isManagerOrHR) {
      return leaveRequests.filter(l => l.employeeId === activeUser.id);
    }
    return leaveRequests;
  }, [leaveRequests, isManagerOrHR, activeUser.id]);

  const filteredLeaves = useMemo(() => {
    return accessibleLeaves.filter(req => {
      if (filterLeaveStatus === 'all') return true;
      return req.status === filterLeaveStatus;
    });
  }, [accessibleLeaves, filterLeaveStatus]);

  return (
    <div className="space-y-6 pb-12">
      {/* Subtab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kehadiran & Pengurusan Cuti
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Perekodan jam masuk/keluar, kiraan OT, serta permohonan cuti masa-nyata berlampiran dokumen MC.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveSubTab('absensi')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'absensi'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Presensi &amp; Kehadiran</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('cuti')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeSubTab === 'cuti'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Permohonan Cuti</span>
            {leaveRequests.filter(l => l.status === 'Menunggu Kelulusan').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {leaveRequests.filter(l => l.status === 'Menunggu Kelulusan').length}
              </span>
            )}
          </button>

          {canEditAllAttendance && (
            <button
              onClick={() => setActiveSubTab('semakanBulanan')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeSubTab === 'semakanBulanan'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-sky-700 dark:text-sky-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Semakan Sebulan (26-25) &amp; Kunci</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PRESENSI & KEHADIRAN */}
      {/* ========================================================================= */}
      {activeSubTab === 'absensi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Clock-In Widget Card (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Terminal Presensi Pekerja ({activeUser.namaLengkap})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeUser.company} · {activeUser.isRemoteOutsideMalaysia ? 'Mod Remote Antarabangsa' : 'Mod Pejabat Tempatan'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Waktu Semasa (Kuala Lumpur)</p>
                    <p className="text-lg font-bold font-mono tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {liveClock || '08:00:00 MYT'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Lokasi Tugasan Semasa:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedLocation('Ibu Pejabat Pustaka Union (KL)')}
                        className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                          selectedLocation.includes('Pustaka Union')
                            ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Pejabat Pustaka Union (KL)
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedLocation('Pejabat Solusi Serumpun Senusantara (KL)')}
                        className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                          selectedLocation.includes('Solusi Serumpun')
                            ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Pejabat Serumpun (KL)
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedLocation('Luar Negara (Remote International)')}
                        className={`p-2.5 rounded-lg border text-left font-medium transition-all ${
                          selectedLocation.includes('Luar Negara')
                            ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Remote Antarabangsa (IDN)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <span>Geolokasi GPS: <strong>Sah & Disahkan</strong></span>
                    </div>
                    <span className="text-emerald-600 font-medium">Radius &lt; 20m ✓</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Nota tugasan harian (cth: Semakan pruf buku sejarah)..."
                    value={attendanceNotes}
                    onChange={(e) => setAttendanceNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* 4-Step Action Punch Terminal (Maks 4x, 2 In + 2 Out, atau 2x Flexi) */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {userTodayAttendance ? (
                  <div className="space-y-3">
                    {/* Status Info Box */}
                    <div className="p-3 bg-sky-50 dark:bg-slate-800 rounded-xl border border-sky-100 dark:border-slate-700 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Punch 1 (Masuk Pagi): <strong>{userTodayAttendance.jamMasuk}</strong>
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                          {userTodayAttendance.status}
                        </span>
                      </div>

                      {/* Punch 2 & 3 info */}
                      {(userTodayAttendance.jamKeluarRehat || userTodayAttendance.isOnBreak) && (
                        <div className="text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                          <span>
                            Punch 2 (Mula Rehat 1j): <strong>{userTodayAttendance.jamKeluarRehat || '-'}</strong>
                          </span>
                          <span>
                            Punch 3 (Masuk Rehat): <strong>{userTodayAttendance.jamMasukRehat || (userTodayAttendance.isOnBreak ? 'Sedang Rehat...' : '-')}</strong>
                          </span>
                        </div>
                      )}

                      {/* Punch 4 info */}
                      {userTodayAttendance.jamKeluar && (
                        <div className="text-emerald-700 dark:text-emerald-300 font-semibold pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <span>Punch 4 (Pulang): {userTodayAttendance.jamKeluar}</span>
                          <span>OT: {userTodayAttendance.otHours} jam</span>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Punch Controls */}
                    {!userTodayAttendance.jamKeluar && (
                      <div className="space-y-2">
                        {/* CASE 1: Belum Rehat (Pilihan Rehat 1j ATAU Pulang Terus jika 2 Punches) */}
                        {!userTodayAttendance.jamKeluarRehat && !userTodayAttendance.isOnBreak && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={handleRecordBreakOut}
                              className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                            >
                              <Coffee className="w-4 h-4" />
                              <span>MULA REHAT 1 JAM (PUNCH 2)</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleRecordClockOut}
                              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                              title="Pilihan 2 Punches (1x In, 1x Out jika tidak rekod rehat)"
                            >
                              <Clock className="w-4 h-4 text-rose-400" />
                              <span>CHECK OUT TERUS (2 PUNCHES)</span>
                            </button>
                          </div>
                        )}

                        {/* CASE 2: Sedang Rehat 1 Jam (isOnBreak) */}
                        {userTodayAttendance.isOnBreak && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
                              <span className="font-semibold flex items-center gap-1.5">
                                <Coffee className="w-4 h-4 text-amber-600 animate-pulse" />
                                Anda Sedang Menikmati Rehat Makan Tengah Hari (1 Jam)
                              </span>
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                                Mula: {userTodayAttendance.jamKeluarRehat}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleRecordBreakIn}
                              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                            >
                              <PlayCircle className="w-4 h-4" />
                              <span>TAMAT REHAT &amp; MASUK BERTUGAS (PUNCH 3)</span>
                            </button>
                          </div>
                        )}

                        {/* CASE 3: Sudah Tamat Rehat, Bersedia Clock Out Pulang (Punch 4) */}
                        {userTodayAttendance.jamMasukRehat && !userTodayAttendance.isOnBreak && (
                          <div className="flex items-center gap-3 pt-1">
                            <div className="flex items-center gap-2 text-xs">
                              <label className="text-slate-500 font-medium">Jam OT:</label>
                              <input
                                type="number"
                                min="0"
                                max="8"
                                step="0.5"
                                value={otHoursInput}
                                onChange={(e) => setOtHoursInput(Number(e.target.value))}
                                className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-mono font-bold"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleRecordClockOut}
                              className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                            >
                              <Clock className="w-4 h-4 text-white" />
                              <span>CHECK OUT (PULANG BERTUGAS)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {userTodayAttendance.jamKeluar && (
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        ✓ Presensi Hari Ini Telah Lengkap Direkodkan. Selamat Berehat!
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleRecordClockIn}
                    className="w-full py-3.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>CHECK IN (MASUK KERJA BERTUGAS)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Attendance Status Summary (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-xl border border-sky-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                  Ringkasan Hadir Hari Ini ({formatDateIndo(filterAttendanceDate)})
                </h2>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Hadir Tepat Masa</p>
                    <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                      {filteredAttendance.filter(a => a.status === 'Hadir').length}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Sedang Rehat</p>
                    <p className="text-2xl font-bold font-mono text-amber-600 mt-1">
                      {staffCurrentlyOnBreak.length}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-sky-50/50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1 text-slate-500">
                  <p>• Pustaka Union: 16 Pekerja</p>
                  <p>• Solusi Serumpun Senusantara SDN. BHD: 3 Pekerja</p>
                  <p>• Sistem 4 Punches: Masuk → Rehat 1j → Tamat Rehat → Pulang</p>
                  <p>• Pilihan 2 Punches: Masuk → Pulang Terus juga disokong</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
                <span>Kadar Ketepatan Masa:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">94.8%</span>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* LIVE BREAK TRACKER: HR BISA CEK SIAPA YG LG REHAT */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/40 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Coffee className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Pemantau Rehat Masa-Nyata (Live Break Tracker)</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {staffCurrentlyOnBreak.length} Kakitangan Sedang Rehat
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    HR &amp; Pengurusan boleh menyemak secara langsung kakitangan yang sedang mengambil rehat (Maks 1 Jam mengikut Seksyen 60A Akta Kerja 1955).
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-400">
                Tarikh: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{filterAttendanceDate}</span>
              </div>
            </div>

            {/* List of staff on break */}
            <div className="mt-4">
              {staffCurrentlyOnBreak.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {staffCurrentlyOnBreak.map(rec => (
                    <div 
                      key={rec.id}
                      className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-amber-100 dark:border-amber-900/40">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{rec.employeeName}</p>
                            <p className="text-[10px] text-slate-500">{rec.company} · {rec.departemen}</p>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" title="Sedang Rehat" />
                        </div>

                        <div className="mt-2.5 space-y-1 text-xs">
                          <p className="text-slate-600 dark:text-slate-300 flex items-center justify-between">
                            <span>Masa Mula Rehat:</span>
                            <strong className="font-mono text-amber-700 dark:text-amber-300">{rec.jamKeluarRehat}</strong>
                          </p>
                          <p className="text-slate-600 dark:text-slate-300 flex items-center justify-between">
                            <span>Had Akta Kerja:</span>
                            <span className="font-medium text-slate-500">Maksimum 60 minit</span>
                          </p>
                        </div>
                      </div>

                      {/* Manual Action by HR */}
                      {canEditAllAttendance && (
                        <div className="mt-3 pt-2 border-t border-amber-100 dark:border-amber-900/40 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              const jamMasukRehat = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                              if (onUpdateAttendanceRecord) {
                                onUpdateAttendanceRecord({
                                  ...rec,
                                  jamMasukRehat,
                                  isOnBreak: false,
                                  breakDurationMinutes: 60,
                                  catatan: (rec.catatan ? rec.catatan + ' · ' : '') + `Rehat ditamatkan manual oleh HR: ${jamMasukRehat}`
                                });
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors flex items-center gap-1"
                          >
                            <PlayCircle className="w-3 h-3" />
                            <span>Tamatkan Rehat Manual</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Coffee className="w-6 h-6 text-slate-300 mx-auto mb-1.5 opacity-60" />
                  <p className="font-medium text-slate-600 dark:text-slate-300">Tiada Kakitangan Sedang Rehat Pada Waktu Ini</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Semua kakitangan sedang bertugas di meja dan kaunter operasi.</p>
                </div>
              )}
            </div>
          </div>

          {/* Table of Attendance with Cut-Off Filter & Super Editor Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* Super-Editor Banner if active */}
            {canEditAllAttendance && (
              <div className="px-4 py-2.5 bg-indigo-50/70 dark:bg-indigo-950/60 border-b border-indigo-100 dark:border-indigo-900 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Akses Editor Absensi Aktif:</strong> Ananda Istiqomah, Cheah Leong Tim, & Siti Fatimah berhak menyunting kehadiran & menambah staf yang terlupa absen.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Rekod Terlupa Absen</span>
                </button>
              </div>
            )}

            {/* Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                
                {/* View Scope Toggle */}
                <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setAttendanceViewMode('cutoff')}
                    className={`px-3 py-1 font-semibold rounded-md transition-all ${
                      attendanceViewMode === 'cutoff'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Periode Cut-Off (26hb - 25hb)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceViewMode('singleDate')}
                    className={`px-3 py-1 font-semibold rounded-md transition-all ${
                      attendanceViewMode === 'singleDate'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tarikh Tunggal
                  </button>
                </div>

                {/* If Cutoff Mode: Month & Year Selector */}
                {attendanceViewMode === 'cutoff' ? (
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={filterPeriodMonth}
                      onChange={(e) => setFilterPeriodMonth(Number(e.target.value))}
                      className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                    >
                      {MONTH_NAMES_MS.map((name, idx) => (
                        <option key={name} value={idx + 1}>{name}</option>
                      ))}
                    </select>

                    <select
                      value={filterPeriodYear}
                      onChange={(e) => setFilterPeriodYear(Number(e.target.value))}
                      className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono"
                    >
                      {AVAILABLE_YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded">
                      {cutOff.startDate} s/d {cutOff.endDate}
                    </span>
                  </div>
                ) : (
                  /* Single Date Input */
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <input
                      type="date"
                      value={filterAttendanceDate}
                      onChange={(e) => setFilterAttendanceDate(e.target.value)}
                      className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>
                )}

                {/* Company Filter */}
                {canEditAllAttendance && (
                  <select
                    value={filterAttendanceCompany}
                    onChange={(e) => setFilterAttendanceCompany(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium"
                  >
                    <option value="all">Semua Syarikat</option>
                    <option value="Pustaka Union">Pustaka Union</option>
                    <option value="Solusi Serumpun Senusantara SDN. BHD">Solusi Serumpun Senusantara</option>
                  </select>
                )}
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Menampilkan <strong>{filteredAttendance.length}</strong> rekod
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-4">Pekerja & Syarikat</th>
                    <th className="py-3 px-4">Tarikh</th>
                    <th className="py-3 px-4">Masuk (P1)</th>
                    <th className="py-3 px-4">Rehat 1j (P2/P3)</th>
                    <th className="py-3 px-4">Pulang (P4)</th>
                    <th className="py-3 px-4">Jam Biasa</th>
                    <th className="py-3 px-4">Jam OT</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Catatan</th>
                    {canEditAllAttendance && <th className="py-3 px-4 text-right">Tindakan</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-500">
                        Tiada rekod presensi pada jangka masa ini.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((rec) => {
                      const isEditing = editingAttendanceId === rec.id;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          
                          {/* Employee Name & Company */}
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900 dark:text-white">{rec.employeeName}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{rec.company} · {rec.nik}</p>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {rec.tanggal}
                          </td>

                          {/* Clock In */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editClockIn}
                                onChange={(e) => setEditClockIn(e.target.value)}
                                className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono font-bold"
                              />
                            ) : (
                              rec.jamMasuk
                            )}
                          </td>

                          {/* Rehat 1j (P2 & P3) */}
                          <td className="py-3 px-4 font-mono text-[11px] tabular-nums">
                            {rec.isOnBreak ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                                <Coffee className="w-3 h-3 animate-pulse" />
                                Sedang Rehat ({rec.jamKeluarRehat})
                              </span>
                            ) : rec.jamKeluarRehat ? (
                              <div className="text-slate-600 dark:text-slate-300">
                                <span>{rec.jamKeluarRehat} - {rec.jamMasukRehat || '-'}</span>
                                {rec.breakDurationMinutes && <span className="text-[10px] text-slate-400 ml-1">({rec.breakDurationMinutes}m)</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Tiada (2 Punches)</span>
                            )}
                          </td>

                          {/* Clock Out */}
                          <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editClockOut}
                                onChange={(e) => setEditClockOut(e.target.value)}
                                className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono"
                              />
                            ) : (
                              rec.jamKeluar || '-'
                            )}
                          </td>

                          {/* Work Hours */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="12"
                                value={editWorkHours}
                                onChange={(e) => setEditWorkHours(Number(e.target.value))}
                                className="w-16 px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-center"
                              />
                            ) : (
                              `${rec.workHours || 8.0}j`
                            )}
                          </td>

                          {/* OT Hours */}
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="8"
                                value={editOtHours}
                                onChange={(e) => setEditOtHours(Number(e.target.value))}
                                className="w-14 px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-center"
                              />
                            ) : rec.otHours > 0 ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-amber-600 dark:text-amber-400">+{rec.otHours}j</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    rec.otStatus === 'Approved'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                      : rec.otStatus === 'Rejected'
                                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                                  }`}>
                                    {rec.otStatus === 'Approved' ? '✓ Diluluskan' : rec.otStatus === 'Rejected' ? '✕ Dihapus' : 'Menunggu'}
                                  </span>
                                </div>
                                {canEditAllAttendance && (
                                  <div className="flex items-center gap-1">
                                    {rec.otStatus !== 'Approved' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onApproveOvertime) {
                                            onApproveOvertime(rec.id);
                                          } else if (onUpdateAttendanceRecord) {
                                            onUpdateAttendanceRecord({
                                              ...rec,
                                              otStatus: 'Approved',
                                              otApprovedBy: activeUser.namaLengkap
                                            });
                                          }
                                        }}
                                        className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                                        title="Luluskan Jam Lembur (OT)"
                                      >
                                        ✓ Lulus
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onRemoveOvertime) {
                                          onRemoveOvertime(rec.id);
                                        } else if (onUpdateAttendanceRecord) {
                                          onUpdateAttendanceRecord({
                                            ...rec,
                                            otHours: 0,
                                            otStatus: 'Rejected',
                                            otApprovedBy: activeUser.namaLengkap
                                          });
                                        }
                                      }}
                                      className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-800 cursor-pointer"
                                      title="Hapus Jam Lembur (Set ke 0 jam)"
                                    >
                                      ✕ Hapus
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : rec.otStatus === 'Rejected' ? (
                              <span className="text-[10px] text-rose-500 font-semibold italic">OT Dihapus (0j)</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs font-semibold"
                              >
                                <option value="Hadir">Hadir</option>
                                <option value="Lewat">Lewat</option>
                                <option value="Bercuti">Bercuti</option>
                                <option value="Sakit (MC)">Sakit (MC)</option>
                                <option value="Alpa">Alpa</option>
                              </select>
                            ) : (
                              <span className={`font-semibold ${
                                rec.status === 'Hadir' 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : rec.status === 'Lewat' 
                                  ? 'text-amber-600 dark:text-amber-400' 
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {rec.status}
                              </span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="py-3 px-4 text-slate-500">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editCatatan}
                                onChange={(e) => setEditCatatan(e.target.value)}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs"
                                placeholder="Nota semakan / alasan terlupa absen"
                              />
                            ) : (
                              <span className="truncate max-w-[140px] block" title={rec.catatan}>
                                {rec.catatan || '-'}
                              </span>
                            )}
                          </td>

                          {/* Actions: Edit / Save / Cancel inline (Authorized for Ananda, Leong Tim, Siti Fatimah) */}
                          {canEditAllAttendance && (
                            <td className="py-3 px-4 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      rec.jamMasuk = editClockIn;
                                      rec.jamKeluar = editClockOut;
                                      rec.workHours = editWorkHours;
                                      rec.otHours = editOtHours;
                                      rec.status = editStatus;
                                      rec.catatan = editCatatan;
                                      if (onUpdateAttendanceRecord) {
                                        onUpdateAttendanceRecord({ ...rec });
                                      }
                                      setEditingAttendanceId(null);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingAttendanceId(null)}
                                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAttendanceId(rec.id);
                                    setEditClockIn(rec.jamMasuk);
                                    setEditClockOut(rec.jamKeluar || '17:30:00');
                                    setEditWorkHours(rec.workHours || 8.0);
                                    setEditOtHours(rec.otHours || 0);
                                    setEditStatus(rec.status);
                                    setEditCatatan(rec.catatan || '');
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded border border-indigo-200 dark:border-indigo-900 transition-colors"
                                >
                                  Sunting
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PERMOHONAN CUTI DENGAN LAMPIRAN DOKUMEN & KELULUSAN MASA-NYATA */}
      {/* ========================================================================= */}
      {activeSubTab === 'cuti' && (
        <div className="space-y-6">
          
          {/* Top Quota strip & Apply Button */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Baki Cuti Tahunan Saya</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-indigo-600 tabular-nums">
                    {activeUser.leaveBalances.annualQuota - activeUser.leaveBalances.annualUsed}
                  </span>
                  <span className="text-xs text-slate-500">/ {activeUser.leaveBalances.annualQuota} hari</span>
                </div>
              </div>

              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Mohon Cuti</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">Cuti Sakit / Perubatan (MC)</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-emerald-600 tabular-nums">
                  {activeUser.leaveBalances.medicalQuota - activeUser.leaveBalances.medicalUsed}
                </span>
                <span className="text-xs text-slate-500">/ {activeUser.leaveBalances.medicalQuota} hari</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Menunggu Kelulusan</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-amber-600 tabular-nums">
                    {leaveRequests.filter(l => l.status === 'Menunggu Kelulusan').length}
                  </span>
                  <span className="text-xs text-amber-600 font-semibold">permohonan</span>
                </div>
              </div>

              <button
                onClick={() => exportLeaveRequestsCSV(leaveRequests)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
                title="Muat turun fail CSV rekod cuti lengkap dengan lajur dokumen lampiran"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV Cuti</span>
              </button>
            </div>
          </div>

          {/* Leave Requests Cards */}
          <div className="space-y-3">
            {filteredLeaves.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                Tiada rekod permohonan cuti.
              </div>
            ) : (
              filteredLeaves.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        {req.employeeName}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {req.company} · {req.jabatan}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {req.tipeCuti}
                      </span>
                      {req.isHalfDay && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 rounded border border-amber-200">
                          0.5 Hari
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-3">
                      <span>
                        Tarikh:{' '}
                        <strong className="text-slate-900 dark:text-white">
                          {formatDateIndo(req.tanggalMulai)}
                        </strong>{' '}
                        {req.tanggalMulai !== req.tanggalSelesai && (
                          <>
                            hingga{' '}
                            <strong className="text-slate-900 dark:text-white">
                              {formatDateIndo(req.tanggalSelesai)}
                            </strong>
                          </>
                        )}{' '}
                        ({req.durasiHari} Hari)
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-400">Dimohon: {req.diajukanPada}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                      <strong>Alasan:</strong> {req.alasan}
                    </p>

                    {/* Dokumen Lampiran Button if present */}
                    {req.attachment && (
                      <div className="flex items-center gap-2 pt-1">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-xs">
                          {req.attachment.name} ({Math.round(req.attachment.size / 1024)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingAttachmentModal(req)}
                          className="px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 rounded border border-indigo-200 dark:border-indigo-900 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Lihat Sijil / Lampiran</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Real-time Approval Buttons (HR & Director only) */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Status Kelulusan</p>
                      <span className={`text-xs font-bold ${
                        req.status === 'Diluluskan'
                          ? 'text-emerald-600'
                          : req.status === 'Ditolak'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {isManagerOrHR && req.status === 'Menunggu Kelulusan' && (
                      <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => onApproveLeave(req.id, 'Diluluskan rasmi oleh Pengurus / HR')}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                          title="Luluskan Permohonan Cuti"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Luluskan</span>
                        </button>

                        <button
                          onClick={() => onRejectLeave(req.id, 'Permohonan ditolak')}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg"
                          title="Tolak Permohonan Cuti"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: SEMAKAN ABSENSI SEBULAN (26HB - 25HB) & KUNCI (LOCK) */}
      {/* ========================================================================= */}
      {activeSubTab === 'semakanBulanan' && canEditAllAttendance && (
        <MonthlyAttendanceReview
          employees={employees}
          attendanceRecords={attendanceRecords}
          leaveRequests={leaveRequests}
          activeUser={activeUser}
          onUpdateAttendanceRecord={onUpdateAttendanceRecord}
          onAddAttendanceRecord={onClockIn}
          selectedCompanyFilter={filterAttendanceCompany}
          currentLang={currentLang}
        />
      )}

      {/* MODAL 1: BORANG MOHON CUTI DENGAN FILE ATTACHMENT */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Borang Permohonan Cuti Rasmi
                </h3>
                <p className="text-xs text-slate-500">
                  Sertakan sijil sakit (MC) atau dokumen sokongan (PDF, PNG, JPG sehingga 5MB)
                </p>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeaveRequest} className="p-6 space-y-4 text-xs">
              
              {/* Pemohon */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Pekerja Pemohon
                </label>
                <select
                  disabled={!isManagerOrHR}
                  value={leaveFormData.employeeId}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.namaLengkap} ({emp.company})
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenis Cuti & Separuh Hari Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Jenis Cuti
                  </label>
                  <select
                    value={leaveFormData.tipeCuti}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, tipeCuti: e.target.value as LeaveType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {LEAVE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={leaveFormData.isHalfDay}
                      onChange={(e) => setLeaveFormData({ ...leaveFormData, isHalfDay: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Cuti Separuh Hari (0.5)
                    </span>
                  </label>
                </div>
              </div>

              {/* Tarikh Mula & Tamat */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Tarikh Mula
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveFormData.tanggalMulai}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, tanggalMulai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Tarikh Tamat
                  </label>
                  <input
                    type="date"
                    disabled={leaveFormData.isHalfDay}
                    required
                    value={leaveFormData.isHalfDay ? leaveFormData.tanggalMulai : leaveFormData.tanggalSelesai}
                    onChange={(e) => setLeaveFormData({ ...leaveFormData, tanggalSelesai: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-900 flex justify-between items-center font-mono">
                <span className="text-slate-600 dark:text-slate-300">Jumlah Durasi:</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">
                  {computedDuration} Hari Kerja
                </span>
              </div>

              {/* Alasan */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Alasan Permohonan Cuti *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jelaskan sebab permohonan..."
                  value={leaveFormData.alasan}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, alasan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>

              {/* ATTACHMENT UPLOAD DRAG & DROP FIELD */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Lampiran Dokumen / Sijil Sakit (MC)</span>
                  {leaveFormData.tipeCuti.includes('Sakit') && (
                    <span className="text-indigo-600 font-normal text-[11px]">*Disyorkan untuk Cuti Sakit</span>
                  )}
                </label>

                <input
                  type="file"
                  ref={leaveFileInputRef}
                  onChange={handleLeaveFileUpload}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                {leaveFormData.attachment ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {leaveFormData.attachment.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {Math.round(leaveFormData.attachment.size / 1024)} KB · {leaveFormData.attachment.type || 'Dokumen'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Padam Lampiran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => leaveFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all"
                  >
                    <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Klik atau seret fail ke sini
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Menyokong PDF, PNG, JPG, JPEG, WEBP (sehingga 5MB)
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Hantar Permohonan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DOCUMENT & MC VIEWER MODAL */}
      {viewingAttachmentModal && viewingAttachmentModal.attachment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pemeriksa Sijil & Dokumen Sokongan
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {viewingAttachmentModal.employeeName} · {viewingAttachmentModal.tipeCuti}
                </p>
              </div>
              <button
                onClick={() => setViewingAttachmentModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              {/* Document Preview Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {viewingAttachmentModal.attachment.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Saiz: {Math.round(viewingAttachmentModal.attachment.size / 1024)} KB · Format: {viewingAttachmentModal.attachment.type || 'PDF/Imej'}
                    </p>
                  </div>
                </div>

                {/* Simulated Certificate Content or Image */}
                {viewingAttachmentModal.attachment.dataUrl && viewingAttachmentModal.attachment.type.startsWith('image/') ? (
                  <div className="max-h-60 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <img
                      src={viewingAttachmentModal.attachment.dataUrl}
                      alt="Pratonton Dokumen"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between text-[11px] border-b pb-1 text-slate-400">
                      <span>KLINIK PANEL / HOSPITAL</span>
                      <span>STATUS: SAH DISAHKAN</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      SIJIL CUTI SAKIT (MEDICAL CERTIFICATE)
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Pesakit: <strong>{viewingAttachmentModal.employeeName}</strong>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Tempoh Rehat: <strong>{formatDateIndo(viewingAttachmentModal.tanggalMulai)}</strong> ({viewingAttachmentModal.durasiHari} Hari)
                    </p>
                    <p className="text-slate-500 text-[10px] italic">
                      Diagnosis: "{viewingAttachmentModal.alasan}"
                    </p>
                  </div>
                )}
              </div>

              {/* Download / Close Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <a
                  href={viewingAttachmentModal.attachment.dataUrl || '#'}
                  download={viewingAttachmentModal.attachment.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Muat Turun Fail Dokumen</span>
                </a>

                <button
                  onClick={() => setViewingAttachmentModal(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REKOD ABSENSI MANUAL (UNTUK KAKITANGAN TERLUPA ABSEN) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rekod Kehadiran Manual (Staf Terlupa Absen)
                </h3>
                <p className="text-xs text-slate-500">
                  Dibenarkan untuk Ananda Istiqomah, Cheah Leong Tim, & Siti Fatimah bagi mengelakkan potongan gaji tidak wajar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Kakitangan:
                </label>
                <select
                  value={manualRecordForm.employeeId}
                  onChange={(e) => setManualRecordForm({ ...manualRecordForm, employeeId: e.target.value })}
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
                    Tarikh Kehadiran:
                  </label>
                  <input
                    type="date"
                    value={manualRecordForm.tanggal}
                    onChange={(e) => setManualRecordForm({ ...manualRecordForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Kehadiran:
                  </label>
                  <select
                    value={manualRecordForm.status}
                    onChange={(e) => setManualRecordForm({ ...manualRecordForm, status: e.target.value as AttendanceStatus })}
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
                    value={manualRecordForm.jamMasuk}
                    onChange={(e) => setManualRecordForm({ ...manualRecordForm, jamMasuk: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Waktu Keluar:
                  </label>
                  <input
                    type="text"
                    value={manualRecordForm.jamKeluar}
                    onChange={(e) => setManualRecordForm({ ...manualRecordForm, jamKeluar: e.target.value })}
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
                    value={manualRecordForm.workHours}
                    onChange={(e) => setManualRecordForm({ ...manualRecordForm, workHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center"
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
                    value={manualRecordForm.otHours}
                    onChange={(e) => setManualRecordForm({ ...manualRecordForm, otHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Semakan Pengurusan:
                </label>
                <input
                  type="text"
                  value={manualRecordForm.catatan}
                  onChange={(e) => setManualRecordForm({ ...manualRecordForm, catatan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  placeholder="Alasan staf terlupa absen, disahkan oleh Pengurus"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
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

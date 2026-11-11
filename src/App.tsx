import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Clock, 
  CalendarCheck, 
  CreditCard, 
  Smartphone, 
  Sun, 
  Moon, 
  ShieldCheck,
  CheckCircle2,
  Bell,
  Database
} from 'lucide-react';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  CompanyName,
  AppNotification,
  PerformanceReview,
  EmployeeLoan,
  CompanyAnnouncement
} from './types/hr';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_ATTENDANCE, 
  INITIAL_LEAVE_REQUESTS,
  INITIAL_PERFORMANCE_REVIEWS,
  INITIAL_ANNOUNCEMENTS
} from './data/mockData';
import { INITIAL_EMPLOYEE_LOANS } from './data/mockLoanData';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { EmployeeManagement } from './components/EmployeeManagement';
import { AttendanceAndLeave } from './components/AttendanceAndLeave';
import { PayrollModule } from './components/PayrollModule';
import { PayslipModal } from './components/PayslipModal';
import { MobileAPKSimulator } from './components/MobileAPKSimulator';
import { LoginModal } from './components/LoginModal';
import { DatabaseSchemaViewer } from './components/DatabaseSchemaViewer';
import { WorkShiftSettingModal } from './components/WorkShiftSettingModal';
import { TrainingMateriModule } from './components/TrainingMateriModule';
import { KPIModule } from './components/KPIModule';
import { NotificationToast } from './components/NotificationToast';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProfilePhotoUploadModal } from './components/ProfilePhotoUploadModal';
import { EditOvertimeModal } from './components/EditOvertimeModal';
import { TeamWorkCalendar } from './components/TeamWorkCalendar';
import { LoanTrackerModule } from './components/LoanTrackerModule';
import { MalaysianPublicHolidayCalendar } from './components/MalaysianPublicHolidayCalendar';
import { ShiftDefinition, INITIAL_SHIFTS } from './types/databaseSchema';
import { Language } from './utils/translations';


export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Language state (Bilingual: ms / en)
  const [currentLang, setCurrentLang] = useState<Language>('ms');

  // Navigation view: Core streamlined views
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Company Filter state
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');

  // Core Data States
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);

  // Authentication State: Require email & password before entering app
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  // Mobile APK Simulator Modal
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState(false);

  // Payslip Modal State
  const [payslipEmployee, setPayslipEmployee] = useState<Employee | null>(null);
  const [payslipCompanyOverride, setPayslipCompanyOverride] = useState<CompanyName | undefined>(undefined);

  // Shift Settings State (HR Master Shifts & Modal)
  const [shifts, setShifts] = useState<ShiftDefinition[]>(INITIAL_SHIFTS);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Malaysian Corporate KPI Performance Reviews State
  const [reviews, setReviews] = useState<PerformanceReview[]>(INITIAL_PERFORMANCE_REVIEWS);

  // In-App Notification System State (for Leave Approvals/Rejections & HR updates)
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Permohonan Cuti Diluluskan',
      message: 'Permohonan Cuti Tahunan (Annual Leave) oleh MUHAMMAD AIMAN BIN ZULKIFLI (2 hari) telah DILULUSKAN oleh Pengurus HR.',
      type: 'success',
      timestamp: '10 Mei 2025, 09:30',
      read: false,
      approverNama: 'SITI FATIMAH BINTI HARON',
      employeeName: 'MUHAMMAD AIMAN BIN ZULKIFLI'
    },
    {
      id: 'notif-2',
      title: 'Pekeliling Akta Kerja 1955',
      message: 'Peringatan: Had jam kerja 45 jam mingguan dan rehat wajib 1 jam berkanun aktif untuk semua pekerja.',
      type: 'info',
      timestamp: '09 Mei 2025, 14:00',
      read: true,
    }
  ]);

  // Profile Photo Upload Modal State
  const [isProfilePhotoModalOpen, setIsProfilePhotoModalOpen] = useState(false);

  // Mobile Navigation Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Overtime Approval & Edit Modal State
  const [editingOtRecord, setEditingOtRecord] = useState<AttendanceRecord | null>(null);

  // Company Announcements & Notice Board State
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>(INITIAL_ANNOUNCEMENTS);

  // Company Loan Tracker & Advance Gaji State
  const [loans, setLoans] = useState<EmployeeLoan[]>(INITIAL_EMPLOYEE_LOANS);

  const handleAddAnnouncement = (newAnnouncement: CompanyAnnouncement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    setNotifications(prev => [{
      id: `notif-ann-${Date.now()}`,
      title: 'Warta Syarikat Diterbitkan',
      message: `Pekeliling "${newAnnouncement.judul}" telah diterbitkan di Papan Kenyataan.`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    }, ...prev]);
  };

  const handleAddLoan = (newLoan: EmployeeLoan) => {
    setLoans(prev => [newLoan, ...prev]);
    setNotifications(prev => [{
      id: `notif-loan-${Date.now()}`,
      title: 'Permohonan Pinjaman Dihantar',
      message: `Permohonan ${newLoan.loanType} berjumlah RM ${newLoan.principalAmount} bagi ${newLoan.employeeName} telah didaftarkan.`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    }, ...prev]);
  };

  const handleApproveLoan = (loanId: string) => {
    const approver = currentUser?.namaLengkap || 'SITI FATIMAH BINTI HARON';
    setLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      status: 'Aktif',
      approvedBy: approver,
      approvedAt: '2025-05-12'
    } : l));
    const target = loans.find(l => l.id === loanId);
    setNotifications(prev => [{
      id: `notif-loan-app-${Date.now()}`,
      title: 'Pinjaman Diluluskan',
      message: `Pinjaman bagi ${target?.employeeName || 'kakitangan'} telah DILULUSKAN oleh ${approver}.`,
      type: 'success',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    }, ...prev]);
  };

  const handleRejectLoan = (loanId: string) => {
    const approver = currentUser?.namaLengkap || 'SITI FATIMAH BINTI HARON';
    setLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      status: 'Ditolak',
      approvedBy: approver,
      approvedAt: '2025-05-12'
    } : l));
    const target = loans.find(l => l.id === loanId);
    setNotifications(prev => [{
      id: `notif-loan-rej-${Date.now()}`,
      title: 'Pinjaman Ditolak',
      message: `Pinjaman bagi ${target?.employeeName || 'kakitangan'} telah DITOLAK oleh ${approver}.`,
      type: 'error',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    }, ...prev]);
  };

  const handleAddReview = (newReview: PerformanceReview) => {
    setReviews(prev => [newReview, ...prev]);
  };

  const handleUpdateReview = (updated: PerformanceReview) => {
    setReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleUpdateProfilePhoto = (newAvatarUrl: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, avatarUrl: newAvatarUrl };
      setCurrentUser(updatedUser);
      setEmployees(prev => prev.map(e => (e.id === currentUser.id ? updatedUser : e)));
      
      const newNotif: AppNotification = {
        id: `notif-avatar-${Date.now()}`,
        title: 'Foto Profil Dikemaskini',
        message: 'Foto profil avatar anda telah berjaya disimpan dan diganti secara instan.',
        type: 'success',
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // --- CORE ATTENDANCE & PAYROLL HANDLERS ---
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees(prev => [newEmp, ...prev]);
  };

  const handleUpdateEmployee = (updated: Employee) => {
    setEmployees(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    if (currentUser && currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const handleBulkAssignShift = (employeeIds: string[], shift: ShiftDefinition) => {
    setEmployees(prev =>
      prev.map(emp => {
        if (employeeIds.includes(emp.id)) {
          return {
            ...emp,
            shiftId: shift.id,
            shiftName: shift.shiftName,
            shiftStartTime: shift.startTime.slice(0, 5),
            shiftEndTime: shift.endTime.slice(0, 5),
            shiftGraceMinutes: shift.gracePeriodMinutes,
            shiftWorkHoursQuota: shift.standardWorkHours,
            shiftBreakMinutes: shift.breakDurationMinutes
          };
        }
        return emp;
      })
    );
    if (currentUser && employeeIds.includes(currentUser.id)) {
      setCurrentUser(prev => prev ? ({
        ...prev,
        shiftId: shift.id,
        shiftName: shift.shiftName,
        shiftStartTime: shift.startTime.slice(0, 5),
        shiftEndTime: shift.endTime.slice(0, 5),
        shiftGraceMinutes: shift.gracePeriodMinutes,
        shiftWorkHoursQuota: shift.standardWorkHours,
        shiftBreakMinutes: shift.breakDurationMinutes
      }) : null);
    }
  };

  /**
   * Conscious Check-In Handler
   * Calculates late_minutes if check-in is past shift start (08:30 + 15 min grace = 08:45)
   */
  const handleClockIn = (record: AttendanceRecord) => {
    setAttendanceRecords(prev => [record, ...prev]);
  };

  const handleUpdateAttendanceRecord = (updated: AttendanceRecord) => {
    setAttendanceRecords(prev => prev.map(r => (r.id === updated.id ? updated : r)));
  };

  /**
   * Conscious Check-Out Handler
   * Updates existing record with check_out_time, calculates total duration, overtime_minutes, and marks day finished
   */
  const handleClockOut = (employeeId: string, jamKeluar: string, otHours: number) => {
    setAttendanceRecords(prev =>
      prev.map(r => {
        if (r.employeeId === employeeId && r.tanggal === '2025-05-12') {
          const workHours = 8.0 + (otHours || 0);
          return { 
            ...r, 
            jamKeluar, 
            otHours: otHours || r.otHours || 0,
            workHours,
            isOnBreak: false 
          };
        }
        return r;
      })
    );
  };

  const handleBreakOut = (employeeId: string, jamKeluarRehat: string) => {
    setAttendanceRecords(prev =>
      prev.map(r => {
        if (r.employeeId === employeeId && r.tanggal === '2025-05-12') {
          return {
            ...r,
            jamKeluarRehat,
            isOnBreak: true,
            catatan: `${r.catatan || ''} [Keluar Rehat: ${jamKeluarRehat}]`
          };
        }
        return r;
      })
    );
  };

  const handleBreakIn = (employeeId: string, jamMasukRehat: string) => {
    setAttendanceRecords(prev =>
      prev.map(r => {
        if (r.employeeId === employeeId && r.tanggal === '2025-05-12') {
          return {
            ...r,
            jamMasukRehat,
            isOnBreak: false,
            catatan: `${r.catatan || ''} [Masuk Rehat: ${jamMasukRehat}]`
          };
        }
        return r;
      })
    );
  };

  const handleSubmitLeaveRequest = (newRequest: LeaveRequest) => {
    setLeaveRequests(prev => [newRequest, ...prev]);
  };

  const handleApproveLeave = (id: string, notes?: string) => {
    const target = leaveRequests.find(l => l.id === id);
    if (!target) return;

    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id === target.employeeId) {
          const currentBalances = { ...emp.leaveBalances };
          if (target.tipeCuti.includes('Tahunan')) {
            currentBalances.annualUsed = (currentBalances.annualUsed || 0) + target.durasiHari;
          } else if (target.tipeCuti.includes('Sakit')) {
            currentBalances.medicalUsed = (currentBalances.medicalUsed || 0) + target.durasiHari;
          } else if (target.tipeCuti.includes('Kecemasan')) {
            currentBalances.emergencyUsed = (currentBalances.emergencyUsed || 0) + target.durasiHari;
          } else if (target.tipeCuti.includes('Tanpa Gaji')) {
            currentBalances.unpaidUsed = (currentBalances.unpaidUsed || 0) + target.durasiHari;
          }

          return {
            ...emp,
            leaveBalances: currentBalances,
          };
        }
        return emp;
      })
    );

    setLeaveRequests(prev =>
      prev.map(req => {
        if (req.id === id) {
          return {
            ...req,
            status: 'Diluluskan',
            approverNama: currentUser?.namaLengkap || 'SITI FATIMAH BINTI HARON',
            approverCatatan: notes || 'Permohonan cuti diluluskan rasmi oleh pengurusan.'
          };
        }
        return req;
      })
    );

    if (target.tanggalMulai === '2025-05-12') {
      const isMc = target.tipeCuti.includes('Sakit');
      const newAttendanceRecord: AttendanceRecord = {
        id: `att-leave-${Date.now()}`,
        employeeId: target.employeeId,
        employeeName: target.employeeName,
        company: target.company,
        nik: target.employeeId,
        departemen: target.departemen,
        tanggal: '2025-05-12',
        jamMasuk: '-',
        jamKeluar: null,
        status: isMc ? 'Sakit (MC)' : 'Bercuti',
        workHours: 8.0,
        lokasi: 'Remote Rumah / WFH',
        koordinat: '-',
        jarakMeter: 0,
        otHours: 0,
        catatan: `Cuti diluluskan: ${target.tipeCuti}`
      };
      setAttendanceRecords(prev => [newAttendanceRecord, ...prev]);
    }

    // Trigger in-app notification
    const approver = currentUser?.namaLengkap || 'SITI FATIMAH BINTI HARON';
    const newNotif: AppNotification = {
      id: `notif-appr-${Date.now()}`,
      title: 'Permohonan Cuti Diluluskan',
      message: `Permohonan cuti ${target.tipeCuti} oleh ${target.employeeName} (${target.durasiHari} hari) telah DILULUSKAN oleh ${approver}.`,
      type: 'success',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      relatedLeaveId: id,
      approverNama: approver,
      employeeName: target.employeeName
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleRejectLeave = (id: string, notes?: string) => {
    const target = leaveRequests.find(l => l.id === id);
    const approver = currentUser?.namaLengkap || 'SITI FATIMAH BINTI HARON';

    setLeaveRequests(prev =>
      prev.map(req => {
        if (req.id === id) {
          return {
            ...req,
            status: 'Ditolak',
            approverNama: approver,
            approverCatatan: notes || 'Permohonan cuti tidak diluluskan.'
          };
        }
        return req;
      })
    );

    if (target) {
      const newNotif: AppNotification = {
        id: `notif-rej-${Date.now()}`,
        title: 'Permohonan Cuti Ditolak',
        message: `Permohonan cuti ${target.tipeCuti} oleh ${target.employeeName} telah DITOLAK oleh ${approver}. Catatan: ${notes || 'Tidak diluluskan'}`,
        type: 'error',
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        relatedLeaveId: id,
        approverNama: approver,
        employeeName: target.employeeName
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  /**
   * Overtime Approval Handler (HR / HRD / Director)
   * Approves overtime hours recorded by employee, updates otStatus to Approved
   */
  const handleApproveOvertime = (recordId: string) => {
    const approver = currentUser?.namaLengkap || 'SITI FATIMAH BINTI HARON';
    let targetEmployee = 'Kakitangan';
    let targetHours = 0;

    setAttendanceRecords(prev =>
      prev.map(r => {
        if (r.id === recordId) {
          targetEmployee = r.employeeName;
          targetHours = r.otHours || 0;
          return {
            ...r,
            otStatus: 'Approved',
            otApprovedBy: approver,
            otApprovedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            catatan: `${r.catatan || ''} [OT ${r.otHours}j diluluskan rasmi oleh ${approver}]`.trim()
          };
        }
        return r;
      })
    );

    const newNotif: AppNotification = {
      id: `notif-ot-app-${Date.now()}`,
      title: 'Jam Lembur (OT) Diluluskan',
      message: `Jam lebih masa (${targetHours}j) bagi kakitangan ${targetEmployee} telah DILULUSKAN oleh ${approver} (Kadar 1.5x / 2.0x).`,
      type: 'success',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      approverNama: approver,
      employeeName: targetEmployee
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  /**
   * Overtime Removal Handler (HR / HRD / Director)
   * Resets overtime to 0 hours and marks otStatus as Rejected/Removed
   */
  const handleRemoveOvertime = (recordId: string) => {
    const approver = currentUser?.namaLengkap || 'SITI FATIMAH BINTI HARON';
    let targetEmployee = 'Kakitangan';
    let previousHours = 0;

    setAttendanceRecords(prev =>
      prev.map(r => {
        if (r.id === recordId) {
          targetEmployee = r.employeeName;
          previousHours = r.otHours || 0;
          const newWorkHours = Math.max(0, (r.workHours || 8.0) - previousHours);
          return {
            ...r,
            otHours: 0,
            otStatus: 'Rejected',
            otApprovedBy: approver,
            otApprovedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            workHours: newWorkHours,
            catatan: `${r.catatan || ''} [OT ${previousHours}j dihapuskan/dibatalkan oleh ${approver}]`.trim()
          };
        }
        return r;
      })
    );

    const newNotif: AppNotification = {
      id: `notif-ot-rem-${Date.now()}`,
      title: 'Jam Lembur (OT) Dihapuskan',
      message: `Jam lebih masa (${previousHours}j) bagi kakitangan ${targetEmployee} telah DIHAPUSKAN / DISET KEPADA 0 JAM oleh ${approver}.`,
      type: 'error',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      approverNama: approver,
      employeeName: targetEmployee
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  /**
   * Overtime Save & Adjust Handler (from EditOvertimeModal)
   */
  const handleSaveOvertime = (recordId: string, otHours: number, notes?: string, multiplier?: number) => {
    const approver = currentUser?.namaLengkap || 'SITI FATIMAH BINTI HARON';
    let targetEmployee = 'Kakitangan';

    setAttendanceRecords(prev =>
      prev.map(r => {
        if (r.id === recordId) {
          targetEmployee = r.employeeName;
          const prevOt = r.otHours || 0;
          const baseHours = Math.max(0, (r.workHours || 8.0) - prevOt);
          const newWorkHours = baseHours + otHours;
          return {
            ...r,
            otHours,
            otStatus: otHours > 0 ? 'Approved' : 'Rejected',
            otApprovedBy: approver,
            otApprovedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            workHours: newWorkHours,
            catatan: notes || `${r.catatan || ''} [OT ${otHours}j diselaraskan]`.trim()
          };
        }
        return r;
      })
    );

    const newNotif: AppNotification = {
      id: `notif-ot-save-${Date.now()}`,
      title: otHours > 0 ? 'Jam Lembur (OT) Diselaraskan' : 'Jam Lembur Dihapuskan',
      message: `Jam lebih masa bagi kakitangan ${targetEmployee} dikemaskini kepada ${otHours} jam oleh ${approver}.`,
      type: otHours > 0 ? 'success' : 'info',
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      approverNama: approver,
      employeeName: targetEmployee
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Filtered employees according to selected company filter
  const displayedEmployees = selectedCompanyFilter === 'all'
    ? employees
    : employees.filter(e => e.company === selectedCompanyFilter);

  // Today attendance for currently active user
  const userTodayAttendance = currentUser 
    ? attendanceRecords.find(r => r.employeeId === currentUser.id && r.tanggal === '2025-05-12')
    : undefined;

  const hasClockedInToday = !!userTodayAttendance && !!userTodayAttendance.jamMasuk && userTodayAttendance.jamMasuk !== '-';
  const pendingLeaveCount = leaveRequests.filter(l => l.status === 'Menunggu Kelulusan').length;

  // If user is not logged in, enforce login modal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <LoginModal
          employees={employees}
          onLoginSuccess={(user: Employee) => {
            setCurrentUser(user);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeUser={currentUser}
        currentLang={currentLang}
        onToggleLang={() => setCurrentLang(prev => prev === 'ms' ? 'en' : 'ms')}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenMobileAPK={() => setIsMobileSimulatorOpen(true)}
        onLogout={() => setCurrentUser(null)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        userTodayAttendance={userTodayAttendance}
        notifications={notifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
        onOpenProfilePhotoModal={() => setIsProfilePhotoModalOpen(true)}
        onQuickClockIn={(location) => {
          const now = new Date();
          const jamMasuk = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const hours = now.getHours();
          const minutes = now.getMinutes();
          const [sH, sM] = (currentUser.shiftStartTime || '09:00').split(':').map(Number);
          const grace = currentUser.shiftGraceMinutes ?? 15;
          const nowMinutes = hours * 60 + minutes;
          const threshold = (sH * 60 + sM) + grace;
          const isLate = nowMinutes > threshold;
          const lateMins = isLate ? Math.max(0, nowMinutes - (sH * 60 + sM)) : 0;
          const quota = currentUser.shiftWorkHoursQuota ?? 8.0;

          handleClockIn({
            id: `att-${Date.now()}`,
            employeeId: currentUser.id,
            employeeName: currentUser.namaLengkap,
            company: currentUser.company,
            nik: currentUser.nik,
            departemen: currentUser.departemen,
            tanggal: '2025-05-12',
            jamMasuk,
            jamKeluar: null,
            status: isLate ? 'Lewat' : 'Hadir',
            workHours: quota,
            lokasi: location as any,
            koordinat: currentUser.isRemoteOutsideMalaysia ? '-6.3728, 106.8331' : '3.1390, 101.6869',
            jarakMeter: currentUser.isRemoteOutsideMalaysia ? 0 : 12,
            otHours: 0,
            lateMinutes: lateMins,
            catatan: isLate ? `Lewat ${lateMins} minit (Shift: ${currentUser.shiftStartTime || '09:00'}, had: ${grace}m)` : 'Tepat Waktu'
          });
        }}
        onQuickClockOut={(otHours) => {
          const now = new Date();
          const jamKeluar = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          handleClockOut(currentUser.id, jamKeluar, otHours);
        }}
        onQuickBreakOut={() => {
          const now = new Date();
          const jamKeluarRehat = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          handleBreakOut(currentUser.id, jamKeluarRehat);
        }}
        onQuickBreakIn={() => {
          const now = new Date();
          const jamMasukRehat = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          handleBreakIn(currentUser.id, jamMasukRehat);
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Navigation Sidebar (Desktop + Mobile Drawer) */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          activeUser={currentUser}
          pendingLeavesCount={pendingLeaveCount}
          currentLang={currentLang}
          onOpenMobileAPK={() => setIsMobileSimulatorOpen(true)}
          onLogout={() => setCurrentUser(null)}
          selectedCompanyFilter={selectedCompanyFilter}
          onSelectCompanyFilter={setSelectedCompanyFilter}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden bg-slate-50/70 dark:bg-slate-950/70 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            
            {/* VIEW 1: Dashboard Overview */}
            {currentView === 'dashboard' && (
              <DashboardOverview
                employees={displayedEmployees}
                attendanceToday={attendanceRecords.filter(a => a.tanggal === '2025-05-12')}
                leaveRequests={leaveRequests}
                announcements={announcements}
                loans={loans}
                onAddAnnouncement={handleAddAnnouncement}
                onNavigateTab={(tab) => {
                  if (tab === 'employees' || tab === 'karyawan') setCurrentView('employees');
                  else if (tab === 'attendance' || tab === 'absensi') setCurrentView('attendance');
                  else if (tab === 'payroll' || tab === 'gaji') setCurrentView('payroll');
                  else if (tab === 'training' || tab === 'latihan') setCurrentView('training');
                  else if (tab === 'schema') setCurrentView('schema');
                  else if (tab === 'kpi' || tab === 'prestasi') setCurrentView('kpi');
                  else if (tab === 'teamCalendar' || tab === 'calendar') setCurrentView('teamCalendar');
                  else if (tab === 'loans' || tab === 'pinjaman') setCurrentView('loans');
                  else if (tab === 'holidays' || tab === 'cuti') setCurrentView('holidays');
                  else setCurrentView(tab);
                }}
                onApproveLeave={handleApproveLeave}
                onRejectLeave={handleRejectLeave}
                onOpenNewLeaveModal={() => setCurrentView('attendance')}
                onOpenNewEmployeeModal={() => setCurrentView('employees')}
                onOpenShiftModal={() => setIsShiftModalOpen(true)}
                onQuickClockIn={(loc) => {
                  const now = new Date();
                  const jamMasuk = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const hours = now.getHours();
                  const minutes = now.getMinutes();
                  const [sH, sM] = (currentUser.shiftStartTime || '09:00').split(':').map(Number);
                  const grace = currentUser.shiftGraceMinutes ?? 15;
                  const nowMinutes = hours * 60 + minutes;
                  const threshold = (sH * 60 + sM) + grace;
                  const isLate = nowMinutes > threshold;
                  const lateMins = isLate ? Math.max(0, nowMinutes - (sH * 60 + sM)) : 0;
                  const quota = currentUser.shiftWorkHoursQuota ?? 8.0;

                  handleClockIn({
                    id: `att-${Date.now()}`,
                    employeeId: currentUser.id,
                    employeeName: currentUser.namaLengkap,
                    company: currentUser.company,
                    nik: currentUser.nik,
                    departemen: currentUser.departemen,
                    tanggal: '2025-05-12',
                    jamMasuk,
                    jamKeluar: null,
                    status: isLate ? 'Lewat' : 'Hadir',
                    workHours: quota,
                    lokasi: loc as any,
                    koordinat: currentUser.isRemoteOutsideMalaysia ? '-6.3728, 106.8331' : '3.1390, 101.6869',
                    jarakMeter: currentUser.isRemoteOutsideMalaysia ? 0 : 12,
                    otHours: 0,
                    lateMinutes: lateMins,
                    catatan: isLate ? `Lewat ${lateMins} minit (Shift: ${currentUser.shiftStartTime || '09:00'})` : 'Masuk tepat waktu'
                  });
                }}
                onQuickClockOut={(otHours) => {
                  const now = new Date();
                  const jamKeluar = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  handleClockOut(currentUser.id, jamKeluar, otHours);
                }}
                onQuickBreakOut={() => {
                  const now = new Date();
                  const jamKeluarRehat = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  handleBreakOut(currentUser.id, jamKeluarRehat);
                }}
                onQuickBreakIn={() => {
                  const now = new Date();
                  const jamMasukRehat = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  handleBreakIn(currentUser.id, jamMasukRehat);
                }}
                onViewPayslip={(emp) => {
                  setPayslipEmployee(emp);
                  setPayslipCompanyOverride(emp.company);
                }}
                activeUser={currentUser}
                hasClockedInToday={hasClockedInToday}
                userTodayAttendance={userTodayAttendance}
                allAttendanceRecords={attendanceRecords}
                onApproveOvertime={handleApproveOvertime}
                onRemoveOvertime={handleRemoveOvertime}
                onOpenEditOvertimeModal={(rec) => setEditingOtRecord(rec || userTodayAttendance || null)}
              />
            )}

            {/* VIEW 2: Presensi & Absensi (Kehadiran & Semakan 26-25 & Kunci Rekod) */}
            {currentView === 'attendance' && (
              <AttendanceAndLeave
                employees={displayedEmployees}
                attendanceRecords={attendanceRecords}
                leaveRequests={leaveRequests}
                activeUser={currentUser}
                onClockIn={handleClockIn}
                onBreakOut={handleBreakOut}
                onBreakIn={handleBreakIn}
                onClockOut={handleClockOut}
                onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
                onSubmitLeaveRequest={handleSubmitLeaveRequest}
                onApproveLeave={handleApproveLeave}
                onRejectLeave={handleRejectLeave}
                onApproveOvertime={handleApproveOvertime}
                onRemoveOvertime={handleRemoveOvertime}
                initialSubTab="absensi"
                currentLang={currentLang}
              />
            )}

            {/* VIEW 3: Penggajian & Statutori (Payroll Terintegrasi Absensi) */}
            {currentView === 'payroll' && (
              <PayrollModule
                employees={displayedEmployees}
                attendanceRecords={attendanceRecords}
                leaveRequests={leaveRequests}
                activeUser={currentUser}
                onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
                onAddAttendanceRecord={handleClockIn}
                onNavigateToAttendance={() => setCurrentView('attendance')}
                onViewPayslip={(emp, companyOverride) => {
                  setPayslipEmployee(emp);
                  setPayslipCompanyOverride(companyOverride || emp.company);
                }}
              />
            )}

            {/* VIEW 4: Data Karyawan (Employees Directory & Kontrak / Resign) */}
            {currentView === 'employees' && (
              <EmployeeManagement
                employees={displayedEmployees}
                activeUser={currentUser}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onOpenShiftModal={() => setIsShiftModalOpen(true)}
                onViewPayslip={(emp) => {
                  setPayslipEmployee(emp);
                  setPayslipCompanyOverride(emp.company);
                }}
              />
            )}

            {/* VIEW 5: Materi Training & SOP Pembelajaran Calon (Retail, CS, Admin, Akta Kerja 1955) */}
            {currentView === 'training' && (
              <TrainingMateriModule
                activeUser={currentUser}
                employees={displayedEmployees}
              />
            )}

            {/* VIEW 6: Skema Database & Dokumentasi API Architecture */}
            {currentView === 'schema' && (
              <DatabaseSchemaViewer
                activeUser={currentUser}
                employees={displayedEmployees}
              />
            )}

            {/* VIEW 7: Penilaian Prestasi & KPI Korporat Malaysia (Akta 1955, KWSP/SOCSO/EIS, SOP) */}
            {currentView === 'kpi' && (
              <KPIModule
                employees={displayedEmployees}
                activeUser={currentUser}
                reviews={reviews}
                onAddReview={handleAddReview}
                onUpdateReview={handleUpdateReview}
              />
            )}

            {/* VIEW 8: Kalender Kerja Tim (Cuti, Outstation, WFH) */}
            {currentView === 'teamCalendar' && (
              <TeamWorkCalendar
                employees={displayedEmployees}
                attendanceRecords={attendanceRecords}
                leaveRequests={leaveRequests}
                activeUser={currentUser}
                selectedCompanyFilter={selectedCompanyFilter}
              />
            )}

            {/* VIEW 9: Rekod Pinjaman Syarikat & Advance Gaji (Akta 1955 Had 50%) */}
            {currentView === 'loans' && (
              <LoanTrackerModule
                employees={displayedEmployees}
                loans={loans}
                activeUser={currentUser}
                onAddLoan={handleAddLoan}
                onApproveLoan={handleApproveLoan}
                onRejectLoan={handleRejectLoan}
                selectedCompanyFilter={selectedCompanyFilter}
              />
            )}

            {/* VIEW 10: Kalendar Cuti Umum Tempatan Malaysia (Selangor, Kedah, Persekutuan) */}
            {currentView === 'holidays' && (
              <MalaysianPublicHolidayCalendar />
            )}

          </div>
        </main>
      </div>

      {/* Floating In-App Notification Toasts */}
      <NotificationToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      {/* Mobile Bottom Navigation Bar (Mobile-First with min 44x44px touch targets) */}
      <MobileBottomNav
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        activeUser={currentUser}
        pendingLeavesCount={pendingLeaveCount}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Profile Photo Upload Modal */}
      <ProfilePhotoUploadModal
        isOpen={isProfilePhotoModalOpen}
        onClose={() => setIsProfilePhotoModalOpen(false)}
        activeUser={currentUser}
        onPhotoUpdated={handleUpdateProfilePhoto}
      />

      {/* Official Payslip Modal */}
      <PayslipModal
        employee={payslipEmployee}
        selectedCompanyOverride={payslipCompanyOverride}
        loans={loans}
        onClose={() => setPayslipEmployee(null)}
      />

      {/* Work Shift Setting Modal (HR & Management) */}
      <WorkShiftSettingModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        employees={employees}
        activeUser={currentUser}
        shifts={shifts}
        onUpdateShifts={setShifts}
        onUpdateEmployee={handleUpdateEmployee}
        onBulkAssignShift={handleBulkAssignShift}
      />

      {/* Mobile APK Simulator Modal */}
      <MobileAPKSimulator
        isOpen={isMobileSimulatorOpen}
        onClose={() => setIsMobileSimulatorOpen(false)}
        activeUser={currentUser}
        attendanceToday={attendanceRecords.filter(a => a.tanggal === '2025-05-12')}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        onOpenLeaveModal={() => {
          setIsMobileSimulatorOpen(false);
          setCurrentView('attendance');
        }}
        onViewPayslip={(emp) => {
          setPayslipEmployee(emp);
          setPayslipCompanyOverride(emp.company);
        }}
      />

      {/* Edit Overtime Modal (HR & HRD Overtime Approval/Removal/Adjustment) */}
      <EditOvertimeModal
        isOpen={!!editingOtRecord}
        onClose={() => setEditingOtRecord(null)}
        record={editingOtRecord}
        employee={employees.find(e => e.id === editingOtRecord?.employeeId)}
        onSaveOvertime={handleSaveOvertime}
      />

    </div>
  );
}


import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Download, 
  Filter, 
  Eye, 
  EyeOff,
  Edit3, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  CreditCard, 
  Building,
  CheckCircle2,
  Clock,
  X,
  Camera,
  Upload,
  Globe2,
  ShieldCheck,
  Save,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
  Lock,
  RefreshCw,
  Baby,
  FileCheck2,
  Shield,
  UploadCloud,
  UserX,
  FileCheck,
  FileSignature,
  FolderArchive
} from 'lucide-react';
import { 
  Employee, 
  Department, 
  EmploymentType, 
  CompanyName, 
  CurrencyCode, 
  UserRole,
  LeaveBalances,
  SalaryScheme 
} from '../types/hr';
import { formatMYR, formatCurrencyAmount, convertToMYR } from '../utils/statutoryCalculations';
import { ContractDocumentModal } from './ContractDocumentModal';
import { ResignationLetterModal } from './ResignationLetterModal';

interface EmployeeManagementProps {
  employees: Employee[];
  activeUser: Employee;
  onAddEmployee: (newEmployee: Employee) => void;
  onUpdateEmployee: (updated: Employee) => void;
  onViewPayslip: (employee: Employee) => void;
  onOpenShiftModal?: () => void;
  onOpenWeeklyOffModal?: () => void;
}

const DEPARTMENTS: Department[] = [
  'Pengurusan & Eksekutif',
  'Teknologi Maklumat & IT',
  'Editorial & Penerbitan',
  'Kewangan & Akaun',
  'Pemasaran & Jualan',
  'Operasi & Logistik',
  'Sumber Manusia (HR)',
];

const COMPANIES: CompanyName[] = [
  'Pustaka Union',
  'Solusi Serumpun Senusantara SDN. BHD',
];

const MALAYSIAN_BANKS = [
  'Maybank Berhad',
  'CIMB Bank Berhad',
  'Public Bank Berhad',
  'RHB Bank Berhad',
  'Hong Leong Bank',
  'AmBank Group',
  'Bank Islam Malaysia',
  'Bank Simpanan Nasional (BSN)',
  'Bank Central Asia (BCA) - Indonesia',
  'Bank Mandiri (Persero) Tbk - Indonesia',
  'Lainnya (Bank Antarabangsa / Lain)'
];

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  activeUser,
  onAddEmployee,
  onUpdateEmployee,
  onViewPayslip,
  onOpenShiftModal,
  onOpenWeeklyOffModal,
}) => {
  // HR Administrators with full credentials access per user instruction:
  // "Hr (Ananda,fatimah, cheah leong tim) can akses info login all employee (email+pasword) and can chhange it"
  const isHRAdmin = useMemo(() => {
    const email = (activeUser.email || '').toLowerCase();
    const name = (activeUser.namaLengkap || '').toLowerCase();
    return (
      activeUser.role === 'HRD' ||
      activeUser.role === 'Director' ||
      email.includes('ananda') ||
      name.includes('ananda') ||
      email.includes('fatimah') ||
      name.includes('fatimah') ||
      email.includes('leongtim') ||
      name.includes('cheah leong tim')
    );
  }, [activeUser]);

  const isManagerOrHR = isHRAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Offering Letter / Contract Document Modal State
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractTargetEmpId, setContractTargetEmpId] = useState<string | undefined>(undefined);

  // Resignation & Automatic Resign Letter Modal State
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [selectedResignEmployee, setSelectedResignEmployee] = useState<Employee | null>(null);

  // Login Credentials Management State (Email & Password view/change by HR)
  const [editingCredentialsEmployee, setEditingCredentialsEmployee] = useState<Employee | null>(null);
  const [isCredentialsOverviewOpen, setIsCredentialsOverviewOpen] = useState(false);
  const [showCredentialsInTable, setShowCredentialsInTable] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [credentialsSuccessMsg, setCredentialsSuccessMsg] = useState<string | null>(null);

  // UNION Registration Form Active Section (1 to 5) for Add / Edit modals
  const [addFormSection, setAddFormSection] = useState<number>(1);
  const [editFormSection, setEditFormSection] = useState<number>(1);
  const [selectedAddCompany, setSelectedAddCompany] = useState<CompanyName>('Pustaka Union');

  // Hidden File input for Gallery Profile Picture upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploadTargetId, setPhotoUploadTargetId] = useState<string | null>(null);

  // Leave Balances Manual Adjustment State (in Profile Modal)
  const [editableLeaveBalances, setEditableLeaveBalances] = useState<LeaveBalances | null>(null);
  const [leaveAdjustSuccess, setLeaveAdjustSuccess] = useState(false);

  // Clipboard copy helper
  const handleCopyText = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Password generator helper
  const generatePassword = (company: string = 'PU') => {
    const prefix = company.includes('Solusi') ? 'SSS' : 'PU';
    const specials = ['@', '!', '#', '$'];
    const randSpecial = specials[Math.floor(Math.random() * specials.length)];
    const randNum = Math.floor(100 + Math.random() * 900);
    return `${prefix}${randSpecial}2027*${randNum}`;
  };

  // Filter employees according to user's permissions:
  // If ordinary employee: ONLY show their own record!
  // If HRD or Director: show all records matching search/filters.
  const accessibleEmployees = useMemo(() => {
    if (!isManagerOrHR) {
      return employees.filter(e => e.id === activeUser.id);
    }
    return employees;
  }, [employees, isManagerOrHR, activeUser.id]);

  const filteredEmployees = useMemo(() => {
    return accessibleEmployees.filter(emp => {
      const matchSearch =
        emp.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.icNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCompany = selectedCompany === 'all' || emp.company === selectedCompany;
      const matchDept = selectedDept === 'all' || emp.departemen === selectedDept;

      const isResigned = emp.statusAktif === false || !!emp.resignationDetails?.isResigned;
      const matchStatus =
        selectedStatusFilter === 'all'
          ? true
          : selectedStatusFilter === 'active'
          ? !isResigned
          : isResigned;

      return matchSearch && matchCompany && matchDept && matchStatus;
    });
  }, [accessibleEmployees, searchTerm, selectedCompany, selectedDept, selectedStatusFilter]);

  // Gallery photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Sila pilih fail imej yang sah (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultDataUrl = reader.result as string;
      const targetId = photoUploadTargetId || activeUser.id;
      const targetEmp = employees.find(emp => emp.id === targetId);

      if (targetEmp) {
        const updated = { ...targetEmp, avatarUrl: resultDataUrl };
        onUpdateEmployee(updated);
        if (selectedEmployeeForDetail && selectedEmployeeForDetail.id === targetId) {
          setSelectedEmployeeForDetail(updated);
        }
      }
      setPhotoUploadTargetId(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerGalleryUpload = (empId: string) => {
    setPhotoUploadTargetId(empId);
    fileInputRef.current?.click();
  };

  // Open Detail and initialize leave balances editor
  const handleOpenDetailModal = (emp: Employee) => {
    setSelectedEmployeeForDetail(emp);
    setEditableLeaveBalances({ ...emp.leaveBalances });
    setLeaveAdjustSuccess(false);
  };

  // Save manual leave balance adjustments
  const handleSaveLeaveBalances = () => {
    if (!selectedEmployeeForDetail || !editableLeaveBalances) return;

    const updated: Employee = {
      ...selectedEmployeeForDetail,
      leaveBalances: { ...editableLeaveBalances }
    };

    onUpdateEmployee(updated);
    setSelectedEmployeeForDetail(updated);
    setLeaveAdjustSuccess(true);
    setTimeout(() => setLeaveAdjustSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden file input for gallery picture upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isManagerOrHR ? 'Direktori Profil & Biodata Karyawan' : 'Profil & Biodata Saya'}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
              {isManagerOrHR ? 'Akses Pentadbir (HR/Director)' : 'Akses Staf ESS'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isManagerOrHR
              ? 'Pengurusan rekod pekerja Pustaka Union & Solusi Serumpun Senusantara SDN. BHD (Gaji pelbagai mata wang, pengecualian statutori remote luar negara & pelarasan kuota cuti).'
              : 'Maklumat peribadi, nombor statutori (KWSP, PERKESO, LHDN), akaun bank, dan baki cuti anda.'}
          </p>
        </div>

        {isManagerOrHR && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setContractTargetEmpId(undefined);
                setIsContractModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900 hover:bg-sky-100 dark:hover:bg-sky-900/60 rounded-lg shadow-sm transition-colors shrink-0"
              title="Muat naik dan arkib surat tawaran kerja (Offering Letter), kontrak pekerjaan & NDA untuk semua pekerja"
            >
              <UploadCloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Surat Tawaran & Kontrak</span>
            </button>

            <button
              onClick={() => {
                setSelectedResignEmployee(null);
                setIsResignModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg shadow-sm transition-colors shrink-0"
              title="Proses perletakan jawatan (Resign), set status karyawan tidak aktif & jana surat penerimaan resign rasmi automatik"
            >
              <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Urus Resign & Surat Rasmi</span>
            </button>

            <button
              onClick={() => setIsCredentialsOverviewOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg shadow-sm transition-colors shrink-0"
              title="Akses & Urus Info Log Masuk (Emel + Kata Laluan) semua pekerja (Ananda, Fatimah, Cheah Leong Tim)"
            >
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Info Log Masuk & Kata Laluan</span>
            </button>

            {onOpenShiftModal && (
              <button
                type="button"
                onClick={onOpenShiftModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg shadow-xs transition-colors shrink-0"
              >
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Tetapan Shift & Jam Kerja</span>
              </button>
            )}

            {onOpenWeeklyOffModal && (
              <button
                type="button"
                onClick={onOpenWeeklyOffModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-lg shadow-xs transition-colors shrink-0"
              >
                <Calendar className="w-4 h-4 text-rose-500" />
                <span>Cuti Mingguan</span>
              </button>
            )}

            <button
              onClick={() => {
                setAddFormSection(1);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Pekerja (Borang UNION)</span>
            </button>
          </div>
        )}
      </div>

      {/* Notification Toast for Credentials Changes */}
      {credentialsSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{credentialsSuccessMsg}</span>
          </div>
          <button onClick={() => setCredentialsSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar (Available for HR/Director) */}
      {isManagerOrHR && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIK, No. IC, atau jawatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Syarikat:</span>
            </div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">Semua Syarikat ({employees.length})</option>
              {COMPANIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Jabatan</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Status Filter: Aktif Sahaja vs Tidak Aktif / Resigned */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">Semua Status (Aktif & Resign)</option>
              <option value="active">🟢 Karyawan Aktif Sahaja</option>
              <option value="inactive">🔴 Karyawan Tidak Aktif (Resign)</option>
            </select>

            {/* Toggle Show Credentials in Table */}
            <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer ml-auto bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={showCredentialsInTable}
                onChange={(e) => setShowCredentialsInTable(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Papar Emel & Katalaluan</span>
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Employees Table (High density tabular view) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                <th className="py-3.5 px-4">Pekerja & NIK</th>
                <th className="py-3.5 px-4">Syarikat & Jabatan</th>
                <th className="py-3.5 px-4">Status & Surat/Kontrak</th>
                <th className="py-3.5 px-4">No. IC / Pasport</th>
                {showCredentialsInTable && (
                  <th className="py-3.5 px-4 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                    Info Log Masuk (Emel / Katalaluan)
                  </th>
                )}
                <th className="py-3.5 px-4">Gaji Pokok & Penukaran (MYR)</th>
                <th className="py-3.5 px-4 text-center">Status Statutori</th>
                <th className="py-3.5 px-4 text-center">Baki Cuti</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={showCredentialsInTable ? 9 : 8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    Tiada rekod pekerja dijumpai.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const salaryMYREquivalent = convertToMYR(emp.baseSalary, emp.originalCurrency, emp.exchangeRateToMYR);
                  return (
                    <tr 
                      key={emp.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Avatar & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group/avatar">
                            {emp.avatarUrl ? (
                              <img
                                src={emp.avatarUrl}
                                alt={emp.namaLengkap}
                                className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
                                {emp.namaLengkap.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            {/* Gallery Upload Trigger overlay button */}
                            {(isManagerOrHR || emp.id === activeUser.id) && (
                              <button
                                type="button"
                                onClick={() => triggerGalleryUpload(emp.id)}
                                className="absolute inset-0 bg-black/40 text-white rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity"
                                title="Muat naik gambar dari galeri"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {emp.namaLengkap}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {emp.nik} · {emp.jabatan}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Company & Department */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900 dark:text-slate-200">
                          {emp.company}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {emp.departemen} · {emp.jenisKontrak}
                        </p>
                      </td>

                      {/* Status & Contract/Offering Documents */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {emp.statusAktif === false || !!emp.resignationDetails?.isResigned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              <UserX className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              <span>Tidak Aktif (Resigned)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Aktif Bekerja</span>
                            </span>
                          )}

                          {/* Quick Document Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setContractTargetEmpId(emp.id);
                              setIsContractModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-100 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 transition-colors"
                            title="Lihat / Muat Naik Surat Tawaran (Offering Letter) & Kontrak Pekerja"
                          >
                            <FileText className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>
                              {emp.contractDocuments && emp.contractDocuments.length > 0 
                                ? `${emp.contractDocuments.length} Fail Kontrak` 
                                : '+ Muat Naik Surat'}
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* IC / Passport */}
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {emp.icNumber}
                      </td>

                      {/* Credentials (Email & Password) - Visible if checked by HR */}
                      {showCredentialsInTable && (
                        <td className="py-3 px-4 font-mono text-[11px] bg-amber-50/20 dark:bg-amber-950/10">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[140px] font-medium">{emp.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(emp.email, `email-${emp.id}`)}
                                className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Salin Emel"
                              >
                                {copiedId === `email-${emp.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="font-bold tracking-wider">
                                {revealedPasswords[emp.id] ? (emp.password || 'password123') : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setRevealedPasswords(prev => ({ ...prev, [emp.id]: !prev[emp.id] }))}
                                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                title={revealedPasswords[emp.id] ? 'Sembunyi Kata Laluan' : 'Papar Kata Laluan'}
                              >
                                {revealedPasswords[emp.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(emp.password || 'password123', `pass-${emp.id}`)}
                                className="p-0.5 text-slate-400 hover:text-indigo-600"
                                title="Salin Kata Laluan"
                              >
                                {copiedId === `pass-${emp.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCredentialsEmployee(emp)}
                                className="text-[10px] text-amber-600 hover:text-amber-700 underline font-semibold ml-0.5"
                                title="Tukar Kata Laluan"
                              >
                                Tukar
                              </button>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Salary & Currency Conversion */}
                      <td className="py-3 px-4">
                        <p className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrencyAmount(emp.baseSalary, emp.originalCurrency)}
                        </p>
                        {emp.originalCurrency !== 'MYR' && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                            ≈ {formatMYR(salaryMYREquivalent)} (Tukaran ke MYR)
                          </p>
                        )}
                      </td>

                      {/* Remote Outside Malaysia / Statutory Status */}
                      <td className="py-3 px-4 text-center">
                        {emp.isRemoteOutsideMalaysia ? (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            Remote Luar Negara (Dikecualikan KWSP/PERKESO)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            Caruman Statutori Aktif
                          </span>
                        )}
                      </td>

                      {/* Leave Balances */}
                      <td className="py-3 px-4 text-center font-mono tabular-nums">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {emp.leaveBalances.annualQuota - emp.leaveBalances.annualUsed}
                        </span>
                        <span className="text-slate-400 text-[11px]"> / {emp.leaveBalances.annualQuota} hr</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isManagerOrHR && (
                            <>
                              {/* Offering Letter & Contract Documents button */}
                              <button
                                onClick={() => {
                                  setContractTargetEmpId(emp.id);
                                  setIsContractModalOpen(true);
                                }}
                                className="p-1.5 text-sky-600 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-md transition-colors"
                                title="Muat Naik / Arkib Surat Tawaran & Kontrak"
                              >
                                <UploadCloud className="w-4 h-4" />
                              </button>

                              {/* Resign Action: If active, prompt resign; if resigned, view letter */}
                              {emp.statusAktif === false || !!emp.resignationDetails?.isResigned ? (
                                <button
                                  onClick={() => {
                                    setSelectedResignEmployee(emp);
                                    setIsResignModalOpen(true);
                                  }}
                                  className="p-1.5 text-rose-600 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                                  title="Lihat Surat Resign Rasmi & Handover"
                                >
                                  <FileSignature className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedResignEmployee(emp);
                                    setIsResignModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors"
                                  title="Proses Resign & Jana Surat Otomatis"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => setEditingCredentialsEmployee(emp)}
                                className="p-1.5 text-amber-600 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md transition-colors"
                                title="Akses & Tukar Info Log Masuk (Emel & Kata Laluan)"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setEditFormSection(1);
                                  setEditingEmployee(emp);
                                }}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                title="Sunting Biodata & Profil Karyawan (Akses HR)"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleOpenDetailModal(emp)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Buka Profil Lengkap & Selaras Baki Cuti"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onViewPayslip(emp)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Lihat Slip Gaji Rasmi"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Detail Profil Karyawan & Manual Leave Balances Adjustment */}
      {selectedEmployeeForDetail && editableLeaveBalances && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative group/avatar">
                  {selectedEmployeeForDetail.avatarUrl ? (
                    <img
                      src={selectedEmployeeForDetail.avatarUrl}
                      alt={selectedEmployeeForDetail.namaLengkap}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-lg flex items-center justify-center">
                      {selectedEmployeeForDetail.namaLengkap.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => triggerGalleryUpload(selectedEmployeeForDetail.id)}
                    className="absolute inset-0 bg-black/40 text-white rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity"
                    title="Tukar foto profil dari galeri"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedEmployeeForDetail.namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {selectedEmployeeForDetail.company} · {selectedEmployeeForDetail.nik}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmployeeForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* SECTION: BAKI & KUOTA CUTI (LEAVE BALANCES) - WITH HR MANUAL ADJUSTMENT */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                      Pengurusan Baki Kuota Cuti (Leave Balances)
                    </h4>
                  </div>
                  {isManagerOrHR && (
                    <span className="text-[10px] text-slate-500">
                      *HRD boleh mengubah kuota tahunan/perubatan secara manual
                    </span>
                  )}
                </div>

                {leaveAdjustSuccess && (
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Baki kuota cuti pekerja berjaya dikemaskini oleh HRD!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Cuti Tahunan */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                      Cuti Tahunan (Annual Leave)
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Baki Semasa:</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        {editableLeaveBalances.annualQuota - editableLeaveBalances.annualUsed} Hari
                      </span>
                    </div>

                    {isManagerOrHR ? (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="text-slate-400">Jumlah Kuota:</label>
                          <input
                            type="number"
                            min="0"
                            value={editableLeaveBalances.annualQuota}
                            onChange={(e) => setEditableLeaveBalances({
                              ...editableLeaveBalances,
                              annualQuota: Number(e.target.value)
                            })}
                            className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400">Telah Diguna:</label>
                          <input
                            type="number"
                            min="0"
                            value={editableLeaveBalances.annualUsed}
                            onChange={(e) => setEditableLeaveBalances({
                              ...editableLeaveBalances,
                              annualUsed: Number(e.target.value)
                            })}
                            className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center font-mono font-bold"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        {editableLeaveBalances.annualUsed} hari telah digunakan daripada {editableLeaveBalances.annualQuota} hari
                      </p>
                    )}
                  </div>

                  {/* Cuti Sakit (MC) */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                      Cuti Sakit (Medical / MC)
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Baki Semasa:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {editableLeaveBalances.medicalQuota - editableLeaveBalances.medicalUsed} Hari
                      </span>
                    </div>

                    {isManagerOrHR ? (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="text-slate-400">Jumlah Kuota:</label>
                          <input
                            type="number"
                            min="0"
                            value={editableLeaveBalances.medicalQuota}
                            onChange={(e) => setEditableLeaveBalances({
                              ...editableLeaveBalances,
                              medicalQuota: Number(e.target.value)
                            })}
                            className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400">Telah Diguna:</label>
                          <input
                            type="number"
                            min="0"
                            value={editableLeaveBalances.medicalUsed}
                            onChange={(e) => setEditableLeaveBalances({
                              ...editableLeaveBalances,
                              medicalUsed: Number(e.target.value)
                            })}
                            className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center font-mono font-bold"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        {editableLeaveBalances.medicalUsed} hari telah diguna
                      </p>
                    )}
                  </div>

                  {/* Cuti Kecemasan */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                      Cuti Kecemasan (Emergency)
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Baki Semasa:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {editableLeaveBalances.emergencyQuota - editableLeaveBalances.emergencyUsed} Hari
                      </span>
                    </div>

                    {isManagerOrHR ? (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="text-slate-400">Jumlah Kuota:</label>
                          <input
                            type="number"
                            min="0"
                            value={editableLeaveBalances.emergencyQuota}
                            onChange={(e) => setEditableLeaveBalances({
                              ...editableLeaveBalances,
                              emergencyQuota: Number(e.target.value)
                            })}
                            className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400">Telah Diguna:</label>
                          <input
                            type="number"
                            min="0"
                            value={editableLeaveBalances.emergencyUsed}
                            onChange={(e) => setEditableLeaveBalances({
                              ...editableLeaveBalances,
                              emergencyUsed: Number(e.target.value)
                            })}
                            className="w-full mt-0.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center font-mono font-bold"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        {editableLeaveBalances.emergencyUsed} hari telah diguna
                      </p>
                    )}
                  </div>

                </div>

                {isManagerOrHR && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveLeaveBalances}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Pelarasan Kuota Cuti</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION: NOMBOR BERKANUN RASMI & GAJI */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
                  Nombor Berkanun & Struktur Gaji (KWSP, PERKESO, LHDN)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <p className="text-slate-400 text-[11px]">Gaji Pokok & Mata Wang Asal</p>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {formatCurrencyAmount(selectedEmployeeForDetail.baseSalary, selectedEmployeeForDetail.originalCurrency)}
                    </p>
                    {selectedEmployeeForDetail.originalCurrency !== 'MYR' && (
                      <p className="text-[11px] text-emerald-600 font-mono mt-0.5">
                        Nilai Setara: {formatMYR(convertToMYR(selectedEmployeeForDetail.baseSalary, selectedEmployeeForDetail.originalCurrency, selectedEmployeeForDetail.exchangeRateToMYR))} (Kadar: {selectedEmployeeForDetail.exchangeRateToMYR})
                      </p>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    <p className="text-slate-400 text-[11px]">Status Caruman Statutori</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-xs mt-0.5">
                      {selectedEmployeeForDetail.isRemoteOutsideMalaysia 
                        ? 'Dikecualikan (Remote Luar Malaysia - Zero EPF/SOCSO/EIS)' 
                        : 'Tertakluk Akta KWSP, PERKESO & EIS Malaysia'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[11px]">No. Ahli KWSP / EPF</p>
                    <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedEmployeeForDetail.epfNumber || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[11px]">No. Pendaftaran PERKESO / SOCSO</p>
                    <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedEmployeeForDetail.socsoNumber || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[11px]">No. Cukai Pendapatan LHDN / NPWP</p>
                    <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedEmployeeForDetail.taxNumber || '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[11px]">Maklumat Akaun Bank Penyalur</p>
                    <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedEmployeeForDetail.namaBank} · {selectedEmployeeForDetail.noRekening}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION: KONTAK KECEMASAN & ALAMAT */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800">
                  Waris Kecemasan & Domisili
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-[11px]">Nama Kontak Waris Kecemasan</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedEmployeeForDetail.kontakKecemasanNama} ({selectedEmployeeForDetail.kontakKecemasanHubungan})
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[11px]">No. Telefon Waris</p>
                    <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedEmployeeForDetail.kontakKecemasanNoHp}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-slate-400 text-[11px]">Alamat Surat-Menyurat / Kediaman</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedEmployeeForDetail.alamat}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onViewPayslip(selectedEmployeeForDetail);
                    setSelectedEmployeeForDetail(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <FileText className="w-4 h-4" />
                  <span>Buka Slip Gaji Rasmi</span>
                </button>

                {isManagerOrHR && (
                  <button
                    onClick={() => {
                      setEditingEmployee(selectedEmployeeForDetail);
                      setSelectedEmployeeForDetail(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Sunting Biodata & Profil</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedEmployeeForDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Tambah Karyawan Baru (Borang Pendaftaran Rasmi UNION / Solusi Serumpun) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Borang Pendaftaran Pengguna Baru (UNION)
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Standard PDF Rasmi
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sila lengkapkan 5 bahagian pendaftaran untuk Pustaka Union atau Solusi Serumpun Senusantara
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Tabs Navigation (5 Sections per PDF) */}
            <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 shrink-0 overflow-x-auto flex gap-2">
              {[
                { id: 1, title: '1. Personal Info' },
                { id: 2, title: '2. Children Info' },
                { id: 3, title: '3. Employment' },
                { id: 4, title: '4. Payroll & Leave' },
                { id: 5, title: '5. Statutory & Tax' },
              ].map(sec => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setAddFormSection(sec.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    addFormSection === sec.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {sec.title}
                </button>
              ))}
            </div>

            {/* Form */}
            <form
              id="addEmployeeForm"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const companyVal: CompanyName = form.company.value;
                const isRemote = form.isRemote?.checked || false;
                const curr: CurrencyCode = form.currency?.value || 'MYR';

                const newEmp: Employee = {
                  id: `emp-${Date.now()}`,
                  company: companyVal,
                  nik: form.nik?.value || `STAFF-${Date.now().toString().slice(-4)}`,
                  namaLengkap: form.namaLengkap.value,
                  icNumber: form.icNumber.value,
                  email: form.email.value,
                  password: form.password?.value || 'password123',
                  noHp: form.noHp.value,
                  role: form.role.value as UserRole,
                  jabatan: form.jabatan.value,
                  departemen: form.departemen.value as Department,
                  jenisKontrak: form.jenisKontrak.value as EmploymentType,
                  tanggalBergabung: form.tanggalBergabung.value || new Date().toISOString().split('T')[0],
                  salaryScheme: form.salaryScheme?.value || 'Bulanan (Monthly)',
                  baseSalary: Number(form.baseSalary?.value) || (form.salaryScheme?.value === 'Per Jam (Hourly)' ? 0 : 3500),
                  hourlyRateMYR: Number(form.hourlyRate?.value) || 18.00,
                  originalCurrency: curr,
                  exchangeRateToMYR: curr === 'IDR' ? 0.000282 : curr === 'USD' ? 4.45 : 1.0,
                  monthlyAllowanceMYR: Number(form.allowance?.value) || 0,
                  isRemoteOutsideMalaysia: isRemote,
                  isExemptStatutory: form.isExemptStatutory?.checked || isRemote,
                  epfNumber: (isRemote || form.isExemptStatutory?.checked) ? 'DIKECUALIKAN' : form.epfNumber?.value || 'EPF-PENDING',
                  socsoNumber: (isRemote || form.isExemptStatutory?.checked) ? 'DIKECUALIKAN' : form.socsoNumber?.value || 'SOC-PENDING',
                  taxNumber: form.taxNumber?.value || '-',
                  namaBank: form.namaBank?.value === 'Lainnya' ? form.namaBankCustom?.value || 'Lainnya' : form.namaBank?.value || 'Maybank Berhad',
                  noRekening: form.noRekening?.value || '-',
                  alamat: form.alamat?.value || '-',
                  postcode: form.postcode?.value || '',
                  city: form.city?.value || '',
                  state: form.state?.value || '',
                  dob: form.dob?.value || '',
                  gender: form.gender?.value || 'Lelaki',
                  nationality: form.nationality?.value || 'Warganegara Malaysia',
                  hasDisability: form.hasDisability?.value === 'Ya',
                  maritalStatus: form.maritalStatus?.value || 'Bujang',
                  kontakKecemasanNama: form.kontakKecemasanNama?.value || '-',
                  kontakKecemasanNoHp: form.kontakKecemasanNoHp?.value || '-',
                  kontakKecemasanHubungan: form.kontakKecemasanHubungan?.value || 'Keluarga',
                  childrenUnder18_100: Number(form.childrenUnder18_100?.value) || 0,
                  childrenUnder18_50: Number(form.childrenUnder18_50?.value) || 0,
                  children18StudyingCert_100: Number(form.children18Cert_100?.value) || 0,
                  children18StudyingCert_50: Number(form.children18Cert_50?.value) || 0,
                  children18StudyingHigher_100: Number(form.children18Degree_100?.value) || 0,
                  children18StudyingHigher_50: Number(form.children18Degree_50?.value) || 0,
                  disabledChild_100: Number(form.childrenDisabled_100?.value) || 0,
                  disabledChild_50: Number(form.childrenDisabled_50?.value) || 0,
                  disabledChildHigher_100: Number(form.childrenDisabledDegree_100?.value) || 0,
                  disabledChildHigher_50: Number(form.childrenDisabledDegree_50?.value) || 0,
                  reportingTo: form.reportingTo?.value || 'Pengurusan Eksekutif',
                  basedLocation: form.basedLocation?.value || 'Ibu Pejabat (HQ)',
                  eligibleForEPF: form.eligibleForEPF?.value === 'Ya',
                  benefitsDescription: form.benefitsDescription?.value || '',
                  hospitalizationQuota: Number(form.hospitalizationQuota?.value) || 60,
                  maternityQuota: Number(form.maternityQuota?.value) || 98,
                  compassionateQuota: Number(form.compassionateQuota?.value) || 3,
                  isTP3Required: form.isTP3Required?.value === 'Ya',
                  skipBackgroundFill: form.skipBackgroundFill?.value === 'Ya',
                  taxLetters: form.taxLetters?.value || 'SG',
                  taxNumberMain: form.taxNumberMain?.value || '',
                  taxNumberLast: form.taxNumberLast?.value || '',
                  passportNumber: form.passportNumber?.value || '',
                  leaveBalances: {
                    annualQuota: Number(form.annualQuota?.value) || (form.salaryScheme?.value === 'Per Jam (Hourly)' ? 0 : 14),
                    annualUsed: 0,
                    medicalQuota: Number(form.medicalQuota?.value) || (form.salaryScheme?.value === 'Per Jam (Hourly)' ? 0 : 14),
                    medicalUsed: 0,
                    emergencyQuota: Number(form.emergencyQuota?.value) || (form.salaryScheme?.value === 'Per Jam (Hourly)' ? 0 : 4),
                    emergencyUsed: 0,
                    unpaidUsed: 0,
                  },
                  avatarUrl: '',
                  statusAktif: true,
                };

                onAddEmployee(newEmp);
                setIsAddModalOpen(false);
                setCredentialsSuccessMsg(`Pekerja baru ${newEmp.namaLengkap} berjaya didaftarkan bagi ${newEmp.company}! Kata laluan: ${newEmp.password}`);
                setTimeout(() => setCredentialsSuccessMsg(null), 8000);
              }}
              className="p-6 space-y-6 overflow-y-auto max-h-[72vh] text-xs"
            >
              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className={addFormSection === 1 ? 'space-y-4' : 'hidden'}>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Section 1: Personal Information & Login Access
                  </h4>
                </div>

                {/* Company Selection */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-2">
                    Syarikat Bertugas (Pustaka Union atau Solusi Serumpun) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedAddCompany === 'Pustaka Union' 
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20' 
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}>
                      <input 
                        type="radio" 
                        name="company" 
                        value="Pustaka Union" 
                        checked={selectedAddCompany === 'Pustaka Union'}
                        onChange={() => setSelectedAddCompany('Pustaka Union')}
                        className="text-sky-600 focus:ring-sky-500" 
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Pustaka Union</p>
                        <p className="text-[11px] text-slate-500">Penerbitan, Retail & Operasi Malaysia</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedAddCompany === 'Solusi Serumpun Senusantara SDN. BHD' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20' 
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}>
                      <input 
                        type="radio" 
                        name="company" 
                        value="Solusi Serumpun Senusantara SDN. BHD" 
                        checked={selectedAddCompany === 'Solusi Serumpun Senusantara SDN. BHD'}
                        onChange={() => setSelectedAddCompany('Solusi Serumpun Senusantara SDN. BHD')}
                        className="text-emerald-600 focus:ring-emerald-500" 
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">Solusi Serumpun Senusantara SDN. BHD</p>
                        <p className="text-[11px] text-slate-500">Penyelesaian IT, Serantau & Operasi</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Login Credentials: Email & Password */}
                <div className="bg-indigo-50/70 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      Akses Log Masuk Pekerja (Email & Kata Laluan)
                    </span>
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-400">
                      Boleh diubah oleh Ananda, Fatimah & Cheah Leong Tim pada bila-bila masa
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                        Emel Log Masuk Rasmi *
                      </label>
                      <input 
                        name="email" 
                        type="email" 
                        required 
                        placeholder={selectedAddCompany === 'Pustaka Union' ? 'nama@pustakaunion.com' : 'nama@solusiserumpun.com'}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-700 dark:text-slate-300 font-medium">
                          Kata Laluan (Password) *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const pwInput = document.getElementById('newEmployeePassword') as HTMLInputElement;
                            if (pwInput) {
                              pwInput.value = generatePassword(selectedAddCompany);
                            }
                          }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Jana Kata Laluan
                        </button>
                      </div>
                      <input 
                        id="newEmployeePassword"
                        name="password" 
                        type="text" 
                        required 
                        defaultValue={generatePassword(selectedAddCompany)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-indigo-700 dark:text-indigo-300" 
                      />
                    </div>
                  </div>
                </div>

                {/* Name, IC, Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Nama Lengkap (Name) *
                    </label>
                    <input name="namaLengkap" required placeholder="Nama penuh seperti KP / Pasport" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. KP / IC Number *
                    </label>
                    <input name="icNumber" required placeholder="cth: 920514-14-5567" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Phone # (No. Telefon) *
                    </label>
                    <input name="noHp" required placeholder="+60 1x-xxxxxxx" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                  </div>
                </div>

                {/* Address, Postcode, City, State */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Alamat Kediaman (Alamat) *
                  </label>
                  <textarea name="alamat" rows={2} required placeholder="No. Rumah, Jalan, Taman / Kawasan" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Poskod (Postcode) *
                    </label>
                    <input name="postcode" required placeholder="cth: 47100" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Bandar (City) *
                    </label>
                    <input name="city" required placeholder="cth: Puchong / Petaling Jaya" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Negeri (State) *
                    </label>
                    <input name="state" required placeholder="cth: Selangor / Kuala Lumpur" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                </div>

                {/* DOB, Gender, Nationality, Marital, Disability */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      D.O.B (Tarikh Lahir) *
                    </label>
                    <input name="dob" type="date" required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Jantina *
                    </label>
                    <select name="gender" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <option value="Lelaki">Lelaki (Male)</option>
                      <option value="Perempuan">Perempuan (Female)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Warganegara *
                    </label>
                    <select name="nationality" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <option value="Warganegara Malaysia">Warganegara Malaysia</option>
                      <option value="Warganegara Indonesia (WNI)">Warganegara Indonesia (WNI)</option>
                      <option value="Bukan Warganegara (Lain-lain)">Bukan Warganegara (Lain-lain)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Marital Status *
                    </label>
                    <select name="maritalStatus" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <option value="Bujang">Bujang (Single)</option>
                      <option value="Berkahwin">Berkahwin (Married)</option>
                      <option value="Duda">Duda (Widower)</option>
                      <option value="Janda">Janda (Widow)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Disability? (OKU) *
                    </label>
                    <select name="hasDisability" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <option value="Tidak">Tidak</option>
                      <option value="Ya">Ya (Kurang Upaya)</option>
                    </select>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Emergency Contact Person *
                    </label>
                    <input name="kontakKecemasanNama" required placeholder="Nama Waris Kecemasan" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Emergency Contact # *
                    </label>
                    <input name="kontakKecemasanNoHp" required placeholder="+60 1x-xxxxxxx" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Hubungan Waris *
                    </label>
                    <input name="kontakKecemasanHubungan" required defaultValue="Keluarga" placeholder="cth: Suami / Isteri / Ibu" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: CHILDREN INFORMATION */}
              <div className={addFormSection === 2 ? 'space-y-4' : 'hidden'}>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Section 2: Children Information (Single Status Children Only)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Diperlukan untuk pengiraan potongan cukai bulanan berjadual (PCB) LHDN mengikut pelepasan 100% atau 50%
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <Baby className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Isikan bilangan anak bagi setiap kategori pelepasan cukai. Pilih sama ada potongan penuh (100%) dituntut oleh pekerja ini atau dikongsi bersama pasangan (50%).
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 items-center">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Anak Bawah 18 Tahun</p>
                      <p className="text-[10px] text-slate-500">Under 18 years old</p>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">100% Tuntutan (Bil. Anak)</label>
                      <input name="childrenUnder18_100" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">50% Tuntutan (Bil. Anak)</label>
                      <input name="childrenUnder18_50" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 items-center">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Anak 18+ Belajar Sijil / Matrikulasi</p>
                      <p className="text-[10px] text-slate-500">18+ studying cert/matrix</p>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">100% Tuntutan</label>
                      <input name="children18Cert_100" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">50% Tuntutan</label>
                      <input name="children18Cert_50" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 items-center">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Anak 18+ Belajar Diploma / Ijazah</p>
                      <p className="text-[10px] text-slate-500">Above 18 diploma/degree</p>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">100% Tuntutan</label>
                      <input name="children18Degree_100" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">50% Tuntutan</label>
                      <input name="children18Degree_50" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 items-center">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Anak Kurang Upaya (Disabled child)</p>
                      <p className="text-[10px] text-slate-500">OKU</p>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">100% Tuntutan</label>
                      <input name="childrenDisabled_100" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">50% Tuntutan</label>
                      <input name="childrenDisabled_50" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 items-center">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Anak OKU Belajar Diploma / Ijazah</p>
                      <p className="text-[10px] text-slate-500">Disabled child diploma/degree</p>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">100% Tuntutan</label>
                      <input name="childrenDisabledDegree_100" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">50% Tuntutan</label>
                      <input name="childrenDisabledDegree_50" type="number" min="0" defaultValue="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: EMPLOYMENT & ORGANIZATION DETAILS */}
              <div className={addFormSection === 3 ? 'space-y-4' : 'hidden'}>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Section 3: Employment & Organization Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. NIK / ID Pekerja *
                    </label>
                    <input name="nik" placeholder="cth: PU-2027-019" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Division / Departemen *
                    </label>
                    <select name="departemen" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Job Type (Jenis Kontrak) *
                    </label>
                    <select name="jenisKontrak" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <option value="Tetap">Tetap (Permanent)</option>
                      <option value="Kontrak">Kontrak (Contract)</option>
                      <option value="Percubaan">Percubaan (Probation)</option>
                      <option value="Sambilan">Sambilan (Part-time)</option>
                      <option value="Internship">Internship / Pelatih</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Jawatan / Designation *
                    </label>
                    <input name="jabatan" required placeholder="cth: Eksekutif Pemasaran / Retail Associate" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Reporting To (Melapor Kepada) *
                    </label>
                    <input name="reportingTo" required defaultValue="Pengarah Urusan / Ketua Jabatan" placeholder="cth: Cheah Leong Tim / Siti Fatimah" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Sys. Role (Peranan Sistem) *
                    </label>
                    <select name="role" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                      <option value="Karyawan">Karyawan (Staf Standard)</option>
                      <option value="HRD">HRD / Pentadbir HR (Akses Urus Pengguna)</option>
                      <option value="Director">Director / Pihak Pengurusan</option>
                      <option value="CS Specialist">CS Specialist (Modul CS)</option>
                      <option value="Retail Staff">Retail Staff (Modul Retail)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Based Location (Lokasi Asas) *
                    </label>
                    <input name="basedLocation" required defaultValue="Ibu Pejabat Puchong" placeholder="cth: HQ Puchong / Cawangan Retail" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Layak Untuk KWSP? *
                    </label>
                    <select name="eligibleForEPF" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <option value="Ya">Ya (Wajib KWSP Malaysia)</option>
                      <option value="Tidak">Tidak (Dikecualikan / Luar Malaysia)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Tarikh Mula Bekerja *
                    </label>
                    <input name="tanggalBergabung" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                    <input type="checkbox" name="isRemote" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                    <span>Bekerja Jauh (Remote) Luar Malaysia (cth: Indonesia)?</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                    <input type="checkbox" name="isExemptStatutory" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                    <span>Pengecualian Potongan Statutori Malaysia (Exempt KWSP, SOCSO, EIS)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Benefits / Faedah Tambahan
                  </label>
                  <textarea name="benefitsDescription" rows={2} placeholder="cth: Elaun telefon RM100, elaun perjalanan, perlindungan insurans kelompok..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                </div>
              </div>

              {/* SECTION 4: PAYROLL & LEAVE ENTITLEMENTS */}
              <div className={addFormSection === 4 ? 'space-y-4' : 'hidden'}>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    4
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Section 4: Payroll & Leave Entitlements
                  </h4>
                </div>

                {/* Salary Scheme & Base */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Salary Type (Skim Gaji) *
                    </label>
                    <select name="salaryScheme" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                      <option value="Bulanan (Monthly)">Bulanan (Monthly)</option>
                      <option value="Per Jam (Hourly)">Per Jam (Hourly)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Mata Wang Asal *
                    </label>
                    <select name="currency" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold">
                      <option value="MYR">MYR (Ringgit Malaysia)</option>
                      <option value="IDR">IDR (Rupiah Indonesia)</option>
                      <option value="USD">USD (Dolar AS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Gaji Pokok (Base Salary)
                    </label>
                    <input name="baseSalary" type="number" defaultValue="3500" step="50" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Elaun Bulanan (MYR)
                    </label>
                    <input name="allowance" type="number" defaultValue="200" step="50" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                  </div>
                </div>

                {/* Bank Account */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Bank Name (Nama Bank) *
                    </label>
                    <select name="namaBank" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                      {MALAYSIAN_BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Bank Acct Number (No. Akaun Bank) *
                    </label>
                    <input name="noRekening" required placeholder="cth: 164285920194" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold" />
                  </div>
                </div>

                {/* Leave Quotas per PDF */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    Kelayakan Cuti Tahunan (Leave Entitlements):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Annual Leave (Hari)</label>
                      <input name="annualQuota" type="number" defaultValue="14" min="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Medical Leave (Hari)</label>
                      <input name="medicalQuota" type="number" defaultValue="14" min="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Hospitalization Leave</label>
                      <input name="hospitalizationQuota" type="number" defaultValue="60" min="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Maternity Leave (Hari)</label>
                      <input name="maternityQuota" type="number" defaultValue="98" min="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Compassionate Leave</label>
                      <input name="compassionateQuota" type="number" defaultValue="3" min="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">Emergency Leave (Hari)</label>
                      <input name="emergencyQuota" type="number" defaultValue="4" min="0" className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-center font-bold" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: STATUTORY & TAX INFORMATION */}
              <div className={addFormSection === 5 ? 'space-y-4' : 'hidden'}>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    5
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Section 5: Statutory & Tax Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Is a TP3 required? *
                    </label>
                    <select name="isTP3Required" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                      <option value="Tidak">Tidak (No)</option>
                      <option value="Ya">Ya (Borang TP3 Diperlukan)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Borang maklumat saraan majikan terdahulu dalam tahun semasa</p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Skip background fill? *
                    </label>
                    <select name="skipBackgroundFill" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium">
                      <option value="Tidak">Tidak (Lengkapkan tapisan)</option>
                      <option value="Ya">Ya (Langkau tapisan latar belakang)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">Pilihan tapisan rekod rujukan</p>
                  </div>
                </div>

                {/* Nombor Cukai Pendapatan: Letters, Number-without last one, Number-last one only */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold">
                    Nombor Cukai Pendapatan (LHDN Income Tax No.) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Letters (cth: SG / OG / C)</label>
                      <input name="taxLetters" defaultValue="SG" placeholder="SG" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold uppercase" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Number - without last one</label>
                      <input name="taxNumberMain" placeholder="cth: 12345678" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Number - last one only</label>
                      <input name="taxNumberLast" placeholder="cth: 0" maxLength={2} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-center font-bold" />
                    </div>
                  </div>
                </div>

                {/* Passport, KWSP, SOCSO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Nombor Pasport (jika bukan warganegara)
                    </label>
                    <input name="passportNumber" placeholder="A12345678" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. Ahli KWSP / EPF
                    </label>
                    <input name="epfNumber" placeholder="EPF-xxxxxxx" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. Pendaftaran PERKESO / SOCSO
                    </label>
                    <input name="socsoNumber" placeholder="SOC-xxxxxxx" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono" />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sticky bottom-0 bg-white dark:bg-slate-900 py-2">
                <div className="flex gap-2">
                  {addFormSection > 1 && (
                    <button
                      type="button"
                      onClick={() => setAddFormSection(prev => Math.max(1, prev - 1))}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      ← Bahagian Sebelumnya
                    </button>
                  )}
                  {addFormSection < 5 && (
                    <button
                      type="button"
                      onClick={() => setAddFormSection(prev => Math.min(5, prev + 1))}
                      className="px-3.5 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors"
                    >
                      Seterusnya: Bahagian {addFormSection + 1} →
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar Pekerja Rasmi</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: Sunting Profil & Biodata Karyawan (Akses HR / Pentadbir) */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Sunting Biodata: {editingEmployee.namaLengkap}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                      Akses HR Rasmi
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    ID: {editingEmployee.id} · NIK: {editingEmployee.nik} · {editingEmployee.company}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const updated: Employee = {
                  ...editingEmployee,
                  namaLengkap: form.namaLengkap.value,
                  nik: form.nik.value,
                  icNumber: form.icNumber.value,
                  email: form.email.value,
                  password: form.password?.value || editingEmployee.password || 'password123',
                  noHp: form.noHp.value,
                  role: form.role.value as UserRole,
                  statusAktif: form.statusAktif.value === 'true',
                  company: form.company.value as CompanyName,
                  departemen: form.departemen.value as Department,
                  jabatan: form.jabatan.value,
                  jenisKontrak: form.jenisKontrak.value as EmploymentType,
                  tanggalBergabung: form.tanggalBergabung.value,
                  salaryScheme: form.salaryScheme.value,
                  baseSalary: Number(form.baseSalary.value) || 0,
                  hourlyRateMYR: Number(form.hourlyRateMYR?.value) || 0,
                  originalCurrency: form.originalCurrency.value as CurrencyCode,
                  exchangeRateToMYR: Number(form.exchangeRateToMYR.value) || 1.0,
                  monthlyAllowanceMYR: Number(form.monthlyAllowanceMYR.value) || 0,
                  isRemoteOutsideMalaysia: form.isRemoteOutsideMalaysia.checked,
                  isExemptStatutory: form.isExemptStatutory.checked,
                  namaBank: form.namaBank.value,
                  noRekening: form.noRekening.value,
                  epfNumber: form.epfNumber.value,
                  socsoNumber: form.socsoNumber.value,
                  taxNumber: form.taxNumber.value,
                  kontakKecemasanNama: form.kontakKecemasanNama.value,
                  kontakKecemasanHubungan: form.kontakKecemasanHubungan.value,
                  kontakKecemasanNoHp: form.kontakKecemasanNoHp.value,
                  alamat: form.alamat.value,
                  postcode: form.postcode?.value ?? editingEmployee.postcode,
                  city: form.city?.value ?? editingEmployee.city,
                  state: form.state?.value ?? editingEmployee.state,
                  dob: form.dob?.value ?? editingEmployee.dob,
                  gender: form.gender?.value ?? editingEmployee.gender,
                  nationality: form.nationality?.value ?? editingEmployee.nationality,
                  maritalStatus: form.maritalStatus?.value ?? editingEmployee.maritalStatus,
                  hasDisability: form.hasDisability ? (form.hasDisability.value === 'Ya') : editingEmployee.hasDisability,
                  reportingTo: form.reportingTo?.value ?? editingEmployee.reportingTo,
                  basedLocation: form.basedLocation?.value ?? editingEmployee.basedLocation,
                  benefitsDescription: form.benefitsDescription?.value ?? editingEmployee.benefitsDescription,
                  hospitalizationQuota: Number(form.hospitalizationQuota?.value) || editingEmployee.hospitalizationQuota || 60,
                  maternityQuota: Number(form.maternityQuota?.value) || editingEmployee.maternityQuota || 98,
                  compassionateQuota: Number(form.compassionateQuota?.value) || editingEmployee.compassionateQuota || 3,
                  leaveBalances: {
                    ...editingEmployee.leaveBalances,
                    annualQuota: Number(form.annualQuota.value) || editingEmployee.leaveBalances.annualQuota,
                    medicalQuota: Number(form.medicalQuota.value) || editingEmployee.leaveBalances.medicalQuota,
                    emergencyQuota: Number(form.emergencyQuota.value) || editingEmployee.leaveBalances.emergencyQuota,
                  }
                };

                onUpdateEmployee(updated);
                setEditingEmployee(null);
                setCredentialsSuccessMsg(`Biodata dan info log masuk untuk ${updated.namaLengkap} berjaya dikemaskini!`);
                setTimeout(() => setCredentialsSuccessMsg(null), 6000);
                setEditingEmployee(null);
              }}
              className="flex-1 overflow-y-auto p-6 space-y-6 text-xs"
            >
              {/* SECTION 1: PROFIL & MAKLUMAT PERIBADI */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>1. Maklumat Peribadi & Log Masuk</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Nama Penuh (Mengikut Kad Pengenalan / Pasport) *
                    </label>
                    <input
                      name="namaLengkap"
                      defaultValue={editingEmployee.namaLengkap}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. NIK / Staff ID *
                    </label>
                    <input
                      name="nik"
                      defaultValue={editingEmployee.nik}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. Kad Pengenalan (IC) / Pasport *
                    </label>
                    <input
                      name="icNumber"
                      defaultValue={editingEmployee.icNumber}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Emel Rasmi / Log Masuk *
                    </label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={editingEmployee.email}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 dark:text-slate-300 font-medium">
                        Kata Laluan (Password) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const pwInput = document.getElementById('editEmployeePasswordInput') as HTMLInputElement;
                          if (pwInput) {
                            pwInput.value = generatePassword(editingEmployee.company);
                          }
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className="w-3 h-3" /> Jana Baru
                      </button>
                    </div>
                    <input
                      id="editEmployeePasswordInput"
                      name="password"
                      type="text"
                      defaultValue={editingEmployee.password || 'password123'}
                      required
                      className="w-full px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-900 dark:text-indigo-200 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Nombor Telefon Bimbit *
                    </label>
                    <input
                      name="noHp"
                      defaultValue={editingEmployee.noHp}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Peranan Sistem (Role)
                    </label>
                    <select
                      name="role"
                      defaultValue={editingEmployee.role}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Employee">Staf Biasa (Employee)</option>
                      <option value="HRD">Pengurus HR (HRD)</option>
                      <option value="Director">Pengarah Eksekutif (Director)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Status Pekerja
                    </label>
                    <select
                      name="statusAktif"
                      defaultValue={editingEmployee.statusAktif ? 'true' : 'false'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="true">Aktif Berkhidmat</option>
                      <option value="false">Tidak Aktif / Ditamatkan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Tarikh Mula Berkhidmat
                    </label>
                    <input
                      name="tanggalBergabung"
                      type="date"
                      defaultValue={editingEmployee.tanggalBergabung}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: JAWATAN & PENEMPATAN */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>2. Syarikat, Jabatan & Kontrak</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Entiti Syarikat
                    </label>
                    <select
                      name="company"
                      defaultValue={editingEmployee.company}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {COMPANIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Jabatan (Department)
                    </label>
                    <select
                      name="departemen"
                      defaultValue={editingEmployee.departemen}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Gelaran Jawatan (Position Title)
                    </label>
                    <input
                      name="jabatan"
                      defaultValue={editingEmployee.jabatan}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Jenis Kontrak
                    </label>
                    <select
                      name="jenisKontrak"
                      defaultValue={editingEmployee.jenisKontrak}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Tetap (Permanent)">Tetap (Permanent)</option>
                      <option value="Kontrak (Contract)">Kontrak (Contract)</option>
                      <option value="Percubaan (Probation)">Percubaan (Probation)</option>
                      <option value="Pekerja Sambilan (Temp / Hourly)">Pekerja Sambilan (Temp / Hourly)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: STRUKTUR GAJI & ELAUN */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>3. Skim Gaji, Mata Wang Asal & Pengecualian Statutori</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Skim Pembayaran Gaji
                    </label>
                    <select
                      name="salaryScheme"
                      defaultValue={editingEmployee.salaryScheme || 'Bulanan (Monthly)'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Bulanan (Monthly)">Bulanan (Monthly)</option>
                      <option value="Per Jam (Hourly)">Per Jam (Hourly) - Cth: Sambilan / Retail</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Gaji Pokok (Base Salary)
                    </label>
                    <input
                      name="baseSalary"
                      type="number"
                      step="any"
                      defaultValue={editingEmployee.baseSalary}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Kadar Sejam MYR (Jika Per Jam)
                    </label>
                    <input
                      name="hourlyRateMYR"
                      type="number"
                      step="0.01"
                      defaultValue={editingEmployee.hourlyRateMYR || 18.00}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Mata Wang Asal Kontrak
                    </label>
                    <select
                      name="originalCurrency"
                      defaultValue={editingEmployee.originalCurrency || 'MYR'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MYR">MYR (Ringgit Malaysia)</option>
                      <option value="IDR">IDR (Rupiah Indonesia)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="SGD">SGD (Singapore Dollar)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Kadar Tukaran ke MYR
                    </label>
                    <input
                      name="exchangeRateToMYR"
                      type="number"
                      step="0.000001"
                      defaultValue={editingEmployee.exchangeRateToMYR || 1.0}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Elaun Tetap Bulanan (MYR)
                    </label>
                    <input
                      name="monthlyAllowanceMYR"
                      type="number"
                      step="any"
                      defaultValue={editingEmployee.monthlyAllowanceMYR || 0}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Statutory Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isRemoteOutsideMalaysia"
                      defaultChecked={editingEmployee.isRemoteOutsideMalaysia}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Pekerja Remote Luar Malaysia</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pekerja berpusat di luar negara (cth: Indonesia/Ananda). Tiada caruman KWSP/PERKESO statutori Malaysia ditolak.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isExemptStatutory"
                      defaultChecked={editingEmployee.isExemptStatutory}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">Pengecualian Statutori Khas</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Kecualikan potongan KWSP/SOCSO/EIS (Cth: staf sambilan bertempoh pendek).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* SECTION 4: PERBANKAN & NOMBOR STATUTORI RASMI */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>4. Maklumat Akaun Bank & Nombor Statutori (KWSP, SOCSO, LHDN)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Nama Bank Penyalur
                    </label>
                    <input
                      name="namaBank"
                      defaultValue={editingEmployee.namaBank}
                      placeholder="cth: Maybank Berhad / RHB"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Nombor Akaun Bank
                    </label>
                    <input
                      name="noRekening"
                      defaultValue={editingEmployee.noRekening}
                      placeholder="Nombor akaun bank"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. Ahli KWSP / EPF
                    </label>
                    <input
                      name="epfNumber"
                      defaultValue={editingEmployee.epfNumber}
                      placeholder="cth: EPF-82019283"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. Pendaftaran PERKESO / SOCSO
                    </label>
                    <input
                      name="socsoNumber"
                      defaultValue={editingEmployee.socsoNumber}
                      placeholder="cth: SOC-910293"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. Cukai Pendapatan LHDN / NPWP
                    </label>
                    <input
                      name="taxNumber"
                      defaultValue={editingEmployee.taxNumber}
                      placeholder="cth: SG-10293847"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: WARIS KECEMASAN & ALAMAT */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>5. Kontak Kecemasan & Alamat Domisili</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Nama Waris Kecemasan
                    </label>
                    <input
                      name="kontakKecemasanNama"
                      defaultValue={editingEmployee.kontakKecemasanNama}
                      placeholder="Nama waris"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Hubungan Waris
                    </label>
                    <input
                      name="kontakKecemasanHubungan"
                      defaultValue={editingEmployee.kontakKecemasanHubungan}
                      placeholder="cth: Isteri / Suami / Ibu / Bapa"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      No. Telefon Waris
                    </label>
                    <input
                      name="kontakKecemasanNoHp"
                      defaultValue={editingEmployee.kontakKecemasanNoHp}
                      placeholder="+60 1x-xxxxxxx"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Alamat Kediaman Penuh
                    </label>
                    <textarea
                      name="alamat"
                      rows={2}
                      defaultValue={editingEmployee.alamat}
                      placeholder="Alamat surat-menyurat..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: KUOTA CUTI TAHUNAN & STATUTORI */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>6. Peruntukan Kuota Cuti Tahunan (Hari)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Kuota Cuti Tahunan (Annual)
                    </label>
                    <input
                      name="annualQuota"
                      type="number"
                      min="0"
                      defaultValue={editingEmployee.leaveBalances.annualQuota}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Kuota Cuti Sakit / MC (Medical)
                    </label>
                    <input
                      name="medicalQuota"
                      type="number"
                      min="0"
                      defaultValue={editingEmployee.leaveBalances.medicalQuota}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Kuota Cuti Kecemasan (Emergency)
                    </label>
                    <input
                      name="emergencyQuota"
                      type="number"
                      min="0"
                      defaultValue={editingEmployee.leaveBalances.emergencyQuota}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between sticky bottom-0 bg-white dark:bg-slate-900 py-3">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Semua perubahan akan segera dikemaskini dalam rekod profil & pengiraan gaji bulanan.
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Biodata</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Pengurusan Akses Log Masuk Individu (Kata Laluan & Emel oleh HR) */}
      {editingCredentialsEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Urus Info Log Masuk Pekerja
                  </h3>
                  <p className="text-xs text-indigo-200">
                    {editingCredentialsEmployee.namaLengkap} · <span className="font-mono">{editingCredentialsEmployee.nik}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCredentialsEmployee(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const newEmail = form.email.value;
                const newPassword = form.password.value;

                const updated: Employee = {
                  ...editingCredentialsEmployee,
                  email: newEmail,
                  password: newPassword,
                };

                onUpdateEmployee(updated);
                setEditingCredentialsEmployee(null);
                setCredentialsSuccessMsg(`Kata laluan & emel untuk ${updated.namaLengkap} (${updated.company}) berjaya dikemaskini kepada "${newPassword}"!`);
                setTimeout(() => setCredentialsSuccessMsg(null), 7000);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-bold block">Akses Pentadbir HR Sah</span>
                  <span>
                    Sebagai HR rasmi (Ananda / Fatimah / Cheah Leong Tim), anda mempunyai kuasa penuh untuk menukar katalaluan kakitangan jika terlupa atau untuk kakitangan baru.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Syarikat Berdaftar
                </label>
                <input
                  type="text"
                  disabled
                  value={editingCredentialsEmployee.company}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Emel Log Masuk Rasmi *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editingCredentialsEmployee.email}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300 font-semibold">
                    Kata Laluan (Password) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('individualPwInput') as HTMLInputElement;
                      if (input) {
                        input.value = generatePassword(editingCredentialsEmployee.company);
                      }
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Jana Kata Laluan Rawak
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="individualPwInput"
                    name="password"
                    type={revealedPasswords[editingCredentialsEmployee.id] ? 'text' : 'password'}
                    required
                    defaultValue={editingCredentialsEmployee.password || 'password123'}
                    className="w-full pl-3 pr-20 py-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-indigo-950 dark:text-indigo-200 font-mono font-bold text-sm tracking-wider focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRevealedPasswords(prev => ({
                        ...prev,
                        [editingCredentialsEmployee.id]: !prev[editingCredentialsEmployee.id]
                      }))}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                      title={revealedPasswords[editingCredentialsEmployee.id] ? "Sembunyi" : "Papar"}
                    >
                      {revealedPasswords[editingCredentialsEmployee.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('individualPwInput') as HTMLInputElement;
                        if (input) handleCopyText(input.value, 'modal-pw');
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"
                      title="Salin Kata Laluan"
                    >
                      {copiedId === 'modal-pw' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCredentialsEmployee(null)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kata Laluan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Direktori Penuh Akses Log Masuk & Kata Laluan (Akses Ananda, Fatimah, Cheah Leong Tim) */}
      {isCredentialsOverviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Direktori Akses Log Masuk & Kata Laluan Semua Kakitangan
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Akses Khas Pentadbir HR: Pustaka Union & Solusi Serumpun Senusantara SDN. BHD
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialsOverviewOpen(false)}
                className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header Filter & Count */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Tapis Syarikat:</span>
                <button
                  type="button"
                  onClick={() => setSelectedCompany('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedCompany === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Semua ({employees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCompany('Pustaka Union')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedCompany === 'Pustaka Union'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Pustaka Union ({employees.filter(e => e.company === 'Pustaka Union').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCompany('Solusi Serumpun Senusantara SDN. BHD')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    selectedCompany === 'Solusi Serumpun Senusantara SDN. BHD'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Solusi Serumpun ({employees.filter(e => e.company.includes('Solusi Serumpun')).length})
                </button>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Klik butang "Tukar" atau salin untuk melihat dan mengemaskini kata laluan pekerja secara terus.
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <th className="py-2.5 px-4">Nama Kakitangan</th>
                    <th className="py-2.5 px-3">Syarikat & Jawatan</th>
                    <th className="py-2.5 px-3">Emel Log Masuk</th>
                    <th className="py-2.5 px-3">Kata Laluan (Password)</th>
                    <th className="py-2.5 px-3 text-right">Tindakan HR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEmployees.map(emp => {
                    const isRevealed = revealedPasswords[emp.id];
                    const pw = emp.password || 'password123';
                    const isSSS = emp.company.includes('Solusi');
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                              isSSS ? 'bg-emerald-600' : 'bg-sky-600'
                            }`}>
                              {emp.namaLengkap.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                {emp.namaLengkap}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono">
                                NIK: {emp.nik}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 ${
                            isSSS
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                          }`}>
                            {isSSS ? 'Solusi Serumpun' : 'Pustaka Union'}
                          </span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                            {emp.jabatan}
                          </p>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[200px]">{emp.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(emp.email, `ov-email-${emp.id}`)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                              title="Salin Emel"
                            >
                              {copiedId === `ov-email-${emp.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-900">
                            <span className="font-mono font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                              {isRevealed ? pw : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setRevealedPasswords(prev => ({ ...prev, [emp.id]: !prev[emp.id] }))}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded"
                              title={isRevealed ? "Sembunyi" : "Papar"}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyText(pw, `ov-pw-${emp.id}`)}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                              title="Salin Kata Laluan"
                            >
                              {copiedId === `ov-pw-${emp.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCredentialsOverviewOpen(false);
                              setEditingCredentialsEmployee(emp);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md border border-indigo-200 dark:border-indigo-800 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Tukar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsCredentialsOverviewOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm"
              >
                Tutup Direktori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {credentialsSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200 border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
          <p className="text-xs font-medium">{credentialsSuccessMsg}</p>
          <button
            type="button"
            onClick={() => setCredentialsSuccessMsg(null)}
            className="p-1 text-emerald-200 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Contract & Offering Letter Upload / Management Modal */}
      <ContractDocumentModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        employees={employees}
        initialEmployeeId={contractTargetEmpId}
        activeUser={activeUser}
        onUpdateEmployee={onUpdateEmployee}
      />

      {/* Resignation Processing & Automatic Resignation Acceptance Letter Modal */}
      <ResignationLetterModal
        isOpen={isResignModalOpen}
        onClose={() => setIsResignModalOpen(false)}
        employees={employees}
        initialEmployee={selectedResignEmployee}
        activeUser={activeUser}
        onUpdateEmployee={onUpdateEmployee}
      />

    </div>
  );
};

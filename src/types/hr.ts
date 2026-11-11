export type CompanyName = 
  | 'Pustaka Union'
  | 'Solusi Serumpun Senusantara SDN. BHD';

export type UserRole = 'HRD' | 'Director' | 'Employee';

export type SalaryScheme = 'Bulanan (Monthly)' | 'Per Jam (Hourly)';

export type Department = 
  | 'Pengurusan & Eksekutif'
  | 'Teknologi Maklumat & IT'
  | 'Editorial & Penerbitan'
  | 'Kewangan & Akaun'
  | 'Pemasaran & Jualan'
  | 'Operasi & Logistik'
  | 'Sumber Manusia (HR)';

export type EmploymentType = 
  | 'Tetap (Permanent)' 
  | 'Kontrak (Contract)' 
  | 'Percubaan (Probation)' 
  | 'Pekerja Sambilan (Temp / Hourly)';

export type CurrencyCode = 'MYR' | 'IDR' | 'USD' | 'SGD';

export interface LeaveBalances {
  annualQuota: number;
  annualUsed: number;
  medicalQuota: number;
  medicalUsed: number;
  emergencyQuota: number;
  emergencyUsed: number;
  unpaidUsed: number;
}

export interface Employee {
  id: string;
  company: CompanyName;
  nik: string; // Staff ID / NIK
  namaLengkap: string;
  icNumber: string; // No. Kad Pengenalan / IC / Pasport
  email: string;
  password?: string;
  noHp: string;
  role: UserRole;
  jabatan: string;
  departemen: Department;
  jenisKontrak: EmploymentType;
  tanggalBergabung: string; // YYYY-MM-DD
  
  // Salary Scheme (Bulanan vs Per Jam)
  salaryScheme: SalaryScheme;
  baseSalary: number; // Monthly base salary if Bulanan, or minimum guarantee
  hourlyRateMYR?: number; // Hourly rate in MYR if Per Jam
  originalCurrency: CurrencyCode;
  exchangeRateToMYR: number; // 1 MYR = ? or multiplier to MYR
  monthlyAllowanceMYR: number; // Elaun bulanan
  isRemoteOutsideMalaysia: boolean; // Remote luar Malaysia
  isExemptStatutory: boolean; // True for Remote (Ananda, Risabella) & Temp worker (Diyana Shazwany)
  
  // Malaysian Statutory Numbers
  epfNumber: string; // No. KWSP
  socsoNumber: string; // No. PERKESO
  taxNumber: string; // No. Cukai Pendapatan LHDN
  
  // Banking & Emergency
  namaBank: string; // RHB Bank, Maybank, CIMB, BCA, Mandiri, Lainnya
  noRekening: string;
  alamat: string;
  kontakKecemasanNama: string;
  kontakKecemasanNoHp: string;
  kontakKecemasanHubungan: string;
  
  leaveBalances: LeaveBalances;
  avatarUrl: string;
  statusAktif: boolean;

  // Official UNION Form Fields (Pustaka Union & Solusi Serumpun Senusantara)
  postcode?: string;
  city?: string;
  state?: string;
  dob?: string; // D.O.B
  gender?: 'Lelaki' | 'Perempuan';
  nationality?: string;
  hasDisability?: boolean;
  maritalStatus?: 'Bujang' | 'Berkahwin' | 'Duda' | 'Janda';

  // Section 2: Children Information (PCB LHDN Tax Relief)
  childrenUnder18_100?: number;
  childrenUnder18_50?: number;
  children18StudyingCert_100?: number;
  children18StudyingCert_50?: number;
  children18StudyingHigher_100?: number;
  children18StudyingHigher_50?: number;
  disabledChild_100?: number;
  disabledChild_50?: number;
  disabledChildHigher_100?: number;
  disabledChildHigher_50?: number;

  // Section 3: Employment & Organization Details
  reportingTo?: string;
  basedLocation?: string;
  eligibleForEPF?: boolean;
  benefitsDescription?: string;

  // Section 4: Additional Leave Entitlements
  hospitalizationQuota?: number;
  maternityQuota?: number;
  compassionateQuota?: number;

  // Section 5: Statutory & Tax Information
  isTP3Required?: boolean;
  skipBackgroundFill?: boolean;
  taxLetters?: string;
  taxNumberMain?: string;
  taxNumberLast?: string;
  passportNumber?: string;

  // Offering & Contract Documents
  contractDocuments?: EmployeeDocument[];

  // Resignation & Termination (Karyawan Tidak Aktif)
  resignationDetails?: {
    isResigned: boolean;
    resignationDate: string; // YYYY-MM-DD
    lastWorkingDay: string; // YYYY-MM-DD
    reason: string;
    letterReferenceNumber: string;
    generatedAt: string;
    notes?: string;
  };

  // Working Hours & Shift Setting (Ditetapkan oleh HRD / Pengurus)
  shiftId?: string; // e.g. 'shift-9-6', 'shift-9-12', 'shift-12-16'
  shiftName?: string; // e.g. 'Shift Pejabat Penuh (09:00 - 18:00)'
  shiftStartTime?: string; // e.g. '09:00'
  shiftEndTime?: string; // e.g. '18:00'
  shiftGraceMinutes?: number; // e.g. 15
  shiftWorkHoursQuota?: number; // e.g. 8.0, 3.0, 4.0
  shiftBreakMinutes?: number; // e.g. 60 or 0

  // Weekly Off Days Setting (Cuti Mingguan ditetapkan HR/HRD)
  weeklyOffDays?: ('Ahad' | 'Isnin' | 'Selasa' | 'Rabu' | 'Khamis' | 'Jumaat' | 'Sabtu')[];
  weeklyRestDayNotes?: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: 'Surat Tawaran Kerja (Offering Letter)' | 'Surat Kontrak (Contract Letter)' | 'Surat Perletakan Jawatan (Resignation Letter)' | 'Perjanjian Kerahsiaan (NDA)' | 'Lain-lain';
  fileSize: number; // in bytes
  uploadedAt: string;
  uploadedBy: string;
  fileUrl?: string;
}

export type AttendanceStatus = 'Hadir' | 'Lewat' | 'Bercuti' | 'Sakit (MC)' | 'Alpa' | 'Cuti Am' | 'Hari Rehat (Off)';
export type WorkLocation = 
  | 'Ibu Pejabat Pustaka Union (KL)'
  | 'Pejabat Solusi Serumpun Senusantara (KL)'
  | 'Remote Rumah / WFH'
  | 'Luar Negara (Remote International)'
  | 'Dinas Luar / Tugasan Klien'
  | 'Pejabat Rasmi (Jadual Libur)'
  | 'Pejabat Rasmi (Roster Off)'
  | 'Remote / Rehat Roster';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  company: CompanyName;
  departemen: Department;
  nik: string;
  tanggal: string; // YYYY-MM-DD
  jamMasuk: string; // HH:mm:ss (Punch 1: Masuk Pagi)
  jamKeluarRehat?: string | null; // HH:mm:ss (Punch 2: Keluar Rehat 1 Jam)
  jamMasukRehat?: string | null; // HH:mm:ss (Punch 3: Masuk Balik dari Rehat)
  jamKeluar: string | null; // HH:mm:ss (Punch 4: Pulang)
  isOnBreak?: boolean; // True jika staf sedang rehat
  breakDurationMinutes?: number; // Cth: 60 minit
  status: AttendanceStatus;
  workHours: number; // Jam Bekerja Biasa (cth. 8.0 jam)
  otHours: number; // Jam Lebih Masa (Overtime)
  otStatus?: 'Pending' | 'Approved' | 'Rejected' | 'None'; // Kelulusan OT oleh HR/HRD
  otApprovedBy?: string; // Nama HR/HRD yang meluluskan atau menghapuskan OT
  otApprovedAt?: string; // Tarikh & masa kelulusan
  lateMinutes?: number; // Minit Keterlambatan melebihi had toleransi
  lokasi: WorkLocation;
  koordinat: string;
  jarakMeter: number;
  fotoSelfieUrl?: string;
  catatan?: string;
}


export type OffDayType = 
  | 'Hari Rehat Mingguan (Rest Day)' 
  | 'Cuti Ganti (Replacement Day)' 
  | 'Cuti Khas Syarikat' 
  | 'Jadual Giliran (Shift Off)';

export interface EmployeeOffDay {
  id: string;
  employeeId: string;
  employeeName: string;
  company: CompanyName;
  departemen: Department;
  tanggal: string; // YYYY-MM-DD
  jenis: OffDayType;
  keterangan: string;
  ditambahOleh: string;
  diciptaPada: string;
}

export interface CSTicket {
  id: string;
  nomborTiket: string;
  namaPelanggan: string;
  noTelefon: string;
  saluran: 'WhatsApp' | 'Emel' | 'Kaunter Kedai' | 'Panggilan Telefon';
  kategori: 'Pertanyaan Stok Buku' | 'Status Penghantaran' | 'Pesanan Korporat / Sekolah' | 'Aduan Kerosakan' | 'Lain-lain';
  judulBuku?: string;
  pesanan: string;
  status: 'Baru' | 'Sedang Diproses' | 'Selesai';
  ditanganiOleh: string;
  tarikh: string;
  keutamaan: 'Rendah' | 'Sederhana' | 'Tinggi' | 'Segera';
}

export interface RetailBook {
  id: string;
  isbn: string;
  judul: string;
  penulis: string;
  penerbit: string;
  kategori: string;
  hargaMYR: number;
  stokSemasa: number;
  lokasiRak: string;
  terjualBulanIni: number;
}

export interface AdminGeneralRequest {
  id: string;
  jenis: 'Bilik Mesyuarat' | 'Alat Tulis & Kertas' | 'Log Kurier Pos' | 'Kenderaan Syarikat';
  pemohonNama: string;
  departemen: Department;
  butiran: string;
  tarikhMasa: string;
  status: 'Diluluskan' | 'Menunggu' | 'Selesai';
}

export type LeaveType = 
  | 'Cuti Tahunan (Annual Leave)'
  | 'Cuti Sakit (Medical Leave / MC)'
  | 'Cuti Kecemasan (Emergency Leave)'
  | 'Cuti Tanpa Gaji (Unpaid Leave)'
  | 'Cuti Bersalin (Maternity Leave)'
  | 'Cuti Khas / Ihsan';

export type ApprovalStatus = 'Menunggu Kelulusan' | 'Diluluskan' | 'Ditolak';

export interface LeaveAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  company: CompanyName;
  jabatan: string;
  departemen: Department;
  avatarUrl: string;
  tipeCuti: LeaveType;
  isHalfDay: boolean;
  tanggalMulai: string;
  tanggalSelesai: string;
  durasiHari: number;
  alasan: string;
  attachment?: LeaveAttachment;
  status: ApprovalStatus;
  diajukanPada: string;
  approverNama?: string;
  approverCatatan?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  company: CompanyName;
  nik: string;
  icNumber: string;
  jabatan: string;
  departemen: Department;
  
  // Cut-off timeframe (26th prev month - 25th curr month)
  periodMonth: number; // 1 - 12
  periodYear: number; // 2025, 2026
  cutOffStartDate: string; // YYYY-MM-26
  cutOffEndDate: string; // YYYY-MM-25
  bulanTahunLabel: string; // e.g. "Mei 2025 (26 Apr - 25 Mei)"
  
  // Salary Scheme
  salaryScheme: SalaryScheme;
  totalRegularHours: number; // Total jam kerja biasa dalam cut-off
  hourlyRateMYR: number; // Kadar sejam jika Per Jam
  
  // Currency & Converted Base
  originalSalary: number;
  originalCurrency: CurrencyCode;
  exchangeRateToMYR: number;
  
  // Gross calculations
  gajiPokokMYR: number; // Base salary (if bulanan) OR totalRegularHours * hourlyRate (if per jam)
  elaunMYR: number;
  otHours: number;
  otPayMYR: number;
  potonganCutiTanpaGajiMYR: number;
  gajiKasarMYR: number;
  
  // Statutory (EPF, SOCSO, EIS, Lindung24)
  isExemptStatutory: boolean; // True for Diyana Shazwany (Temp worker) and Remote foreign staff
  epfPekerja: number; // 11%
  epfMajikan: number; // 12% or 13%
  socsoPekerja: number; // ~0.5% capped
  socsoMajikan: number; // ~1.75% capped
  eisPekerja: number; // 0.2% capped
  eisMajikan: number; // 0.2% capped
  lindung24Pekerja?: number; // Skim Lindung24 PERKESO (cth: RM 5.00 / bulan)
  lindung24Majikan?: number; // Skim Lindung24 PERKESO Majikan (cth: RM 5.00 / bulan)
  pcbCukai: number;
  
  // Potongan Pinjaman Syarikat & Pendahuluan Gaji (Akta Kerja 1955 Seksyen 24)
  potonganPinjamanSyarikat?: number;
  bakiPinjamanSebelum?: number;
  bakiPinjamanSelepas?: number;
  keteranganPinjaman?: string;
  loanId?: string;
  isMaxDeductionExceeded?: boolean; // Had 50% Gaji Pokok Akta Kerja 1955
  
  totalPotonganPekerja: number;
  totalCarumanMajikan: number;
  gajiBersihMYR: number; // Net Pay
  
  namaBank: string;
  noRekening: string;
  epfNumber: string;
  socsoNumber: string;
  taxNumber: string;
  statusBayar: 'Draft' | 'Disahkan' | 'Dibayar';
  tarikhBayar: string;
}

export interface KPIIndicator {
  id: string;
  namaIndikator: string;
  targetKuantitatif: string;
  bobotPersen: number;
  realisasiKuantitatif: string;
  skor: number;
}

export type ReviewPeriod = 'Q1 2025' | 'Q2 2025' | 'Q3 2025' | 'Q4 2025' | 'Tahunan 2024';
export type ReviewStatus = 'Draft' | 'Menunggu Evaluasi Lead' | 'Selesai Direview';

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  jabatan: string;
  departemen: Department;
  avatarUrl: string;
  periode: ReviewPeriod;
  status: ReviewStatus;
  indikatorList: KPIIndicator[];
  totalSkorTertimbang: number;
  grade: 'A+ (Sangat Unggul)' | 'A (Melampaui Target)' | 'B (Sesuai Target)' | 'C (Perlu Perbaikan)' | 'D (Kurang)';
  umpanBalikManager: string;
  umpanBalikHR: string;
  rekomendasi: 'Promosi Jabatan' | 'Kenaikan Gaji Berkala' | 'Pelatihan Khusus' | 'Pertahankan Kinerja' | 'Performance Improvement Plan (PIP)';
  reviewerName: string;
  tanggalReview: string;
}

export interface CompanyAnnouncement {
  id: string;
  judul: string;
  kategori: 'Pekeliling HR' | 'Warta Cuti Syarikat' | 'Kebajikan Pekerja' | 'Operasi Syarikat' | 'Akta Kerja 1955';
  tanggal: string;
  konten: string;
  prioritas: 'Tinggi (Must Read)' | 'Biasa' | 'Penting';
  pengarang: string;
  sasaranSyarikat: 'Semua Syarikat' | 'Pustaka Union' | 'Solusi Serumpun Senusantara SDN. BHD';
  dibacaOleh?: string[];
}

export interface MonthlyAttendanceLock {
  id: string; // e.g. "lock-emp-pu-01-2025-5"
  employeeId: string;
  employeeName: string;
  company: CompanyName;
  periodYear: number;
  periodMonth: number;
  isLocked: boolean;
  lockedBy: string;
  lockedAt: string;
  notes?: string;
  totalDaysPresent: number;
  totalRegularHours: number;
  totalOtHours: number;
  hasIssues: boolean;
  issueCount?: number;
}

export interface TrainingQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TrainingChapter {
  id: string;
  chapterNumber: number;
  title: string;
  estimatedMinutes: number;
  category: 
    | 'Pengenalan & Budaya' 
    | 'Akta Kerja & Polisi' 
    | 'Absensi & Cuti' 
    | 'Gaji & Statutori' 
    | 'Operasi Buku & CS' 
    | 'Keselamatan OSHA'
    | 'Retail & Kasir'
    | 'Customer Service'
    | 'Admin Pejabat';
  track?: 'retail' | 'cs' | 'admin' | 'corporate' | 'all';
  summary: string;
  sections: {
    heading: string;
    content: string[];
    keyPoints?: string[];
    sopPoints?: string[];
  }[];
  quizQuestions: TrainingQuizQuestion[];
}

export interface OnboardingTask {
  id: string;
  dayPhase: 'Hari 1 (Day 1)' | 'Minggu 1 (Week 1)' | 'Bulan 1 (Month 1)';
  title: string;
  description: string;
  requiredFor: 'Semua Karyawan' | 'Operasi & Retail' | 'Pemasaran & Jualan' | 'Eksekutif & HR';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string; // ISO string or formatted time
  read: boolean;
  relatedLeaveId?: string;
  approverNama?: string;
  employeeName?: string;
}

// ==========================================
// PINJAMAN SYARIKAT & ADVANCE GAJI
// ==========================================
export type LoanType = 
  | 'Pendahuluan Gaji (Salary Advance)'
  | 'Pinjaman Kecemasan (Emergency Loan)'
  | 'Pinjaman Perubatan & Kesihatan'
  | 'Bantuan Persekolahan / Komputer';

export interface LoanPaymentRecord {
  id: string;
  installmentNo: number; // Bulan ke-1, 2, 3...
  periodYear: number;
  periodMonth: number;
  amountPaid: number;
  balanceBefore: number;
  balanceAfter: number;
  paidDate: string;
  receiptRef?: string;
  status: 'Paid' | 'Pending';
}

export interface EmployeeLoan {
  id: string;
  employeeId: string;
  employeeName: string;
  company: CompanyName;
  loanType: LoanType;
  principalAmount: number; // Jumlah Asal Pinjaman
  balanceRemaining: number; // Baki Pinjaman Semasa
  monthlyInstallment: number; // Ansuran Bulanan (RM)
  totalTenureMonths: number; // Tempoh Ansuran (Bulan)
  monthsPaid: number; // Bilangan Bulan Telah Dibayar
  startDate: string; // YYYY-MM
  status: 'Aktif' | 'Selesai' | 'Menunggu Kelulusan' | 'Ditolak';
  reason: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  paymentLedger: LoanPaymentRecord[];
}

// ==========================================
// KALENDAR CUTI UMUM TEMPATAN (MALAYSIA)
// ==========================================
export type MalaysianStateHoliday = 'Kebangsaan' | 'Selangor' | 'Kedah' | 'Kuala Lumpur';

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  dayName: string;
  state: MalaysianStateHoliday;
  isNational: boolean;
  description: string;
  category: 'Agama' | 'Negeri' | 'Persekutuan' | 'Kebangsaan';
}



import { CurrencyCode, Employee, PayrollRecord, LeaveRequest, AttendanceRecord, EmployeeLoan } from '../types/hr';

export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  MYR: 1.0,
  IDR: 0.000282, // 1 IDR = ~0.000282 MYR
  USD: 4.45,
  SGD: 3.32,
};

export const MONTH_NAMES_MS = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

// Senarai Tahun Pilihan termasuk 2027 dan seterusnya (2024 - 2035)
export const AVAILABLE_YEARS = [
  2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035
];

/**
 * Super Admin & Payroll / Attendance Confidentiality Gate:
 * Hanya ANANDA ISTIQOMAH, CHEAH LEONG TIM, dan SITI FATIMAH yang dibenarkan
 * mengakses data milik pekerja lain, menjalankan kiraan gaji penuh, menyunting absensi,
 * dan melihat rekod sulit syarikat.
 * Pekerja lain TIDAK DAPAT akses data milik rakan sekerja (Rahsia Sulit).
 */
export function isSuperAdminOrHR(user: Employee | null | undefined): boolean {
  if (!user) return false;
  const superIds = ['emp-pu-01', 'emp-pu-02', 'emp-sss-02'];
  if (superIds.includes(user.id)) return true;
  const name = (user.namaLengkap || '').toLowerCase();
  return (
    name.includes('ananda') ||
    name.includes('cheah leong tim') ||
    name.includes('siti fatimah')
  );
}

export function isSuperAttendanceEditor(user: Employee | null | undefined): boolean {
  return isSuperAdminOrHR(user);
}

/**
 * Calculates the standard 26th - 25th cut-off date range for any given month & year.
 * Example: Month 5 (Mei), Year 2025 -> 26 April 2025 to 25 Mei 2025.
 */
export function getCutOffDateRange(year: number, month: number): {
  startDate: string;
  endDate: string;
  label: string;
  prevMonthName: string;
  currMonthName: string;
} {
  // Previous month and year
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-26`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-25`;

  const prevMonthName = MONTH_NAMES_MS[prevMonth - 1];
  const currMonthName = MONTH_NAMES_MS[month - 1];
  const label = `26 ${prevMonthName} ${prevYear} - 25 ${currMonthName} ${year}`;

  return {
    startDate,
    endDate,
    label,
    prevMonthName,
    currMonthName,
  };
}

export const DAY_NAMES_MS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

export function getCalendarMonthDays(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return dates;
}

export function getCutOffDays(year: number, month: number): string[] {
  const range = getCutOffDateRange(year, month);
  const dates: string[] = [];
  const current = new Date(range.startDate + 'T00:00:00');
  const end = new Date(range.endDate + 'T00:00:00');
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function convertToMYR(amount: number, currency: CurrencyCode, customRate?: number): number {
  if (currency === 'MYR') return amount;
  const rate = customRate || DEFAULT_EXCHANGE_RATES[currency] || 1.0;
  return Math.round(amount * rate * 100) / 100;
}

export function formatMYR(value: number): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyAmount(value: number, currency: CurrencyCode): string {
  if (currency === 'MYR') return formatMYR(value);
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculates payroll supporting both:
 * 1. Monthly (Bulanan) scheme
 * 2. Hourly (Per Jam) scheme
 * With 26th-25th cut-off integration & special statutory exemptions (Diyana Shazwany & Remote).
 */
export function calculatePayrollForEmployee(
  employee: Employee,
  totalHoursWorked = 160,
  otHours = 0,
  unpaidLeaveDays = 0,
  periodYear = 2025,
  periodMonth = 5,
  activeLoan?: EmployeeLoan | null
): PayrollRecord {
  const cutOff = getCutOffDateRange(periodYear, periodMonth);
  const isHourly = employee.salaryScheme === 'Per Jam (Hourly)';
  const hourlyRate = employee.hourlyRateMYR || 18.0;

  let gajiPokokMYR = 0;
  let otPayMYR = 0;

  if (isHourly) {
    // Hourly scheme: worked hours * hourly rate
    gajiPokokMYR = Math.round(totalHoursWorked * hourlyRate * 100) / 100;
    // Hourly OT rate: 1.5x of hourly rate
    otPayMYR = Math.round(otHours * hourlyRate * 1.5 * 100) / 100;
  } else {
    // Monthly scheme: fixed base salary converted to MYR
    gajiPokokMYR = convertToMYR(employee.baseSalary, employee.originalCurrency, employee.exchangeRateToMYR);
    // Standard Malaysian OT rate formula: (Gaji Pokok / 26 / 8) * 1.5
    const regularHourlyRate = (gajiPokokMYR / 26 / 8);
    otPayMYR = Math.round(otHours * regularHourlyRate * 1.5 * 100) / 100;
  }

  const elaunMYR = employee.monthlyAllowanceMYR || 0;
  
  // Unpaid leave deduction (for monthly workers)
  const potonganCutiTanpaGajiMYR = !isHourly 
    ? Math.round((gajiPokokMYR / 26) * unpaidLeaveDays * 100) / 100 
    : 0;

  const gajiKasarMYR = Math.max(0, gajiPokokMYR + elaunMYR + otPayMYR - potonganCutiTanpaGajiMYR);

  // STATUTORY EXEMPTION RULES:
  // 1. DIYANA SHAZWANY BT MOHAMAD ZUBER (Temp worker Pustaka Union) -> EXEMPT!
  // 2. ANANDA ISTIQOMAH & RISABELLA BERLIYANA (Remote outside Malaysia) -> EXEMPT!
  const isExempt = employee.isExemptStatutory || employee.isRemoteOutsideMalaysia;

  let epfPekerja = 0;
  let epfMajikan = 0;
  let socsoPekerja = 0;
  let socsoMajikan = 0;
  let eisPekerja = 0;
  let eisMajikan = 0;
  let lindung24Pekerja = 0;
  let lindung24Majikan = 0;
  let pcbCukai = 0;

  if (!isExempt) {
    // EPF: 11% employee, 12%/13% employer
    epfPekerja = Math.round(gajiKasarMYR * 0.11);
    const epfRateMajikan = gajiKasarMYR <= 5000 ? 0.13 : 0.12;
    epfMajikan = Math.round(gajiKasarMYR * epfRateMajikan);

    // SOCSO: Capped at wage RM 6,000
    const socsoWageBase = Math.min(gajiKasarMYR, 6000);
    socsoPekerja = Math.min(29.75, Math.round(socsoWageBase * 0.005 * 100) / 100);
    socsoMajikan = Math.min(104.15, Math.round(socsoWageBase * 0.0175 * 100) / 100);

    // EIS: 0.2% capped
    const eisWageBase = Math.min(gajiKasarMYR, 6000);
    eisPekerja = Math.min(11.90, Math.round(eisWageBase * 0.002 * 100) / 100);
    eisMajikan = Math.min(11.90, Math.round(eisWageBase * 0.002 * 100) / 100);

    // Lindung24 PERKESO Scheme: RM 5.00 employee, RM 5.00 employer (24-Hour Non-Occupational Coverage)
    lindung24Pekerja = 5.00;
    lindung24Majikan = 5.00;

    // Estimated PCB
    const taxableIncome = gajiKasarMYR - epfPekerja;
    if (taxableIncome > 7500) {
      pcbCukai = Math.round((taxableIncome - 7500) * 0.21 + 350);
    } else if (taxableIncome > 5000) {
      pcbCukai = Math.round((taxableIncome - 5000) * 0.13 + 120);
    } else if (taxableIncome > 3800) {
      pcbCukai = Math.round((taxableIncome - 3800) * 0.06);
    }
  }

  // Akta Kerja 1955 Seksyen 24: Had Potongan Agregat Tidak Melebihi 50% Gaji Pokok
  const maxDeductionAllowed = gajiPokokMYR * 0.50;
  const statutorySubtotal = epfPekerja + socsoPekerja + eisPekerja + lindung24Pekerja + pcbCukai;

  let potonganPinjamanSyarikat = 0;
  let bakiPinjamanSebelum = 0;
  let bakiPinjamanSelepas = 0;
  let keteranganPinjaman: string | undefined = undefined;
  let isMaxDeductionExceeded = false;
  let loanId: string | undefined = undefined;

  if (activeLoan && activeLoan.status === 'Aktif' && activeLoan.balanceRemaining > 0) {
    bakiPinjamanSebelum = activeLoan.balanceRemaining;
    const requestedInstallment = activeLoan.monthlyInstallment;
    loanId = activeLoan.id;

    // Ensure loan installment does not exceed remaining loan balance
    potonganPinjamanSyarikat = Math.min(requestedInstallment, bakiPinjamanSebelum);
    bakiPinjamanSelepas = Math.max(0, bakiPinjamanSebelum - potonganPinjamanSyarikat);

    // Check 50% aggregate deduction rule under Employment Act 1955
    if ((statutorySubtotal + potonganPinjamanSyarikat) > maxDeductionAllowed) {
      isMaxDeductionExceeded = true;
    }

    keteranganPinjaman = `Bayaran balik pinjaman syarikat - Baki akhir: ${formatMYR(bakiPinjamanSelepas)}`;
  }

  const totalPotonganPekerja = statutorySubtotal + potonganPinjamanSyarikat;
  const totalCarumanMajikan = epfMajikan + socsoMajikan + eisMajikan + lindung24Majikan;
  const gajiBersihMYR = Math.max(0, gajiKasarMYR - totalPotonganPekerja);

  return {
    id: `pay-${employee.id}-${periodYear}-${periodMonth}`,
    employeeId: employee.id,
    employeeName: employee.namaLengkap,
    company: employee.company,
    nik: employee.nik,
    icNumber: employee.icNumber,
    jabatan: employee.jabatan,
    departemen: employee.departemen,
    periodMonth,
    periodYear,
    cutOffStartDate: cutOff.startDate,
    cutOffEndDate: cutOff.endDate,
    bulanTahunLabel: `${cutOff.currMonthName} ${periodYear} (${cutOff.label})`,
    salaryScheme: employee.salaryScheme,
    totalRegularHours: totalHoursWorked,
    hourlyRateMYR: hourlyRate,
    originalSalary: isHourly ? (totalHoursWorked * hourlyRate) : employee.baseSalary,
    originalCurrency: employee.originalCurrency,
    exchangeRateToMYR: employee.exchangeRateToMYR || 1.0,
    gajiPokokMYR,
    elaunMYR,
    otHours,
    otPayMYR,
    potonganCutiTanpaGajiMYR,
    gajiKasarMYR,
    isExemptStatutory: isExempt,
    epfPekerja,
    epfMajikan,
    socsoPekerja,
    socsoMajikan,
    eisPekerja,
    eisMajikan,
    lindung24Pekerja,
    lindung24Majikan,
    pcbCukai,
    potonganPinjamanSyarikat,
    bakiPinjamanSebelum,
    bakiPinjamanSelepas,
    keteranganPinjaman,
    loanId,
    isMaxDeductionExceeded,
    totalPotonganPekerja,
    totalCarumanMajikan,
    gajiBersihMYR,
    namaBank: employee.namaBank,
    noRekening: employee.noRekening,
    epfNumber: isExempt ? 'DIKECUALIKAN' : employee.epfNumber,
    socsoNumber: isExempt ? 'DIKECUALIKAN' : employee.socsoNumber,
    taxNumber: employee.taxNumber,
    statusBayar: 'Disahkan',
    tarikhBayar: `${periodYear}-${String(periodMonth).padStart(2, '0')}-28`,
  };
}

/**
 * Helper to identify employees having their birthday in the given month (1 - 12)
 * Supports both explicit dob field (YYYY-MM-DD) and Malaysian IC (YYMMDD-SS-NNNN)
 */
export function getEmployeesWithBirthdayThisMonth(employees: Employee[], targetMonth: number): Employee[] {
  return employees.filter(emp => {
    if (emp.dob) {
      const parts = emp.dob.split('-');
      if (parts.length >= 2 && Number(parts[1]) === targetMonth) return true;
    }
    if (emp.icNumber) {
      const clean = emp.icNumber.replace(/[^0-9]/g, '');
      if (clean.length >= 6) {
        const icMonth = Number(clean.substring(2, 4));
        if (icMonth === targetMonth) return true;
      }
    }
    return false;
  });
}

/**
 * Checks Employment Act 1955 Section 24 compliance:
 * Total aggregate deductions cannot exceed 50% of the employee's base wages.
 */
export function checkAkta1955DeductionLimit(
  gajiPokok: number,
  statutoryDeductions: number,
  loanInstallment: number
): {
  maxAllowed: number;
  totalDeductions: number;
  remainingCapacity: number;
  isExceeded: boolean;
  excessAmount: number;
  percentageOfBase: number;
} {
  const maxAllowed = gajiPokok * 0.50;
  const totalDeductions = statutoryDeductions + loanInstallment;
  const isExceeded = totalDeductions > maxAllowed;
  const remainingCapacity = Math.max(0, maxAllowed - totalDeductions);
  const excessAmount = isExceeded ? totalDeductions - maxAllowed : 0;
  const percentageOfBase = gajiPokok > 0 ? (totalDeductions / gajiPokok) * 100 : 0;

  return {
    maxAllowed,
    totalDeductions,
    remainingCapacity,
    isExceeded,
    excessAmount,
    percentageOfBase,
  };
}

// Download helper
function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 1. CSV TO RHB BANK (RHB Reflex / AutoPay Bulk Payment Format)
export function exportRHBBankCSV(records: PayrollRecord[], companyFilter: string, cutOffLabel: string) {
  const headers = [
    'RHB_Transaction_Type',
    'Beneficiary_Account_No',
    'Beneficiary_Name',
    'Beneficiary_IC_Passport',
    'Receiving_Bank_Name',
    'Payment_Amount_MYR',
    'Payment_Reference',
    'Employee_ID',
    'Company_Name',
    'Payment_Date'
  ];

  const rows = records.map(r => [
    'SALARY_PAYROLL',
    `'${r.noRekening.replace(/[^0-9]/g, '')}`,
    r.employeeName,
    r.icNumber,
    r.namaBank,
    r.gajiBersihMYR.toFixed(2),
    `SALARY_${r.cutOffStartDate}_TO_${r.cutOffEndDate}`,
    r.nik,
    r.company,
    r.tarikhBayar
  ]);

  const csv = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
  downloadCSV(`RHB_AutoPay_Payroll_${companyFilter.replace(/\s+/g, '_')}_CutOff_${rFormattedDate(records[0]?.cutOffStartDate || '20250426')}_${rFormattedDate(records[0]?.cutOffEndDate || '20250525')}`, csv);
}

function rFormattedDate(str: string): string {
  return str.replace(/[^0-9]/g, '');
}

// 2. CSV Salary / Penggajian Lengkap
export function exportSalarySummaryCSV(records: PayrollRecord[], companyFilter: string) {
  const headers = [
    'Syarikat',
    'ID Pekerja / NIK',
    'Nama Penuh',
    'No. IC / Pasport',
    'Jawatan',
    'Skema Gaji',
    'Jumlah Jam Kerja',
    'Kadar Sejam (MYR)',
    'Gaji Pokok / Upah Jam (MYR)',
    'Elaun (MYR)',
    'Jam OT',
    'Bayaran OT (MYR)',
    'Potongan Cuti Tanpa Gaji (MYR)',
    'Gaji Kasar (MYR)',
    'Pengecualian Statutori (Temp/Luar Negara)',
    'KWSP Pekerja (11%)',
    'KWSP Majikan (12%/13%)',
    'PERKESO Pekerja',
    'PERKESO Majikan',
    'EIS Pekerja (0.2%)',
    'EIS Majikan (0.2%)',
    'PCB Cukai (MYR)',
    'Jumlah Potongan (MYR)',
    'Gaji Bersih (MYR)',
    'Nama Bank',
    'No. Akaun Bank'
  ];

  const rows = records.map(r => [
    r.company,
    r.nik,
    r.employeeName,
    r.icNumber,
    r.jabatan,
    r.salaryScheme,
    r.totalRegularHours,
    r.hourlyRateMYR.toFixed(2),
    r.gajiPokokMYR.toFixed(2),
    r.elaunMYR.toFixed(2),
    r.otHours,
    r.otPayMYR.toFixed(2),
    r.potonganCutiTanpaGajiMYR.toFixed(2),
    r.gajiKasarMYR.toFixed(2),
    r.isExemptStatutory ? 'YA (Dikecualikan)' : 'TIDAK (Dikenakan)',
    r.epfPekerja.toFixed(2),
    r.epfMajikan.toFixed(2),
    r.socsoPekerja.toFixed(2),
    r.socsoMajikan.toFixed(2),
    r.eisPekerja.toFixed(2),
    r.eisMajikan.toFixed(2),
    r.pcbCukai.toFixed(2),
    r.totalPotonganPekerja.toFixed(2),
    r.gajiBersihMYR.toFixed(2),
    r.namaBank,
    `'${r.noRekening}`
  ]);

  const csv = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
  downloadCSV(`Gaji_Ringkasan_${companyFilter.replace(/\s+/g, '_')}_CutOff_${records[0]?.cutOffStartDate || '2025-04-26'}_${records[0]?.cutOffEndDate || '2025-05-25'}`, csv);
}

// 3. CSV Caruman KWSP / EPF
export function exportEpfContributionCSV(records: PayrollRecord[], companyFilter: string) {
  const headers = [
    'Syarikat',
    'No. Ahli KWSP',
    'No. Kad Pengenalan / IC',
    'Nama Pekerja',
    'Skema Gaji',
    'Gaji Layak Caruman (MYR)',
    'Caruman Pekerja 11% (MYR)',
    'Caruman Majikan (MYR)',
    'Jumlah Caruman KWSP (MYR)',
    'Status Pengecualian'
  ];

  const rows = records.map(r => [
    r.company,
    r.epfNumber,
    r.icNumber,
    r.employeeName,
    r.salaryScheme,
    r.isExemptStatutory ? '0.00' : r.gajiKasarMYR.toFixed(2),
    r.epfPekerja.toFixed(2),
    r.epfMajikan.toFixed(2),
    (r.epfPekerja + r.epfMajikan).toFixed(2),
    r.isExemptStatutory ? 'Dikecualikan (Temp / Luar Negara)' : 'Aktif Caruman'
  ]);

  const csv = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
  downloadCSV(`Caruman_KWSP_EPF_${companyFilter.replace(/\s+/g, '_')}`, csv);
}

// 4. CSV Caruman PERKESO / SOCSO
export function exportSocsoContributionCSV(records: PayrollRecord[], companyFilter: string) {
  const headers = [
    'Syarikat',
    'No. Pendaftaran PERKESO',
    'No. IC / Pasport',
    'Nama Pekerja',
    'Skema Gaji',
    'Gaji Bulan (MYR)',
    'Syer Pekerja (MYR)',
    'Syer Majikan (MYR)',
    'Jumlah PERKESO (MYR)',
    'Status Kategori'
  ];

  const rows = records.map(r => [
    r.company,
    r.socsoNumber,
    r.icNumber,
    r.employeeName,
    r.salaryScheme,
    r.isExemptStatutory ? '0.00' : r.gajiKasarMYR.toFixed(2),
    r.socsoPekerja.toFixed(2),
    r.socsoMajikan.toFixed(2),
    (r.socsoPekerja + r.socsoMajikan).toFixed(2),
    r.isExemptStatutory ? 'Dikecualikan (Temp Worker / Luar Negara)' : 'Kategori 1'
  ]);

  const csv = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
  downloadCSV(`Caruman_PERKESO_SOCSO_${companyFilter.replace(/\s+/g, '_')}`, csv);
}

// 5. CSV Caruman EIS / SIP
export function exportEisContributionCSV(records: PayrollRecord[], companyFilter: string) {
  const headers = [
    'Syarikat',
    'No. IC / Pasport',
    'Nama Pekerja',
    'Skema Gaji',
    'Gaji Tertakluk EIS (MYR)',
    'Caruman Pekerja 0.2% (MYR)',
    'Caruman Majikan 0.2% (MYR)',
    'Jumlah Caruman EIS (MYR)',
    'Catatan'
  ];

  const rows = records.map(r => [
    r.company,
    r.icNumber,
    r.employeeName,
    r.salaryScheme,
    r.isExemptStatutory ? '0.00' : r.gajiKasarMYR.toFixed(2),
    r.eisPekerja.toFixed(2),
    r.eisMajikan.toFixed(2),
    (r.eisPekerja + r.eisMajikan).toFixed(2),
    r.isExemptStatutory ? 'Dikecualikan (Temp / Luar Negara)' : 'Caruman Standard'
  ]);

  const csv = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
  downloadCSV(`Caruman_EIS_SIP_${companyFilter.replace(/\s+/g, '_')}`, csv);
}

// 6. CSV Cuti Karyawan
export function exportLeaveRequestsCSV(requests: LeaveRequest[]) {
  const headers = [
    'Syarikat',
    'Nama Pekerja',
    'Jawatan',
    'Jabatan',
    'Jenis Cuti',
    'Separuh Hari (0.5)',
    'Tarikh Mula',
    'Tarikh Tamat',
    'Durasi (Hari)',
    'Alasan Permohonan',
    'Dokumen Lampiran (Attachment)',
    'Status Kelulusan',
    'Tarikh Permohonan',
    'Nama Pegawai Pelulus',
    'Nota Semakan'
  ];

  const rows = requests.map(l => [
    l.company,
    l.employeeName,
    l.jabatan,
    l.departemen,
    l.tipeCuti,
    l.isHalfDay ? 'YA (0.5 Hari)' : 'TIDAK (1.0 Hari Penuh)',
    l.tanggalMulai,
    l.tanggalSelesai,
    l.durasiHari,
    l.alasan,
    l.attachment ? `${l.attachment.name} (${Math.round(l.attachment.size / 1024)} KB)` : 'Tiada Lampiran',
    l.status,
    l.diajukanPada,
    l.approverNama || '-',
    l.approverCatatan || '-'
  ]);

  const csv = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
  downloadCSV(`Rekod_Permohonan_Cuti_HR_${new Date().toISOString().split('T')[0]}`, csv);
}

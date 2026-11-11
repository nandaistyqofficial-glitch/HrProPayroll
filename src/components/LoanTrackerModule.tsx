import React, { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  FileText, 
  Building2, 
  ChevronRight, 
  ShieldCheck, 
  Search, 
  Filter, 
  X, 
  Check, 
  ArrowUpRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { Employee, EmployeeLoan, LoanType } from '../types/hr';
import { formatMYR, checkAkta1955DeductionLimit } from '../utils/statutoryCalculations';

interface LoanTrackerModuleProps {
  employees: Employee[];
  loans: EmployeeLoan[];
  activeUser: Employee;
  onAddLoan: (loan: EmployeeLoan) => void;
  onApproveLoan: (loanId: string) => void;
  onRejectLoan: (loanId: string) => void;
  selectedCompanyFilter?: string;
}

export const LoanTrackerModule: React.FC<LoanTrackerModuleProps> = ({
  employees,
  loans,
  activeUser,
  onAddLoan,
  onApproveLoan,
  onRejectLoan,
  selectedCompanyFilter = 'all'
}) => {
  const isHRorManagement = activeUser.role === 'HRD' || activeUser.role === 'Director';
  
  // Modals & view state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedLoanForLedger, setSelectedLoanForLedger] = useState<EmployeeLoan | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states for new loan application
  const [applicantEmployeeId, setApplicantEmployeeId] = useState<string>(activeUser.id);
  const [loanType, setLoanType] = useState<LoanType>('Pendahuluan Gaji (Salary Advance)');
  const [principalAmount, setPrincipalAmount] = useState<number>(1200);
  const [tenureMonths, setTenureMonths] = useState<number>(4);
  const [reason, setReason] = useState<string>('Kecemasan pembaikan kenderaan & perubatan');
  const [notes, setNotes] = useState<string>('Potongan berjadual bulanan melalui RHB Reflex AutoPay');

  // Filtered loans
  const displayedLoans = loans.filter(l => {
    if (selectedCompanyFilter !== 'all' && l.company !== selectedCompanyFilter) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.employeeName.toLowerCase().includes(q) || l.loanType.toLowerCase().includes(q) || l.reason.toLowerCase().includes(q);
    }
    // If ordinary employee, only show their own loans
    if (!isHRorManagement && l.employeeId !== activeUser.id) return false;
    return true;
  });

  // Calculate high-level summary metrics
  const activeLoans = loans.filter(l => l.status === 'Aktif');
  const totalPrincipalDisbursed = loans.reduce((acc, l) => acc + l.principalAmount, 0);
  const totalBalanceRemaining = activeLoans.reduce((acc, l) => acc + l.balanceRemaining, 0);
  const totalRepaid = totalPrincipalDisbursed - totalBalanceRemaining;

  // Selected applicant for form
  const selectedApplicant = employees.find(e => e.id === applicantEmployeeId) || activeUser;
  const applicantBaseSalary = selectedApplicant.baseSalary || 3000;
  
  // Approximate statutory deductions for applicant (EPF 11% + SOCSO 0.5% + EIS 0.2% + Lindung24 RM5)
  const approxEpf = Math.round(applicantBaseSalary * 0.11);
  const approxSocso = Math.min(29.75, Math.round(applicantBaseSalary * 0.005));
  const approxEis = Math.min(11.90, Math.round(applicantBaseSalary * 0.002));
  const approxLindung24 = 5.00;
  const approxStatutory = approxEpf + approxSocso + approxEis + approxLindung24;

  const calculatedMonthlyInstallment = tenureMonths > 0 ? Math.round((principalAmount / tenureMonths) * 100) / 100 : 0;

  // Akta Kerja 1955 50% Limit check
  const aktaCheck = checkAkta1955DeductionLimit(
    applicantBaseSalary,
    approxStatutory,
    calculatedMonthlyInstallment
  );

  const handleCreateLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (principalAmount <= 0 || tenureMonths <= 0) return;

    // Generate monthly payment ledger
    const ledger = [];
    let currentBalance = principalAmount;
    for (let i = 1; i <= tenureMonths; i++) {
      const isLast = i === tenureMonths;
      const installment = isLast ? currentBalance : calculatedMonthlyInstallment;
      const balanceAfter = Math.max(0, currentBalance - installment);
      
      ledger.push({
        id: `ledger-${Date.now()}-${i}`,
        installmentNo: i,
        periodYear: 2025,
        periodMonth: 5 + i, // Future months
        amountPaid: installment,
        balanceBefore: currentBalance,
        balanceAfter,
        paidDate: `2025-0${5 + i}-28`,
        status: 'Pending' as const
      });
      currentBalance = balanceAfter;
    }

    const newLoan: EmployeeLoan = {
      id: `loan-${Date.now()}`,
      employeeId: selectedApplicant.id,
      employeeName: selectedApplicant.namaLengkap,
      company: selectedApplicant.company,
      loanType,
      principalAmount,
      balanceRemaining: principalAmount,
      monthlyInstallment: calculatedMonthlyInstallment,
      totalTenureMonths: tenureMonths,
      monthsPaid: 0,
      startDate: '2025-05',
      status: isHRorManagement ? 'Aktif' : 'Menunggu Kelulusan',
      reason,
      requestedAt: '2025-05-12',
      approvedBy: isHRorManagement ? activeUser.namaLengkap : undefined,
      approvedAt: isHRorManagement ? '2025-05-12' : undefined,
      notes,
      paymentLedger: ledger
    };

    onAddLoan(newLoan);
    setIsApplyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Module Title Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Rekod Pinjaman Syarikat &amp; Advance Gaji (Loan Tracker)
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Akta Kerja 1955 Had 50%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pengurusan jadual pelunasan ansuran, semakan had potongan gaji berkanun 50%, dan permohonan pendahuluan gaji.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsApplyModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Mohon Pinjaman / Advance</span>
        </button>
      </div>

      {/* Summary 4-Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Pinjaman Aktif</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {activeLoans.length}
          </p>
          <span className="text-[11px] text-indigo-600 font-medium">Dalam potongan gaji</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Jumlah Pinjaman Asal</span>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {formatMYR(totalPrincipalDisbursed)}
          </p>
          <span className="text-[11px] text-slate-400 font-mono">Bantuan kebajikan syarikat</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Telah Dilunaskan</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatMYR(totalRepaid)}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" /> Berjaya dipotong
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Baki Belum Lunas</span>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {formatMYR(totalBalanceRemaining)}
          </p>
          <span className="text-[11px] text-amber-600 font-medium">Ansuran bulanan aktif</span>
        </div>

      </div>

      {/* Akta Kerja 1955 Compliance Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 to-sky-50/80 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200 dark:border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Peraturan Had Potongan Gaji (Akta Kerja 1955 Seksyen 24)
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
              Undang-undang Malaysia menetapkan had maksimum semua potongan agregat (statutori + pinjaman) adalah <strong>50% daripada gaji pokok</strong>. Sistem kami menguatkuasakan semakan automatik untuk melindungi hak pekerja.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold rounded-full font-mono text-[11px] shrink-0 self-start sm:self-auto">
          ✓ 100% Pematuhan Berkanun
        </span>
      </div>

      {/* Loans Table & Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm space-y-4 p-4 sm:p-5">
        
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari peminjam / tujuan..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="all">Semua Status Pinjaman</option>
              <option value="Aktif">Aktif (Sedang Bayar)</option>
              <option value="Selesai">Selesai (Lunas)</option>
              <option value="Menunggu Kelulusan">Menunggu Kelulusan</option>
            </select>
          </div>

          <span className="text-slate-400 font-mono text-[11px]">
            Menunjukkan {displayedLoans.length} rekod pinjaman
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Peminjam</th>
                <th className="px-4 py-3">Jenis Pinjaman</th>
                <th className="px-4 py-3">Jumlah Asal</th>
                <th className="px-4 py-3">Ansuran Bulanan</th>
                <th className="px-4 py-3">Kemajuan Bayaran</th>
                <th className="px-4 py-3">Baki Belum Lunas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tiada rekod pinjaman mengikut kriteria carian.
                  </td>
                </tr>
              ) : (
                displayedLoans.map(loan => {
                  const percentPaid = loan.principalAmount > 0 
                    ? Math.round(((loan.principalAmount - loan.balanceRemaining) / loan.principalAmount) * 100)
                    : 100;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{loan.employeeName}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{loan.company}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">{loan.loanType}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-xs block">{loan.reason}</span>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {formatMYR(loan.principalAmount)}
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatMYR(loan.monthlyInstallment)}/bln
                      </td>

                      <td className="px-4 py-3 min-w-[130px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>{loan.monthsPaid} / {loan.totalTenureMonths} bln</span>
                            <span>{percentPaid}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                percentPaid === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                              }`} 
                              style={{ width: `${percentPaid}%` }} 
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {formatMYR(loan.balanceRemaining)}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          loan.status === 'Aktif'
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                            : loan.status === 'Selesai'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}>
                          {loan.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedLoanForLedger(loan)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded border border-indigo-200 dark:border-indigo-900 cursor-pointer"
                          >
                            Jadual Pelunasan
                          </button>

                          {isHRorManagement && loan.status === 'Menunggu Kelulusan' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApproveLoan(loan.id)}
                                className="px-2 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded cursor-pointer"
                                title="Luluskan Pinjaman"
                              >
                                Lulus
                              </button>
                              <button
                                type="button"
                                onClick={() => onRejectLoan(loan.id)}
                                className="px-2 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer"
                                title="Tolak Pinjaman"
                              >
                                Tolak
                              </button>
                            </>
                          )}
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

      {/* MODAL 1: JADUAL PELUNASAN (AMORTIZATION LEDGER) */}
      {selectedLoanForLedger && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Jadual Pelunasan &amp; Lejar Bayaran (Amortization Ledger)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Peminjam: <strong>{selectedLoanForLedger.employeeName}</strong> ({selectedLoanForLedger.company})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLoanForLedger(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loan Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Jumlah Asal</span>
                <p className="font-mono font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {formatMYR(selectedLoanForLedger.principalAmount)}
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Sudah Dibayar</span>
                <p className="font-mono font-bold text-emerald-600 text-sm mt-0.5">
                  {selectedLoanForLedger.monthsPaid} Bulan ({formatMYR(selectedLoanForLedger.principalAmount - selectedLoanForLedger.balanceRemaining)})
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Baki Bulan Berbaki</span>
                <p className="font-mono font-bold text-amber-600 text-sm mt-0.5">
                  {Math.max(0, selectedLoanForLedger.totalTenureMonths - selectedLoanForLedger.monthsPaid)} Bulan Lagi
                </p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Baki Akhir</span>
                <p className="font-mono font-bold text-indigo-600 text-sm mt-0.5">
                  {formatMYR(selectedLoanForLedger.balanceRemaining)}
                </p>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-3.5 py-2.5">Bulan Ke</th>
                    <th className="px-3.5 py-2.5">Tarikh Potongan</th>
                    <th className="px-3.5 py-2.5">Baki Sebelum</th>
                    <th className="px-3.5 py-2.5">Potongan Gaji</th>
                    <th className="px-3.5 py-2.5">Baki Selepas</th>
                    <th className="px-3.5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {selectedLoanForLedger.paymentLedger.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3.5 py-2 font-bold text-slate-700 dark:text-slate-300">
                        Bulan #{row.installmentNo}
                      </td>
                      <td className="px-3.5 py-2 text-slate-500">
                        {row.paidDate}
                      </td>
                      <td className="px-3.5 py-2 text-slate-600 dark:text-slate-400">
                        {formatMYR(row.balanceBefore)}
                      </td>
                      <td className="px-3.5 py-2 font-bold text-rose-600 dark:text-rose-400">
                        -{formatMYR(row.amountPaid)}
                      </td>
                      <td className="px-3.5 py-2 font-bold text-indigo-600 dark:text-indigo-400">
                        {formatMYR(row.balanceAfter)}
                      </td>
                      <td className="px-3.5 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {row.status === 'Paid' ? '✓ Telah Dipotong' : '⏳ Menunggu Kitaran'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedLoanForLedger(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Tutup Jadual
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: BORANG MOHON PINJAMAN BARU / ADVANCE GAJI */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Borang Permohonan Pinjaman Syarikat / Advance Gaji
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoanSubmit} className="space-y-4 text-xs">
              
              {/* Employee Selection */}
              {isHRorManagement ? (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Kakitangan Peminjam:
                  </label>
                  <select
                    value={applicantEmployeeId}
                    onChange={(e) => setApplicantEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.namaLengkap} ({emp.nik}) - Gaji Pokok: {formatMYR(emp.baseSalary)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Peminjam:</span>
                  <p className="font-bold text-slate-900 dark:text-white">{activeUser.namaLengkap} ({activeUser.nik})</p>
                  <span className="text-[11px] text-slate-500 font-mono">Gaji Pokok: {formatMYR(applicantBaseSalary)}</span>
                </div>
              )}

              {/* Loan Type */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Pinjaman / Advance:
                </label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value as LoanType)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Pendahuluan Gaji (Salary Advance)">Pendahuluan Gaji (Salary Advance)</option>
                  <option value="Pinjaman Kecemasan (Emergency Loan)">Pinjaman Kecemasan (Emergency Loan)</option>
                  <option value="Pinjaman Perubatan & Kesihatan">Pinjaman Perubatan &amp; Kesihatan</option>
                  <option value="Bantuan Persekolahan / Komputer">Bantuan Persekolahan / Komputer</option>
                </select>
              </div>

              {/* Principal & Tenure */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Pinjaman (RM):
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tempoh Bayaran (Bulan):
                  </label>
                  <select
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    <option value="1">1 Bulan (Potongan sekali gus)</option>
                    <option value="2">2 Bulan</option>
                    <option value="3">3 Bulan</option>
                    <option value="4">4 Bulan</option>
                    <option value="6">6 Bulan</option>
                    <option value="10">10 Bulan</option>
                    <option value="12">12 Bulan (1 Tahun)</option>
                  </select>
                </div>
              </div>

              {/* Live Calculation Strip */}
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900 flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold">
                    Cadangan Ansuran Bulanan:
                  </span>
                  <p className="text-lg font-bold font-mono text-indigo-950 dark:text-indigo-100">
                    {formatMYR(calculatedMonthlyInstallment)} / bulan
                  </p>
                </div>
                <div className="text-right text-[11px] text-indigo-700 dark:text-indigo-300 font-mono">
                  <div>Tempoh: {tenureMonths} Bulan</div>
                  <div>Potongan Automatik Kitaran Gaji</div>
                </div>
              </div>

              {/* Akta Kerja 1955 50% Limit Warning & Live Threshold Display */}
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                aktaCheck.isExceeded
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {aktaCheck.isExceeded ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>
                    {aktaCheck.isExceeded
                      ? 'AMARAN AKTA KERJA 1955 (SEKSYEN 24): Melebihi Had Potongan 50%!'
                      : 'Status Pematuhan Had 50% Akta Kerja 1955: PATUH'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div>Gaji Pokok: <strong>{formatMYR(applicantBaseSalary)}</strong></div>
                  <div>Had 50% Maksimum: <strong>{formatMYR(aktaCheck.maxAllowed)}</strong></div>
                  <div>Potongan Statutori: <strong>~{formatMYR(approxStatutory)}</strong></div>
                  <div>Ansuran Pinjaman: <strong>+{formatMYR(calculatedMonthlyInstallment)}</strong></div>
                </div>

                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 flex justify-between font-semibold">
                  <span>Jumlah Potongan Keseluruhan:</span>
                  <span className="font-mono">
                    {formatMYR(aktaCheck.totalDeductions)} ({aktaCheck.percentageOfBase.toFixed(1)}% Gaji Pokok)
                  </span>
                </div>

                {aktaCheck.isExceeded && (
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium pt-1">
                    Potongan melebihi had sebanyak <strong>{formatMYR(aktaCheck.excessAmount)}</strong>. Sila panjangkan tempoh bayaran atau kurangkan jumlah pinjaman sebelum meneruskan.
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sebab Permohonan:
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nyatakan sebab seperti kecemasan perubatan, persekolahan, kerosakan kenderaan..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={aktaCheck.isExceeded}
                  className={`px-4 py-2 rounded-xl font-bold text-white shadow-xs cursor-pointer ${
                    aktaCheck.isExceeded
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  Hantar Permohonan
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

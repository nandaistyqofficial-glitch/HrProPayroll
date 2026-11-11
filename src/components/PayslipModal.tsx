import React, { useState, useRef } from 'react';
import { X, Printer, Download, Building2, CheckCircle2, Calendar, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Employee, CompanyName, EmployeeLoan } from '../types/hr';
import { 
  calculatePayrollForEmployee, 
  formatMYR, 
  formatCurrencyAmount,
  getCutOffDateRange,
  MONTH_NAMES_MS 
} from '../utils/statutoryCalculations';

interface PayslipModalProps {
  employee: Employee | null;
  selectedCompanyOverride?: CompanyName;
  loans?: EmployeeLoan[];
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ 
  employee, 
  selectedCompanyOverride, 
  loans,
  onClose 
}) => {
  if (!employee) return null;

  // Company selection (can be switched between the two companies as requested)
  const [activeCompany, setActiveCompany] = useState<CompanyName>(
    selectedCompanyOverride || employee.company
  );

  // Month & Year state
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<number>(5);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const payslipRef = useRef<HTMLDivElement>(null);

  const cutOff = getCutOffDateRange(selectedYear, selectedMonth);
  const isHourly = employee.salaryScheme === 'Per Jam (Hourly)';
  const isDiyana = employee.namaLengkap.toLowerCase().includes('diyana');

  // For hourly worker, standard working hours within cut-off is e.g. 168 hours
  const regularHours = isHourly ? 168 : 160;
  const activeLoan = loans?.find(l => l.employeeId === employee.id && l.status === 'Aktif');
  const payroll = calculatePayrollForEmployee(employee, regularHours, 0, 0, selectedYear, selectedMonth, activeLoan);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!payslipRef.current) return;
    try {
      setIsGeneratingPdf(true);
      setPdfSuccessMessage(null);

      const element = payslipRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const cleanName = employee.namaLengkap.replace(/[^a-zA-Z0-9]/g, '_');
      const monthStr = MONTH_NAMES_MS[selectedMonth - 1];
      const fileName = `Slip_Gaji_${cleanName}_${monthStr}_${selectedYear}.pdf`;

      pdf.save(fileName);
      setPdfSuccessMessage(`Berjaya memuat turun ${fileName}`);
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isPustakaUnion = activeCompany === 'Pustaka Union';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print px-6 py-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Syarikat:
              </span>
              <select
                value={activeCompany}
                onChange={(e) => setActiveCompany(e.target.value as CompanyName)}
                className="text-xs font-bold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1 text-indigo-700 dark:text-indigo-300"
              >
                <option value="Pustaka Union">Pustaka Union</option>
                <option value="Solusi Serumpun Senusantara SDN. BHD">Solusi Serumpun Senusantara SDN. BHD</option>
              </select>
            </div>

            <div className="flex items-center gap-1 text-xs text-slate-500 pl-2 border-l border-slate-300 dark:border-slate-600">
              <Calendar className="w-3.5 h-3.5" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-0.5"
              >
                {MONTH_NAMES_MS.map((name, idx) => (
                  <option key={name} value={idx + 1}>{name}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-0.5 font-mono"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 rounded-lg shadow-sm transition-all cursor-pointer active:scale-98"
              title="Unduh dokumen slip gaji sebagai fail PDF"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menjana PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {pdfSuccessMessage && (
          <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{pdfSuccessMessage}</span>
          </div>
        )}

        {/* Printable Payslip Body */}
        <div ref={payslipRef} className="p-8 text-xs text-slate-800 dark:text-slate-200 space-y-5 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900">
          
          {/* Company Official Letterhead */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900 dark:border-slate-100">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
                {activeCompany}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {isPustakaUnion
                  ? 'No. Pendaftaran Syarikat: 198201004123 (84021-M)'
                  : 'No. Pendaftaran Syarikat: 202101029184 (1429481-U)'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isPustakaUnion
                  ? 'No. 28, Jalan Ampang Utama 2/1, 50450 Kuala Lumpur, Malaysia'
                  : 'Level 16, Menara Serumpun, Mont Kiara, 50480 Kuala Lumpur, Malaysia'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                Tel: +60 3-4251 8800 · Emel: payroll@{isPustakaUnion ? 'pustakaunion.com' : 'solusiserumpun.com'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-sm font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">
                PENYATA GAJI (PAYSLIP)
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 block">
                Bulan: {MONTH_NAMES_MS[selectedMonth - 1]} {selectedYear}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono block">
                Cut-off: {cutOff.startDate} s/d {cutOff.endDate}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                No. Ruj: PAY/{selectedYear}/{String(selectedMonth).padStart(2, '0')}/{employee.nik}
              </p>
            </div>
          </div>

          {/* Employee & Statutory Data Strip */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Penuh:</span>
                <strong className="text-slate-900 dark:text-white uppercase">{employee.namaLengkap}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. IC / Pasport:</span>
                <span className="font-mono">{employee.icNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jawatan:</span>
                <span>{employee.jabatan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Skema Penggajian:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{employee.salaryScheme}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">No. KWSP (EPF):</span>
                <span className="font-mono">{payroll.epfNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. PERKESO:</span>
                <span className="font-mono">{payroll.socsoNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Akaun Bank:</span>
                <span className="font-mono">{payroll.namaBank} ({payroll.noRekening})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarikh Bayaran:</span>
                <span className="font-mono">28 {MONTH_NAMES_MS[selectedMonth - 1]} {selectedYear}</span>
              </div>
            </div>
          </div>

          {/* Special Notice for Diyana Shazwany (Temp Worker from Pustaka Union) */}
          {isDiyana && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-900 dark:text-amber-200">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Pekerja Sambilan (Temp Worker) dari Pustaka Union</span>
              </p>
              <p className="text-[11px] mt-0.5">
                Skema Gaji Per Jam @ <strong>RM {employee.hourlyRateMYR?.toFixed(2) || '18.00'} / jam</strong>. Mengikut ketetapan pengurusan, pekerja berstatus sambilan ini <strong>DIKECUALIKAN</strong> sepenuhnya daripada caruman berkanun SOCSO, EIS, dan EPF.
              </p>
            </div>
          )}

          {/* Remote Foreign Currency Notice if applicable */}
          {employee.isRemoteOutsideMalaysia && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Pekerja Bertaraf Remote Luar Malaysia (Indonesia)</span>
              </p>
              <p className="text-[11px] mt-0.5">
                Gaji Pokok Asal: <strong>{formatCurrencyAmount(employee.baseSalary, employee.originalCurrency)}</strong> ditukarkan pada kadar <strong>{employee.exchangeRateToMYR}</strong> bersamaan <strong>{formatMYR(payroll.gajiPokokMYR)}</strong>. Dikecualikan daripada caruman berkanun tempatan Malaysia.
              </p>
            </div>
          )}

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Earnings */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                A. Pendapatan (Earnings)
              </h3>
              
              <div className="space-y-1.5 text-xs">
                {isHourly ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">
                        Upah Jam Kerja ({payroll.totalRegularHours}j @ RM {payroll.hourlyRateMYR.toFixed(2)})
                      </span>
                      <span className="font-mono font-medium tabular-nums">{formatMYR(payroll.gajiPokokMYR)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Gaji Pokok Bulanan</span>
                    <span className="font-mono font-medium tabular-nums">{formatMYR(payroll.gajiPokokMYR)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Elaun Bulanan (MYR)</span>
                  <span className="font-mono font-medium tabular-nums">{formatMYR(payroll.elaunMYR)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Bayaran Lebih Masa (OT)</span>
                  <span className="font-mono font-medium tabular-nums">{formatMYR(payroll.otPayMYR)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Jumlah Gaji Kasar:</span>
                <span className="font-mono tabular-nums">{formatMYR(payroll.gajiKasarMYR)}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wide text-rose-700 dark:text-rose-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                B. Potongan Pekerja (Deductions)
              </h3>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">KWSP / EPF (11%)</span>
                  <span className="font-mono font-medium tabular-nums">
                    {payroll.isExemptStatutory ? 'RM 0.00 (Bebas)' : formatMYR(payroll.epfPekerja)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">PERKESO / SOCSO</span>
                  <span className="font-mono font-medium tabular-nums">
                    {payroll.isExemptStatutory ? 'RM 0.00 (Bebas)' : formatMYR(payroll.socsoPekerja)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">SIP / EIS (0.2%)</span>
                  <span className="font-mono font-medium tabular-nums">
                    {payroll.isExemptStatutory ? 'RM 0.00 (Bebas)' : formatMYR(payroll.eisPekerja)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Lindung24 PERKESO (24 Jam)</span>
                  <span className="font-mono font-medium tabular-nums">
                    {payroll.isExemptStatutory ? 'RM 0.00 (Bebas)' : formatMYR(payroll.lindung24Pekerja || 5.00)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">PCB Cukai Pendapatan</span>
                  <span className="font-mono font-medium tabular-nums">{formatMYR(payroll.pcbCukai)}</span>
                </div>

                {/* Bahagian Potongan Pinjaman Syarikat (Company Loan / Advance) */}
                {payroll.potonganPinjamanSyarikat && payroll.potonganPinjamanSyarikat > 0 ? (
                  <div className="pt-1.5 border-t border-dashed border-rose-200 dark:border-rose-900/60 space-y-1 bg-rose-50/50 dark:bg-rose-950/20 p-2 rounded-lg">
                    <div className="flex justify-between font-semibold text-rose-800 dark:text-rose-300">
                      <span>Ansuran Pinjaman Syarikat / Advance</span>
                      <span className="font-mono tabular-nums">-{formatMYR(payroll.potonganPinjamanSyarikat)}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono leading-tight">
                      {payroll.keteranganPinjaman}
                    </p>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Baki Sebelum: {formatMYR(payroll.bakiPinjamanSebelum || 0)}</span>
                      <span>Baki Akhir: {formatMYR(payroll.bakiPinjamanSelepas || 0)}</span>
                    </div>
                    {payroll.isMaxDeductionExceeded && (
                      <span className="inline-block text-[9px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 rounded">
                        ⚠ Amaran: Potongan agregat melebihi 50% gaji pokok (Akta Kerja 1955)
                      </span>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Jumlah Potongan:</span>
                <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  {formatMYR(payroll.totalPotonganPekerja)}
                </span>
              </div>
            </div>

          </div>

          {/* Employer Statutory Contributions strip */}
          {!payroll.isExemptStatutory ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Caruman Majikan (Employer Share):</span>
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                <span>KWSP: <strong>{formatMYR(payroll.epfMajikan)}</strong></span>
                <span>PERKESO: <strong>{formatMYR(payroll.socsoMajikan)}</strong></span>
                <span>EIS: <strong>{formatMYR(payroll.eisMajikan)}</strong></span>
                <span>Lindung24: <strong>{formatMYR(payroll.lindung24Majikan || 5.00)}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
              Status Caruman Majikan: <strong>Dikecualikan (RM 0.00)</strong> mengikut profil pekerjaan khas.
            </div>
          )}

          {/* Net Pay Strip */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-300 font-bold">
                GAJI BERSIH DIBAYAR (NET PAY)
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dikreditkan melalui RHB AutoPay ke {payroll.namaBank} ({payroll.noRekening})
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {formatMYR(payroll.gajiBersihMYR)}
              </span>
            </div>
          </div>

          {/* Verification & Signatures */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cetakan Sah Berkomputer · RHB Reflex AutoPay Terintegrasi</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Dijana melalui Sistem Bersepadu HRD & Penggajian {activeCompany}
              </p>
            </div>

            <div className="text-center w-48">
              <p className="text-slate-500 text-[10px]">Kuala Lumpur, 28 {MONTH_NAMES_MS[selectedMonth - 1]} {selectedYear}</p>
              <p className="font-serif italic text-slate-700 dark:text-slate-300 my-1 text-sm">
                Cheah Leong Tim / Siti Fatimah
              </p>
              <p className="font-bold text-slate-900 dark:text-white text-xs border-t border-slate-300 dark:border-slate-700 pt-1">
                Bahagian Kewangan & HR
              </p>
              <p className="text-[10px] text-slate-400">{activeCompany}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

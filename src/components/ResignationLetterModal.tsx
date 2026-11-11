import React, { useState, useMemo } from 'react';
import { 
  X, 
  UserX, 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  RotateCcw,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';
import { Employee } from '../types/hr';
import { formatDateIndo } from '../utils/formatters';

interface ResignationLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  initialEmployee?: Employee | null;
  activeUser: Employee;
  onUpdateEmployee: (updated: Employee) => void;
}

export const ResignationLetterModal: React.FC<ResignationLetterModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialEmployee,
  activeUser,
  onUpdateEmployee,
}) => {
  if (!isOpen) return null;

  // Selected Employee
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    initialEmployee?.id || employees[0]?.id || ''
  );

  const targetEmp = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || initialEmployee || employees[0];
  }, [employees, selectedEmpId, initialEmployee]);

  // Form states
  const [noticeDate, setNoticeDate] = useState<string>('2025-05-12');
  const [lastWorkingDay, setLastWorkingDay] = useState<string>(() => {
    const d = new Date('2025-05-12');
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0]; // 1 month notice: 2025-06-12
  });
  const [reason, setReason] = useState<string>('Mendapat tawaran peluang kerjaya baharu dan pembangunan profesional');
  const [handoverStatus, setHandoverStatus] = useState<string>('Semua fail projek, akaun sistem, kad akses, dan komputer riba syarikat diserahkan dalam keadaan lengkap kepada penyelia jabatan.');
  const [hrApproverName, setHrApproverName] = useState<string>(activeUser.namaLengkap || 'SITI FATIMAH BINTI HARON');

  // Preview Mode: If target employee is already resigned or after submit
  const isAlreadyResigned = Boolean(!targetEmp.statusAktif || targetEmp.resignationDetails?.isResigned);
  const [viewMode, setViewMode] = useState<'form' | 'letter'>(isAlreadyResigned ? 'letter' : 'form');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Reference number
  const refNumber = targetEmp.resignationDetails?.letterReferenceNumber || 
    (targetEmp.company.includes('Pustaka') 
      ? `PU/HR/RESIGN/2025/05/${targetEmp.nik.replace(/\D/g, '').slice(-3) || '012'}` 
      : `SSS/HR/RESIGN/2025/05/${targetEmp.nik.replace(/\D/g, '').slice(-3) || '002'}`);

  // Process Resignation & Generate Letter
  const handleProcessResignation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmp) return;

    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    const resignationDetails = {
      isResigned: true,
      resignationDate: noticeDate,
      lastWorkingDay: lastWorkingDay,
      reason: reason,
      letterReferenceNumber: refNumber,
      generatedAt: dateFormatted,
      notes: handoverStatus
    };

    // Auto-create document in contractDocuments
    const resignDocName = `Surat_Penerimaan_Perletakan_Jawatan_${targetEmp.nik}.pdf`;
    const newDoc = {
      id: `doc-resign-${Date.now()}`,
      name: resignDocName,
      type: 'Surat Perletakan Jawatan (Resignation Letter)' as any,
      fileSize: 185000,
      uploadedAt: dateFormatted,
      uploadedBy: hrApproverName
    };

    const updatedEmployee: Employee = {
      ...targetEmp,
      statusAktif: false, // MARK KARYAWAN TIDAK AKTIF OTOMATIS
      resignationDetails,
      contractDocuments: [newDoc, ...(targetEmp.contractDocuments || [])]
    };

    onUpdateEmployee(updatedEmployee);
    setSuccessNotice(`Status ${targetEmp.namaLengkap} telah ditukar kepada TIDAK AKTIF (Resigned) dan Surat Resign rasmi berjaya dijana!`);
    setViewMode('letter');
  };

  // Reactivate Employee (Batal Resign)
  const handleReactivateEmployee = () => {
    if (!confirm(`Adakah anda pasti mahu mengaktifkan semula status perkhidmatan ${targetEmp.namaLengkap}?`)) return;

    const updatedEmployee: Employee = {
      ...targetEmp,
      statusAktif: true,
      resignationDetails: undefined
    };

    onUpdateEmployee(updatedEmployee);
    setSuccessNotice(`${targetEmp.namaLengkap} telah berjaya DIAKTIFKAN SEMULA sebagai staf aktif.`);
    setViewMode('form');
  };

  // Download Letter Simulation
  const handleDownloadLetter = () => {
    const letterText = `
================================================================================
${targetEmp.company.toUpperCase()}
No. Pendaftaran: 201601039841 (1209782-X)
Ibu Pejabat: Wisma Pustaka Union, Jalan Tun Razak, 50400 Kuala Lumpur
Tel: +60 3-9284 1000 | Faks: +60 3-9284 1001 | Laman Web: www.pustakaunion.com.my
================================================================================

Rujukan Kami: ${refNumber}
Tarikh: ${formatDateIndo(noticeDate)}

KEPADA:
Nama Pekerja: ${targetEmp.namaLengkap}
No. Kad Pengenalan / Pasport: ${targetEmp.icNumber}
No. Staf / NIK: ${targetEmp.nik}
Jawatan: ${targetEmp.jabatan}
Jabatan: ${targetEmp.departemen}

Tuan / Puan,

PENGESAHAN PENERIMAAN PERLETAKAN JAWATAN / ACCEPTANCE OF RESIGNATION
--------------------------------------------------------------------------------

Dengan segala hormatnya, perkara di atas adalah dirujuk.

1. Pihak Pengurusan ${targetEmp.company} mengesahkan bahawa kami telah menerima surat notis perletakan jawatan bertarikh ${noticeDate} daripada pihak tuan/puan.

2. Selaras dengan syarat-syarat perjanjian pelantikan dan peruntukan di bawah Seksyen 12 Akta Kerja 1955 (Pindaan 2022), pihak syarikat dengan ini menerima perletakan jawatan tuan/puan. Hari terakhir perkhidmatan tuan/puan di syarikat ini telah dipersetujui pada:

   TARIKH HARI TERAKHIR BERTUGAS: ${lastWorkingDay}

3. Pihak syarikat mengesahkan penerimaan makluman bahawa penyerahan tugas (handover) telah dilaksanakan:
   "${handoverStatus}"

4. Segala pembayaran baki gaji akhir, bayaran ganti baki cuti tahunan yang layak (jika ada), serta penyelarasan potongan caruman statutori (KWSP, SOCSO, EIS, dan PCB) akan dikreditkan ke akaun bank tuan/puan (${targetEmp.namaBank} - ${targetEmp.noRekening}) pada hari bekerja terakhir bulan berkenaan mengikut undang-undang statutori Malaysia.

5. Bagi pihak Pengarah Urusan dan seluruh barisan kepimpinan serta warga kerja ${targetEmp.company}, kami merakamkan setinggi-tinggi penghargaan dan terima kasih atas segala sumbangan, khidmat bakti, dan komitmen yang telah tuan/puan berikan sepanjang tempoh perkhidmatan bersama kami.

Kami mendoakan kejayaan dan kecemerlangan yang berterusan dalam kerjaya dan masa hadapan tuan/puan.

Sekian, terima kasih.

Yang menjalankan amanah,
BAGI PIHAK ${targetEmp.company.toUpperCase()}


__________________________________________
${hrApproverName}
Pengurus Sumber Manusia (HR Lead)
Pustaka Union & Solusi Serumpun Senusantara SDN. BHD
    `;

    const blob = new Blob([letterText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Surat_Pengesahan_Resign_${targetEmp.nik}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
              !targetEmp.statusAktif ? 'bg-rose-600' : 'bg-amber-600'
            }`}>
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pengurusan Perletakan Jawatan (Resign) &amp; Surat Rasmi Otomatis
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  !targetEmp.statusAktif 
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {!targetEmp.statusAktif ? '🔴 Karyawan Tidak Aktif (Resigned)' : '🟢 Karyawan Aktif'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pemberhentian rasmi staf, penukaran status tidak aktif secara automatik, dan penjanaan surat pelepasan rasmi.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch between Form and Generated Letter */}
        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode('form')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                viewMode === 'form'
                  ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Borang Pemprosesan Resign</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('letter')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                viewMode === 'letter'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Surat Rasmi Pelepasan Jawatan (Acceptance Letter)</span>
            </button>
          </div>

          {!targetEmp.statusAktif && (
            <button
              type="button"
              onClick={handleReactivateEmployee}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors mb-2"
              title="Batal status perletakan jawatan dan aktifkan semula pekerja"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Aktifkan Semula Pekerja</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {successNotice && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* VIEW 1: RESIGNATION FORM */}
          {viewMode === 'form' && (
            <form onSubmit={handleProcessResignation} className="space-y-5 text-xs max-w-2xl mx-auto">
              
              {/* Employee Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  Pilih Pekerja yang Meletakkan Jawatan:
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.statusAktif ? '🟢 ' : '🔴 [Tidak Aktif] '}
                      {emp.namaLengkap} ({emp.nik}) — {emp.company.includes('Pustaka') ? 'Pustaka Union' : 'Solusi Serumpun'} · {emp.jabatan}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Entiti: <strong>{targetEmp.company}</strong> · No. IC: {targetEmp.icNumber} · Gaji: {targetEmp.baseSalary} {targetEmp.originalCurrency}
                </p>
              </div>

              {/* Dates grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                    Tarikh Surat Notis Diterima:
                  </label>
                  <input
                    type="date"
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                    Hari Terakhir Bertugas (Last Working Day):
                  </label>
                  <input
                    type="date"
                    value={lastWorkingDay}
                    onChange={(e) => setLastWorkingDay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white font-bold"
                    required
                  />
                  <p className="mt-1 text-[10px] text-slate-400">Notis standard 1 bulan mengikut Akta Kerja 1955</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  Sebab Perletakan Jawatan / Resignation Reason:
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Mendapat tawaran peluang kerjaya baharu dan pembangunan profesional">Mendapat tawaran peluang kerjaya baharu</option>
                  <option value="Melanjutkan pengajian ke peringkat lebih tinggi (Sarjana / Ijazah)">Melanjutkan pengajian ke peringkat lebih tinggi</option>
                  <option value="Faktor peribadi, urusan keluarga, atau berpindah tempat tinggal">Faktor peribadi / hal keluarga / berpindah tempat kediaman</option>
                  <option value="Kesihatan dan nasihat doktor untuk berehat">Faktor kesihatan atas nasihat perubatan</option>
                  <option value="Penamatan tempoh kontrak perkhidmatan yang dipersetujui">Tamat tempoh kontrak perkhidmatan</option>
                </select>
              </div>

              {/* Handover & Clearance Status */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  Pengesahan Pelepasan Tugas &amp; Aset (Handover Clearance):
                </label>
                <textarea
                  value={handoverStatus}
                  onChange={(e) => setHandoverStatus(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none"
                  placeholder="Catatkan pemulangan laptop, kad akses, dan penyerahan fail projek..."
                />
              </div>

              {/* Approver Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider text-[11px]">
                  Pegawai HR yang Meluluskan Surat:
                </label>
                <input
                  type="text"
                  value={hrApproverName}
                  onChange={(e) => setHrApproverName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                  placeholder="SITI FATIMAH BINTI HARON"
                />
              </div>

              {/* Warning box */}
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-rose-800 dark:text-rose-200">
                  <p className="font-bold">Kesan Automatik Penukaran Status:</p>
                  <p>
                    Apabila anda menekan butang di bawah, status pekerja akan bertukar kepada <strong>TIDAK AKTIF (Resigned)</strong>. Surat rasmi penerimaan resign akan dijana serta-merta dan disimpan ke dalam arkib fail pekerja.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Jana Surat Resign &amp; Tukar Karyawan Tidak Aktif</span>
                </button>
              </div>

            </form>
          )}

          {/* VIEW 2: FORMAL LETTER PREVIEW */}
          {viewMode === 'letter' && (
            <div className="space-y-4">
              
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 no-print">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Pratinjau Surat Rasmi:</span>
                  <span className="font-mono text-slate-500">{refNumber}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadLetter}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Muat Turun Fail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Surat Rasmi</span>
                  </button>
                </div>
              </div>

              {/* Printable Letter Paper */}
              <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-300 shadow-lg text-xs leading-relaxed space-y-6 print:border-none print:shadow-none print:p-0">
                
                {/* Letterhead */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                      {targetEmp.company.toUpperCase()}
                    </h1>
                    <p className="text-[10px] text-slate-600 font-medium">
                      No. Pendaftaran Syarikat: 201601039841 (1209782-X)
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Ibu Pejabat: Wisma Pustaka Union, Jalan Tun Razak, 50400 Kuala Lumpur, Malaysia
                    </p>
                    <p className="text-[10px] text-slate-600">
                      Tel: +60 3-9284 1000 | Emel: hr@pustakaunion.com.my | Web: www.pustakaunion.com.my
                    </p>
                  </div>
                  
                  <div className="w-16 h-16 rounded-xl border border-slate-400 flex items-center justify-center font-bold text-slate-700 text-lg uppercase bg-slate-50">
                    {targetEmp.company.includes('Pustaka') ? 'PU' : 'SSS'}
                  </div>
                </div>

                {/* Reference & Date */}
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <div>
                    <p><strong>Rujukan Kami:</strong> {refNumber}</p>
                    <p><strong>Klasifikasi:</strong> SULIT / PERSENDIRIAN</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Tarikh:</strong> {formatDateIndo(noticeDate)}</p>
                  </div>
                </div>

                {/* Addressee */}
                <div className="space-y-0.5 text-xs font-medium">
                  <p className="font-bold text-sm text-slate-950 uppercase">{targetEmp.namaLengkap}</p>
                  <p>No. Kad Pengenalan / Pasport: <strong>{targetEmp.icNumber}</strong></p>
                  <p>No. Kakitangan (NIK): <strong>{targetEmp.nik}</strong></p>
                  <p>Jawatan: <strong>{targetEmp.jabatan}</strong></p>
                  <p>Bahagian / Jabatan: <strong>{targetEmp.departemen}</strong></p>
                </div>

                {/* Subject Header */}
                <div className="pt-2">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide border-b border-slate-300 pb-1 text-slate-950">
                    SURAT PENGESAHAN PENERIMAAN PERLETAKAN JAWATAN / ACCEPTANCE OF RESIGNATION
                  </h2>
                </div>

                {/* Letter Paragraphs */}
                <div className="space-y-3.5 text-justify text-slate-800">
                  <p>Tuan / Puan,</p>
                  
                  <p>
                    Dengan segala hormatnya dimaklumkan bahawa pihak pengurusan <strong>{targetEmp.company}</strong> telah menerima dan meneliti surat notis perletakan jawatan yang dikemukakan oleh pihak tuan/puan bertarikh <strong>{noticeDate}</strong>.
                  </p>

                  <p>
                    2. Selaras dengan syarat-syarat perjanjian pelantikan dan peruntukan Seksyen 12 Akta Kerja 1955 Malaysia, pihak syarikat dengan ini <strong>BERSETUJU MENERIMA</strong> perletakan jawatan tuan/puan. Sehubungan itu, tarikh rasmi hari terakhir perkhidmatan tuan/puan bersama syarikat adalah pada:
                  </p>

                  <div className="p-3 bg-slate-100 rounded-lg text-center font-bold text-slate-950 font-mono text-sm border border-slate-300 my-2">
                    HARI TERAKHIR BERTUGAS (LAST WORKING DAY): {lastWorkingDay}
                  </div>

                  <p>
                    3. Pihak syarikat turut mengesahkan bahawa segala urusan penyerahan tugas (handover), fail operasi, pemulangan komputer riba, kad akses premis, serta harta syarikat telah dilaksanakan selaras dengan dasar penamatan perkhidmatan korporat:
                    <br />
                    <em>&quot;{handoverStatus}&quot;</em>
                  </p>

                  <p>
                    4. Pembayaran baki gaji bagi bulan terakhir, penyelarasan baki cuti tahunan yang layak (jika berkaitan), serta caruman statutori akhir (KWSP, SOCSO, EIS, dan pelepasan cukai PCB LHDN) akan dikreditkan ke akaun bank tuan/puan (<strong>{targetEmp.namaBank} — {targetEmp.noRekening}</strong>) sebelum atau pada hari bekerja terakhir bulan berkenaan.
                  </p>

                  <p>
                    5. Bagi pihak Pengarah Urusan dan seluruh barisan warga kerja {targetEmp.company}, kami merakamkan setinggi-tinggi penghargaan dan ucapan terima kasih atas sumbangan, dedikasi, serta khidmat bakti yang telah tuan/puan curahkan sepanjang tempoh perkhidmatan bersama kami.
                  </p>

                  <p>
                    Kami mendoakan agar tuan/puan terus beroleh kejayaan yang cemerlang dalam segala bidang dan kerjaya baharu pada masa hadapan.
                  </p>
                </div>

                {/* Signature Block */}
                <div className="pt-8 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-slate-700">Sekian, terima kasih.</p>
                    <p className="font-semibold text-slate-800">Yang menjalankan amanah,</p>
                    <p className="font-bold text-slate-950 uppercase">{targetEmp.company.toUpperCase()}</p>
                    
                    <div className="py-4">
                      <div className="w-40 border-b border-slate-900" />
                    </div>

                    <p className="font-bold text-slate-950 text-xs">{hrApproverName}</p>
                    <p className="text-[11px] text-slate-600">Pengurus Sumber Manusia (HR Lead)</p>
                    <p className="text-[11px] text-slate-500">Pustaka Union &amp; Solusi Serumpun Senusantara SDN. BHD</p>
                  </div>

                  {/* Stamp */}
                  <div className="w-28 h-28 border-2 border-dashed border-slate-400 rounded-full flex flex-col items-center justify-center text-center p-2 text-slate-400 text-[9px] uppercase font-bold">
                    <span>COP RASMI</span>
                    <span className="font-mono text-[8px] mt-0.5">PUSTAKA UNION</span>
                    <span className="text-[7px]">KUALA LUMPUR</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Pematuhan Akta Kerja 1955 Malaysia · Pengurusan Sumber Manusia Pustaka Union
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
